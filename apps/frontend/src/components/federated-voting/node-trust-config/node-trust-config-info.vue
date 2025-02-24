<template>
  <div class="trust-connections-info">
    <h3>Trust Configurations</h3>
    <p>
      This table shows the trust configurations of the nodes in our network.
      Because this simulation is for educational purposes, we have simplified
      this config to make it easier to understand. In a real network, nodes
      would define quorumSets with more complex (nested) rules.
    </p>
    <p>
      You can translate it as follows: A quorum slice needs threshold amount of
      nodes from the trusted nodes, including itself. This also means that the
      node itself is always (!) added to its quorum slices, even if it not
      'configured' as such.
    </p>
    <ul>
      <li><strong>Node:</strong> The public key of each node in the network</li>
      <li>
        <strong>Trust:</strong> All possible nodes that are trusted. Green nodes
        are currently trusted by this node
      </li>
      <li>
        <strong>Threshold:</strong> The minimum number of trusted nodes required
        to form a quorum slice (N/M where N is threshold and M is total trusted
        nodes). A node is part of everyone of its quorum slices.
      </li>
    </ul>

    <h4>From trust configuration to quorum slices example</h4>
    <p>
      Let's take a look at the trust configuration of node A. Node A trusts
      nodes B, C and D. The threshold is set to 2. This means that node A has a
      quorum slice for every combination of 2 of the nodes it trusts. Node A is
      always added to every quorum slice (if not already present). So the quorum
      slices of node A are:
    </p>
    <ul>
      <li>A, B, C</li>
      <li>A, B, D</li>
      <li>A, C, D</li>
    </ul>
  </div>
</template>

<style scoped>
.trust-connections-info {
  padding: 1rem;
  line-height: 1.6;
}

h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

strong {
  color: #334e68;
}
</style>
