import { reactive } from "vue";
import {
  BasicFederatedVotingScenario,
  FederatedVotingContext,
  FederatedVotingContextFactory,
  Simulation,
} from "scp-simulation";
import { FederatedVotingContextState } from "scp-simulation/lib/federated-voting/FederatedVotingContext";
import { findAllIntactNodes } from "@/components/federated-voting/analysis/DSetAnalysis";
import { NetworkAnalysis } from "@/components/federated-voting/analysis/NetworkAnalysis";

class FederatedVotingStore {
  readonly scenarios = [
    {
      id: "consensus-reached",
      label: "Consensus Reached",
      loader: BasicFederatedVotingScenario.loadConsensusReached,
    },
    {
      id: "stuck",
      label: "Stuck Scenario",
      loader: BasicFederatedVotingScenario.loadStuck,
    },
  ];

  public readonly simulationStepDurationInSeconds: number = 2;
  public selectedScenarioId: string = "consensus-reached";
  public selectedNodeId: string | null = null;
  public networkAnalysis: NetworkAnalysis;
  public protocolContext: FederatedVotingContext;
  public protocolContextState: FederatedVotingContextState;
  public simulation: Simulation;

  constructor() {
    const scenario = this.scenarios.find(
      (s) => s.id === this.selectedScenarioId,
    );
    if (!scenario) throw new Error("Scenario not found");

    this.protocolContext = FederatedVotingContextFactory.create();
    this.protocolContextState = this.protocolContext.getState();
    this.simulation = new Simulation(this.protocolContext);
    scenario.loader(this.simulation);
    this.networkAnalysis = NetworkAnalysis.analyze(
      this.protocolContextState.initialNodes,
    );
  }

  public selectScenario(scenarioId: string): void {
    this.selectedScenarioId = scenarioId;
    const scenario = this.scenarios.find(
      (s) => s.id === this.selectedScenarioId,
    );
    if (!scenario) throw new Error("Scenario not found");

    this.protocolContext = FederatedVotingContextFactory.create();
    this.protocolContextState = this.protocolContext.getState();
    this.simulation = new Simulation(this.protocolContext);
    scenario.loader(this.simulation);
    this.networkAnalysis = NetworkAnalysis.analyze(
      this.protocolContextState.initialNodes,
    );
  }

  public illBehavedNodes = () => {
    return this.simulation.getDisruptedNodes();
  };

  public intactNodes = () => {
    return findAllIntactNodes(
      this.protocolContextState.initialNodes.map((node) => node.publicKey),
      new Set(this.illBehavedNodes()),
      this.networkAnalysis.dSets,
    );
  };
}

export const federatedVotingStore = reactive<FederatedVotingStore>(
  new FederatedVotingStore(),
);
