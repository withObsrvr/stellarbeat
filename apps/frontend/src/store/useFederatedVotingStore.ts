import { computed, reactive, UnwrapRef } from "vue";
import {
  UserAction,
  Message,
  ScenarioLoader,
  Scenario,
  ProtocolAction,
  VoteOnStatement,
} from "scp-simulation";
import { findAllIntactNodes } from "@/components/federated-voting/analysis/DSetAnalysis";
import { NetworkAnalysis } from "@/components/federated-voting/analysis/NetworkAnalysis";
import { FederatedVotingContextBridge } from "./federated-voting/FederatedVotingContextBridge";
import { OverlayBridge } from "./federated-voting/OverlayBridge";
import { ScenarioManager } from "./federated-voting/ScenarioManager";
import {
  SimulationBridge,
  SimulationObserver,
} from "./federated-voting/SimulationBridge";
import { FederatedNode } from "./federated-voting/FederatedNode";

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
  safetyDisruptingNodes: string[];
  livenessDisruptingNodes: string[];
  intactNodes: string[];
  latestEvents: Event[];
  fullEventLog: Event[][];
  hasNextStepAvailable: boolean;
  hasPreviousStepAvailable: boolean;
  latestSimulationStepWentForward: boolean;
  pendingUserActions: UserAction[];
  pendingProtocolActions: ProtocolAction[];
}

class FederatedVotingStore implements SimulationObserver {
  readonly scenarios: Scenario[];
  private _state: UnwrapRef<State>;
  private _networkStructureHash: string = "";
  private _overlayConnectionsHash: string = "";
  private scenarioLoader = new ScenarioLoader();
  private protocolContext: FederatedVotingContextBridge;
  private overlay: OverlayBridge;
  private simulationBridge: SimulationBridge;
  private scenarioManager = new ScenarioManager();

