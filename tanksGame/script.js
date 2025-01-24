// SETTINGS

// TODO (low priority)
// Fix collision with walls friction and stuff
// Make tanks not push each other (settable)
// Make shot balls not pass through walls
// Fix maze generation (no overlap)
// Add mobile controls somehow


//NEW STUFF
var DEF_ACCELERATION = 10  //Works weird??
var DEF_MAX_SPEED = 5
var ROTATION_SPEED = 2.5
var MAZE_SIZE = 10
var DEF_BULLET_SPEED = 7
var SHOT_DELAY = 200
var BULLET_LIFETIME = 7000
var MAX_BULLETS = 10
var DISPERSION = 0
var MAZE_DELETE_CHANCE = 20
var DEF_BULLET_SIZE = 8
var DEF_MAZE_THICKNESS = 15
var DEF_TANK_SIZE = 35

// Not implemented
const PUSHABLE = true
const ROTATABLE = false  //true value doesnt work well

// Needed const
const ROTATION_SPEED_RAD = ROTATION_SPEED * (Math.PI/180)

//Game vars
var score = [0, 0]

// to engine
var DEF_GRAVITY = 0
var DEF_GRAVITY_X = 0
var BOUNCINESS = 0
var FRICTION = 1
var FRICTION_STATIC = 1
var FRICTION_AIR = 1
var RESTING = 0.1  //autism jednotka proste cim menej tym presnejsie bounces default: 4
var POSITION_ITER = 30  //makes stacking more stable, default: 6

// Colors
const BG_COLOR = 0xebac54
const PADDING_COLOR = 0x4a4640
const MAZE_COLOR = 0x000000
const BUTTON_COLOR = 0x701340
const BUTTON_HOVER_COLOR = 0x991153

// Changeable
var GAME_SIDES_RATIO = 1  // 0.5;  WIDTH : HEIGHT (1 = square) -> WIDTH == 0.5*HEIGHT

const PADDING_TOP_RATIO = 1/20
const PADDING_BOTTOM_RATIO = 1/15
const PADDING_SIDES_RATIO = 1/20



//Calculate needed constants
//need recount
let DPR
let WIDTH
let HEIGHT

let SCALE_RATIO

let FIXED_PADDING_TOP
let FIXED_PADDING_BOTTOM
let FIXED_PADDING_SIDE

let MIN_GAME_WIDTH
let MIN_GAME_HEIGHT


let PADDING_TOP
let PADDING_BOTTOM
let PADDING_SIDE

let GAME_WIDTH
let GAME_HEIGHT

let GAME_SCALE_RATIO

let MAX_QUEUE_HEIGHT
let GAME_LINE_HEIGHT
let FRUIT_SPAWN_PADDING

let ACCELERATION
let MAX_SPEED
let BULLET_SIZE
let BULLET_SPEED
let MAZE_THICKNESS
let TANK_SIZE

let DIAMETERS
let GRAVITY
let GRAVITY_X

let FONT
let COLORS

