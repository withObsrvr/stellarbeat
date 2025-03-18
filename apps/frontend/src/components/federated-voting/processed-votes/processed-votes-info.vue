<template>
  <div class="processed-votes-info">
    <h3>Processed Votes Overview</h3>
    <p>
      This component displays the votes that have been processed by the nodes in
      the network. A vote is processed when it has been received by a node. It
      shows both regular votes and votes to accept. When selecting a node you
      can also see the events that have been triggered by the processing of the
      votes. For example v-blocking sets accepting a value or a quorum ratifying
      a vote. You can cross check this information in the 'consensus topology'
      dashboard component.
    </p>

    <p>
      The processing node also shows its current phase and the statement it is
      actually voting for. All nodes show if they are ill-behaved or befouled
      trough a red or orange border.
    </p>

    <div class="section">
      <h4>Vote Types</h4>
      <ul>
        <li>
          <strong>Votes</strong>: Initial votes cast by nodes for specific
          statements (burger, pizza, salad)
        </li>
        <li>
          <strong>Votes to Accept</strong>: Votes indicating that a node has
          voted to accept a statement.
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Tabs</h4>
      <p>
        Each tab represents a different statement (value) being voted on. You
        can click on tabs to view which nodes have:
      </p>
      <ul>
        <li>Cast regular votes for that statement</li>
        <li>Cast votes to accept that statement</li>
      </ul>
    </div>

    <div class="section">
      <h4>Events</h4>
      <p>
        The events section shows consensus topology events triggered by the
        processing of the votes for all statements.
      </p>
      <ul>
        <li>
          <strong>V-Blocking Events</strong>: When a v-blocking set accepts a
          value
        </li>
        <li>
          <strong>Ratification Events</strong>: When a quorum ratifies a vote
        </li>
      </ul>
      <p>
        Clicking on an event will select the relevant node and statement tab.
      </p>
    </div>

    <div class="section">
      <h4>Views</h4>
      <ul>
        <li>
          <strong>System View</strong>: Shows all processed votes across the
          network for every node.
        </li>
        <li>
          <strong>Node View</strong>: When a node is selected, shows only the
          votes processed by that specific node and the events triggered by the
          processing of those votes.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.processed-votes-info {
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
