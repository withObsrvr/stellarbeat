interface Node {
	publicKey: string;
	connections: string[];
}

export class ConsoleAdjacencyMatrixVisualization {
	public visualize(nodes: Node[]): void {
		const nodeIds = nodes.map((node) => node.publicKey);
		const nodeIndexMap: { [key: string]: number } = {};
		nodeIds.forEach((id, index) => {
			nodeIndexMap[id] = index;
		});

		// Initialize an empty adjacency matrix
		const adjacencyMatrix: string[][] = this.initializeMatrix(nodeIds.length);

		// Populate the adjacency matrix
		nodes.forEach((node) => {
			const nodeIndex = nodeIndexMap[node.publicKey];
			node.connections.forEach((connection) => {
				const connectionIndex = nodeIndexMap[connection];
				adjacencyMatrix[nodeIndex][connectionIndex] = 'x';
				adjacencyMatrix[connectionIndex][nodeIndex] = 'x'; // Since it's undirected
			});
		});

		// Print the adjacency matrix
		this.printMatrix(nodeIds, adjacencyMatrix);
	}

	private initializeMatrix(size: number): string[][] {
		const matrix: string[][] = [];
		for (let i = 0; i < size; i++) {
			matrix.push(new Array(size).fill('.'));
			matrix[i][i] = 'x';
		}
		return matrix;
	}

	private printMatrix(nodeIds: string[], matrix: string[][]): void {
		const maxLength = Math.max(...nodeIds.map((id) => id.length));
		const header =
			' '.padEnd(maxLength + 1) +
			nodeIds.map((id) => id.padEnd(maxLength)).join(' ');
		console.log(header);
		console.log(' '.padEnd(maxLength + 1) + '-'.repeat(header.length - 3));

		matrix.forEach((row, index) => {
			const rowString =
				nodeIds[index].padEnd(maxLength) +
				'| ' +
				row.map((cell) => cell.toString().padEnd(maxLength)).join(' ');
			console.log(rowString);
		});
	}
}