function recount_scaleable() {
    // Part 1 of calculations
    DPR = window.devicePixelRatio
    WIDTH = window.innerWidth * DPR
    HEIGHT = window.innerHeight * DPR

    SCALE_RATIO = HEIGHT / 1000

    FIXED_PADDING_TOP = HEIGHT * PADDING_TOP_RATIO
    FIXED_PADDING_BOTTOM = HEIGHT * PADDING_BOTTOM_RATIO
    FIXED_PADDING_SIDE = WIDTH * (PADDING_SIDES_RATIO / 2)

    MIN_GAME_WIDTH = WIDTH - 2 * FIXED_PADDING_SIDE
    MIN_GAME_HEIGHT = HEIGHT - FIXED_PADDING_TOP - FIXED_PADDING_BOTTOM

    // Game ratio stuff
    if (MIN_GAME_WIDTH >= GAME_SIDES_RATIO * MIN_GAME_HEIGHT) {  //Too wide
        PADDING_TOP = FIXED_PADDING_TOP
        PADDING_BOTTOM = FIXED_PADDING_BOTTOM
        PADDING_SIDE = FIXED_PADDING_SIDE + (MIN_GAME_WIDTH - GAME_SIDES_RATIO * MIN_GAME_HEIGHT) / 2
    
    } else {  //Too high (WIDTH < RATIO*HEIGHT)
        PADDING_TOP = FIXED_PADDING_TOP + (MIN_GAME_HEIGHT - MIN_GAME_WIDTH / GAME_SIDES_RATIO) / 2
        PADDING_BOTTOM = FIXED_PADDING_BOTTOM + (MIN_GAME_HEIGHT - MIN_GAME_WIDTH / GAME_SIDES_RATIO) / 2
        PADDING_SIDE = FIXED_PADDING_SIDE
    }
    
    GAME_WIDTH = WIDTH - 2 * PADDING_SIDE
    GAME_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM
    
    GAME_SCALE_RATIO = GAME_HEIGHT / 1000
    
    // MAX_QUEUE_HEIGHT = 55 * SCALE_RATIO
    // GAME_LINE_HEIGHT = PADDING_TOP + GAME_SCALE_RATIO * 150
    // FRUIT_SPAWN_PADDING = 10 * GAME_SCALE_RATIO

    // // Colors
    // COLORS = []
    // for (let i = 0; i < DIAMETERS.length; i++) {
    //     COLORS.push(getRandomColor())
    // }

    // Gravity
    GRAVITY = DEF_GRAVITY*GAME_SCALE_RATIO
    GRAVITY_X = DEF_GRAVITY_X*GAME_SCALE_RATIO

    // Font
    FONT = {
        fontSize: 25*SCALE_RATIO,
        fontFamily: 'LocalComicSans, Comic Sans MS, Comic Sans, Verdana, serif',
        color: "white"
    }

    ACCELERATION = DEF_ACCELERATION * GAME_SCALE_RATIO
    MAX_SPEED = DEF_MAX_SPEED * GAME_SCALE_RATIO
    BULLET_SIZE = DEF_BULLET_SIZE * GAME_SCALE_RATIO
    BULLET_SPEED = DEF_BULLET_SPEED * GAME_SCALE_RATIO
    MAZE_THICKNESS = DEF_MAZE_THICKNESS * GAME_SCALE_RATIO
    TANK_SIZE = DEF_TANK_SIZE * GAME_SCALE_RATIO
}

recount_scaleable()


function windowResize() {
    // recount disabled cuz nechcem forcovat restart
    // recount_scaleable()
    game.scale.setGameSize(WIDTH, HEIGHT)
    game.scale.displaySize.resize(WIDTH, HEIGHT);

    // game.scene.scenes.forEach((scene) => {
    //     const key = scene.scene.key;
    //     game.scene.stop(key);
    // })
    // game.scene.start('Menu');
}

function randint(start, stop) {
    return Math.floor(Math.random() * (stop - start + 1)) + start;
}

function getRandomColor() {
    var letters = '23456789ABCD';
    var color = '0x';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}



class MazeTile {
    constructor() {
        this.visited = false
        this.walls = {
            up: true,
            down: true,
            left: true,
            right: true
        }
    }
}

class Maze {
    constructor(width, height, to_delete_chance=0) {
        this.maze = [];  // Access as this.maze[y][x]
        this.width = width;
        this.height = height;
        
        if (this.width <= 0 || this.height <= 0) {
            return
        }

        this.populate()
        this.create_maze()
        if (0 < to_delete_chance <= 100) {
            this.empty_percentage(to_delete_chance)
        }
    }

    populate() {
        for (let i = 0; i < this.height; i++) {
            let row = []
            for (let j = 0; j < this.width; j++) {
                row.push(new MazeTile())
            }
            this.maze.push(row)
        }
    }

    _change_wall(x, y, wall, action) {
        if (wall == "right" && x + 1 < this.width) {
            this.maze[y][x].walls.right = action
            this.maze[y][x+1].walls.left = action

        } else if (wall == "left" && x - 1 >= 0) {
            this.maze[y][x].walls.left = action
            this.maze[y][x-1].walls.right = action

        } else if (wall == "down" && y + 1 < this.height) {
            this.maze[y][x].walls.down = action
            this.maze[y+1][x].walls.up = action

        } else if (wall == "up" && y - 1 >= 0) {
            this.maze[y][x].walls.up = action
            this.maze[y-1][x].walls.down = action

        }
    }

