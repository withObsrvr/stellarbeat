import { Vote } from "scp-simulation";

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
