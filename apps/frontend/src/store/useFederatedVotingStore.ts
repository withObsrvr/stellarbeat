import { computed, reactive, watch } from "vue";
import {
  BasicFederatedVotingScenario,
  FederatedVotingContext,
  FederatedVotingContextFactory,
  Simulation,
  Node,
  AddNode,
  UpdateQuorumSet,
  QuorumSet,
} from "scp-simulation";
import { FederatedVotingContextState } from "scp-simulation/lib/federated-voting/FederatedVotingContext";
import { findAllIntactNodes } from "@/components/federated-voting/analysis/DSetAnalysis";
import { NetworkAnalysis } from "@/components/federated-voting/analysis/NetworkAnalysis";

class FederatedVotingStore {
  private readonly _state = reactive<{
    delayImmediateUserActions: boolean; //give the simulation time to animate before we preview changes
    selectedScenarioId: string;
    selectedNodeId: string | null;
    protocolContext: FederatedVotingContext;
    protocolContextState: FederatedVotingContextState;
    simulation: Simulation;
    networkAnalysis: NetworkAnalysis;
  }>({
    delayImmediateUserActions: false,
    selectedScenarioId: "consensus-reached",
    selectedNodeId: null,
    protocolContext: FederatedVotingContextFactory.create(),
    protocolContextState: {} as FederatedVotingContextState, // temporary placeholder until constructor load
    simulation: {} as Simulation,
    networkAnalysis: {} as NetworkAnalysis,
  });

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
    this._state.networkAnalysis = NetworkAnalysis.analyze(this.nodes as Node[]);
    this.setupNetworkWatcher();
  }

  /**
   * Sets up a watcher to detect changes in the network configuration
   */
  private setupNetworkWatcher() {
    watch(
      [() => this.nodes, () => this.quorumSets],
      () => {
        console.log("Network configuration changed, recalculating analysis");
        this.recalculateNetworkAnalysis();
      },
      { deep: true },
    );
  }

  private recalculateNetworkAnalysis(): void {
    console.log("Recalculating network analysis");
    this._state.networkAnalysis = NetworkAnalysis.analyze(this.nodes as Node[]);
  }

  get simulationStepDurationInSeconds(): number {
    return 2;
  }

  get selectedScenarioId(): string {
    return this._state.selectedScenarioId;
  }

  get selectedNodeId(): string | null {
    return this._state.selectedNodeId;
  }

  get protocolContext() {
    return this._state.protocolContext;
  }

  get protocolContextState(): FederatedVotingContextState {
    return this._state.protocolContextState as FederatedVotingContextState;
  }

  get simulation() {
    return this._state.simulation;
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

  set delayImmediateUserActions(value: boolean) {
    this._state.delayImmediateUserActions = value;
    console.log("MEH", this._state.delayImmediateUserActions);
  }

  /*
   * caches the nodes in the simulation. Takes into account UserActions that will
   * be applied to the simulation in the next step.
   */
  private _nodes = computed(() => {
    const nodes = this._state.protocolContextState.protocolStates.map(
      (state) => {
        return new Node(
          state.node.publicKey,
          new QuorumSet(
            state.node.quorumSet.threshold,
            state.node.quorumSet.validators,
            [],
          ),
        );
      },
    );

    //Give the animations time to complete
    if (this._state.delayImmediateUserActions) return nodes;
    //add any pending nodes for live preview of immediate AddNode UserAction
    console.log("ADDING USER ACTIONS");
    nodes.concat(
      this._state.simulation
        .pendingUserActions()
        .filter((action) => action instanceof AddNode)
        .map((action) => {
          return new Node(action.publicKey, action.quorumSet);
        }),
    );

    //update quorumSets with any pending UpdateQuorumSet actions
    this._state.simulation
      .pendingUserActions()
      .filter((action) => action instanceof UpdateQuorumSet)
      .forEach((action) => {
        const node = nodes.find((node) => node.publicKey === action.publicKey);
        if (!node) {
          return;
        }
        node.updateQuorumSet(action.quorumSet);
      });

    return nodes;
  });

  get nodes() {
    return this._nodes.value;
  }

  get quorumSets() {
    return this.nodes.map((node) => node.quorumSet);
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
    this.recalculateNetworkAnalysis();
  }
}

export const federatedVotingStore = new FederatedVotingStore();
