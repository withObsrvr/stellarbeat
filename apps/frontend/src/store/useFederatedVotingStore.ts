import { computed, reactive, UnwrapRef } from "vue";
import {
  Simulation,
  AddNode,
  UpdateQuorumSet,
  UserAction,
  QuorumSet,
  Vote,
  VoteOnStatement,
  RemoveNode,
  AddConnection,
  RemoveConnection,
  Message,
  ForgeMessage,
  ScenarioLoader,
  Scenario,
} from "scp-simulation";
import { findAllIntactNodes } from "@/components/federated-voting/analysis/DSetAnalysis";
import { NetworkAnalysis } from "@/components/federated-voting/analysis/NetworkAnalysis";
import { FederatedVotingContextBridge } from "./federated-voting/FederatedVotingContextBridge";
import { OverlayBridge } from "./federated-voting/OverlayBridge";
import { ScenarioManager } from "./federated-voting/ScenarioManager";

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

interface State {
  simulationUpdate: number;
  networkStructureUpdate: number;
  overlayUpdate: number;
  selectedScenario: Scenario;
  selectedNodeId: string | null;
  networkAnalysis: NetworkAnalysis;
  nodes: FederatedNode[];
  overlayConnections: { publicKey: string; connections: string[] }[];
  overlayIsFullyConnected: boolean;
  overlayIsGossipEnabled: boolean;
  latestSimulationStepWentForwards: boolean;
  simulation: Simulation;
  safetyDisruptingNodes: string[];
  livenessDisruptingNodes: string[];
  intactNodes: string[];
}

class FederatedVotingStore {
  readonly scenarios: Scenario[];
  private _state: UnwrapRef<State>;
  private _networkStructureHash: string = "";
  private _overlayConnectionsHash: string = "";
  private scenarioLoader = new ScenarioLoader();
  private protocolContext: FederatedVotingContextBridge;
  private overlay: OverlayBridge;
  private scenarioManager = new ScenarioManager();

  constructor() {
    this.scenarios = this.scenarioManager.getAllScenarios();
    const loadedScenario = this.scenarioLoader.loadScenario(this.scenarios[0]);
    this.protocolContext = new FederatedVotingContextBridge(
      loadedScenario.protocolContext,
    );
    this.overlay = new OverlayBridge(loadedScenario.protocolContext);
    this._state = reactive({
      simulationUpdate: 0,
      networkStructureUpdate: 0,
      overlayUpdate: 0,
      selectedScenario: this.scenarios[0],
      selectedNodeId: null,
      networkAnalysis: NetworkAnalysis.analyze([]),
      nodes: [],
      overlayConnections: [],
      overlayIsFullyConnected: false,
      overlayIsGossipEnabled: false,
      latestSimulationStepWentForwards: true,
      simulation: loadedScenario.simulation,
      safetyDisruptingNodes: [],
      livenessDisruptingNodes: [],
      intactNodes: [],
    });

    this.updateState();
  }

  /*************
   * UPDATE STATE
   **************/
  private updateState() {
    this.updateNodes();
    this.checkAndRecalculateNetworkAnalysis();
    this.updateOverlayState();
    this.updateDisruptingAndIntactNodes();
  }

  private updateDisruptingAndIntactNodes() {
    const result = this.protocolContext.getDisruptingNodes(
      this.simulation.pendingUserActions(),
      this.simulation.pendingProtocolActions(),
    );

    this._state.livenessDisruptingNodes = result.livenessDisruptingNodes;
    this._state.safetyDisruptingNodes = result.safetyDisruptingNodes;

    this._state.intactNodes = findAllIntactNodes(
      this.nodes.map((node) => node.publicKey),
      new Set(this.disruptingNodes),
      this._state.networkAnalysis.dSets,
    );
  }

  private updateNodes() {
    this._state.nodes = this.protocolContext.getFederatedNodes(
      this._state.simulation.pendingUserActions(),
    );
  }

  private updateOverlayState() {
    this._state.overlayIsFullyConnected = this.overlay.isFullyConnected;
    this._state.overlayIsGossipEnabled = this.overlay.isGossipEnabled;
    const connections = this.overlay.createConnections(
      this.nodes,
      this._state.simulation.pendingUserActions(),
    );

    const hash = this.overlay.calculateOverlayConnectionsHash(connections);
    if (hash !== this._overlayConnectionsHash) {
      this._overlayConnectionsHash = hash;
      this._state.overlayConnections = connections;
      this._state.overlayUpdate++;
    }
  }

