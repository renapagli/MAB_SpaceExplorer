// TODO
// 1) Make rewards come from a Gaussian distribution
//    (currently using Math.random() which draws from uniform distribution)
//      Create updateMean and updateVar functions of planets
//      Display measured mean and var somewhere (within planet? right sidebar?)
//      Graph regret?
// 2) Implement MAB algorithms
//      Create policies and connect them to select DOM values

cvs = document.getElementById('spaceCanvas');
cvs.width = innerWidth;
cvs.height = innerHeight;
ctx = cvs.getContext('2d');


planets = [];
agents = [];
numPlanets = 10;
rotationalSpeed = 0.001;
rocketSpeed = 0.09;
miningDelay = 1000;
planetID = 0;

// planet object
var Planet = function Planet(r, o, a, rot)  {
    this.id = planetID++;
    this.r = r; // radius
    this.o = o; // orbit radius
    this.a = a; // angle in radians
    this.rot = rot; // -ve for counterclockwise, +ve for clockwise
    this.c1 = generateColor();
    this.c2 = generateColor();
    this.active = false;
    this.scaleBy = 0;
    this.setXY();
    this.lastReward = 0;
    this.mean = 0;
    this.stddev = 0;
  }, pp = Planet.prototype;

pp.setXY = function () {
    this.x = this.o * Math.cos(this.a);
    this.y = this.o * Math.sin(this.a);
}

pp.move = function () {
    this.a = this.a + this.rot;
    this.setXY();
}

pp.activate = function() {
    this.active = true;
    this.scaleBy = 0; // reset scaleBy
}

pp.deactivate = function() {
    this.active = false;
    this.scaleBy = 0; // reset scaleBy
}

pp.getReward = function() {
    this.lastReward = sampleGaussian(this.mean, this.stddev);
    return this.lastReward;
}

pp.draw = function() {
    // Create a radial gradient
    let gradient = ctx.createRadialGradient(cvs.width/2 + this.x + (this.r + this.scaleBy)/3, cvs.height/2 + this.y - (this.r + this.scaleBy)/3,
        (this.r + this.scaleBy)/3, cvs.width/2 + this.x, cvs.height/2 + this.y, this.r + this.scaleBy);

    // Add three color stops
    gradient.addColorStop(0, this.c1);
    gradient.addColorStop(0.9, this.c2);
    if (this.id !=0) {gradient.addColorStop(1, 'black');}
    else {gradient.addColorStop(1, this.c1);}

    // Set the fill style and draw a circle
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(cvs.width/2 + this.x, cvs.height/2  + this.y, this.r + this.scaleBy, 0, Math.PI*2, true);
    ctx.fill();
    // determine scaleBy magnitude
    if (this.active) {
        this.bounceN = bounceAnimation(this, this.bounceN);
    }
}

function bounceAnimation(planet, call) {
    n = call % 60;
    if (n < 15) {
        // scale down to 0.90 r
        planet.scaleBy -= planet.r*0.1/15;
    }
    else if (n < 30) {
        // scale up to 1.10 r
        planet.scaleBy += planet.r*0.2/15;
    }
    else if (n < 45) {
        // scale down to 0.95 r
        planet.scaleBy -= planet.r*0.15/15;
    }
    else if (n < 60) {
        // scale up to 1.00 r
        planet.scaleBy += planet.r*0.05/15;
    }
    else {
       n = 0;
    }
    // draw reward
    if (planet.id != 0 && call < 60) {
        let offset_x = -40;
        let offset_y = 7;
        ctx.fillStyle = '#ebbc09';
        ctx.textAlign = 'left';
        ctx.fillText('+' + Math.round(planet.lastReward) + ' ????', cvs.width/2 + planet.x + offset_x + (call + planet.r*2)*Math.cos(planet.a + Math.PI),
        cvs.height/2 + planet.y + offset_y + (call + planet.r*2)*Math.sin(planet.a + Math.PI));
    }
    return ++n;
}