    _maze_recursive(x, y) {
        this.maze[y][x].visited = true

        let keys = Object.keys(this.maze[y][x].walls).filter(k => this.maze[y][x].walls[k])
        keys.sort(() => 0.5 - Math.random())

        while (keys.length > 0) {
            let key = keys.pop()
            if (key == "right" && x + 1 < this.width && !this.maze[y][x+1].visited) {
                this._change_wall(x, y, "right", false)
                this._maze_recursive(x+1, y)
            
            } else if (key == "left" && x - 1 >= 0 && !this.maze[y][x-1].visited) {
                this._change_wall(x, y, "left", false)
                this._maze_recursive(x-1, y)

            } else if (key == "down" && y + 1 < this.height && !this.maze[y+1][x].visited) {
                this._change_wall(x, y, "down", false)
                this._maze_recursive(x, y+1)

            } else if (key == "up" && y - 1 >= 0 && !this.maze[y-1][x].visited) {
                this._change_wall(x, y, "up", false)
                this._maze_recursive(x, y-1)

            }
        }

        return
    }

    create_maze() {
        this._maze_recursive(0, 0)
    }

    empty_percentage(percentage) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x].walls.right) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "right", false)
                    }
                }
                if (this.maze[y][x].walls.left) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "left", false)
                    }
                }
                if (this.maze[y][x].walls.up) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "up", false)
                    }
                }
                if (this.maze[y][x].walls.down) {
                    let roll = Math.random()
                    if (roll < percentage/100) {
                        this._change_wall(x, y, "down", false)
                    }
                }
            }
        }
    }

    draw(scene, matter_obj, start_x, start_y, tile_size, thickness=15) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let walls = this.maze[y][x].walls
                
                let canvas_x = start_x + x * tile_size
                let canvas_y = start_y + y * tile_size
                if (walls.left) {
                    let wall = scene.add.rectangle(canvas_x, canvas_y + tile_size/2, thickness, tile_size + thickness, MAZE_COLOR)
                    scene.matter.add.gameObject(wall, matter_obj)
                }

                if (walls.up) {
                    let wall = scene.add.rectangle(canvas_x + tile_size/2, canvas_y, tile_size + thickness, thickness, MAZE_COLOR)
                    scene.matter.add.gameObject(wall, matter_obj)
                }
            }
        }

        // Finish outer wall
        let outer1 = scene.add.rectangle(start_x + this.width*tile_size, start_y + (this.height*tile_size)/2, thickness, this.height*tile_size + thickness, MAZE_COLOR)
        scene.matter.add.gameObject(outer1, matter_obj)

        let outer2 = scene.add.rectangle(start_x + (this.width*tile_size)/2, start_y + this.height*tile_size, this.width*tile_size + thickness, thickness, MAZE_COLOR)
        scene.matter.add.gameObject(outer2, matter_obj)
    }
}

class Bullet {
    constructor(scene, x, y, rotation, physics_obj, remove_callback=null, remove_callback_scope=null) {
        this.scene = scene
        this.remove_callback = remove_callback
        this.remove_callback_scope = remove_callback_scope

        let circle = this.scene.add.circle(x, y, BULLET_SIZE, MAZE_COLOR)
        this.bullet = this.scene.matter.add.gameObject(circle, physics_obj)
        this.bullet.setVelocity(BULLET_SPEED * Math.sin(rotation), - BULLET_SPEED * Math.cos(rotation))

        this.lifetime_timer = this.scene.time.addEvent({
            delay: BULLET_LIFETIME,
            startAt: 0,
            callback: this.remove,
            callbackScope: this,
        });
    }

    remove() {
        this.bullet.destroy()
        if (this.remove_callback != null) {
            if (this.remove_callback_scope) {
                this.remove_callback.call(this.remove_callback_scope)
            } else {
                this.remove_callback()
            }
        }
    }
}

