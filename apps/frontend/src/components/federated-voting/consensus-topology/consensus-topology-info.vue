<template>
  <div class="consensus-topology-info">
    <h3>Consensus Topology Overview</h3>
    <p>
      The Consensus Topology component provides insight into the trust structure
      of the Federated Byzantine Agreement System through three different views.
    </p>
    <p>
      If nodes are ill-behaved or befouled, they are visualized with a red or
      orange border. This will show you the trust worthiness of the quorums,
      slices and v-blocking sets.
    </p>

    <div class="section">
      <h4>Quorums</h4>
      <p>
        Each quorum contains at least one slice for every node within it. A
        quorum ratifies a vote if every member of the quorum votes the same.
      </p>
      <ul>
        <li>
          <strong>System Safety</strong>: For the system to be safe, all quorums
          must intersect (have nodes in common)
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Quorum Intersections</h4>
      <p>
        Quorum intersections are overlapping nodes between different quorums.
        They are critical for ensuring agreement and preventing network splits
        (Safety). Every quorum should pair-wise intersect with every other
        quorum.
      </p>
      <ul>
        <li>
          <strong>Safety Guarantee</strong>: When all quorums intersect, the
          network cannot make contradictory decisions
        </li>
        <li>
          This tab shows the minimal quorum intersections, which are the
          smallest sets of nodes that overlap every quorum. If two quorums are
          found to not overlap, this list will be empty.
        </li>
        <li>
          If there exists a quorum intersection entirely out of ill-behaved
          nodes, then there is a possibility that node could cause the network
          to split by lying to the overlapping quorums.
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Quorum Slices</h4>
      <p>
        Select a node to view its slices. Quorum slices are subsets of nodes
        that a specific node trusts to help it determine agreement. They are
        formed by taking a threshold amount of its trusted nodes.
      </p>
      <ul>
        <li>
          <strong>Node-Specific</strong>: Each node defines its own quorum
          slices
        </li>
        <li>
          <strong>Threshold</strong>: A node's quorum slices are determined by
          its threshold and validators it trusts
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>V-Blocking Sets</h4>
      <p>
        Select a node to see its V-blocking sets. V-blocking sets are groups of
        nodes that can prevent a specific node from reaching consensus. They
        overlap every one of the nodes slices.
      </p>
      <ul>
        <li>
          <strong>Blocking Power</strong>: A v-blocking set for node N can block
          N from reaching agreement by withholding votes
        </li>
        <li>
          <strong>Overriding votes</strong> If a node voted for a statement, it
          can still accept another statement if it sees a V-blocking set
          accepting it.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.consensus-topology-info {
  padding: 1rem;
  line-height: 1.6;
}

.section {
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

h4 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #486581;
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