// rocket ship
var Rocket = function Rocket(name, o, a, w, src) {
    this.name = name;
    this.o = o; // distance to sun
    this.a = a; // positional angle
    this.w = w; // body angle
    this.setXY(); // set x,y coords
    this.targets = []; // list of targets to visit
    this.atTarget = false;
    this.mining = false;
    this.img = new Image(); // rocket png
    this.img.onload = function() {
        this.imgLoaded = true;
    }
    this.img.src = src;
    this.imgLoaded = false;
    this.width = 50;
    this.height = 50;
    this.rotate = true;
    this.bounceN = 0; // keep track of where we are in bounce animation
    this.totalReward = 0;
    this.policy = document.getElementById(this.name + '_policy').value; // MAB policy
    this.initialized = false;
},  rp = Rocket.prototype;

rp.setStats = function(planets) {
    this.sampleMean = {}; // estimated mean from samples
    this.sampleStdDev = {}; // estimated stddev from samples
    this.M2n = {}; // sum of squares of differences
    this.count = {}; // Number of times planet has been mined

    for (const planet of planets) {
        this.sampleMean[planet.id] = 0;
        this.sampleStdDev[planet.id] = 0;
        this.M2n[planet.id] = 0;
        this.count[planet.id] = 0;
    }
}

rp.setXY = function () {
    this.x = this.o * Math.cos(this.a);
    this.y = this.o * Math.sin(this.a);
}

rp.setPolicy = function (policy) {
    document.getElementById(this.name + '_policy').value = policy;
    this.policy = policy;
}

rp.angle2Target = function (target) {
    let x = target.x - this.x;
    let y = target.y - this.y;
    let angle = Math.atan2(y,x);
    angle = angle > Math.PI ? angle + Math.PI*2 : angle;
    diffAngle = angle - this.w;

    return diffAngle;
}

rp.initializeArms = function(planets) {
    for (const planet of planets) {
        this.addTarget(planet);
    }
    // if Bayesian UBC, do a second round to get variance estimates
    if (this.policy == 'ucbBayesian') {
        for (const planet of planets) {
            this.addTarget(planet);
        }
    }
}

rp.addTarget = function (target) {
    this.targets.push(target);
//    this.targets.push(sun);
}

rp.mineTarget = function (target) {
    if (this.mining) {return;}
    this.mining = true; // set mining status
    // get reward
    if (target.id != 0) {
        this.totalReward += target.getReward(this);
        this.updateStats(target);
        // if strategy EXP3, then update weights
        if (this.strategy == 'EXP3') {updateExp3Weights(this.name, planets.length, target.id, target.lastReward);}
    }

    // if we are not in initialization phase, then run policy to determine next target
    if (this.initialized) {
        this.planNextTarget()// add next target based on agent policy
    }
    else {
    // mark agent as initialized if we are at the last arm
        if (sum(this.count) == planets.length-1) {this.initialized = true;}
    }

    target.activate();
    // mine for 3 seconds before moving to next target
    delay(miningDelay).then(() => {
        rocketAligned = false;
        this.atTarget = false;
        this.mining = false;
        target.deactivate();
        this.targets.shift(); // remove first target
        this.bounceN = 0; // ensures bounceAnimation runs properly
        // increase reward
        if (target.id !=0) {
            document.getElementById('score_' + this.name + '_display').innerHTML = Math.round(this.totalReward) + ' ????';
        }
    });
}

rp.planNextTarget = function() {
    this.addTarget(policies[this.policy](this, planets));
}

rp.updateStats = function(target) {
    this.count[target.id] = this.count[target.id] + 1;
    if (this.count[target.id] < 2) {
        // if only one sample, then mean = sample
        this.sampleMean[target.id] = target.lastReward;
        this.sampleStdDev[target.id] = 0;
    }
    else {
        // use Welford's online algorithm to update sample mean and variance
        let delta = target.lastReward - this.sampleMean[target.id]; // (x_n - xbar_n-1)
        this.sampleMean[target.id] = this.sampleMean[target.id] + delta/this.count[target.id]; // += (x_n - xbar_n-1) / N
        let delta2 = target.lastReward - this.sampleMean[target.id]; // (x_n - xbar_n)
        this.M2n[target.id] = this.M2n[target.id] + delta * delta2;
        this.sampleStdDev[target.id] = Math.sqrt(this.M2n[target.id] / (this.count[target.id] - 1));
    }
    // update bandits sidebar numbers
    document.getElementById(this.name + '_planet' + target.id + '_count').innerHTML = Math.round(this.count[target.id]);
    document.getElementById(this.name + '_planet' + target.id + '_mean').innerHTML = Math.round(this.sampleMean[target.id]);
    document.getElementById(this.name + '_planet' + target.id + '_stddev').innerHTML = Math.round(this.sampleStdDev[target.id]);
}

