function strategy_UCB(agent, arms) {
    // initialize array of Q values
    let Q = new Array(arms.length);
    // get t-1 from number of arms visited by agent
    let t = sum(agent.count);
    // compute Qi for each arm
    for (var i = 0; i < arms.length; i++) {
        let mu_i = agent.sampleMean[arms[i].id];
        let n_i = agent.count[arms[i].id];
        let C_i = Math.sqrt( 2 * Math.log(t) / n_i )
        Q[i] = mu_i + C_i;
    }
    // return arm with largest Q
    console.log('UCB Algorithm')
    console.log('Q: ',Q)
    console.log('Max Q at: ', indexOfMax(Q))
    console.log('Arm with highest Q: ',arms[indexOfMax(Q)].id)
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