class Tank {
    constructor(data) {
        this.dead_flag = false
        this.scene = data.scene
        this.bullet_physics_obj = data.bullet_physics_obj
        this.bullet_count = 0

        let tank1obj = this.scene.add.sprite(data.x, data.y, data.sprite)

        this.tank = this.scene.matter.add.gameObject(tank1obj, data.physics_obj)
        this.tank.setScale(data.size / 1000)
        this.height = this.tank.height * (data.size / 1000)
        this.width = this.tank.width * (data.size / 1000)

        // Register Controls
        this.key_up = this.scene.input.keyboard.addKey(data.controls.up);
        this.key_down = this.scene.input.keyboard.addKey(data.controls.down);
        this.key_left = this.scene.input.keyboard.addKey(data.controls.left);
        this.key_right = this.scene.input.keyboard.addKey(data.controls.right);
        this.key_shoot = this.scene.input.keyboard.addKey(data.controls.shoot);

        // Add shoot delay timer
        this.shot_delay_timer = this.scene.time.addEvent({
            delay: SHOT_DELAY,
            startAt: SHOT_DELAY
        });

        // Add collision with bullet check
        this.tank.setOnCollide(this.collision, "hi")
    }

    update() {
        if (!this.tank.active) {
            if (!this.dead_flag) {
                this.dead_flag = true
                // this.death() // MAYBE UNNEEDED
            }
            return
        }

        this.tank.setFrictionAir(FRICTION_AIR)
        let key_pressed = false
        if(this.key_up.isDown) {
            key_pressed = true
            this.tank.setFrictionAir(0)
            
            let new_vel_x = this.tank.body.velocity.x + ACCELERATION * Math.sin(this.tank.rotation)
            let new_vel_y = this.tank.body.velocity.y - ACCELERATION * Math.cos(this.tank.rotation)
            if (new_vel_x**2 + new_vel_y**2 < MAX_SPEED**2) {
                this.tank.setVelocity(new_vel_x, new_vel_y)
            } else {
                this.tank.setVelocity(MAX_SPEED * Math.sin(this.tank.rotation), - MAX_SPEED * Math.cos(this.tank.rotation))
            }
            
        }
        else if(this.key_down.isDown) {
            key_pressed = true
            this.tank.setFrictionAir(0)

            let new_vel_x = this.tank.body.velocity.x - ACCELERATION * Math.sin(this.tank.rotation)
            let new_vel_y = this.tank.body.velocity.y + ACCELERATION * Math.cos(this.tank.rotation)
            if (new_vel_x**2 + new_vel_y**2 < MAX_SPEED**2) {
                this.tank.setVelocity(new_vel_x, new_vel_y)
            } else {
                this.tank.setVelocity(- MAX_SPEED * Math.sin(this.tank.rotation), MAX_SPEED * Math.cos(this.tank.rotation))
            }
        }

        if(this.key_left.isDown) {
            key_pressed = true
            this.tank.setAngle(this.tank.angle - ROTATION_SPEED)
            this.tank.setVelocity(
                this.tank.body.velocity.x * Math.cos(-ROTATION_SPEED_RAD) - this.tank.body.velocity.y * Math.sin(-ROTATION_SPEED_RAD),
                this.tank.body.velocity.x * Math.sin(-ROTATION_SPEED_RAD) + this.tank.body.velocity.y * Math.cos(-ROTATION_SPEED_RAD)
            )
        }
        else if(this.key_right.isDown) {
            key_pressed = true
            this.tank.setAngle(this.tank.angle + ROTATION_SPEED)
            this.tank.setVelocity(
                this.tank.body.velocity.x * Math.cos(ROTATION_SPEED_RAD) - this.tank.body.velocity.y * Math.sin(ROTATION_SPEED_RAD),
                this.tank.body.velocity.x * Math.sin(ROTATION_SPEED_RAD) + this.tank.body.velocity.y * Math.cos(ROTATION_SPEED_RAD)
            )
        }

        if(key_pressed) {
            // this.tank1.setFrictionAir(0)
        } else {
            // this.tank1.setFrictionAir(FRICTION_AIR)
        }

        if(this.key_shoot.isDown) {
            if (this.shot_delay_timer.getRemaining() <= 0 && this.bullet_count < MAX_BULLETS) {
                // Reset shoot delay timer
                this.shot_delay_timer.reset({delay: SHOT_DELAY})
                this.shoot()
            }
        }
    }

