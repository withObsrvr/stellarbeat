<template>
  <div class="overlay-graph-info">
    <div class="section">
      <h3>Network Connections</h3>
      <p>
        This component visualizes the network connections between nodes in the
        federated voting system. It shows how messages propagate through the
        network.
      </p>
    </div>

    <div class="section">
      <h4>Connection Types</h4>
      <ul>
        <li>
          <strong>Fully Connected:</strong> All nodes can directly communicate
          with each other. When enabled, every node is connected to every other
          node.
        </li>
        <li>
          <strong>Editable Connections:</strong> When fully connected is
          disabled, you can manually create or remove connections between nodes.
        </li>
        <li>
          <strong>Gossiping:</strong> When enabled, messages propagate through
          the network. A node will send messages to its neighbors, which will
          then send them to their neighbors, and so on.
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Interaction</h4>
      <p>
        When "Fully Connected" is disabled, you can modify the network topology:
      </p>
      <ul>
        <li>
          <strong>Add Connection:</strong> Click on a source node and then on a
          target node to create a connection.
        </li>
        <li>
          <strong>Remove Connection:</strong> Click on an existing connection
          (line between nodes) to remove it.
        </li>
        <li>
          <strong>Adjust Layout:</strong> Use the "Repelling Force" slider at
          the bottom right to adjust the spacing between nodes for better
          visibility.
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Impact on Consensus</h4>
      <p>The network topology directly affects how consensus is reached:</p>
      <ul>
        <li>
          Disconnected nodes may not receive all messages and can't participate
          fully in the consensus process.
        </li>
        <li>
          In a gossip network, message delivery is not guaranteed to be prompt
          or ordered, which can affect the consensus outcome.
        </li>
        <li>
          If critical nodes become isolated, it may prevent the network from
          reaching consensus.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.overlay-graph-info {
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
