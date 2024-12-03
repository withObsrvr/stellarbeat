import { computed, reactive, ref, type Ref } from "vue";
import {
  BasicFederatedVotingScenario,
  FederatedVotingContext,
  FederatedVotingContextFactory,
  FederatedVotingProtocolState,
  QuorumSetService,
  Simulation,
} from "scp-simulation";
import { FederatedVotingContextState } from "scp-simulation/lib/federated-voting/FederatedVotingContext";
import { TrustGraphBuilder } from "@/components/federated-voting/trust-graph/TrustGraphBuilder";
import { TrustGraph } from "shared";

class FederatedVotingStore {
  scenarios: string[] = ["FBAS QI scenario"];
  selectedScenario: string = this.scenarios[0];
  selectedNodeId: string | null = null;

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
  }

  get trustGraph(): TrustGraph {
    return this._trustGraph;
  }

  public illBehavedNodes = () => {
    return federatedVotingStore.simulation.getDisruptedNodes();
  };

  public befouledNodes = () => {
    //todo: implement safety checks (quorum intersection despite...)
    //at the moment only calculates liveness befouling. Because our only demo network has QI and
    //we are not tampering with vote content, we do not have to worry about this...yet.
    const quorumSets = new Map(
      this.protocolContextState.protocolStates.map((state) => [
        state.node.publicKey,
        state.node.quorumSet,
      ]),
    );

    return Array.from(
      QuorumSetService.calculatePotentiallyBlockedNodes(
        quorumSets,
        this.illBehavedNodes(),
      ),
    );
  };
}

export const federatedVotingStore = reactive<FederatedVotingStore>(
  new FederatedVotingStore(),
);