  constructor() {
    this.scenarios = this.scenarioManager.getAllScenarios();
    const loadedScenario = this.scenarioLoader.loadScenario(this.scenarios[0]);
    this.protocolContext = new FederatedVotingContextBridge(
      loadedScenario.protocolContext,
    );
    this.overlay = new OverlayBridge(loadedScenario.protocolContext);
    this.simulationBridge = new SimulationBridge(loadedScenario.simulation);
    this.simulationBridge.addObserver(this);

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
      latestSimulationStepWentForward: true,
      simulation: loadedScenario.simulation,
      safetyDisruptingNodes: [],
      livenessDisruptingNodes: [],
      intactNodes: [],
      latestEvents: [],
      fullEventLog: [[]],
      hasNextStepAvailable: false,
      hasPreviousStepAvailable: false,
      pendingUserActions: [],
      pendingProtocolActions: [],
      pendingVotes: [],
    });

    this.updateState(true);
  }

  /*************
   * UPDATE STATE
   **************/
  private updateState(simulationStepExecuted: boolean) {
    this.updateSimulationState(simulationStepExecuted);
  }

  private updateDisruptingAndIntactNodes() {
    const result = this.protocolContext.getDisruptingNodes(
      this._state.pendingUserActions,
      this._state.pendingProtocolActions,
    );

    this._state.livenessDisruptingNodes = result.livenessDisruptingNodes;
    this._state.safetyDisruptingNodes = result.safetyDisruptingNodes;

    this._state.intactNodes = findAllIntactNodes(
      this.nodes.map((node) => node.publicKey),
      new Set(this.disruptingNodes),
      this._state.networkAnalysis.dSets,
    );
  }

  private updateContextState() {
    this._state.nodes = this.protocolContext.getFederatedNodes(
      this._state.pendingUserActions,
    );
  }

  private updateOverlayState() {
    this._state.overlayIsFullyConnected = this.overlay.isFullyConnected;
    this._state.overlayIsGossipEnabled = this.overlay.isGossipEnabled;
    const connections = this.overlay.createConnections(
      this.nodes,
      this._state.pendingUserActions,
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

  private updateSimulationState(stepExecuted: boolean) {
    if (stepExecuted) {
      this._state.latestEvents =
        this.simulationBridge.getLatestEvents() as Event[];
      this._state.fullEventLog =
        this.simulationBridge.getFullEventLog() as Event[][];
      this._state.latestSimulationStepWentForward =
        this.simulationBridge.latestSimulationStepWentForward;
    }
    this._state.hasNextStepAvailable = this.simulationBridge.hasNextStep();
    this._state.hasPreviousStepAvailable =
      this.simulationBridge.hasPreviousStep();
    this._state.pendingUserActions = this.simulationBridge.pendingUserActions();
    this._state.pendingProtocolActions =
      this.simulationBridge.pendingProtocolActions();

    this._state.simulationUpdate++;

    this.updateContextState();
    this.checkAndRecalculateNetworkAnalysis();
    this.updateOverlayState();
    this.updateDisruptingAndIntactNodes();
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
    this.simulationBridge.replaceSimulation(result.simulation);
    this._state.simulationUpdate++;
    this._state.overlayUpdate++;
    this._state.networkStructureUpdate++;
    this.updateState(true);
  }

  exportScenario() {
    return this.scenarioManager.exportScenarioToJSON(
      this.selectedScenario,
      this.overlayIsFullyConnected,
      this.overlayIsGossipEnabled,
      this.simulationBridge.getInitialStep(),
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
    this.loadSimulationWithScenario(scenario);
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
    return Array.from(
      //delete duplicates
      new Set(
        this._state.livenessDisruptingNodes.concat(
          this._state.safetyDisruptingNodes,
        ),
      ),
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
    return this._state.latestEvents;
  }

  public hasNextStep() {
    return this._state.hasNextStepAvailable;
  }

  public hasPreviousStep() {
    return this._state.hasPreviousStepAvailable;
  }

  get fullEventLog() {
    return this._state.fullEventLog;
  }

  /*********************
   * SIMULATION ACTIONS
   *********************/

  public updateNodeTrust(
    publicKey: string,
    trustedNodes: string[],
    threshold: number,
  ) {
    this.simulationBridge.updateNodeTrust(publicKey, trustedNodes, threshold);
  }

  addConnection(a: string, b: string) {
    this.simulationBridge.addConnection(a, b);
  }

  removeConnection(a: string, b: string) {
    this.simulationBridge.removeConnection(a, b);
  }

  public forgeMessage(message: Message) {
    this.simulationBridge.forgeMessage(message);
  }

  public addNode(publicKey: string, trustedNodes: string[], threshold: number) {
    if (this.protocolContext.containsNode(publicKey)) {
      return; // Already there
    }

    this.simulationBridge.addNode(publicKey, trustedNodes, threshold);
  }

  public removeNode(publicKey: string) {
    if (!this.protocolContext.containsNode(publicKey)) {
      return; // Not there, no need to remove
    }

    this.simulationBridge.removeNode(publicKey);
  }

  public cancelNodeTrustUpdate(publicKey: string) {
    this.simulationBridge.cancelNodeTrustUpdate(publicKey);
  }

  public cancelPendingUserAction(action: UserAction) {
    this.simulationBridge.cancelPendingUserAction(action);
  }

  public disruptAction(
    action: ProtocolAction,
    blacklistedNeighbors: string[] = [],
  ): void {
    this.simulationBridge.disruptAction(action, blacklistedNeighbors);
  }

  public undisruptAction(action: ProtocolAction): void {
    this.simulationBridge.undisruptAction(action);
  }

  public executeStep() {
    this.simulationBridge.executeStep();
  }

  public reset() {
    this.simulationBridge.reset();
  }

  public goBackOneStep() {
    this.simulationBridge.goBackOneStep();
  }

  public vote(publicKey: string, vote: string) {
    this.simulationBridge.vote(publicKey, vote);
  }

  public cancelPendingVote(publicKey: string) {
    this.simulationBridge.cancelPendingVote(publicKey);
  }

  public getPendingVotes(): VoteOnStatement[] {
    return this._state.pendingUserActions.filter(
      (action) => action instanceof VoteOnStatement,
    ) as VoteOnStatement[];
  }

  get simulationUpdate(): number {
    return this._state.simulationUpdate;
  }

  get overlayUpdate(): number {
    return this._state.overlayUpdate;
  }

  get latestSimulationStepWentForwards(): boolean {
    return this._state.latestSimulationStepWentForward;
  }

  get overlayIsFullyConnected(): boolean {
    return this._state.overlayIsFullyConnected;
  }

  get overlayIsGossipEnabled(): boolean {
    return this._state.overlayIsGossipEnabled;
  }

  get pendingUserActions(): UserAction[] {
    return this._state.pendingUserActions;
  }

  get pendingProtocolActions(): ProtocolAction[] {
    return this._state.pendingProtocolActions;
  }

  onSimulationChanged(stepExecuted: boolean): void {
    this.updateState(stepExecuted);
  }

  //TODO: should be somewhere else
  public consensusReached = computed(() => {
    const intactNodes = this.nodes.filter(
      (node) => this.intactNodes.indexOf(node.publicKey) !== -1,
    );

    if (intactNodes.length === 0) {
      return false;
    }

    if (intactNodes.filter((node) => node.confirmed).length === 0) {
      return false;
    }

    const confirmedValues = intactNodes
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

  public isVoteStuck = computed(() => {
    return !this._state.hasNextStepAvailable && !this.consensusReached.value;
  });
}

export const federatedVotingStore = new FederatedVotingStore();