rp.move = function () {
    // if no targets, go back to base;
    if (this.targets.length == 0) {this.addTarget(sun); return;}
    // set target
    let target = this.targets[0];
    // if at target, mine for reward
    if (this.atTarget && !this.mining) {this.mineTarget(target);}
    // get distance from target
    let dist_x = target.x - this.x;
    let dist_y = target.y - this.y;
    let dist = target.o - this.o;
    let dist_a = target.a - this.a;
    dist_a = dist_a < 0 ? dist_a + Math.PI*2 : dist_a;
    let dist_w = this.angle2Target(target);
    // if within 15 degree alignment, move towards target
    if (Math.abs(dist_w) < 10*Math.PI/180) {rocketAligned = true;}
    else {rocketAligned = false;}
    // if at target, then stay there until a new target is assigned

    if (rocketAligned) {
        // move towards target
        this.x += dist_x * rocketSpeed;
        this.y += dist_y * rocketSpeed;
    }
    else {
        // rotate towards target or, if at target, towards the up direction
        this.w += Math.min(dist_w, 0.15) % Math.PI*2;
    }

    // update properties of rocket
    this.o = Math.sqrt(this.x * this.x + this.y * this.y);
    // if at target, start mining
    if (Math.abs(dist_x + dist_y) < 15 && !this.atTarget) {this.atTarget = true;}
}

rp.draw = function () {
    // save the unrotated context of the canvas so we can restore it later
    if (this.rotate) {
        ctx.save();
        // move to the center of the rocket
        ctx.translate(cvs.width/2 + this.x , cvs.height/2 + this.y);
        // rotate the canvas to the specified degrees
        ctx.rotate(this.w);
        // move to the center of the rocket
        ctx.translate(-cvs.width/2 - this.x , -cvs.height/2 - this.y);
        // draw the image
        // since the context is rotated, the image will be rotated also
        ctx.drawImage(this.img, cvs.width/2 - this.width/2 + this.x , cvs.height/2 - this.height/2 + this.y);
        // we???re done with the rotating so restore the unrotated context
        ctx.restore();
    }
    else {
        // draw the image
        ctx.drawImage(this.img, cvs.width/2 - this.width/2 + this.x , cvs.height/2 - this.height/2 + this.y);
    }
}


// Event listeners
rocket_policy.addEventListener("change", () => {
    rocket.policy = rocket_policy.value;
})
ufo_policy.addEventListener("change",() => {
    ufo.policy = ufo_policy.value;
})


// helper functions

function boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    return { z0, z1 };
}

function sampleGaussian(mean, stddev) {
    const { z0, _ } = boxMullerTransform();

    return z0 * stddev + mean;
}

function delay(t, v) {
    return new Promise(resolve => setTimeout(resolve, t, v));
}

function generateColor() {
  let hexSet = "0123456789ABCDEF";
  let finalHexString = "#";
  for (let i = 0; i < 6; i++) {
    finalHexString += hexSet[Math.ceil(Math.random() * 15)];
  }
  return finalHexString;
}

function drawCorona(r) {
    // Create a radial gradient
    let gradient = ctx.createRadialGradient(cvs.width/2 + sun.x, cvs.height/2 + sun.y,
        r/3, cvs.width/2 + sun.x, cvs.height/2 + sun.y, r);

    // Add three color stops
    gradient.addColorStop(0, sun.c1);
    gradient.addColorStop(0.32, '#f0dc34');
    gradient.addColorStop(1, 'rgba(0,0,0,0');

    // Set the fill style and draw a circle
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(cvs.width/2 + sun.x, cvs.height/2  + sun.y, r, 0, Math.PI*2, true);
    ctx.fill();
}


