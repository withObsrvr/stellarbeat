import {
	ConsoleInterfacer,
	ConsoleAdjacencyMatrixVisualization
} from './console-interface';
import { BasicFederatedVotingScenario } from './simulation';

new ConsoleInterfacer(
	new ConsoleAdjacencyMatrixVisualization(),
	new BasicFederatedVotingScenario()
);
