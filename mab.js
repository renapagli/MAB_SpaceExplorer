// Add MAB policy definitions here
policy_options = {};
policy_options['Random'] = 'random'; // Completely Random Policy
policy_options['epsGreedy0.1'] = 'epsilonGreedy1'; // Epsilon-Greedy with epsilon = 0.1
policy_options['epsGreedy0.5'] = 'epsilonGreedy5'; // Epsilon-Greedy with epsilon = 0.5
policy_options['UCB1'] = 'ucb1'; // Upper Confidence Bound Algorithm using Hoeffding's inequality
policy_options['UCB_Bayesian'] = 'ucbBayesian'; // Bayesian Upper Confidence Bound Algorithm
policy_options['EXP3'] = 'exp3'; // Exponential-weight algorithm for Exploration and Exploitation

// Add MAB policy functions here
//
//
const policies = {};

// RANDOM STRATEGY
policies['random'] = function (agent, arms) {
    // Select an arm at random
    return arms[Math.round(Math.random()*(arms.length-1))]
}
// EPSILON GREEDY POLICY
policies['epsilonGreedy1'] = (agent, arms) => epsilonGreedy(agent, arms, 0.1);
policies['epsilonGreedy5'] = (agent, arms) => epsilonGreedy(agent, arms, 0.5);

function epsilonGreedy(agent, arms, eps) {
    // Select arm at random with probability eps
    // Otherwise, select arm with highest sample mean
    if (Math.random() < eps) {
        return policies['random'](agent, arms);
    }
    else {
        return arms.filter((e) => e.id == idOfMax(agent.sampleMean))[0]
    }
}
// UCB POLICY
policies['ucb1'] = function (agent, arms) {
    // Balance explore-exploit tradeoff by increasing
    // exploration term over time
    // Explore term: C_i = sqrt( 2 * ln(t) / N_i)
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
// BAYESIAN UCB POLICY
policies['ucbBayesian'] = function (agent, arms) {
    // Balance explore-exploit tradeoff by increasing
    // exploration term over time
    // Explore term now incorporates information about Gaussian distribution of rewards
    // Explore term: C_i = c * sample_stddev_i / sqrt(N_i), where
    // c is the number of std deviations away from the mean, so setting c = 1.96 gives
    // a 95% confidence interval
    // Exploit term: mu_i (sample mean of arm)
    // At time t, select arm with highest Q = mu_i + C_i

    let c = 1.96 // constant for 95% confidence interval
    // initialize array of Q values
    let Q = new Array(arms.length);
    // get t-1 from number of arms visited by agent
    let t = sum(agent.count);
    // compute Qi for each arm
    for (var i = 0; i < arms.length; i++) {
        let mu_i = agent.sampleMean[arms[i].id] / 100; // scale to [0, 1] range
        let n_i = agent.count[arms[i].id];
        let C_i = c * agent.sampleStdDev[arms[i].id] / Math.sqrt( n_i );
        Q[i] = mu_i + C_i;
    }
    // return arm with largest Q
    return arms[indexOfMax(Q)]
}
// EXP3
policies['exp3'] = (agent, arms) => exp3(agent, arms, exp3_weights[agent.name]);

function exp3(agent, arms, weights) {
    // Probabilistic explorations based on learned arms weights and hyperparameter gamma
    // Initialize weights to 1 for all arms
    // Set probability of choosing arm as p_i = (1 - gamma) * w_i / sum(w) + gamma / num_arms
    // Choose next arm with probability p_i
    // Get reward r_j from chosen arm j
    // Update weight of chosen arm w_j = w_j * exp( gamma * (r_j / p_j) / num_arms )

    let gamma = 0.5; // hyperparameter
    let p = new Array(arms.length); // probabilities

    // set probabilities
    for (var i = 0; i < arms.length; i++) {
        p[i] = (1 - gamma) * weights[i] / sumArr(weights) + gamma / arms.length;
    }
    // select arm at random
    r = Math.random();
    arm_index = pickAtRandom(p,r);

    // updating weights is done via updateExp3Weights function after reward is obtained from chosen arm

    // return arm with largest Q
    return arms[arm_index]
}

function updateExp3Weights(agentName, armsLength, armId, armReward) {
    let weights = exp3_weights[agent.name];
    armIndex = planets.findIndex((e) => {e.id == armId});
    let gamma = 0.5;
    // get probability
    p_j = (1 - gamma) * weights[index] / sumArr(weights) + gamma / armsLength;
    // update weight
    weights[armIndex] = weights[armIndex] * Math.exp(gamma * (armReward / p_j) / armsLength);
    exp3_weights[agentName] = weights;
}


// helper functions
//
//
function pickAtRandom(p,r) {
    let sum = 0;
    for (var i=0; i < p.length; i++) {
        sum += p[i];
        if (r < sum) {return i;}
    }
}

function sum(dict) {
    var res = 0;
    for (const [key, value] of Object.entries(dict)) {
        res += value;
    }
    return res;
}

function sumArr(arr) {
    var res = 0;
    for (var i = 0; i < arr.length; i++) {
        res += arr[i];
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