/* eslint no-unused-vars: "off" */
import Matter, { Bodies, Composite, Engine,
    Events, Mouse, MouseConstraint, Render, Runner
} from 'matter-js';
import { ParticleEmitterFactory } from "./particle-factory";
import Player from "./player";

// @ts-ignore
Matter.Resolver._restingThresh = 0.1 // solving bug: https://github.com/liabru/matter-js/issues/394
// @ts-ignore
Matter.Resolver._restingThreshTangent = 1


console.clear();
// matter-tools by liabru https://github.com/liabru/matter-tools

declare global {
  interface Window {
      H:any;
      W:any;
  }
}

declare module 'matter-js' {
  interface Body {
    player: Player
    owner: Player
  }
}

window.H = 600;
window.W = 800;

//type FUN = (arg:any) => any

export class Env {
    game_data_callback: Function //| undefined
    engine!: Engine
    world: any
    particle_factory!: ParticleEmitterFactory
    render!: Render
    runner!: Runner
    particles: {}

    constructor(game_data_callback?){
        this.game_data_callback = game_data_callback
        this.particles = {}

        // create engine
        this.engine = Engine.create({velocityIterations: 8});
        // @ts-ignore
        this.engine.gravity.scale = 0;
        this.world = this.engine.world;

        this.particle_factory = new ParticleEmitterFactory(this);
    }

    setup(element_id: string, player_stats : Array<Object>) {
        var render = Render.create({
            element: document.getElementById(element_id) as HTMLElement,
            engine: this.engine,
            options: {
                width: 800,
                height: 600,
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

        this.build_play_field();
        this.add_mouse_control();

        this.build_players(player_stats);

        this.register_events();

        Runner.run(this.runner, this.engine);

        // fit the render viewport to the scene
        Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: 800, y: 600 }
        });
        this.update_game_data()
    }

  add_mouse_control() {
    var mouse = Mouse.create(this.render.canvas),
      mouseConstraint = MouseConstraint.create(this.engine, {
        mouse: mouse,
        // @ts-ignore
        constraint: {
          stiffness: 0.2,
          render: {
            visible: true
          }
        }
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
    if(n!==2) throw new Error('only 2 players supported')
    let margin = 21, play_area = 100;
    return [
        [0 + play_area + margin, window.H/2],
        [window.W - (play_area + margin), window.H/2],
    ]
  }
  build_players(player_stats) {
    this.players = []
    const player_coords = this.get_player_coords(player_stats.length)
    player_stats.forEach( (p_stats, idx) => {
        let [x, y] = player_coords[idx]
        let p = new Player(x, y, this, p_stats);
        this.players.push(p)
        Composite.add(this.world, p.shape);
    })
    this.players.map((p) => p.build_emitter());
  }

  build_play_field() {
    // add bodies
    let opts = { isStatic: true} //, friction:0, restituition:1, frictionStatic:0, inertia: 10000};
    // @ts-ignore
    Composite.add(this.world, [ // walls
      Bodies.rectangle(400, 0, 800, 100, opts),
      Bodies.rectangle(400, 600, 800, 100, opts),
      Bodies.rectangle(800, 300, 100, 600, opts),
      Bodies.rectangle(0, 300, 100, 600, opts)
    ]);
  }

    update_game_data() {
        if (!this.game_data_callback) return
        let game_data = this.players.map(p => {return {
            health: p.health, died_at: p.died_at || null, damage_dealt: p.damage_dealt
        }})
        setTimeout(() => this.game_data_callback(game_data), 0)
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
            let damage_dealt = player.take_damage(51);
            if (other_shape.owner === undefined){
                //debugger
            }
            other_shape.owner.damage_dealt += damage_dealt
            env.update_game_data()
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


//window.restart()
