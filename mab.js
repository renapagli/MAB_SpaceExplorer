// Add MAB policy definitions here
policy_options = {};
policy_options['Random'] = 'random';
policy_options['epsGreedy0.1'] = 'epsilonGreedy1';
policy_options['epsGreedy0.5'] = 'epsilonGreedy5';
policy_options['UCB1'] = 'ucb1';
policy_options['UCB_Bayesian'] = 'ucbBayesian';

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

// UCB POLICY
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