//neat interactive background
//First real crack at using JS so go easy :P
//2021 Christen Spadavecchia

//define sim params
const POINT_RADIUS = 10;
const MAX_CONNECT_DISTANCE = 300;
const STROKE_MAX = 1;
const STROKE_MIN = .1;
const SLING_VELO_MAX = 100;
const MAX_FRAME_WAIT = 40;
let POINTS = 40;
let BG_FILL = "rgba(0, 0, 0, 0.3)"; //alpha determines fade out (range: 0.03 - 1.0)
let BG_STROKE = 'lightblue';


//get drawing context
let bg = document.getElementById("bg");
let drawCtx = bg.getContext('2d');

//get window size
let width = window.innerWidth;
let height = window.innerHeight;

//define some objects for later use
class Point {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
    }

    update() {
        //move forward
        this.x = this.x + this.dx;
        this.y = this.y + this.dy;

        //bounce
        if (this.x < POINT_RADIUS || this.x > width - POINT_RADIUS) {
            this.dx *= -1;
        }
        if (this.y < POINT_RADIUS || this.y > height - POINT_RADIUS) {
            this.dy *= -1;
        }

    }

}

class Simulation {
    constructor() {
        this.points = new Array(POINTS);

        for (let i = 0; i < POINTS; i++) {
            //this code is *semi* duplicated later but would be annoying to dedup and may add complexity 
            let point = new Point(
                rand(POINT_RADIUS * 2, width - POINT_RADIUS * 2),
                rand(POINT_RADIUS * 2, height - POINT_RADIUS * 2),
                rand(-5 * i / POINTS, 5 * i / POINTS),
                rand(-5 * i / POINTS, 5 * i / POINTS)
            );

            this.points[i] = point;
        }
    }

    update() {
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            p.update();
        }
    }

    render() {
        //I know that iterating over every point for every other point is a slow, O(n^2)
        //endeavor; however, I will not be implementing a spatial hash grid.
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];

            drawCtx.strokeStyle = BG_STROKE;
            circle(p.x, p.y, POINT_RADIUS);

            let lonely = true;
            //console.log("Drawing circle at:" + p.x + ", " + p.y);
            for (let j = 0; j < this.points.length; j++) {
                let d = dist(p, this.points[j]);
                if (d < MAX_CONNECT_DISTANCE && d > 0.1) {
                    drawCtx.lineWidth = scale(d, 0, MAX_CONNECT_DISTANCE, STROKE_MAX, STROKE_MIN);
                    line(p.x, p.y, this.points[j].x, this.points[j].y);
                    lonely = false;
                }
            }
            drawCtx.lineWidth = 1;

            if (!lonely) {
                circle(p.x, p.y, POINT_RADIUS / 4);
            } else {
                circle(p.x, p.y, POINT_RADIUS / 3);
            }
        }
    }

    resize_window() {
        width = window.innerWidth;
        height = window.innerHeight;

        drawCtx.canvas.width = width;
        drawCtx.canvas.height = height;

        sim.points.forEach((point, index) => {
            if (point.x < POINT_RADIUS || point.x > width - POINT_RADIUS ||
                point.y < POINT_RADIUS || point.y > height - POINT_RADIUS) {


                let point = new Point(
                    rand(POINT_RADIUS * 2, width - POINT_RADIUS * 2),
                    rand(POINT_RADIUS * 2, height - POINT_RADIUS * 2),
                    rand(-5, 5),
                    rand(-5, 5)
                );

                this.points[index] = point;
            }
        });
    }
}

//create ball sim
let sim = new Simulation();

//slingshot stuff
let drawSlingshot = false;
let startPos = new Point(0, 0, 0, 0);
let currentPos = new Point(0, 0, 0, 0);

function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function dist(point1, point2) {
    let absDx = Math.abs(point2.x - point1.x);
    let absDy = Math.abs(point2.y - point1.y);
    return Math.sqrt(absDx ** 2 + absDy ** 2);
}

async function line(x1, y1, x2, y2) {
    drawCtx.beginPath();
    drawCtx.moveTo(x1, y1);
    drawCtx.lineTo(x2, y2);
    drawCtx.stroke();
}

async function circle(x, y, r) {
    drawCtx.beginPath();
    drawCtx.arc(x, y, r, 0, 2 * Math.PI, false);
    drawCtx.stroke();
}

function rand(min, max) {
    return Math.random() * (max - min + 1) + min;
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}


async function draw() {
    while (true) {
        let start = new Date().getTime();

        //clear last frame
        drawCtx.fillStyle = BG_FILL; 
        drawCtx.fillRect(0, 0, width, height);
        //update and render
        sim.update();
        sim.render();

        if(drawSlingshot){
            line(startPos.x, startPos.y, currentPos.x, currentPos.y);
        }

        //wait to render next frame
        let end = new Date().getTime();
        let time = end - start;
        if(time > MAX_FRAME_WAIT * 0.8 && sim.points.length > POINTS) {
            console.log("bg: Culling points to increase fps.");
            for(let i = 0; i < 5 + sim.points.length/4; i++){
                let cull_index = rand(0, sim.points.length);
                sim.points.splice(cull_index, 1);
            }
        }
        await sleep(MAX_FRAME_WAIT - time);
    }
}

sim.resize_window();
draw();


window.addEventListener('resize', function (event) {
    sim.resize_window();
}, true);


document.addEventListener('mousemove', function (event) {
    currentPos.x = event.clientX;
    currentPos.y = event.clientY;
});

document.addEventListener('mousedown', function (event) {
    startPos.x = event.clientX;
    startPos.y = event.clientY; 
    drawSlingshot = true;
});

document.addEventListener('mouseup', function (event) {
    //suppress slingshot feature when selecting text
    if(window.getSelection().toString() != "") {
        drawSlingshot = false;
        return;
    }

    if(!drawSlingshot){
        startPos.x = event.clientX;
        startPos.y = event.clientY;
    }

    let point = new Point(
        startPos.x, startPos.y, 
        scale(currentPos.x - startPos.x, -width/2, width/2, -SLING_VELO_MAX, SLING_VELO_MAX),
        scale(currentPos.y - startPos.y, -height/2, height/2, -SLING_VELO_MAX * height/width, SLING_VELO_MAX * height/width));

    sim.points.push(point);
    
    drawSlingshot = false;
});