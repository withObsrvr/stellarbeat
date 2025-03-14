import {
	ConsoleInterfacer,
	ConsoleAdjacencyMatrixVisualization
} from './console-interface';
import { ScenarioLoader } from './simulation';

new ConsoleInterfacer(
	new ConsoleAdjacencyMatrixVisualization(),
	new ScenarioLoader()
);
