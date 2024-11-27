import { reactive, ref, type Ref } from "vue";
import { Network } from "shared";
import { FBASQIRepository } from "@/repositories/implementation/FBASQIRepository";
import {
  BasicFederatedVotingScenario,
  FederatedVotingContext,
  FederatedVotingContextFactory,
  Simulation,
} from "scp-simulation";
import { FederatedVotingContextState } from "scp-simulation/lib/federated-voting/FederatedVotingContext";

class FederatedVotingStore {
  scenarios: string[] = ["FBAS QI scenario"];
  selectedScenario: string = this.scenarios[0];
  selectedNodeId: string | null = null;

  protocolContext: FederatedVotingContext;
  protocolContextState: FederatedVotingContextState;
  simulation: Simulation;

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
  }
}

export const federatedVotingStore = reactive<FederatedVotingStore>(
  new FederatedVotingStore(),
);
