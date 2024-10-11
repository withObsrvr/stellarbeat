import { Network } from "shared";
import { Result } from "neverthrow";

export interface NetworkRepository {
  find(at?: Date): Promise<Result<Network, Error>>;
}
