// Add new MAB strategy definitions here

// RANDOM STRATEGY
strategies['random'] = function (agent, arms) {
    // Select an arm at random
    return arms[Math.round(Math.random()*(arms.length-1))]
}

// UCB STRATEGY
strategies['ucb'] = function (agent, arms) {
    // Balance explore-exploit tradeoff by increasing
    // exploration term over time
    // Explore term: C_i
    // Exploit term: mu_i (sample mean of arm)
    // At time t, select arm with highest Q = mu_i + C_i
    // initialize array of Q values
    let Q = new Array(arms.length);
    // get t-1 from number of arms visited by agent
    let t = sum(agent.count);
    // compute Qi for each arm
    for (var i = 0; i < arms.length; i++) {
        let mu_i = agent.sampleMean[arms[i].id] / 100; // scale to [0, 1] range
        let n_i = agent.count[arms[i].id];
        let C_i = Math.sqrt( 2 * Math.log(t) / n_i );
        Q[i] = mu_i + C_i;
    }
    // return arm with largest Q
    return arms[indexOfMax(Q)]
}

// EPSILON GREEDY STRATEGY
strategies['epsilonGreedy1'] = (agent, arms) => epsilonGreedy(agent, arms, 0.1);
strategies['epsilonGreedy5'] = (agent, arms) => epsilonGreedy(agent, arms, 0.5);

function epsilonGreedy(agent, arms, eps) {
    // Select arm at random with probability eps
    // Otherwise, select arm with highest sample mean
    if (Math.random() < eps) {
        return strategies['random'](agent, arms);
    }
    else {
        return arms.filter((e) => e.id == idOfMax(agent.sampleMean))[0]
    }
}

// helper functions
function sum(dict) {
    var res = 0;
    for (const [key, value] of Object.entries(dict)) {
        res += value;
    }
    return res;
}

function idOfMax(dict) {
    let maxKey, maxValue = 0;

    for(const [key, value] of Object.entries(dict)) {
      if(value > maxValue) {
        maxValue = value;
        maxKey = key;
      }
    }
    return maxKey;
}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}