    shoot() {
        this.bullet_count += 1

        new Bullet(
            this.scene,
            this.tank.body.position.x + (this.width/2 + BULLET_SIZE + 5) * Math.sin(this.tank.rotation),
            this.tank.body.position.y - (this.height/2 + BULLET_SIZE + 5) * Math.cos(this.tank.rotation),
            this.tank.rotation + (randint(- DISPERSION/2 * 100, DISPERSION/2 * 100) / 100) * (Math.PI/180),
            this.bullet_physics_obj,
            this.bullet_removed, this
        )
    }

    bullet_removed() {
        this.bullet_count -= 1
    }

    collision(event) {
        if (event.bodyA.label == "Bullet" || event.bodyB.label == "Bullet") {
            if (event.bodyA.gameObject != null) {
                event.bodyA.gameObject.destroy()
            }
            if (event.bodyB.gameObject != null) {
                event.bodyB.gameObject.destroy()
            }
        }
    }
}



class NumberInput {
    constructor (scene, x, y, width, height, min=null, max=null, step="any") {
        this.input_object = scene.add.dom(x, y).createFromHTML(this.getInputString(width, height, step))
        if (min != null) {
            this.setMin(min)
        }
        if (max != null) {
            this.setMax(max)
        }
    }

    setMin(value) {
        this.input_object.getChildByName("myInput").min = value
    }

    setMax(value) {
        this.input_object.getChildByName("myInput").max = value
    }

    getInputString(width, height, step) {
        return `
            <input type="number" name="myInput" placeholder="Value" step="${step}" style="${this.getInputStyle(width, height)}"/>
        `
    }

    getInputStyle(width, height) {
        return `
                font-size: ${FONT.fontSize}px;
                width: ${width}px;
                height: ${height}px;
                padding: 0px;
                text-indent: 10px;
        `
        .replace(/\s+/g, '') // Remove whitespaces
    }

    getVal() {
        let html_obj = this.input_object.getChildByName("myInput")
        if(html_obj.value != "") {
            return Number(html_obj.value)
        } else {
            return null
        }
    }

    setVal(value) {
        let html_obj = this.input_object.getChildByName("myInput")
        html_obj.value = value
    }

    destroy() {
        this.input_object.destroy()
    }
}


class MyScene extends Phaser.Scene {
    constructor(arg) {
        super(arg)
    }

    create_button(x, y, width, height, text, callback, color=BUTTON_COLOR, hover_color=BUTTON_HOVER_COLOR) {
        this.add.rectangle(x, y, width, height, color)
        .setInteractive({cursor: "pointer"})
        .on('pointerup', () => callback.call(this))
        .on('pointerover', function() {this.setFillStyle(hover_color)})
        .on('pointerout', function() {this.setFillStyle(color)});
        
        this.add.text(x, y, text, FONT).setOrigin(0.5)
    }

    create_input(x, y, width, height, min=null, max=null, step="any") {
        return new NumberInput(this, x, y, width, height, min, max, step)
    }
}


class Menu extends MyScene {
    constructor () {
        super("Menu")
    }

    create () {
        this.add.text(Math.floor(WIDTH/2), 80*SCALE_RATIO, "Tanks", FONT)
        .setOrigin(0.5)
        .setFontSize(70*SCALE_RATIO)
        .setWordWrapWidth(WIDTH)

        this.add.text(Math.floor(WIDTH/4), HEIGHT/4, "Player 1 (Red)\nWASD + SPACE", FONT)
        .setOrigin(0.5)
        .setFontSize(40*SCALE_RATIO)
        .setAlign("center")
        .setColor(" #eb3434")
        .setWordWrapWidth(WIDTH/2 - 5*SCALE_RATIO)

        this.add.text(WIDTH - Math.floor(WIDTH/4), HEIGHT/4, "Player 2 (Blue)\n↑←↓→ + ENTER", FONT)
        .setOrigin(0.5)
        .setFontSize(40*SCALE_RATIO)
        .setAlign("center")
        .setColor(" #3446eb")
        .setWordWrapWidth(WIDTH/2 - 5*SCALE_RATIO)

        this.create_button(WIDTH/2, HEIGHT/2 - 60*SCALE_RATIO, 200*SCALE_RATIO, 95*SCALE_RATIO, "PLAY", function(){
            this.scene.start("Game")
        })

        this.create_button(WIDTH/2, HEIGHT/2 + 60*SCALE_RATIO, 200*SCALE_RATIO, 95*SCALE_RATIO, "SETTINGS", function(){
            this.scene.start("Settings")
        })

        this.add.text(Math.floor(WIDTH/2), HEIGHT - 100*SCALE_RATIO, "-For 2 players!\n-Highly customizable!\n-Works only with a keyboard\n-After resizing the page reload it to fix visual issues", FONT)
        .setOrigin(0.5)
        .setFontSize(22*SCALE_RATIO)
        .setWordWrapWidth(WIDTH - 70*SCALE_RATIO)
    }
}

