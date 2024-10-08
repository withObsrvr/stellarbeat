// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('await-fs');

let nodesJSON: string;
beforeAll(async () => {
	nodesJSON = await fs.readFile('./test/data/nodes.json');
});

test('hasQuorumIntersection', function () {
	expect(nodesJSON).toBeDefined();
	/*QuorumService.hasQuorumIntersection(
      network
  )*/
});

test('containsQuorum', function () {
	/*let innerQuorumSet = new QuorumSet('hash', 2);
    innerQuorumSet.validators.push(...['c', 'd']);

    let nodeA = new Node("a");
    nodeA.active = true;
    nodeA.isValidating = true;
    nodeA.quorumSet.threshold = 3;
    nodeA.quorumSet.validators.push('a')
    nodeA.quorumSet.validators.push('b')
    nodeA.quorumSet.innerQuorumSets.push(innerQuorumSet);
    nodeA.quorumSet.validators.push('e');
    nodeA.quorumSet.validators.push('f');

    let nodeB = new Node("b");
    nodeB.active = true;
    nodeB.isValidating = true;
    nodeB.quorumSet.threshold = 3;
    nodeB.quorumSet.validators.push('a');
    nodeB.quorumSet.validators.push('b');
    nodeB.quorumSet.innerQuorumSets.push(innerQuorumSet);
    nodeB.quorumSet.validators.push('e');
    nodeB.quorumSet.validators.push('f');

    let nodeC = new Node("c");
    nodeC.active = true;
    nodeC.isValidating = true;
    nodeC.quorumSet.threshold = 3;
    nodeC.quorumSet.validators.push('a');
    nodeC.quorumSet.validators.push('b');
    nodeC.quorumSet.innerQuorumSets.push(innerQuorumSet);
    nodeC.quorumSet.validators.push('e');
    nodeC.quorumSet.validators.push('f');

    let nodeD = new Node("d");
    nodeD.active = true;
    nodeD.isValidating = true;
    nodeD.quorumSet.threshold = 3;
    nodeD.quorumSet.validators.push('a');
    nodeD.quorumSet.validators.push('b');
    nodeD.quorumSet.innerQuorumSets.push(innerQuorumSet);
    nodeD.quorumSet.validators.push('e');
    nodeD.quorumSet.validators.push('f');

    let nodeE = new Node("e");
    nodeE.active = true;
    nodeE.isValidating = true;
    nodeE.quorumSet.threshold = 3;
    nodeE.quorumSet.validators.push('a');
    nodeE.quorumSet.validators.push('b');
    nodeE.quorumSet.innerQuorumSets.push(innerQuorumSet);
    nodeE.quorumSet.validators.push('e');
    nodeE.quorumSet.validators.push('f');

    let nodeF = new Node("f");
    nodeF.active = true;
    nodeF.isValidating = true;
    nodeF.quorumSet.threshold = 3;
    nodeF.quorumSet.validators.push('a');
    nodeF.quorumSet.validators.push('b');
    nodeF.quorumSet.innerQuorumSets.push(innerQuorumSet);
    nodeF.quorumSet.validators.push('e');
    nodeF.quorumSet.validators.push('f');


    let network = new Network([nodeA, nodeB, nodeC, nodeD, nodeE, nodeF]);
    expect(QuorumService.hasQuorumIntersection(
        network
    )).toBeTruthy();*/
});
