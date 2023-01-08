# MAB_SpaceExplorer
Multi-Arm Bandit Strategies Visualization through a Competitive Space Exploration Game

Live demo <a href="https://renapagli.github.io/MAB_SpaceExplorer/" target="_blank">here</a>

Watch as two agents using different MAB policies choose between 10 planets to mine for diamonds.
Each planet has Gaussian rewards with mean in [0, 100] and variance in [0, 20].

Agents perform an initialization phase where they visit each planet once (or twice for agents following the Bayesian UBC policy in order to get initial variance estimates). 

Available MAB policies: 
* Random
* Epsilon-Greedy (with epsilon 0.1 and 0.5) 
* UCB1
* Bayesian UCB
* EXP3