  private checkAndRecalculateNetworkAnalysis(): void {
    const newHash = this.protocolContext.calculateNetworkTrustStructureHash(
      this.nodes,
    );
    if (newHash !== this._networkStructureHash) {
      this._networkStructureHash = newHash;
      this._state.networkStructureUpdate++;
      this._state.networkAnalysis = NetworkAnalysis.analyze(this.nodes);
    }
  }

  /*************
   * SCENARIO
   **************/

  public modifyScenario(
    scenarioId: string,
    overlayIsFullyConnected: boolean,
    overlayIsGossipEnabled: boolean,
  ) {
    const modifiedScenario = this.scenarioManager.getModifiedScenario(
      scenarioId,
      overlayIsFullyConnected,
      overlayIsGossipEnabled,
    );

    if (!modifiedScenario) {
      console.error(`Scenario with id ${scenarioId} not found`);
      return;
    }

    this.loadSimulationWithScenario(modifiedScenario);
  }

  public selectScenario(scenarioId: string): void {
    const scenario = this.scenarioManager.getScenario(scenarioId);
    if (!scenario) {
      console.error(`Scenario with id ${scenarioId} not found`);
      return;
    }

    this.loadSimulationWithScenario(scenario);
  }

  private loadSimulationWithScenario(scenario: Scenario) {
    const result = this.scenarioLoader.loadScenario(scenario);

    this._state.selectedScenario = scenario;

    this.protocolContext.replaceContext(result.protocolContext);
    this.overlay.replaceContext(result.protocolContext);

    this._state.simulation = result.simulation;
    this._state.simulationUpdate++;
    this._state.overlayUpdate++;
    this._state.networkStructureUpdate++;
    this.updateState();
  }

  exportScenario() {
    return this.scenarioManager.exportScenarioToJSON(
      this.selectedScenario,
      this.overlayIsFullyConnected,
      this.overlayIsGossipEnabled,
      this.simulation.getInitialStep(),
    );
  }

  importScenario(json: object) {
    const scenario = this.scenarioManager.createScenarioFromJSON(json);
    const existingIndex = this.scenarios.findIndex((s) => s.id === scenario.id);
    if (existingIndex !== -1) {
      this.scenarios.splice(existingIndex, 1, scenario);
    } else {
      this.scenarios.push(scenario);
    }
    this.selectScenario(scenario.id);
  }

  /*************
   * GETTERS
   **************/
  get simulationStepDurationInSeconds(): number {
    return 2;
  }

  get networkStructureUpdate(): number {
    return this._state.networkStructureUpdate;
  }

  get selectedScenario(): Scenario {
    return this._state.selectedScenario;
  }

  get selectedNodeId(): string | null {
    return this._state.selectedNodeId;
  }

  get networkAnalysis(): NetworkAnalysis {
    return this._state.networkAnalysis;
  }

  set selectedNodeId(value: string | null) {
    this._state.selectedNodeId = value;
  }

  public selectedNode = computed(() => {
    return this.nodes.find((node) => node.publicKey === this.selectedNodeId);
  });

  get nodes() {
    return this._state.nodes;
  }

  get overlayConnections() {
    return this._state.overlayConnections;
  }

  public getNodeWithoutPreviewChanges(publicKey: string): FederatedNode | null {
    return this.protocolContext.getFederatedNode(publicKey);
  }

  get illBehavedNodes() {
    return this.disruptingNodes;
  }

  get disruptingNodes() {
    return this._state.livenessDisruptingNodes.concat(
      this._state.safetyDisruptingNodes,
    );
  }

  get livenessDisruptingNodes() {
    return this._state.livenessDisruptingNodes;
  }

  get safetyDisruptingNodes() {
    return this._state.safetyDisruptingNodes;
  }

  get intactNodes() {
    return this._state.intactNodes;
  }

  public getLatestEvents() {
    return this.simulation.getLatestEvents();
  }

  /*********************
   * SIMULATION ACTIONS
   *********************/

  public updateNodeTrust(
    publicKey: string,
    trustedNodes: string[],
    threshold: number,
  ) {
    const pendingUpdate = this.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof UpdateQuorumSet && action.publicKey === publicKey,
      );

    if (pendingUpdate) {
      this.simulation.cancelPendingUserAction(pendingUpdate);
    }

    this.simulation.addUserAction(
      new UpdateQuorumSet(
        publicKey,
        new QuorumSet(threshold, trustedNodes, []),
      ),
    );

