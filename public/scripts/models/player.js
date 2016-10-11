define([
    'pixi',
    'pubsub',
    'enums/events',
    'enums/keys',
    'core/hotkey',
    'models/turret',
    'blueprints/ships',
    'components/staticParticle',
    'particles/trail'
], function(PIXI, PubSub, EVENTS, KEYS, Hotkey, Turret, ShipBlueprints, StaticParticle, trail){
    var playerId = null;

    PubSub.subscribe(EVENTS.CONNECTION.OPEN, (e, data) => {
        playerId = data.message.actorId;
    });


    function onUpdate(){
        this.x += this.vx;
        this.y += this.vy;

       if (this.rotation > Math.PI * 2){
           this.rotation -= Math.PI * 2;
       } else if (this.rotation < -Math.PI * 2){
           this.rotation += Math.PI * 2;
       }

        if (typeof this.animateMovement === 'object' && this.animateMovement){
            this.animateMovement.ticks ++;

            if (this.animateMovement.ticks >= 5){
                this.animateMovement = null;
                this.vx = 0;
                this.vy = 0;
            }
        }

        if (this.systems){
            this.systems.forEach(systemsIterator);
        }
    }

    function systemsIterator(t){
        if (typeof t.onUpdate === 'function'){
            t.onUpdate();
        }
    }

    function applyUpdate(newState){
        this.animateMovement = {
            x: newState.x,
            y: newState.y,
            velX: (newState.x - this.x ) * 0.2,
            velY: (newState.y - this.y ) * 0.2,
            ticks: 0
        };

        this.vx = this.animateMovement.velX;
        this.vy = this.animateMovement.velY;

        const projectedRotation = -(newState.rotation || 0) + Math.PI * 0.5;
        this.rotation = projectedRotation;
    }

    return function Player(options, stage){
        const texture = PIXI.loader.resources['/public/images/spaceship-01.png']
            .texture;
        const player = new PIXI.Container();
        const playerSprite = new PIXI.Sprite(texture);
        const blueprint = ShipBlueprints.find(b => b.id === options.type);

        player.id = options.id;
        player.kind = 'player';

        player.vx = 0;
        player.vy = 0;

        playerSprite.anchor.x = 0.5;
        playerSprite.anchor.y = 0.5;

        player.rotation = 0;
        player.rotateDirection = 0;
        player.projectedRotation = Math.PI * 0.5;

        player.onUpdate = onUpdate;
        player.applyUpdate = applyUpdate;

        if (player.id === playerId){
            Hotkey.register({
                keycode: KEYS.W,
                onPress: () => {
                    PubSub.publish(EVENTS.COMMANDS.PLAYER.ACCELERATE);
                },
                onRelease: () => {
                    PubSub.publish(EVENTS.COMMANDS.PLAYER.DECELERATE);
                }
            });

            Hotkey.register({
                keycode: KEYS.A,
                onPress: () => {
                    PubSub.publish(EVENTS.COMMANDS.PLAYER.RADIAL_ACCELERATE, {
                        direction: -1
                    });
                },
                onRelease: () => {
                    PubSub.publish(EVENTS.COMMANDS.PLAYER.RADIAL_DECELERATE);
                }
            });

            Hotkey.register({
                keycode: KEYS.D,
                onPress: () => {
                    PubSub.publish(EVENTS.COMMANDS.PLAYER.RADIAL_ACCELERATE, {
                        direction: 1
                    });
                },
                onRelease: () => {
                    PubSub.publish(EVENTS.COMMANDS.PLAYER.RADIAL_DECELERATE);
                }
            });
        }

        player.addChild(playerSprite);
        player.systems = [];

        blueprint.systems.forEach(s => {
            var system = null;

            if (s.kind === 'turret'){
                system = Turret({
                   x: s.offset.x,
                   y: s.offset.y,
                   isControllable: player.id === playerId,
                   parent: player
                });
            } else if (s.kind === 'trail'){
                const radius = Math.sqrt(s.offset.x*s.offset.x + s.offset.y *s.offset.y);
                const xAngle = Math.acos(s.offset.x / radius);
                const yAngle = Math.asin(s.offset.y / radius);

                console.log(JSON.stringify(s, null, 21));
                console.log(`x:${xAngle / Math.PI * 180}, y:${yAngle / Math.PI * 180}`);

                system = StaticParticle({
                    textures: [PIXI.loader.resources['/public/particles/particle.png'].texture],
                    particle: trail,
                    x: 0,
                    y: 0,
                    onUpdate: function (){
                        const _y = yAngle + player.rotation;
                        const _x = xAngle + player.rotation;

                        this.particle.spawnPos.x = player.x + Math.cos(_x) * radius;
                        this.particle.spawnPos.y = player.y + Math.sin(_y) * radius;

                        this.particle.emit = !!player.animateMovement;
                        this.particle.update(20 * 0.001);
                    }
                    /*TODO: destroy particle on player removal*/
                });

                return stage.addChild(system);
            }

            if (system){
                player.systems.push(system);
            }
        });

        player.systems.forEach(s => player.addChild(s));

        return player;
    }
});
