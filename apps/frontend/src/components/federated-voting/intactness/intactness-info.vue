<template>
  <div class="intactness-info">
    <div class="section">
      <h3>Intactness</h3>
      <p>
        Intactness is a property that helps determine which nodes can continue
        to operate safely in a federated voting system despite the presence of
        ill-behaved nodes.
      </p>
    </div>

    <div class="section">
      <h4>Node Categories</h4>
      <ul>
        <li>
          <strong>Intact Nodes:</strong> Nodes that can continue to function
          correctly despite the presence of ill-behaved nodes. Formally, a node
          is intact if there exists a dispensable set (DSET) containing all
          ill-behaved nodes but not containing the node itself.
        </li>
        <li>
          <strong>Ill-Behaved Nodes:</strong> Nodes that have crashed, are
          unresponsive, or are acting maliciously by not following the protocol
          rules. Nodes that are ill-behaved are visualized with a red border
          accross the dashboard.
        </li>
        <li>
          <strong>Befouled Nodes:</strong> Nodes that are not intact. These
          nodes may be functioning correctly but cannot be guaranteed to reach
          consensus due to their quorum slice dependencies. Nodes that are
          befouled are visualized with an orange border accross the dashboard.
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Dispensable Sets (DSETs)</h4>
      <p>
        A Dispensable Set (DSET) is a set of nodes that can be removed from the
        network without affecting the ability of remaining nodes to reach
        consensus. When a node is selected, only DSETs that don't contain the
        selected node and include all ill-behaved nodes are shown.
      </p>
      <p>
        DSETs are crucial for understanding the fault tolerance of the network
        and which nodes can continue to operate safely despite the presence of
        failures or malicious behavior.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.intactness-info {
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
