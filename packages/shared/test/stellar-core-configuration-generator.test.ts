import StellarCoreConfigurationGenerator from '../src/stellar-core-configuration-generator';
import { Network, Node, Organization, QuorumSet } from '../src';

test('quorumSetToToml', () => {
	const node = new Node('a');
	node.name = 'a';
	node.quorumSet.validators.push('b');
	node.quorumSet.validators.push('d');
	const innerQSet = new QuorumSet();
	innerQSet.validators.push('c');
	node.quorumSet.innerQuorumSets.push(innerQSet);
	const nodeB = new Node('b');
	nodeB.name = 'b';
	nodeB.homeDomain = 'highQuality.com';
	nodeB.host = 'localhost:11625';
	nodeB.organizationId = 'orgHighQuality';
	nodeB.historyUrl = 'myHistory.org';
	const orgHighQuality = new Organization('orgHighQuality', 'orgHighQuality');
	orgHighQuality.has30DayStats = true;
	orgHighQuality.subQuorum30DaysAvailability = 100;
	orgHighQuality.validators.push(...['b', 'e', 'f']);
	const orgLowQuality = new Organization('orgLowQuality', 'orgLowQuality');
	const nodeC = new Node('c');
	nodeC.name = 'c';
	nodeC.organizationId = 'orgLowQuality';
	nodeC.homeDomain = 'lowQuality.com';

	const nodeD = new Node('d');
	nodeD.name = 'd';

	const nodes: Node[] = [node, nodeB, nodeC, nodeD];
	const organizations: Organization[] = [orgHighQuality, orgLowQuality];
	const network = new Network(nodes, organizations);
	const quorumSetCoreConfiguration = new StellarCoreConfigurationGenerator(
		network
	);
	expect(quorumSetCoreConfiguration.quorumSetToToml(node.quorumSet))
		.toEqual(`[[HOME_DOMAINS]]
HOME_DOMAIN = "highQuality.com"
QUALITY = "HIGH"

[[HOME_DOMAINS]]
HOME_DOMAIN = "lowQuality.com"
QUALITY = "MEDIUM_OR_LOW"

[[VALIDATORS]]
NAME = "b"
PUBLIC_KEY = "b"
ADDRESS = "localhost:11625"
HISTORY = "curl -sf myHistory.org/{0} -o {1}"
HOME_DOMAIN = "highQuality.com"

[[VALIDATORS]]
NAME = "d"
PUBLIC_KEY = "d"
ADDRESS = "127.0.0.1:11625"
QUALITY = "MEDIUM_OR_LOW"

[[VALIDATORS]]
NAME = "c"
PUBLIC_KEY = "c"
ADDRESS = "127.0.0.1:11625"
HOME_DOMAIN = "lowQuality.com"
`);
});

test('nodesToToml', () => {
	const nodeB = new Node('b');
	nodeB.name = 'b';
	nodeB.homeDomain = 'highQuality.com';
	nodeB.organizationId = 'orgHighQuality';
	nodeB.historyUrl = 'myHistory.org/';
	const orgHighQuality = new Organization('orgHighQuality', 'orgHighQuality');
	orgHighQuality.has30DayStats = true;
	orgHighQuality.subQuorum30DaysAvailability = 100;
	orgHighQuality.validators.push(...['b', 'e', 'f']);
	const orgLowQuality = new Organization('orgLowQuality', 'orgLowQuality');
	const nodeC = new Node('c');
	nodeC.organizationId = 'orgLowQuality';
	nodeC.homeDomain = 'lowQuality.com';
	nodeC.name = 'c';
	const network = new Network([nodeB, nodeC], [orgHighQuality, orgLowQuality]);
	const quorumSetCoreConfiguration = new StellarCoreConfigurationGenerator(
		network
	);
	expect(quorumSetCoreConfiguration.nodesToToml([nodeB, nodeC]))
		.toEqual(`[[HOME_DOMAINS]]
HOME_DOMAIN = "highQuality.com"
QUALITY = "HIGH"

[[HOME_DOMAINS]]
HOME_DOMAIN = "lowQuality.com"
QUALITY = "MEDIUM_OR_LOW"

[[VALIDATORS]]
NAME = "b"
PUBLIC_KEY = "b"
ADDRESS = "127.0.0.1:11625"
HISTORY = "curl -sf myHistory.org/{0} -o {1}"
HOME_DOMAIN = "highQuality.com"

[[VALIDATORS]]
NAME = "c"
PUBLIC_KEY = "c"
ADDRESS = "127.0.0.1:11625"
HOME_DOMAIN = "lowQuality.com"
`);
});
