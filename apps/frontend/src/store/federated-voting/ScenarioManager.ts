import {
  FederatedVotingScenarioFactory,
  Scenario,
  ScenarioSerializer,
  SimulationStep,
  SimulationStepListSerializer,
  SimulationStepSerializer,
} from "scp-simulation";

export class ScenarioManager {
  private simulationStepSerializer: SimulationStepSerializer;
  private simulationStepListSerializer: SimulationStepListSerializer;
  private scenarioSerializer: ScenarioSerializer;
  private scenarioFactory: FederatedVotingScenarioFactory;

  constructor() {
    this.simulationStepSerializer = new SimulationStepSerializer();
    this.simulationStepListSerializer = new SimulationStepListSerializer(
      this.simulationStepSerializer,
    );
    this.scenarioSerializer = new ScenarioSerializer(
      this.simulationStepListSerializer,
    );
    this.scenarioFactory = new FederatedVotingScenarioFactory(
      this.scenarioSerializer,
    );
  }
  getAllScenarios(): Scenario[] {
    return this.scenarioFactory.loadAll();
  }

  getScenario(scenarioId: string): Scenario | undefined {
    return this.getAllScenarios().find(
      (scenario) => scenario.id === scenarioId,
    );
  }

  getModifiedScenario(
    scenarioId: string,
    overlayIsFullyConnected: boolean,
    overlayIsGossipEnabled: boolean,
  ): Scenario | null {
    const originalScenario = this.getScenario(scenarioId);
    if (!originalScenario) {
      return null;
    }

    return new Scenario(
      originalScenario.id,
      originalScenario.name,
      originalScenario.description,
      overlayIsFullyConnected,
      overlayIsGossipEnabled,
      originalScenario.initialSimulationStep,
    );
  }

  exportScenarioToJSON(
    scenario: Scenario,
    overlayIsFullyConnected: boolean,
    overlayIsGossipEnabled: boolean,
    initialSimulationStep: SimulationStep,
  ): object {
    const scenarioToExport = new Scenario(
      scenario.id,
      scenario.name,
      scenario.description,
      overlayIsFullyConnected,
      overlayIsGossipEnabled,
      initialSimulationStep,
    );

    return this.scenarioSerializer.toJSON(scenarioToExport);
  }

  createScenarioFromJSON(json: object): Scenario {
    return this.scenarioSerializer.fromJSON(json);
  }
}
