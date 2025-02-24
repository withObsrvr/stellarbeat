<template>
  <div class="info-content">
    <h3>Vote Selection</h3>
    <p>
      The vote selector allows you to cast the initial votes for nodes in the
      network:
    </p>
    <ul>
      <li>
        <strong>Available Options:</strong>
        <ul>
          <li>Burger 🍔</li>
          <li>Pizza 🍕</li>
          <li>Salad 🥗</li>
        </ul>
      </li>
      <li>
        Selecting a vote creates a UserAction that you can observe in the
        Federated Voting status window. A UserAction is executed in the next
        Simulation Step.
      </li>
      <li>
        All voting options are 'valid' for every Node. Unlike real validators
        that could reject statements if it contains for example an invalid
        transaction that is incompatible with its history
      </li>
      <li>
        <strong>Processing:</strong> Once a vote is processed, it cannot be
        changed (unless you go back in the simulation)
      </li>
    </ul>
  </div>
</template>

<style scoped>
.info-content {
  line-height: 1.6;
}
ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
li {
  margin-bottom: 0.5rem;
}
</style>
