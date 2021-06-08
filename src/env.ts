/* eslint no-unused-vars: "off" */
import Matter, { Bodies, Composite, Engine,
    Events, Mouse, MouseConstraint, Render, Runner, 
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
                showDebug: true,
                showAngleIndicator: true,
            }
        });
        this.render = render;

        Render.run(render);

        // create runner
        this.runner = Runner.create();

        this.add_mouse_control();
        this.build_players(player_stats);
        this.build_play_field();

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

    get_player_coords(n: 2) {
        if (n !== 2) throw new Error('only 2 players supported')
        let margin = 21, play_area = 100;
        return [
            [0 + play_area + margin, this.H / 2],
            [this.W - (play_area + margin), this.H / 2],
        ]
    }
    build_players(player_stats) {
        if(player_stats.length < 2 || player_stats.length > MAX_PLAYERS)
            throw new Error(`Unsuported number of players ${player_stats.length}`);
        this.players = []
        const player_coords = this.get_player_coords(player_stats.length)
        player_stats.forEach((p_stats, idx) => {
            let [x, y] = player_coords[idx]
            let p = new Player(x, y, this, p_stats);
            this.players.push(p)
            Composite.add(this.world, p.shape);
        })
        this.players.map((p) => p.build_emitter());
    }
    build_play_field() {
        const n_players = (4+2)
        //const n_players = this.players.length
        // add bodies
        let opts = { isStatic: true } //, friction:0, restituition:1, frictionStatic:0, inertia: 10000};
        // @ts-ignore
        let walls : Bodies[] = []
        if (n_players === 2)
            walls = [
                Bodies.rectangle(400, 0, 800, 100, opts),
                Bodies.rectangle(400, 600, 800, 100, opts),
                Bodies.rectangle(800, 300, 100, 600, opts),
                Bodies.rectangle(0, 300, 100, 600, opts)
            ]
        else { // build a polygon
            const middle = {x: this.W/2, y: this.H/2}, radius = Math.min(this.W/2, this.H/2), border = 30
            const smaller = Bodies.polygon(middle.x, middle.y, n_players, radius).vertices
            const bigger  = Bodies.polygon(middle.x, middle.y, n_players, radius + border).vertices
            for (var i=0; i< smaller.length; i++) {
                const ip1 = (i+1)%smaller.length
                const sides = [smaller[i], smaller[ip1], bigger[ip1], bigger[i]]
                let b = Bodies.fromVertices(middle.x, middle.y, [sides], opts)
                const offset = {x: sides[0].x - b.vertices[0].x, y: sides[0].y - b.vertices[0].y}
                Matter.Body.translate(b, offset)
                walls.push(b)
            }
        }
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