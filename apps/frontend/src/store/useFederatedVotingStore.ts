import { computed, reactive } from "vue";
import {
  BasicFederatedVotingScenario,
  FederatedVotingContext,
  FederatedVotingContextFactory,
  Simulation,
  AddNode,
  UpdateQuorumSet,
  UserAction,
  FederatedVotingProtocolState,
  QuorumSet,
  Vote,
  VoteOnStatement,
} from "scp-simulation";
import { FederatedVotingContextState } from "scp-simulation/lib/federated-voting/FederatedVotingContext";
import { findAllIntactNodes } from "@/components/federated-voting/analysis/DSetAnalysis";
import { NetworkAnalysis } from "@/components/federated-voting/analysis/NetworkAnalysis";

export interface FederatedNode {
  publicKey: string;
  trustedNodes: string[];
  trustThreshold: number;
  voted: string | null;
  accepted: string | null;
  confirmed: string | null;
  phase: string;
  processedVotes: Vote[];
}

class FederatedVotingStore {
  private readonly _state = reactive<{
    simulationUpdate: number;
    networkStructureUpdate: number;
    selectedScenarioId: string;
    selectedNodeId: string | null;
    protocolContext: FederatedVotingContext;
    protocolContextState: FederatedVotingContextState;
    simulation: Simulation;
    networkAnalysis: NetworkAnalysis;
    nodes: FederatedNode[];
    latestSimulationStepWentForwards: boolean;
  }>({
    simulationUpdate: 0,
    networkStructureUpdate: 0,
    latestSimulationStepWentForwards: false,
    selectedScenarioId: "consensus-reached",
    selectedNodeId: null,
    protocolContext: FederatedVotingContextFactory.create(),
    protocolContextState: {} as FederatedVotingContextState, // temporary placeholder until constructor load
    simulation: {} as Simulation,
    networkAnalysis: {} as NetworkAnalysis,
    nodes: [] as FederatedNode[],
  });

  // Add this property to track network structure
  private _networkStructureHash: string = "";

  readonly scenarios = [
    {
      id: "consensus-reached",
      label: "Consensus Scenario",
      loader: BasicFederatedVotingScenario.loadConsensusReached,
    },
    {
      id: "stuck",
      label: "Stuck Scenario",
      loader: BasicFederatedVotingScenario.loadStuck,
    },
  ];

  constructor() {
    const scenario = this.scenarios.find(
      (s) => s.id === this._state.selectedScenarioId,
    );
    if (!scenario) throw new Error("Scenario not found");

    this._state.protocolContext = FederatedVotingContextFactory.create();
    this._state.protocolContextState = this._state.protocolContext.getState();
    this._state.simulation = new Simulation(this._state.protocolContext);
    scenario.loader(this._state.simulation as Simulation);
    this.updateNodes();
  }

  private calculateNetworkStructureHash(): string {
    const sortedNodes = [...this.nodes].sort((a, b) =>
      a.publicKey.localeCompare(b.publicKey),
    );
    return sortedNodes
      .map((node) => {
        const trustedNodesSorted = [...node.trustedNodes].sort().join(",");
        return `${node.publicKey}:${node.trustThreshold}:[${trustedNodesSorted}]`;
      })
      .join("|");
  }

  private checkAndRecalculateNetworkAnalysis(): void {
    const newHash = this.calculateNetworkStructureHash();
    if (newHash !== this._networkStructureHash) {
      this._networkStructureHash = newHash;
      this._state.networkStructureUpdate++;
      this._state.networkAnalysis = NetworkAnalysis.analyze(this.nodes);
    }
  }

  get simulationStepDurationInSeconds(): number {
    return 2;
  }

  get networkStructureUpdate(): number {
    return this._state.networkStructureUpdate;
  }

  get selectedScenarioId(): string {
    return this._state.selectedScenarioId;
  }

  get selectedNodeId(): string | null {
    return this._state.selectedNodeId;
  }

  get networkAnalysis(): NetworkAnalysis {
    return this._state.networkAnalysis;
  }

  set selectedScenarioId(value: string) {
    this._state.selectedScenarioId = value;
  }

  set selectedNodeId(value: string | null) {
    this._state.selectedNodeId = value;
  }

  public updateNodes() {
    const nodes: FederatedNode[] =
      this._state.protocolContextState.protocolStates.map((state) =>
        this.mapStateToFederatedNode(state as FederatedVotingProtocolState),
      );

    nodes.concat(
      this._state.simulation
        .pendingUserActions()
        .filter((action) => action instanceof AddNode)
        .map((action) => {
          return {
            publicKey: action.publicKey,
            trustedNodes: action.quorumSet.validators.slice(),
            trustThreshold: action.quorumSet.threshold,
            voted: null,
            accepted: null,
            confirmed: null,
            phase: "unknown",
            processedVotes: [],
          };
        }),
    );

    this._state.simulation
      .pendingUserActions()
      .filter((action) => action instanceof UpdateQuorumSet)
      .forEach((action) => {
        const node = nodes.find((node) => node.publicKey === action.publicKey);
        if (!node) {
          return;
        }
        node.trustedNodes = action.quorumSet.validators.slice();
        node.trustThreshold = action.quorumSet.threshold;
      });

    this._state.nodes = nodes;

    this.checkAndRecalculateNetworkAnalysis();
  }

  get nodes() {
    return this._state.nodes;
  }

