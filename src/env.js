/* eslint no-unused-vars: "off" */

import Matter from "matter-js"
import {ParticleFactory} from "./particle-factory.js"
import Color from "color";
import Player from "./player.js"

Matter.Resolver._restingThresh = 0.1 // solving bug: https://github.com/liabru/matter-js/issues/394
Matter.Resolver._restingThreshTangent = 1

console.clear();
// matter-tools by liabru https://github.com/liabru/matter-tools

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Composites = Matter.Composites,
  Composite = Matter.Composite,
  Common = Matter.Common,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Grid = Matter.Grid,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  Body = Matter.Body,
  Events = Matter.Events;

window.H = 600;
window.W = 800;

export class Env {
  constructor(game_data_callback){
      this.game_data_callback = game_data_callback
  }

  setup(element_id) {
    // create engine
    this.engine = Engine.create({velocityIterations: 8});
    this.engine.gravity.scale = 0;
    this.world = this.engine.world;

    this.particle_factory = ParticleFactory(this);

    // create renderer
    var render = Render.create({
      element: document.getElementById(element_id),
      engine: this.engine,
      options: {
        width: 800,
        height: 600,
        showAngleIndicator: true,
        // showBroadphase: false,
        showDebug: false,
        wireframes: false
      }
    });
    this.render = render;

    Render.run(render);

    // create runner
    var runner = Runner.create();

    this.build_play_field();
    this.add_mouse_control();

    this.build_players();


    this.register_events();

    Runner.run(runner, this.engine);

    // fit the render viewport to the scene
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: 800, y: 600 }
    });
  }

  add_mouse_control() {
    var mouse = Mouse.create(this.render.canvas),
      mouseConstraint = MouseConstraint.create(this.engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: true
          }
        }
      });

    Composite.add(this.world, mouseConstraint);
    // keep the mouse in sync with rendering
    this.render.mouse = mouse;
  }

  stop() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
  }

  build_players(data) {
    let margin = 20, play_area = 100;
    var p1 = new Player(0 + play_area + margin, window.H / 2, this);
    var p2 = new Player(window.W - (play_area + margin), window.H / 2, this);
    Composite.add(this.world, p1.shape);
    Composite.add(this.world, p2.shape);
    this.players = [p1, p2];
    this.players.map((p) => p.build_emmiter());
  }

  build_play_field() {
    // add bodies
    let opts = { isStatic: true} //, friction:0, restituition:1, frictionStatic:0, inertia: 10000};
    Composite.add(this.world, [
      // walls
      Bodies.rectangle(400, 0, 800, 100, opts),
      Bodies.rectangle(400, 600, 800, 100, opts),
      Bodies.rectangle(800, 300, 100, 600, opts),
      Bodies.rectangle(0, 300, 100, 600, opts)
    ]);
  }

  register_events() {
    // cant seem to register event on players object themselves TODO: check this later
    const env = this
    function update_game_data() {
        let game_data = env.players.map(p => {return {health: p.health}})
        env.game_data_callback(game_data)
    }
    Events.on(this.engine, "collisionStart", function (e) {
      var pairs = e.pairs;
      pairs = pairs.filter((el, _) => {
        return el.bodyA.is_player || el.bodyB.is_player;
      });

      // change object colours to show those starting a collision
      for (var i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        let player = pair.bodyA.is_player ? pair.bodyA : pair.bodyB;
        let other = !pair.bodyA.is_player ? pair.bodyA : pair.bodyB;
        player = player.player;
        if (other.isParticle){
            Composite.remove(this.world, other)
            explode(other.position, env.particle_factory)
        }
        player.take_damage(51);
        update_game_data()
      }
    });
  }


    title = "Env";
    for = ">=0.14.2";
}

function explode(position, particle_factory) {
    let emmiter = particle_factory.emitter.create(
            position.x,
            position.y,
            {collisions: false, amount: 40, amountPerTick:10, interval: 1, collisionFilter:{group: -1}}
            );
    emmiter.start();
}


//window.restart()
