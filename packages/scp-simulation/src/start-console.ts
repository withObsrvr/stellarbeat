import { ConsoleAdjacencyMatrixVisualization } from './console-interface/ConsoleAdjacencyMatrixVisualizer';
import { ConsoleInterfacer } from './console-interface/ConsoleInterfacer';
import { BasicFederatedVotingScenario } from './simulation/BasicFederatedVotingScenario';

new ConsoleInterfacer(
	new ConsoleAdjacencyMatrixVisualization(),
	new BasicFederatedVotingScenario()
);
