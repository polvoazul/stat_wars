"use strict"
import Color from "https://colorjs.io/dist/color.esm.js";

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


export default class Player {
  ///////////////////// PLAYER
  static get pallete() {
    let out = '#F51720 #FA26A0 #F8D210 #2FF3E0'.split(' ').map(x => new Color(x))
    return out
  }

  static idx = 0;
  constructor(x, y, env) {
    this.idx = Player.idx++;
    this.max_health = 100;
    this.health = this.max_health;
    this.env = env;
    this.world = this.env.world;
    this.color = Player.pallete[this.idx % Player.pallete.length]
    this.original_color = Player.pallete[this.idx % Player.pallete.length]
    this.shape = this._build_shape(x, y);
  }

  _build_shape(x, y) {
    let opts = {
      isStatic: true,
      render: {
        fillStyle: this.color.toString(),
        strokeStyle: "white",
        lineWidth: 3
      },
      collisionFilter: this.collision_filter
    };
    let shape = Bodies.rectangle(x, y, 30, 30, opts);
    shape.player = this;
    shape.is_player = true;
    return shape;
  }

  get collision_filter() {
    let category = 1 << (this.idx + 1); // +1 because category 1 is the default (walls)
    let mask = -1 ^ category; // colide with all but yourself
    return { category: category, mask: mask, group: 0 };
  }

  build_emmiter() {
    let opts = {
      amount: Infinity,
      interval: 1001, // in millis
      amountPerTick: 1, // batch size
      size: { min: 5, max: 20 },
      delay: 1000 * 10,
      collisions: true,
      restituition: 1,
      colors: this.original_color.toString(),
      collisionFilter: this.collision_filter,
      frictionStatic: 0,
      frictionAir: 0,
      friction: 0,
      decaySpeed: 0.03,
    };
    // Composite.add(this.world, Bodies.polygon(300, 300, 10, 50, {restituition: 1, friction:0, frictionAir:0, frictionStatic:0}))
    // return
    this.emmiter = this.env.particle_factory.emitter.create(
      this.x,
      this.y,
      opts
    );
    this.emmiter.start();
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
    this.color.alpha = health_percentage
    this.shape.render.fillStyle = this.color.toString();
  }

  die() {
    console.log(`Player ${this.idx} DIED`);
    Composite.remove(this.world, this.shape);
    this.emmiter.stop();
    this.dead = true;
  }
}

