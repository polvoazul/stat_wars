/* eslint no-unused-vars: "off" */
import Color from "color";
import { Bodies, Body, Composite, World } from 'matter-js';
import { Env } from "./env";
import { Emitter } from "./particle-factory";

const pallete = '#F51720 #FA26A0 #F8D210 #2FF3E0'.split(' ').map(x => new Color(x))

export default class Player {
    shape: Body
    health: number
    max_health: number
    died_at: Date | null
    damage_dealt: number
    idx: number
    env: Env
    world: World
    color: Color
    original_color: Color
    emitter! : Emitter
    name: string
    damage_per_ball: number
    balls_per_second: number


  static idx = 0;
  constructor(x, y, env, {max_health, name, damage_per_ball, balls_per_second}) {
    this.idx = Player.idx++;
    this.max_health = max_health;
    this.health = this.max_health;
    this.env = env;
    this.world = this.env.world;
    this.color = pallete[this.idx % pallete.length]
    this.original_color = pallete[this.idx % pallete.length]
    this.shape = this._build_shape(x, y);
    this.damage_per_ball = damage_per_ball
    this.balls_per_second = balls_per_second
    this.damage_dealt = 0
    this.died_at = null
    this.name = name
  }

  _build_shape(x, y) {
    let opts = {
      isStatic: true,
      render: {
        fillStyle: this.color.string(),
        strokeStyle: "white",
        lineWidth: 3
      },
      collisionFilter: this.collision_filter
    };
    let shape = Bodies.rectangle(x, y, 30, 30, opts)
    shape.player = this
    return shape
  }

  get collision_filter() {
    let category = 1 << (this.idx + 1); // +1 because category 1 is the default (walls)
    let mask = -1 ^ category; // colide with all but yourself
    return { category: category, mask: mask, group: 0 };
  }

  build_emitter() {
    let opts = {
      amount: Infinity,
      interval: 1000 / this.balls_per_second,
      amountPerTick: 1, // batch size
      size: { min: 5, max: 20 },
      delay: 1000 * 10,
      collisions: true,
      restituition: 1,
      colors: this.original_color.string(),
      collisionFilter: this.collision_filter,
      frictionStatic: 0,
      frictionAir: 0,
      friction: 0,
      decaySpeed: 0.03,
    };
    // Composite.add(this.world, Bodies.polygon(300, 300, 10, 50, {restituition: 1, friction:0, frictionAir:0, frictionStatic:0}))
    // return
    this.emitter = this.env.particle_factory.create(
      this.x,
      this.y,
      {owner: this, ...opts}
    );
    this.emitter.start();
  }

  get x() {
    return this.shape.position.x;
  }

  get y() {
    return this.shape.position.y;
  }

  take_damage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
    let health_percentage = this.health / this.max_health;
    this.color = this.color.alpha(health_percentage)
    this.shape.render.fillStyle = this.color.string();
    return damage
  }

  die() {
    console.log(`Player ${this.idx} DIED`);
    Composite.remove(this.world, this.shape);
    this.emitter.stop();
    this.died_at = new Date()
  }
}

