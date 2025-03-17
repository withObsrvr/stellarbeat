<template>
  <div class="graph-info">
    <h3>Trust Graph Overview</h3>
    <p>
      This graph visualizes the trust relationships between nodes in the
      Federated Byzantine Agreement System. Each node represents a validator in
      the network, and the connections between them represent trust
      relationships. The trust connections together with a trust threshold form
      the quorum slices of a node.
    </p>

    <div class="section">
      <h4>Graph Elements</h4>
      <ul>
        <li>
          <strong>Nodes</strong>: Represent validators in the network. Each node
          displays its public key and current voting state. And also the number
          of trusted nodes that can convince him of a vote (its trust threshold)
        </li>
        <li>
          <strong>Edges</strong>: Connections between nodes representing trust
          relationships. A directed edge from node A to node B means that node A
          trusts node B.
        </li>
        <li>
          <strong>Top Tier</strong>: The highlighted area shows the "top tier"
          of nodes that form the core of the network's trust structure. These
          are the nodes that make up the minimal quorums of the FBAS.
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Node States</h4>
      <ul>
        <li>
          <strong>Voted (v:)</strong> (gray): The node has cast a vote for the
          indicated value
        </li>
        <li>
          <strong>Accepted (a:)</strong> (blue): The node has accepted the
          indicated value
        </li>
        <li>
          <strong>Confirmed (c:)</strong> (green): The node has confirmed the
          indicated value
        </li>
        <li>
          <strong>Ill-Behaved</strong> (red border): The node is not following
          the protocol correctly or has crashed.
        </li>
        <li>
          <strong>Befouled</strong> (orange border): The node has been affected
          by ill-behaved nodes
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Controls</h4>
      <ul>
        <li>
          <strong>Click</strong>: Select a node, and see the system through its
          eyes
        </li>
        <li><strong>Pan</strong>: Click and drag to move around the graph</li>
        <li><strong>Zoom</strong>: Use the mouse wheel to zoom in and out</li>
        <li>
          <strong>Repelling Force</strong>: Adjust the slider to change the
          spacing between nodes
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Views</h4>
      <p>
        The graph shows the trust relationships based on the selected
        perspective:
      </p>
      <ul>
        <li>
          <strong>System View</strong>: Shows the actual states of all nodes in
          the network
        </li>
        <li>
          <strong>Node View</strong>: When a specific node is selected, shows
          what that node knows about other nodes based on the messages it has
          received. Note: Federated voting does not specify the broadcasting of
          commit states, thus only the selected node can be in the commit phase.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.graph-info {
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
