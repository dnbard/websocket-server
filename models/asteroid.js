"use strict";

const Actor = require('./actor');
const AsteroidsMetadata = require('../public/images/asteroids/asteroids.json');

const GEOMETRY = require('../enums/geometry');

const types = [
    'gray01',
    'gray02',
    'gray03'
];

class Asteroid extends Actor{
    constructor(options){
        super(options);

        const asteroidData = AsteroidsMetadata[Math.trunc(Math.random() * AsteroidsMetadata.length)];

        this.kind = 'asteroid';
        this.type = asteroidData.filename;
        this.size = asteroidData.width * 0.35;
        this.geometry = GEOMETRY.CIRCLE;

        this.rotationSpeed = Math.random() * 0.01 - 0.005;

        this.maxArmor = Math.round(Math.random() * 10);
        this.armor = this.maxArmor;
    }

    onDamage(actor, stage){
        this.armor --;

        if (this.armor <= 0){
            stage.removeActorById(this.id);
            //TODO: spawn loot; respawn asteroid
        }
    }

    onUpdate(){
        this.rotation += this.rotationSpeed;
    }
}

module.exports = Asteroid;