    this.updateState();
  }

  addConnection(a: string, b: string) {
    const addConnection = new AddConnection(a, b);
    this.simulation.addUserAction(addConnection);
  }

  removeConnection(a: string, b: string) {
    const removeConnection = new RemoveConnection(a, b);
    this.simulation.addUserAction(removeConnection);
  }

  public forgeMessage(message: Message) {
    this.simulation.addUserAction(new ForgeMessage(message));
  }

  public addNode(publicKey: string, trustedNodes: string[], threshold: number) {
    this.cancelNodeRemoval(publicKey);

    if (this.protocolContext.containsNode(publicKey)) {
      return; //already there
    }

    this.simulation.addUserAction(
      new AddNode(publicKey, new QuorumSet(threshold, trustedNodes, [])),
    );

    this.updateState();
  }

  private cancelNodeRemoval(publicKey: string) {
    const pendingRemoval = this.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof RemoveNode && action.publicKey === publicKey,
      );

    if (pendingRemoval) {
      this.simulation.cancelPendingUserAction(pendingRemoval);
      this.updateState();
    }
  }

  private cancelNodeAdd(publicKey: string) {
    const pendingAdd = this.simulation
      .pendingUserActions()
      .find(
        (action) => action instanceof AddNode && action.publicKey === publicKey,
      );

    if (pendingAdd) {
      this.simulation.cancelPendingUserAction(pendingAdd);
      this.updateState();
    }
  }

  public removeNode(publicKey: string) {
    this.cancelNodeAdd(publicKey);
    if (!this.protocolContext.containsNode(publicKey)) {
      return; //not there, no need to remove
    }
    this.simulation.addUserAction(new RemoveNode(publicKey));
    this.updateState();
  }

  public cancelNodeTrustUpdate(publicKey: string) {
    const pendingUpdate = this.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof UpdateQuorumSet && action.publicKey === publicKey,
      );

    if (pendingUpdate) {
      this.simulation.cancelPendingUserAction(pendingUpdate);
      this.updateState();
    }
  }

  public cancelPendingUserAction(action: UserAction) {
    this.simulation.cancelPendingUserAction(action);
    if (action.immediateExecution) {
      this.updateState();
    }
  }

  private simulationUpdated(forwardDirection: boolean = true) {
    this._state.latestSimulationStepWentForwards = forwardDirection;
    this.updateState();
    this._state.simulationUpdate++;
  }

  public executeStep() {
    this.simulation.executeStep();
    this.simulationUpdated(true);
  }

  public reset() {
    this.simulation.goToFirstStep();
    this.simulationUpdated(false);
  }

  public goBackOneStep() {
    this.simulation.goBackOneStep();
    this.simulationUpdated(false);
  }

  public hasNextStep() {
    return this.simulation.hasNextStep();
  }

  public hasPreviousStep() {
    return this.simulation.hasPreviousStep();
  }

  get fullEventLog() {
    return this._state.simulation.getFullEventLog();
  }

  public consensusReached = computed(() => {
    const wellBehavedNodes = this.nodes.filter(
      (node) => this.illBehavedNodes.indexOf(node.publicKey) === -1,
    );
    if (!wellBehavedNodes.every((node) => node.confirmed)) {
      return false;
    }

    const confirmedValues = wellBehavedNodes
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
    return !this.simulation.hasNextStep() && !this.consensusReached.value;
  });

  public vote(publicKey: string, vote: string) {
    this.cancelPendingVote(publicKey);
    const action = new VoteOnStatement(publicKey, vote);
    this.simulation.addUserAction(action);
  }

  public cancelPendingVote(publicKey: string) {
    const vote = this.simulation
      .pendingUserActions()
      .find(
        (action) =>
          action instanceof VoteOnStatement && action.publicKey === publicKey,
      );

    if (vote) {
      this.simulation.cancelPendingUserAction(vote);
    }
  }

  public getPendingVotes() {
    return this.simulation
      .pendingUserActions()
      .filter(
        (action) => action instanceof VoteOnStatement,
      ) as VoteOnStatement[];
  }

  get simulation(): Simulation {
    return this._state.simulation as Simulation;
  }

  get simulationUpdate(): number {
    return this._state.simulationUpdate;
  }

  get overlayUpdate(): number {
    return this._state.overlayUpdate;
  }

  get latestSimulationStepWentForwards(): boolean {
    return this._state.latestSimulationStepWentForwards;
  }

  get overlayIsFullyConnected(): boolean {
    return this._state.overlayIsFullyConnected;
  }

  get overlayIsGossipEnabled(): boolean {
    return this._state.overlayIsGossipEnabled;
  }
}

export const federatedVotingStore = new FederatedVotingStore();
