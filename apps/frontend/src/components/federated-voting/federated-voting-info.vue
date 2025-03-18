<template>
  <div class="federated-voting-info">
    <h3>Federated Voting Simulation</h3>
    <p>
      Federated voting is a core mechanism of the Stellar Consensus Protocol
      (SCP) that allows nodes to reach agreement without central coordination.
      Federated Voting operates in a Federated Byzantine Agreement System (FBAS)
      where nodes themselves define which other nodes they trust through quorum
      slices. SCP uses multiple rounds of federated voting to create a protocol
      that has liveness and safety. Federated Voting by itself lacks liveness
      guarantuees and can get stuck. To understand SCP, you need to understand
      federated voting.
    </p>
    <p>
      In this simulation, you can explore how federated voting works, how nodes
      can reach consensus, and where federated voting breaks down. Multiple
      scenario's are provided to show you how it works, can get stuck or how the
      network could fork. But you also have full control to diverge and
      experiment yourself.
    </p>
    <p>
      The simulation allows for configuration of the trust relationships between
      nodes, allows manipulation of the actual network connections (overlay),
      and gives you the ability to act byzantine by disrupting and forging
      messages. With every change or manipulation, the consensus topology is
      updated and you are shown which nodes are intact, ill-behaved or befouled.
    </p>
    <p>
      The original SCP whitepaper assumes the underlying network to
      <strong>eventually deliver all messages</strong>, but makes no mention of
      how to implement this. The standard overlay network in this simulation
      provides a fully connected graph (connections between every node) and no
      message relaying, as this reflects the 'worst case scenario' for which SCP
      was engineered. But you have to option to choose the network connections
      yourself and to enable message gossiping. With message gossiping a node
      relays messages it receives to its neighbors that it has not yet received
      the message from, or to whom it did not yet send the message.
    </p>

    <div class="section">
      <h4>Dashboard Components & Simulation functionality</h4>
      <ul>
        <li>
          <strong>Trust Graph:</strong> Visualizes trust relationships between
          nodes and their current voting state.
        </li>
        <li>
          <strong>Events and Actions:</strong> Shows what has happened and what
          will happen next in the simulation. Allows you to tamper with the
          protocol.
        </li>
        <li>
          <strong>Processed Votes:</strong> Displays which votes have been
          processed by each node
        </li>
        <li>
          <strong>Consensus Topology:</strong> Shows quorums, quorum slices, and
          v-blocking sets
        </li>
        <li>
          <strong>Intactness (DSets):</strong> Identifies intact nodes and
          dispensable sets
        </li>
        <li>
          <strong>Network Connections:</strong> Shows how messages propagate
          between nodes and lets you manipulate the network (overlay) topology.
        </li>
        <li>
          <strong>Node Trust Config:</strong> Allows configuration of nodes and
          their trust relationships
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Simulation Simplifications</h4>
      <p>
        To make the simulation educational and easier to understand and
        federated voting easier to grok:
      </p>
      <ul>
        <li>
          <strong>No Cryptography:</strong> In real networks, message
          authentication is handled by public key cryptography to prevent
          forgery. A node can however forge its own messages.
        </li>
        <li>
          <strong>Single Slot Consensus:</strong> The simulation focuses on a
          single consensus decision ("what to eat for lunch")
        </li>
        <li>
          <strong>Honest Quorum Sets:</strong> Nodes cannot lie about their
          quorum sets in the simulation
        </li>
        <li>
          <strong>Simplified Trust Structure:</strong> Real networks may use
          more complex nested quorum structures
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.federated-voting-info {
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
