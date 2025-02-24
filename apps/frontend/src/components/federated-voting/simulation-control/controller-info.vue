<template>
  <div class="controller-info">
    <h3>Simulation Controls</h3>

    <p>
      The simulation allows you to play out a selected scenario or step through
      the scenario step by step. A simulation Step executes two kinds of
      actions:
    </p>
    <ul>
      <li>
        UserActions: Things the user manipulates like initial votes, disrupting
        the protocol,...
      </li>
      <li>
        ProtocolActions: Things that will be executed because of the Federated
        Voting protocol. You have the option to disrupt these.
      </li>
    </ul>
    <div class="section">
      <h4>Playback Controls</h4>
      <ul>
        <li>
          <strong>Back</strong> (⏪): Step backwards in the simulation to see
          previous states
        </li>
        <li>
          <strong>Play/Pause</strong> (▶/⏸): Automatically advance through
          simulation steps
        </li>
        <li>
          <strong>Forward</strong> (⏩): Move one step forward in the simulation
        </li>
        <li><strong>Stop/Reset</strong> (⏹): Stop/reset the simulation</li>
      </ul>
    </div>

    <div class="section">
      <h4>Keyboard Shortcuts</h4>
      <ul>
        <li><strong>n</strong>: Next step</li>
        <li><strong>shift-n</strong>: Previous step</li>
      </ul>
    </div>

    <div class="section">
      <h4>Scenarios</h4>
      <p>Choose between different voting scenarios:</p>
      <ul>
        <li><strong>Consensus</strong>: Demonstrates successful consensus</li>
        <li>
          <strong>Stuck</strong>: Shows what happens when consensus cannot be
          reached
        </li>
      </ul>
      <p>
        If you modify the votes or disrupt the protocol flow at any point in the
        simulation. The scenario is abandoned and you actually start a new
        scenario that you can 'replay'
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed
</script>

<style scoped>
.controller-info {
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