class Settings extends MyScene {
    constructor() {
        super("Settings")
    }

    create () {
        function save_data() {
            for (let i = 0; i < settings_setup.length; i++) {
                if (settings_setup[i].input.getVal() != null) {
                    window[settings_setup[i].name] = settings_setup[i].input.getVal()
                }
            }
            recount_scaleable()
        }

        this.add.text(Math.floor(WIDTH/2), 50*SCALE_RATIO, "Settings", FONT).setOrigin(0.5).setFontSize(45*SCALE_RATIO)
        this.add.text(WIDTH - WIDTH/6, 50*SCALE_RATIO, "*Changing these might make the game unplayable :)", FONT)
        .setOrigin(0.5)
        .setFontSize(15*SCALE_RATIO)
        .setWordWrapWidth(WIDTH/4)

        this.create_button(80*SCALE_RATIO, 50*SCALE_RATIO, 130*SCALE_RATIO, 55*SCALE_RATIO, "Home", function(){
            save_data()
            this.scene.start("Menu")
        })

        let settings_setup = [
            {
                name: "DEF_ACCELERATION",
                val: DEF_ACCELERATION,
                text: "Tank Acceleration",
                input: null
            },
            {
                name: "DEF_MAX_SPEED",
                val: DEF_MAX_SPEED,
                text: "Tank Max Speed",
                input: null
            },
            {
                name: "ROTATION_SPEED",
                val: ROTATION_SPEED,
                text: "Tank Rotation Speed",
                input: null
            },
            {
                name: "MAZE_SIZE",
                val: MAZE_SIZE,
                text: "Maze Grid Size",
                input: null
            },
            {
                name: "DEF_BULLET_SPEED",
                val: DEF_BULLET_SPEED,
                text: "Bullet Speed",
                input: null
            },
            {
                name: "SHOT_DELAY",
                val: SHOT_DELAY,
                text: "Tank Shot Delay (ms)",
                input: null
            },
            {
                name: "BULLET_LIFETIME",
                val: BULLET_LIFETIME,
                text: "Bullet Lifetime (ms)",
                input: null
            },
            {
                name: "MAX_BULLETS",
                val: MAX_BULLETS,
                text: "Maximum Bullet Count",
                input: null
            },
            {
                name: "DISPERSION",
                val: DISPERSION,
                text: "Shot Dispersion",
                input: null
            },
            {
                name: "MAZE_DELETE_CHANCE",
                val: MAZE_DELETE_CHANCE,
                text: "Maze Emptiness (%)",
                input: null
            },
            {
                name: "DEF_BULLET_SIZE",
                val: DEF_BULLET_SIZE,
                text: "Bullet Size",
                input: null
            },
            {
                name: "DEF_MAZE_THICKNESS",
                val: DEF_MAZE_THICKNESS,
                text: "Maze Thickness",
                input: null
            },
            {
                name: "DEF_TANK_SIZE",
                val: DEF_TANK_SIZE,
                text: "Tank Size",
                input: null
            }
        ]
        const OFFSET = 65
        const START = 150
        for (let i = 0; i < settings_setup.length; i++) {
            this.add.text(10*SCALE_RATIO, START*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), settings_setup[i].text, FONT)
            .setWordWrapWidth(WIDTH/2)
            .setFontSize(18*SCALE_RATIO)
            .setOrigin(0, 0.5)

            settings_setup[i].input = this.create_input(WIDTH / 2 + 50*SCALE_RATIO, START*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), 82*SCALE_RATIO, 42*SCALE_RATIO)
            settings_setup[i].input.setVal(settings_setup[i].val)
            this.add.line(0, 0, 10*SCALE_RATIO, (START + 35)*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), WIDTH - 10*SCALE_RATIO, (START + 35)*SCALE_RATIO + i * (OFFSET*SCALE_RATIO), 0xffffff)
            .setOrigin(0)
        }


    }
}

