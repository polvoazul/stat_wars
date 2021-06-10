/* eslint no-unused-vars: "off" */
import Matter, { Bodies, Composite, Engine,
    Events, Mouse, MouseConstraint, Render, Runner, Vector, 
} from 'matter-js';
import { ParticleEmitterFactory } from "./particle-factory";
import Player from "./player";

// @ts-ignore
Matter.Resolver._restingThresh = 0.1 // solving bug: https://github.com/liabru/matter-js/issues/394
// @ts-ignore
Matter.Resolver._restingThreshTangent = 1


console.clear();
// matter-tools by liabru https://github.com/liabru/matter-tools


declare module 'matter-js' {
  interface Body {
    player: Player
    owner: Player
  }
}


//type FUN = (arg:any) => any
const MAX_PLAYERS = 8

export class Env {
    game_state_callback: Function | undefined
    engine!: Engine
    world: any
    particle_factory!: ParticleEmitterFactory
    render!: Render
    runner!: Runner
    particles: {}
    H: number; W: number
    walls!: Matter.Bodies[];

    constructor(game_state_callback?, opts?: {H?, W?}){
        this.particles = {}

        // create engine
        this.engine = Engine.create({velocityIterations: 8});
        // @ts-ignore
        this.engine.gravity.scale = 0;
        this.world = this.engine.world;

        this.particle_factory = new ParticleEmitterFactory(this);
        this.game_state_callback = game_state_callback

        this.H = opts?.H || 1000;
        this.W = opts?.W || 1000;
        console.log(this.H)
    }
    destroy(){
        this.stop()
        Composite.clear(this.world, false, true);
        Engine.clear(this.engine);
        this.game_state_callback = undefined
    }
    setup(element_id: string, player_stats : Array<Object>) {
        var render = Render.create({
            element: document.getElementById(element_id) as HTMLElement,
            engine: this.engine,
            options: {
                width: this.W,
                height: this.H,
                wireframes: false,
                // @ts-ignore
                showDebug: false,
                showAngleIndicator: true,
            }
        });
        this.render = render;

        Render.run(render);

        // create runner
        this.runner = Runner.create();

        this.add_mouse_control();
        this.build_players(player_stats);

        this.update_game_state()

        this.register_events();

        Runner.run(this.runner, this.engine);

        // fit the render viewport to the scene
        Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: this.W, y: this.H }
        });
    }
    add_mouse_control() {
        var mouse = Mouse.create(this.render.canvas),
            mouseConstraint = MouseConstraint.create(this.engine, {
                mouse: mouse,
                // @ts-ignore
                constraint: {
                    stiffness: 0.0002,
                    render: {
                        visible: true
                    }
                }
            });
        Events.on(mouseConstraint, 'mousedown', function (event) {
            // @ts-ignore
            var mousePosition = event.mouse.position;
            console.log('mousedown at ' + mousePosition.x + ' ' + mousePosition.y);
        });

        Composite.add(this.world, mouseConstraint as any);
        // @ts-ignore
        this.render.mouse = mouse;
    }
    stop() {
        Matter.Render.stop(this.render);
        Matter.Runner.stop(this.runner);
    }
    players!: Array<Player>

    get_player_coords(idx, n: number) {
        if (n < 2) throw new Error('only >= 2 players supported')
        if (idx >= n) throw new Error(`wrong index ${idx} >= ${n}`)
        if (n === 2)
            idx = {0: 3, 1: 1}[idx] // if 2 players on a square, position players so that oponents face each other
        let margin = 120
        let wall: Vector[] = (this.walls[idx] as any).vertices
        let [v0, v1] = find_largest_line(wall)
        let perp = Vector.normalise(Vector.perp(Vector.sub(v1, v0)))
        let middle = Vector.mult(Vector.add(v0, v1), 0.5)
        let coords = Vector.add(Vector.mult(perp, margin), middle)
        return coords
    }
    build_players(player_stats) {
        if(player_stats.length < 2 || player_stats.length > MAX_PLAYERS)
            throw new Error(`Unsuported number of players ${player_stats.length}`);
        this.build_play_field(player_stats.length)
        this.players = []
        player_stats.forEach((p_stats, idx) => {
            let {x, y} = this.get_player_coords(idx, player_stats.length)
            let p = new Player(x, y, this, p_stats);
            this.players.push(p)
            Composite.add(this.world, p.shape);
        })
        this.players.map((p) => p.build_emitter());
    }
    build_play_field(n_players) {
        let opts = { isStatic: true } //, friction:0, restituition:1, frictionStatic:0, inertia: 10000};
        let walls : Bodies[] = []
        if (n_players === 2)
            n_players = 4 // build a square anyway
        // build a regular polygon
        const middle = {x: this.W/2, y: this.H/2}, border = 30
        const radius = (Math.min(this.W/2, this.H/2)-border) / Math.cos(Math.PI/n_players) // multiplying by constant to convert radius to inradius
        const smaller = Bodies.polygon(middle.x, middle.y, n_players, radius).vertices
        const bigger  = Bodies.polygon(middle.x, middle.y, n_players, radius + border).vertices
        for (var i=0; i< smaller.length; i++) {
            const ip1 = (i+1)%smaller.length
            const sides = [smaller[i], smaller[ip1], bigger[ip1], bigger[i]]
            let b = Bodies.fromVertices(middle.x, middle.y, [sides], opts)
            const offset = {x: sides[0].x - b.vertices[0].x, y: sides[0].y - b.vertices[0].y} // fromVertices translates bodies immediatly after creation, so we undo this
            Matter.Body.translate(b, offset)
            walls.push(b)
        }
        this.walls = walls
        Composite.add(this.world, walls as any);
    }
    update_game_state() {
        if (!this.game_state_callback) return
        let game_state = this.players.map(p => {return {
            health: p.health, died_at: p.died_at || null, damage_dealt: p.damage_dealt
        }})
        setTimeout(() => this.game_state_callback!(game_state), 0)
    }
    register_events() {
        const env = this
        Events.on(this.engine, "collisionStart", function (e) { // cant seem to register event on players object themselves TODO: check this later
          var pairs = e.pairs;
          pairs = pairs.filter((el, _) => {
            return el.bodyA.player || el.bodyB.player;
          });

          // change object colours to show those starting a collision
          for (var i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            let player_shape = pair.bodyA.player ? pair.bodyA : pair.bodyB;
            let other_shape = !pair.bodyA.player ? pair.bodyA : pair.bodyB;
            let player = player_shape.player;
            if (other_shape.isParticle){
                Composite.remove(env.world, other_shape)
                explode(other_shape.position, env.particle_factory)
            }
            let damage = other_shape.owner.damage_per_ball
            player.take_damage(damage);
            if (other_shape.owner === undefined){
                debugger
            }
            other_shape.owner.damage_dealt += damage
            env.update_game_state()
          }
        });
    }

    title = "Env";
    for = ">=0.14.2";
}

function explode(position, particle_factory) {
    let emitter = particle_factory.create(
            position.x,
            position.y,
            {collisions: false, amount: 40, amountPerTick:10, interval: 1, collisionFilter:{group: -1}}
    );
    emitter.start();
}

function find_largest_line(v: Vector[]){
    let max_idx = 0, max_mag = 0
    for(var i=0; i<v.length;i++){
        let mag = Vector.magnitudeSquared(Vector.sub(v[i], v[(i+1)% v.length]))
        if(max_mag < mag){
            max_mag = mag
            max_idx = i
        }
    }
    return [v[max_idx], v[(max_idx+1)%v.length]]
}