  public getNodeWithoutPreviewChanges(publicKey: string): FederatedNode | null {
    const state = this._state.protocolContextState.protocolStates.find(
      (state) => state.node.publicKey === publicKey,
    );

    if (!state) {
      return null;
    }

    //todo: why do we loose the type info?
    return this.mapStateToFederatedNode(state as FederatedVotingProtocolState);
  }

  private mapStateToFederatedNode(
    state: FederatedVotingProtocolState,
  ): FederatedNode {
    return {
      publicKey: state.node.publicKey,
      trustedNodes: state.node.quorumSet.validators.slice(),
      trustThreshold: state.node.quorumSet.threshold,
      voted: state.voted ? state.voted.toString() : null,
      accepted: state.accepted ? state.accepted.toString() : null,
      confirmed: state.confirmed ? state.confirmed.toString() : null,
      phase: state.phase,
      processedVotes: state.processedVotes,
    };
  }

  get illBehavedNodes() {
    return this._state.simulation.getDisruptedNodes();
  }

  get intactNodes() {
    return findAllIntactNodes(
      this.nodes.map((node) => node.publicKey),
      new Set(this.illBehavedNodes),
      this._state.networkAnalysis.dSets,
    );
  }

  public selectScenario(scenarioId: string): void {
    this._state.selectedScenarioId = scenarioId;
    const scenario = this.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error("Scenario not found");

    this._state.protocolContext = FederatedVotingContextFactory.create();
    this._state.protocolContextState = this._state.protocolContext.getState();
    this._state.simulation = new Simulation(this._state.protocolContext);
    scenario.loader(this._state.simulation as Simulation);
    this.updateNodes();
  }

  //SIMULATION ACTIONS
  public getLatestEvents() {
    return this._state.simulation.getLatestEvents();
  }

  public updateNodeTrust(
    publicKey: string,
    trustedNodes: string[],
    threshold: number,
  ) {
    const pendingUpdate = this._state.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof UpdateQuorumSet && action.publicKey === publicKey,
      );

    if (pendingUpdate) {
      this._state.simulation.cancelPendingUserAction(pendingUpdate);
    }

    this._state.simulation.addUserAction(
      new UpdateQuorumSet(
        publicKey,
        new QuorumSet(threshold, trustedNodes, []),
      ),
    );

    this.updateNodes();
  }

  public cancelNodeTrustUpdate(publicKey: string) {
    const pendingUpdate = this._state.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof UpdateQuorumSet && action.publicKey === publicKey,
      );

    if (pendingUpdate) {
      this._state.simulation.cancelPendingUserAction(pendingUpdate);
      this.updateNodes();
    }
  }

  public cancelPendingUserAction(action: UserAction) {
    this._state.simulation.cancelPendingUserAction(action);
    if (action instanceof UpdateQuorumSet) {
      this.updateNodes();
    }
  }

  public executeStep() {
    this._state.simulation.executeStep();
    this._state.latestSimulationStepWentForwards = true;
    this.updateNodes();
    this._state.simulationUpdate++;
  }

  public reset() {
    this._state.simulation.goToFirstStep();
    this._state.latestSimulationStepWentForwards = false;
    this.updateNodes();
    this._state.simulationUpdate++;
  }

  public goBackOneStep() {
    this._state.simulation.goBackOneStep();
    this._state.latestSimulationStepWentForwards = false;
    this.updateNodes();
    this._state.simulationUpdate++;
  }

  public hasNextStep() {
    return this._state.simulation.hasNextStep();
  }

  public hasPreviousStep() {
    return this._state.simulation.hasPreviousStep();
  }

  //todo: mapping?
  public getFullEventLog() {
    return this._state.simulation.getFullEventLog();
  }

  public consensusReached = computed(() => {
    const nodes = this.nodes;
    if (!nodes.every((node) => node.confirmed)) {
      return false;
    }

    const confirmedValues = nodes
      .filter((state) => state.confirmed)
      .map((state) => state.confirmed);

    const firstConfirmedValue = confirmedValues[0];
    return confirmedValues.every((value) => value === firstConfirmedValue);
  });

  public isNetworkSplit = computed(() => {
    const confirmedStates = this.nodes.filter(
      (state) => state.confirmed !== null,
    );

    const confirmedValues = new Set(
      confirmedStates.map((state) => state.confirmed),
    );

    // If there's more than one unique value, the network is split
    return confirmedValues.size > 1;
  });

  public isStuck = computed(() => {
    return (
      !this._state.simulation.hasNextStep() && !this.consensusReached.value
    );
  });

  public vote(publicKey: string, vote: string) {
    this.cancelPendingVote(publicKey);
    const action = new VoteOnStatement(publicKey, vote);
    this._state.simulation.addUserAction(action);
  }

  private cancelPendingVote(publicKey: string) {
    const vote = this._state.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof VoteOnStatement && action.publicKey === publicKey,
      );

    if (vote) {
      this._state.simulation.cancelPendingUserAction(vote);
    }
  }

  public getPendingVotes() {
    return this._state.simulation
      .pendingUserActions()
      .filter(
        (action) => action instanceof VoteOnStatement,
      ) as VoteOnStatement[];
  }

  //@deprecated
  get simulation(): Simulation {
    return this._state.simulation as Simulation;
  }

  get simulationUpdate(): number {
    return this._state.simulationUpdate;
  }

  get latestSimulationStepWentForwards(): boolean {
    return this._state.latestSimulationStepWentForwards;
  }
}

export const federatedVotingStore = new FederatedVotingStore();