class LoseOverlay extends MyScene {
    constructor() {
        super("LoseOverlay")
    }

    create(args) {
        this.add.rectangle(WIDTH/2, HEIGHT/2, 250*SCALE_RATIO, 300*SCALE_RATIO, PADDING_COLOR).setAlpha(0.7)
        
        // this.add.text(WIDTH/2, HEIGHT/2 - 100*SCALE_RATIO, "Game Over", FONT).setOrigin(0.5).setFontSize(40*SCALE_RATIO)
        // this.add.text(WIDTH/2, HEIGHT/2 - 40*SCALE_RATIO, "Score: " + args.score, FONT).setOrigin(0.5)

        this.add.text(WIDTH/2, HEIGHT/2 - 100*SCALE_RATIO, args.winner_name + " wins!", FONT).setOrigin(0.5).setFontSize(40*SCALE_RATIO)
        this.add.text(WIDTH/2, HEIGHT/2 - 40*SCALE_RATIO, `Red: ${score[0]} — Blue: ${score[1]}`, FONT).setOrigin(0.5)

        this.create_button(WIDTH/2, HEIGHT/2 + 30*SCALE_RATIO, 150*SCALE_RATIO, 55*SCALE_RATIO, "Restart", function() {
            this.scene.start("Game")
        })

        this.create_button(WIDTH/2, HEIGHT/2 + 100*SCALE_RATIO, 150*SCALE_RATIO, 55*SCALE_RATIO, "Menu", function() {
            game.scene.stop("Game")
            this.scene.start("Menu")
        })
    }
}

class GameScene extends MyScene {
    constructor () {
        super("Game")
    }

    reset_variables() {
        //set gravity
        this.matter.world.setGravity(GRAVITY_X, GRAVITY)

        let inertia
        if (ROTATABLE) {
            inertia = 0
        } else {
            inertia = Infinity
        }

        this.score_text;

        this.default_tank_physics = {
            label: 'BodyTank',
            shape: {
                type: 'rectangle'
            },
            chamfer: null,
        
            isStatic: false,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: BOUNCINESS, // 0
            friction: FRICTION, // 0.1
            frictionStatic: FRICTION_STATIC, // 0.5
            frictionAir: FRICTION_AIR, // 0.01
        
            inertia: inertia,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        },

        this.default_bullet_physics = {
            label: 'Bullet',
            shape: {
                type: 'circle',
            },
            chamfer: null,
        
            isStatic: false,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: 1, // 0
            friction: 0, // 0.1
            frictionStatic: 0, // 0.5
            frictionAir: 0, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: -1,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        },

        this.default_wall_physics = {
            label: 'BodyWall',
            shape: {
                type: 'rectangle'
            },
            chamfer: null,
        
            isStatic: true,
            isSensor: false,
            isSleeping: false,
            ignoreGravity: true,
            ignorePointer: false,
        
            sleepThreshold: 60,
            density: 0.001,
            restitution: 0, // 0
            friction: 10, // 0.1
            frictionStatic: 0, // 0.5
            frictionAir: 0, // 0.01
        
            inertia: Infinity,
        
            force: { x: 0, y: 0 },
            angle: 0,
            torque: 0,
        
            collisionFilter: {
                group: 0,
                category: 0x0001,
                mask: 0xFFFFFFFF,
            },
        
            // parts: [],
        
            // plugin: {
            //     attractors: [
            //         (function(bodyA, bodyB) { return {x, y}}),
            //     ]
            // },
        
            slop: 0.05,
        
            timeScale: 1
        }
    }
    
    preload ()
    {
        this.reset_variables()
        this.load.image('tank_red', 'assets/tank_red.png');
        this.load.image('tank_blue', 'assets/tank_blue.png');
    }

