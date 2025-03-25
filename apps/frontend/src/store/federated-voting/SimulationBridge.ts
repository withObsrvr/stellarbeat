import {
  Simulation,
  UserAction,
  ProtocolAction,
  QuorumSet,
  VoteOnStatement,
  UpdateQuorumSet,
  AddNode,
  RemoveNode,
  AddConnection,
  RemoveConnection,
  ForgeMessage,
  Message,
  Event,
  SimulationStep,
  Broadcast,
  Gossip,
} from "scp-simulation";

// Observer interface
export interface SimulationObserver {
  onSimulationChanged(stepExecuted: boolean): void;
}

/**
 * Manages the Simulation instance and notifies observers of changes.
 * Provides methods to interact with the simulation.
 */
export class SimulationBridge {
  private observers: SimulationObserver[] = [];

  constructor(private simulation: Simulation) {}

  public latestSimulationStepWentForward: boolean = true;

  /**
   * Register an observer to be notified of simulation changes
   */
  public addObserver(observer: SimulationObserver): void {
    this.observers.push(observer);
  }

  /**
   * Replace the current simulation with a new one
   */
  public replaceSimulation(simulation: Simulation): void {
    this.simulation = simulation;
    this.latestSimulationStepWentForward = true;
  }

  /**
   * Execute the next step in the simulation
   */
  public executeStep(): void {
    this.simulation.executeStep();
    this.latestSimulationStepWentForward = true;
    this.notifyObservers(true);
  }

  /**
   * Reset the simulation to its initial state
   */
  public reset(): void {
    this.simulation.goToFirstStep();
    this.latestSimulationStepWentForward = false;
    this.notifyObservers(true);
  }

  /**
   * Go back one step in the simulation
   */
  public goBackOneStep(): void {
    this.simulation.goBackOneStep();
    this.latestSimulationStepWentForward = false;
    this.notifyObservers(true);
  }

  /**
   * Check if the simulation has a next step
   */
  public hasNextStep(): boolean {
    return this.simulation.hasNextStep();
  }

  /**
   * Check if the simulation has a previous step
   */
  public hasPreviousStep(): boolean {
    return this.simulation.hasPreviousStep();
  }

  /**
   * Add a user action to the simulation
   */
  private addUserAction(action: UserAction): void {
    this.simulation.addUserAction(action);
    this.notifyObservers(false);
  }

  public cancelNodeTrustUpdate(publicKey: string) {
    const pendingUpdate = this.pendingUserActions().find(
      (action) =>
        action instanceof UpdateQuorumSet && action.publicKey === publicKey,
    );

    if (pendingUpdate) {
      this.cancelPendingUserAction(pendingUpdate);
    }
  }

  /**
   * Cancel a pending user action
   */
  public cancelPendingUserAction(action: UserAction): void {
    this.simulation.cancelPendingUserAction(action);
    this.notifyObservers(false);
  }

  /**
   * Get all pending user actions
   */
  public pendingUserActions(): UserAction[] {
    return this.simulation.pendingUserActions();
  }

  /**
   * Get all pending protocol actions
   */
  public pendingProtocolActions(): ProtocolAction[] {
    return this.simulation.pendingProtocolActions();
  }

  /**
   * Get the latest events
   */
  public getLatestEvents(): Event[] {
    return this.simulation.getLatestEvents();
  }

  /**
   * Get the full event log
   */
  public getFullEventLog(): Event[][] {
    return this.simulation.getFullEventLog();
  }

  /**
   * Get the initial step of the simulation
   */
  public getInitialStep(): SimulationStep {
    return this.simulation.getInitialStep();
  }

  /**
   * Find a pending action by type and key
   */
  private findPendingAction<T extends UserAction>(
    type: new (...args: any[]) => T,
    publicKey: string,
  ): T | undefined {
    return this.pendingUserActions().find(
      (action) => action instanceof type && action.publicKey === publicKey,
    ) as T | undefined;
  }

  /**
   * Update a node's trust configuration
   */
  public updateNodeTrust(
    publicKey: string,
    trustedNodes: string[],
    threshold: number,
  ): void {
    const pendingUpdate = this.findPendingAction(UpdateQuorumSet, publicKey);

    if (pendingUpdate) {
      this.cancelPendingUserAction(pendingUpdate);
    }

    this.addUserAction(
      new UpdateQuorumSet(
        publicKey,
        new QuorumSet(threshold, trustedNodes, []),
      ),
    );
  }

  /**
   * Add a node to the network
   */
  public addNode(
    publicKey: string,
    trustedNodes: string[],
    threshold: number,
  ): void {
    const pendingRemoval = this.findPendingAction(RemoveNode, publicKey);

    if (pendingRemoval) {
      this.cancelPendingUserAction(pendingRemoval);
    }

    this.addUserAction(
      new AddNode(publicKey, new QuorumSet(threshold, trustedNodes, [])),
    );
  }

  /**
   * Remove a node from the network
   */
  public removeNode(publicKey: string): void {
    const pendingAdd = this.findPendingAction(AddNode, publicKey);

    if (pendingAdd) {
      this.cancelPendingUserAction(pendingAdd);
    }

    this.addUserAction(new RemoveNode(publicKey));
  }

  /**
   * Add a connection between two nodes
   */
  public addConnection(a: string, b: string): void {
    this.addUserAction(new AddConnection(a, b));
  }

  /**
   * Remove a connection between two nodes
   */
  public removeConnection(a: string, b: string): void {
    this.addUserAction(new RemoveConnection(a, b));
  }

  /**
   * Add a forged message to the simulation
   */
  public forgeMessage(message: Message): void {
    this.addUserAction(new ForgeMessage(message));
  }

  /**
   * Cast a vote for a node
   */
  public vote(publicKey: string, vote: string): void {
    this.cancelPendingVote(publicKey);
    this.addUserAction(new VoteOnStatement(publicKey, vote));
  }

  /**
   * Cancel a pending vote for a node
   */
  public cancelPendingVote(publicKey: string): void {
    const pendingVote = this.findPendingAction(VoteOnStatement, publicKey);

    if (pendingVote) {
      this.cancelPendingUserAction(pendingVote);
    }
  }

  /**
   * Get all pending votes
   */
  public getPendingVotes(): VoteOnStatement[] {
    return this.pendingUserActions().filter(
      (action) => action instanceof VoteOnStatement,
    ) as VoteOnStatement[];
  }

  /**
   * Disrupt a protocol action with specific blacklisted neighbors
   */
  public disruptAction(
    action: ProtocolAction,
    blacklistedNeighbors: string[] = [],
  ): void {
    if (action instanceof Broadcast || action instanceof Gossip) {
      action.isDisrupted = true;
      action.blackListNeighbors(blacklistedNeighbors);
    } else {
      action.isDisrupted = true;
    }
    this.notifyObservers(false);
  }

  /**
   * Undisrupt a protocol action
   */
  public undisruptAction(action: ProtocolAction): void {
    if (action instanceof Broadcast || action instanceof Gossip) {
      action.isDisrupted = false;
      action.blackListNeighbors([]);
    } else {
      action.isDisrupted = false;
    }
    this.notifyObservers(false);
  }

  /**
   * Notify all observers of a change in the simulation
   */
  private notifyObservers(stepExecuted: boolean): void {
    this.observers.forEach((observer) => {
      observer.onSimulationChanged(stepExecuted);
    });
  }
}
