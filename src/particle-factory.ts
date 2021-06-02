/* eslint no-unused-vars: "off" */
import {Env} from './env'
import Player from './player'
import { Engine, Render, Runner, Composites,
  Composite, Common, World, Bodies, Grid,
  MouseConstraint, Mouse, Body, Events, } from 'matter-js'

declare module 'matter-js' {
  interface Body {
    isParticle: boolean
    decaySpeed: number
  }
  interface Runner {
    fps: any
  }
}


export class ParticleEmitterFactory {
    env: Env

    constructor(env: Env) {
        if(env.particle_factory !== undefined) { throw new Error("Only one factory per env")}
        this.env = env
    }
    create(x, y, opts) {
        return new Emitter(x, y, {env: this.env, ...opts})
    }
}

class Emitter{
    static numParticles = 0;
    env: Env
    particlesAdded: number
    pos: {x, y}
    options: any 
    running: boolean
    owner: Player

    constructor(x, y, {owner, env, ...options}) {
        this.env = env
        this.particlesAdded = 0;
        let defaults = Emitter.defaults;
        //Reset options to defaults
        // let options = (...defaults, ...options)
        if (options === undefined) {
            options = defaults;
        }
        if (options.collisions === undefined) {
            options.collisions = defaults.collisions;
        }
        if (options.isStatic === undefined) {
            options.isStatic = defaults.isStatic;
        }
        if (options.size === undefined) {
            options.size = defaults.size;
        } else if (typeof options.size === "number") {
            options.size = {
                min: options.size,
                max: options.size
            };
        }
        if (options.amount === undefined) {
            options.amount = defaults.amount;
        }
        if (options.interval === undefined) {
            options.interval = defaults.interval;
        }
        if (options.velocity === undefined) {
            options.velocity = defaults.velocity;
        }
        if (options.velocity.direction === undefined) {
            options.velocity.direction = defaults.velocity.direction;
        } else if (options.velocity.direction.x === undefined) {
            options.velocity.direction.x = defaults.velocity.direction.x;
        } else if (options.velocity.direction.y === undefined) {
            options.velocity.direction.y = defaults.velocity.direction.y;
        }
        if (options.colors === undefined) {
            options.colors = defaults.colors;
        } else if (typeof options.colors === "string") {
            options.colors = [options.colors];
        }
        if (options.delay === undefined) {
            options.delay = defaults.delay;
        }
        if (options.frictionAir === undefined) {
            options.frictionAir = defaults.frictionAir;
        }
        if (options.parent === undefined) {
            options.parent = defaults.parent;
        }
        if (options.collisionFilter === undefined) {
            options.collisionFilter = defaults.collisionFilter;
        }
        if (options.amountPerTick === undefined || options.amountPerTick < 1) {
            options.amountPerTick = defaults.amountPerTick;
        }
        if (options.decaySpeed === undefined) {
            options.decaySpeed = defaults.decaySpeed;
        }
        if (options.decaySpeed < 0) {
            options.decaySpeed = 0;
        }
        if (options.decaySpeed > 1) {
            options.decaySpeed = 1;
        }

        options.collisions = options.collisions ? false : true;

        //Reset x/y to defaults
        if (x === undefined) {
            x = defaults.x;
        }
        if (y === undefined) {
            y = defaults.y;
        }

        //Change velocity.direction
        let dir = options.velocity.direction;
        if (typeof dir.y === "string") {
            dir.y = dir.y.toLowerCase();
            if (dir.y === "up") {
                options.velocity.direction.y = -1;
            } else if (dir.y === "down") {
                options.velocity.direction.y = 1;
            } else if (dir.y === "none") {
                options.velocity.direction.y = 0;
            }
        }
        if (typeof dir.x === "string") {
            dir.x = dir.x.toLowerCase();
            if (dir.x === "left") {
                options.velocity.direction.x = -1;
            } else if (dir.x === "right") {
                options.velocity.direction.x = 1;
            } else if (dir.x === "none") {
                options.velocity.direction.x = 0;
            }
        }

        this.pos = { x: x, y: y }
        this.options = options
        this.running = false
        this.owner = owner
    }
    stop() {
        let e = this;
        let amount = this.options.amount;
        this.options.amount = 0;
        this.running = false;
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                e.options.amount = amount;
            });
        });
    }
    start() {
        this.running = true
        this.particlesAdded = 0;
        this.addParticle();
    }
    addParticle(duplicated=false) {
        let emitter = this
        let pos = this.pos;
        let posX = pos.x;
        let posY = pos.y;
        let options = this.options;
        let delay = options.delay / this.env.engine.timing.timeScale;
        let pSize = options.size;
        let colors = options.colors;
        let vel = options.velocity;
        let number = options.amount;
        let interval = options.interval;
        let interactive = options.collisions;
        let frictionAir = options.frictionAir;
        let direction = options.velocity.direction;
        let collisionFilter = options.collisionFilter;
        let amountPerTick = options.amountPerTick;

        Emitter.numParticles++;
        this.particlesAdded++;

        if (this.options.parent !== undefined) {
            let parent = this.options.parent;
            pos = parent.position;
            this.pos = pos;

            if (parent.label === "Circle Body") {
                let angle = Math.random() * Math.PI * 2;
                let dist = Math.random() * parent.circleRadius;

                posX = dist * Math.cos(angle) + posX;
                posY = dist * Math.sin(angle) + posY;
            } else if (parent.label === "Rectangle Body") {
                posX =
                    Math.random() * (parent.bounds.max.x - parent.bounds.min.x) +
                    parent.bounds.min.x;
                posY =
                    Math.random() * (parent.bounds.max.y - parent.bounds.min.y) +
                    parent.bounds.min.y;
            }
        }

        let name = "particle" + Emitter.numParticles;
        let size = random(pSize.min, pSize.max);
        let color = colors[Math.round(random(colors.length))];
        color = color !== undefined ? color : colors[0];

        if (color === "random") {
            let r = random(0, 255);
            let g = random(0, 255);
            let b = random(0, 255);
            color = "rgb(" + r + ", " + g + ", " + b + ")";
        }

        let particle_opts = (({
            friction,
            frictionStatic,
            inertia
        }) => ({
            friction,
            frictionStatic,
            inertia
        }))(this.options);
        let particle = Bodies.polygon(posX, posY, 6, size, {
            isSensor: interactive,
            isStatic: this.options.isStatic,
            density: 1,
            restitution: this.options.restituition,
            frictionAir: frictionAir,
            render: {
                fillStyle: color
            },
            ...particle_opts
        });
        particle.decaySpeed = options.decaySpeed
        particle.isParticle = true
        particle.owner = this.owner
        this.env.particles[name] = particle

        World.add(this.env.world, particle);

        if (collisionFilter !== undefined) {
            particle.collisionFilter = collisionFilter;
        }

        let velX = random(0, vel.x);
        let velY = random(0, vel.y);

        if (vel.y === undefined) {
            velY = random(0, 2);
        }
        if (vel.x === undefined) {
            velX = random(0, 2);
        }

        if (direction.x === undefined || direction.x === 0) {
            velX = Boolean(Math.round(random())) ? velX : velX * -1;
        } else {
            velX *= direction.x;
        }

        if (direction.y === undefined || direction.y === 0) {
            velY = Boolean(Math.round(random())) ? velY : velY * -1;
        } else {
            velY *= direction.y;
        }
        Body.setVelocity(particle, {
            x: velX,
            y: velY
        });

        let scale = 1;

        function decreaseScale() {
            scale -= options.decaySpeed * emitter.env.engine.timing.timeScale;
            particle.circleRadius = size * scale;
            if (particle.circleRadius > options.decaySpeed) {
                requestAnimationFrame(decreaseScale);
            } else {
                Composite.remove(emitter.env.world, particle);
            }
        }
        setTimeout(decreaseScale, delay);

        if (this.particlesAdded < number && !duplicated) {
            if (interval > 0) {
                let framesPast = 0;
                function waitForInterval() {
                    if (emitter.options.amount > 0) {
                        framesPast += emitter.env.engine.timing.timeScale;
                        if (emitter.env.runner !== undefined && emitter.env.runner.fps !== undefined) {
                            if (framesPast >= interval / (1000 / emitter.env.runner.fps)) {
                                if (amountPerTick > 1) {
                                    for (let i = amountPerTick; i--;) {
                                        if (i !== 0) {
                                            emitter.addParticle(true);
                                        } else {
                                            emitter.addParticle();
                                        }
                                    }
                                } else {
                                    emitter.addParticle();
                                }
                            } else {
                                requestAnimationFrame(waitForInterval);
                            }
                        } else {
                            if (
                                framesPast >=
                                interval / 16.67 / emitter.env.engine.timing.timeScale
                            ) {
                                for (let i = amountPerTick; i--;) {
                                    if (i !== 0) {
                                        emitter.addParticle(true);
                                    } else {
                                        emitter.addParticle();
                                    }
                                }
                            } else {
                                requestAnimationFrame(waitForInterval);
                            }
                        }
                    } else {
                        emitter.running = false;
                    }
                }
                requestAnimationFrame(waitForInterval);
            } else {
                this.addParticle();
            }
        }
    }

    static defaults = {
        colors: ["#FE601C", "#EBDB14", "#EB471F", "#ED7A0E"],
        collisions: false,
        isStatic: false,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        size: {
            min: 0.5,
            max: 2
        },
        amount: 50,
        interval: 0,
        amountPerTick: 1,
        velocity: {
            x: 5,
            y: 5,
            direction: {
                x: "none",
                y: "none"
            }
        },
        delay: 400,
        decaySpeed: 0.1,
        frictionAir: 0.02,
        parent: undefined,
        collisionFilter: undefined
    }
}

function random(min:any=undefined, max:any=undefined) {
        if (min === undefined && max === undefined) {
            min = 0;
            max = 1;
        } else if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
}