    create ()
    {
        // Fix sudden stop of bouncing
        Phaser.Physics.Matter.Matter.Resolver._restingThresh = RESTING; // default is 4

        //Make stacking more stable
        this.matter.world.engine.positionIterations = POSITION_ITER;  // default is 6

        // Set world bounds
        this.matter.world.setBounds(PADDING_SIDE, PADDING_TOP, WIDTH - PADDING_SIDE*2, HEIGHT - PADDING_BOTTOM - PADDING_TOP, 1500);
        // this.matter.world.setBounds(0, 0, 800, 600, 500);

        // Create top and bottom rectangles
        this.add.rectangle(0, 0, WIDTH, PADDING_TOP, PADDING_COLOR).setOrigin(0)
        this.add.rectangle(0, HEIGHT - PADDING_BOTTOM, WIDTH, HEIGHT, PADDING_COLOR).setOrigin(0)

        // Create side rectangles
        this.add.rectangle(0, 0, PADDING_SIDE, HEIGHT, PADDING_COLOR).setOrigin(0)
        this.add.rectangle(WIDTH - PADDING_SIDE, 0, PADDING_SIDE, HEIGHT, PADDING_COLOR).setOrigin(0)

        // Create a home button
        this.create_button(WIDTH - Math.max(PADDING_SIDE, 10*SCALE_RATIO) - 60*SCALE_RATIO, 25*SCALE_RATIO, 120*SCALE_RATIO, 40*SCALE_RATIO, "Home", function(){
            this.scene.start("Menu")
        })

        // Add score texts
        this.score_text = this.add.text(Math.max(10*SCALE_RATIO, PADDING_SIDE), 25*SCALE_RATIO, `Red: ${score[0]} — Blue: ${score[1]}`, FONT)
        .setOrigin(0, 0.5)


        let tank1_data = {
            scene: this,
            x: PADDING_SIDE + (randint(1, MAZE_SIZE) * (GAME_WIDTH / MAZE_SIZE)) - (GAME_WIDTH / MAZE_SIZE)/2,
            y: PADDING_TOP + (randint(1, MAZE_SIZE) * (GAME_WIDTH / MAZE_SIZE)) - (GAME_WIDTH / MAZE_SIZE)/2,
            size: TANK_SIZE,
            sprite: "tank_red",
            physics_obj: this.default_tank_physics,
            bullet_physics_obj: this.default_bullet_physics,
            controls: {
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
                shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
            }
        }

        let tank2_data = {
            scene: this,
            x: PADDING_SIDE + (randint(1, MAZE_SIZE) * (GAME_WIDTH / MAZE_SIZE)) - (GAME_WIDTH / MAZE_SIZE)/2,
            y: PADDING_TOP + (randint(1, MAZE_SIZE) * (GAME_WIDTH / MAZE_SIZE)) - (GAME_WIDTH / MAZE_SIZE)/2,
            size: TANK_SIZE,
            sprite: "tank_blue",
            physics_obj: this.default_tank_physics,
            bullet_physics_obj: this.default_bullet_physics,
            controls: {
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                shoot: Phaser.Input.Keyboard.KeyCodes.ENTER
            }
        }

        this.tank1 = new Tank(tank1_data)
        this.tank2 = new Tank(tank2_data)

        // Add maze
        this.maze = new Maze(MAZE_SIZE, MAZE_SIZE, MAZE_DELETE_CHANCE)
        this.maze.draw(this, this.default_wall_physics, PADDING_SIDE, PADDING_TOP, GAME_WIDTH / MAZE_SIZE, MAZE_THICKNESS)
    }

    update() {
        this.tank1.update()
        this.tank2.update()

        if (!this.tank1.tank.active || !this.tank2.tank.active) {
            game.scene.pause("Game")

            let winner
            if (this.tank1.tank.active) {
                winner = "Red"
                this.add_score(0)
            } else {
                this.add_score(1)
                winner = "Blue"
            }

            game.scene.start("LoseOverlay", {winner_name: winner})
        }
    };

    add_score(i) {
        score[i] += 1
        this.score_text.setText(`Red: ${score[0]} — Blue: ${score[1]}`)
    }

}


let config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: BG_COLOR,
    scene: [Menu, GameScene, LoseOverlay, Settings],
    physics: {
        default: 'matter',
        matter: {
            enableSleeping: false,
            gravity: { y: GRAVITY },
            debug: false,
        }
    },
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        width: WIDTH,
        height: HEIGHT,
    }
};

// Phaser stuff
let game = new Phaser.Game(config);


window.addEventListener("resize", function (event) {
    windowResize()
})