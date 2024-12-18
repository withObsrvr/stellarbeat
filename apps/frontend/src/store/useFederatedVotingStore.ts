import { reactive, ref, type Ref } from "vue";
import {
  BasicFederatedVotingScenario,
  FederatedVotingContext,
  FederatedVotingContextFactory,
  FederatedVotingProtocolState,
  Simulation,
} from "scp-simulation";
import { FederatedVotingContextState } from "scp-simulation/lib/federated-voting/FederatedVotingContext";
import { TrustGraphBuilder } from "@/components/federated-voting/trust-graph/TrustGraphBuilder";
import { TrustGraph } from "shared";
import {
  findAllDSets,
  findAllIntactNodes,
  findMinimalQuorums,
  findQuorums,
} from "@/components/federated-voting/analysis/DSetAnalysis";
import { findSubSetsOfSize } from "@/components/federated-voting/analysis/Sets";

class FederatedVotingStore {
  scenarios: string[] = ["FBAS QI scenario"];
  selectedScenario: string = this.scenarios[0];
  selectedNodeId: string | null = null;
  readonly simulationStepDurationInSeconds: number = 2;
  dSets: Set<string>[] = [];
  quorumSlices: Map<string, Set<string>[]> = new Map();
  quorums: Set<string>[] = [];
  minimalQuorums: Set<string>[] = [];
  protocolContext: FederatedVotingContext;
  protocolContextState: FederatedVotingContextState;
  simulation: Simulation;
  _trustGraph: TrustGraph;

  overlayGraphRepellingForce: Ref<number> = ref(1000);

  constructor() {
    this.protocolContext = FederatedVotingContextFactory.create();
    this.protocolContextState = reactive(
      this.protocolContext.getState(),
    ) as FederatedVotingContextState;
    this.simulation = reactive(
      new Simulation(this.protocolContext),
    ) as Simulation;
    BasicFederatedVotingScenario.load(this.simulation);
    this._trustGraph = TrustGraphBuilder.buildTrustGraph(
      this.protocolContextState
        .protocolStates as FederatedVotingProtocolState[],
    );

    this.quorumSlices = new Map(
      this.protocolContextState.protocolStates.map((state) => [
        state.node.publicKey,
        Array.from(
          findSubSetsOfSize(
            new Set(state.node.quorumSet.validators),
            state.node.quorumSet.threshold,
          ).map((set) => set.add(state.node.publicKey)),
        ),
      ]),
    );
    this.dSets = findAllDSets({
      nodes: Array.from(this._trustGraph.vertices.keys()),
      Q: this.quorumSlices,
    });
    this.quorums = findQuorums(
      Array.from(this._trustGraph.vertices.keys()),
      this.quorumSlices,
    );
    this.minimalQuorums = findMinimalQuorums(this.quorums);
  }

  get trustGraph(): TrustGraph {
    return this._trustGraph;
  }

  public illBehavedNodes = () => {
    return this.simulation.getDisruptedNodes();
  };

  public intactNodes = () => {
    return findAllIntactNodes(
      Array.from(this._trustGraph.vertices.keys()),
      new Set(this.illBehavedNodes()),
      this.dSets,
    );
  };
}

export const federatedVotingStore = reactive<FederatedVotingStore>(
  new FederatedVotingStore(),
);