// initialize functions
function initializePolicyOptions() {
    // weights for EXP3 policy
    exp3_weights = {};
    // for every agent
    for (var a=0; a < agents.length; a++) {
        selectDOM = document.getElementById(agents[a].name + '_policy');
        // for every policy
        for (const [key, value] of Object.entries(policy_options)) {
            // add policy to options
            selectDOM.add(new Option(key,value));
        }
        // initialize weights for EXP3 policy
        exp3_weights[agents[a].name] = new Array(planets.length).fill(1); // {rocket : [1,1,1...]; ufo : [1,1,1...]}
    }
}

function initializePlanets() {
    let angle = Math.PI*2/numPlanets;
    let orbitR = 350;
    let radius = 30;
    console.log('Planets initialized: ')
    for (var i=0; i<numPlanets; i++) {
        planets.push( new Planet(radius, orbitR, angle*i, rotationalSpeed));
        planets[i].mean = Math.round(Math.random()*100);
        planets[i].stddev = Math.round(Math.random()*20);
    }
    console.table(planets,['id','mean','stddev'])
}

function initializeArmsSidebar(agent) {
// for every planet, add to planets Table
    for (var i=0; i < planets.length; i++) {
        let p = planets[i];
        // build html
        let newHtml = '<tr>';
        newHtml += '<td>';
        newHtml += '<div id="' + agent.name + '_planet' + p.id +'_planet" class="circle" onmouseover="this.classList.toggle(' + "'gelatine'" +')" onmouseout="this.classList.toggle(' + "'gelatine'" +')">' + p.id + '</div>';
        newHtml += '<td id="' + agent.name + '_planet' + p.id +'_count">' + agent.count[p.id] + '</td>';
        newHtml += '<td id="' + agent.name + '_planet' + p.id +'_mean">' + agent.sampleMean[p.id] + '</td>';
        newHtml += '<td id="' + agent.name + '_planet' + p.id +'_stddev">' + agent.sampleStdDev[p.id] + '</td>';
        newHtml += '</tr>';
        // append planet to table
        document.getElementById(agent.name + '_planetsTable').innerHTML += newHtml;
        // change color of planet
        let planet = document.getElementById(agent.name + '_planet' + p.id + '_planet');
        planet.style.background = p.c1;
        planet.style.boxShadow = '3px -3px 10px 3px ' + p.c2 + ' inset';
    }
}

function initializeAgents() {
    // initialize rocket-ship
    rocket = new Rocket('rocket', 0, 0, Math.PI*3/2, 'rocket-ship.png');
    rocket.setStats(planets);
    // initialize alien-ship
    ufo = new Rocket('ufo', 0, 0, 0, 'ufo.png');
    ufo.width = ufo.height = 64;
    ufo.rotate = false;
    ufo.setStats(planets);
    // add to agents array
    agents.push(ufo);
    agents.push(rocket);
    // initialize policy options
    initializePolicyOptions();
    // set initial rocket policy to UCB
    rocket.setPolicy('ucbBayesian');
    // set initial ufo policy to epsilon greedy (0.5)
    ufo.setPolicy('epsilonGreedy1');
    // initialize targets
    rocket.initializeArms(planets);
    ufo.initializeArms(planets);
    // initialize right side bar
    initializeArmsSidebar(rocket);
    initializeArmsSidebar(ufo);
}

function render() {
    requestAnimationFrame(render);

    // clear canvas
    ctx.clearRect(0,0,cvs.width,cvs.height);

    // draw sun
    drawCorona(150);
    sun.draw();
    // draw planets
    for (var i=0; i < planets.length; i++) {
        planets[i].move(), planets[i].draw();
    }
    // draw rewards counter
//    let offset_y = 7;
//    ctx.fillStyle = 'black';
//    ctx.textAlign = 'center';
//    ctx.fillText(totalReward + ' pts', cvs.width/2, cvs.height/2 + offset_y)
    // draw agents
    for (var i=0; i < agents.length; i++) {
        agents[i].move(), agents[i].draw();
    }
}


// initialize sun
sun = new Planet(80, 0, 0, 0);
sun.c1 = '#f0b521';
sun.c2 = '#faa357';
// initialize planets
initializePlanets();
// initialize Agents
initializeAgents();
// start animation
ctx.font='20px Verdana';

render();

