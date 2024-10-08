import {
	BaseQuorumSet,
	Node,
	Organization,
	QuorumSet,
	QuorumSetService,
	TrustGraph,
	TrustGraphBuilder
} from './index';
import NetworkStatistics from './network-statistics';
import { isNumber, isString } from './typeguards';
import { NodeV1 } from './dto/node-v1';
import { NetworkV1 } from './dto/network-v1';
import { OrganizationV1 } from './dto/organization-v1';

export type OrganizationId = string;
export type PublicKey = string;

export class Network {
	protected _trustGraphBuilder: TrustGraphBuilder;
	protected _nodesTrustGraph!: TrustGraph;
	//todo: move organization trust graph to network and only calculate when requested
	protected _quorumSetService: QuorumSetService;
	protected _networkStatistics: NetworkStatistics;

	public name?: string;
	public id?: string;
	public passPhrase?: string;
	public overlayMinVersion?: number;
	public overlayVersion?: number;
	public maxLedgerVersion?: number;
	public stellarCoreVersion?: string;
	public quorumSetConfiguration?: BaseQuorumSet;

	// a blocked node is a node that is participating in SCP but cannot validate because its quorumSet cannot
	// reach its threshold.
	public blockedNodes: Set<PublicKey> = new Set();

	protected nodesMap: Map<PublicKey, Node>;
	protected organizationsMap: Map<OrganizationId, Organization> = new Map();

	constructor(
		public nodes: Array<Node> = [],
		public organizations: Array<Organization> = [],
		public time: Date = new Date(),
		public latestLedger: string | null = null,
		networkStatistics?: NetworkStatistics
	) {
		this.latestLedger = latestLedger;
		this.nodes = nodes;
		this.organizations = organizations;
		this.time = time;

		this.nodesMap = this.getPublicKeyToNodeMap(nodes);
		this.initializeOrganizationsMap();
		this._quorumSetService = new QuorumSetService();
		this._trustGraphBuilder = new TrustGraphBuilder(this);
		this.initializeNodesTrustGraph();
		this.initializeBlockedNodes();

		if (networkStatistics) this._networkStatistics = networkStatistics;
		else {
			this._networkStatistics = new NetworkStatistics();
			this.updateNetworkStatistics();
		}
	}

	/*
	try to determine nodes that are blocked because of their quorumSet. They are participating in SCP, but don't reach consensus.
	There is a chance that a node has a failing quourumSet and is participating in SCP but sending invalid messages on the network.
	But this can only be solved by improving the 'participatingInSCP' detection in the crawler.
	 */
	protected initializeBlockedNodes() {
		this.blockedNodes = new Set(
			this.nodes
				.filter(
					(node) =>
						node.active &&
						node.isValidator &&
						!node.isValidating &&
						node.activeInScp &&
						!QuorumSetService.quorumSetCanReachThreshold(
							node.quorumSet,
							this,
							new Set()
						)
				)
				.map((node) => node.publicKey)
		);
	}

	get networkStatistics() {
		return this._networkStatistics;
	}

	updateNetworkStatistics(fbasAnalysisResult?: unknown) {
		this.networkStatistics.nrOfActiveWatchers = this.nodes.filter(
			(node) => !node.isValidator && node.active
		).length;
		this.networkStatistics.nrOfActiveValidators = this.nodes.filter(
			(node) => node.active && node.isValidating && !this.isNodeFailing(node)
		).length;
		this.networkStatistics.nrOfActiveFullValidators = this.nodes.filter(
			(node) => node.isFullValidator && !this.isNodeFailing(node)
		).length;
		this.networkStatistics.nrOfActiveOrganizations = this.organizations.filter(
			(organization) => organization.subQuorumAvailable
		).length;
		this.networkStatistics.transitiveQuorumSetSize =
			this.nodesTrustGraph.networkTransitiveQuorumSet.size;
		this.networkStatistics.hasTransitiveQuorumSet =
			this.nodesTrustGraph.hasNetworkTransitiveQuorumSet();

		if (fbasAnalysisResult) {
			//todo: integrate fbas analyzer wasm implementation
		}
	}

	initializeNodesTrustGraph() {
		this._nodesTrustGraph = this._trustGraphBuilder.buildGraphFromNodes(false);
	}

	initializeOrganizationsMap() {
		this.organizations.forEach((organization) =>
			this.organizationsMap.set(organization.id, organization)
		);
	}

	//call this method when the network was changed externally
	recalculateNetwork() {
		this.nodesMap = this.getPublicKeyToNodeMap(this.nodes);
		this.initializeNodesTrustGraph();
		this.initializeOrganizationsMap();

		//determine if nodes and organizations are blocked due to the changes
		this.blockedNodes = QuorumSetService.calculateBlockedNodes(
			this,
			this.nodesTrustGraph
		);
		this.updateOrganizationSubQuorumAvailabilityStates();

		this.updateNetworkStatistics();
	}

	/*
    An organization is missing if a simple majority of it's validators are missing.
     */
	isOrganizationMissing(organization: Organization) {
		return !organization.subQuorumAvailable;
	}

	/*
    An organization is failing if it is blocked or missing.
     */
	isOrganizationFailing(organization: Organization) {
		if (this.isOrganizationBlocked(organization)) return true;

		return this.isOrganizationMissing(organization);
	}

	/*
      An organization is blocked if due to simulation changes of the network, there aren't enough 'non-blocked' nodes to possibly re-enable it.
     */
	isOrganizationBlocked(organization: Organization) {
		if (organization.subQuorumAvailable) return false;

		return (
			organization.validators.filter(
				(validator) => !this.blockedNodes.has(validator)
			).length < organization.subQuorumThreshold
		);
	}

	updateOrganizationSubQuorumAvailabilityStates() {
		this.organizations.forEach((organization) => {
			const nrOfValidatingNodes = organization.validators
				.map((validator) => this.getNodeByPublicKey(validator))
				.filter((validator) => !this.isNodeFailing(validator)).length;

			if (nrOfValidatingNodes - organization.subQuorumThreshold < 0)
				organization.subQuorumAvailable = false;
			else organization.subQuorumAvailable = true;
		});
	}

	isQuorumSetBlocked(node: Node, innerQuorumSet?: QuorumSet) {
		//todo should pass graphQuorumSet
		let quorumSet = innerQuorumSet;
		if (quorumSet === undefined) {
			quorumSet = node.quorumSet;
		}

		return !QuorumSetService.quorumSetCanReachThreshold(
			quorumSet,
			this,
			this.blockedNodes
		);
	}

	getNodeByPublicKey(publicKey: PublicKey): Node {
		if (this.nodesMap.has(publicKey))
			return this.nodesMap.get(publicKey) as Node;
		else {
			const unknownNode = new Node(publicKey);
			unknownNode.unknown = true;

			return unknownNode;
		}
	}

	getOrganizationById(id: OrganizationId): Organization {
		if (this.organizationsMap.has(id))
			return this.organizationsMap.get(id) as Organization;
		else {
			const unknownOrganization = new Organization(id, id);
			unknownOrganization.unknown = true;

			return unknownOrganization;
		}
	}

	get nodesTrustGraph() {
		return this._nodesTrustGraph;
	}

	/*
	 * Get nodes that have the given node in their quorumSet
	 */
	getTrustingNodes(node: Node): Node[] {
		const vertex = this._nodesTrustGraph.getVertex(node.publicKey);
		if (!vertex) {
			return [];
		}

		return Array.from(this._nodesTrustGraph.getParents(vertex)).map((vertex) =>
			this.getNodeByPublicKey(vertex.key)
		);
	}

	//todo => get data from organizationTrustGraph
	getTrustedOrganizations(quorumSet: QuorumSet): Organization[] {
		const trustedOrganizations: Organization[] = [];
		quorumSet.innerQuorumSets.forEach((innerQSet) => {
			if (innerQSet.validators.length === 0) {
				return;
			}
			const organizationId = this.getNodeByPublicKey(
				innerQSet.validators[0]
			).organizationId;
			if (
				organizationId === null ||
				this.getOrganizationById(organizationId) === undefined
			) {
				return;
			}

			if (
				!innerQSet.validators
					.map((validator) => this.getNodeByPublicKey(validator))
					.every(
						(validator, index, validators) =>
							validator.organizationId === validators[0].organizationId
					)
			) {
				return;
			}

			trustedOrganizations.push(this.getOrganizationById(organizationId));
			trustedOrganizations.push(...this.getTrustedOrganizations(innerQSet));
		});

		return trustedOrganizations;
	}

	protected getPublicKeyToNodeMap(nodes: Node[]): Map<string, Node> {
		return new Map(
			nodes
				.filter((node) => node.publicKey)
				.map((node) => [node.publicKey, node])
		);
	}

	getTrustedOrganizationsByOrganization(organization: Organization) {
		const trustedOrganizations: Organization[] = [];
		organization.validators.forEach((publicKey) => {
			const validator = this.getNodeByPublicKey(publicKey);
			this.getTrustedOrganizations(validator.quorumSet).forEach((org) => {
				if (org.id !== organization.id) trustedOrganizations.push(org);
			});
		});
		return Array.from(new Set(trustedOrganizations)); //remove doubles
	}

	/**
	 * A node can fail for various reasons. See Fig. 5.   Venn diagram of node failures of the original SCP paper.
	 * When a node is missing we mark it as failed.
	 * If we modify the network for simulation purposes, we mark validators that are blocked as failed.
	 */
	isNodeFailing(node: Node): boolean {
		//if a node is blocked, we mark it as failed for simulation purposes
		if (this.blockedNodes.has(node.publicKey)) return true;

		if (!node.isValidator)
			//watchers are marked missing when we cannot connect to them
			return !node.active;

		return !node.isValidating;
	}

	/*
    Everytime the network is modified for simulation purposes we check if validators can reach their quorumSet thresholds.
    If not we mark them as 'blocked'.
     */
	isValidatorBlocked(validator: Node): boolean {
		return this.blockedNodes.has(validator.publicKey);
	}

	someNodesHaveWarnings(nodes: Node[]): boolean {
		return nodes.some((node) => this.nodeHasWarnings(node));
	}

	nodeHasWarnings(node: Node): boolean {
		return (
			this.isFullValidatorWithOutOfDateArchive(node) ||
			this.historyArchiveHasError(node)
		);
	}

	getNodeWarningReasons(node: Node): string {
		if (this.historyArchiveHasError(node)) {
			return 'History archive issue detected';
		}

		if (this.isFullValidatorWithOutOfDateArchive(node))
			return 'History archive not up-to-date';

		return 'None';
	}

	isFullValidatorWithOutOfDateArchive(node: Node): boolean {
		return node.historyUrl !== null && !node.isFullValidator;
	}

	historyArchiveHasError(node: Node): boolean {
		return node.historyUrl !== null && node.historyArchiveHasError;
	}

	getNodeFailingReason(node: Node): { label: string; description: string } {
		if (!node.active && !node.isValidator)
			return {
				label: 'Failing',
				description: 'Unable to connect to node during latest crawl'
			};

		if (node.isValidator && !node.quorumSet.hasValidators())
			return {
				label: 'Failing',
				description: 'Quorum set not yet detected by crawler'
			};

		if (node.isValidator && this.isValidatorBlocked(node))
			return {
				label: 'Blocked',
				description: 'Quorum set not reaching threshold'
			};

		if (this.isNodeFailing(node))
			return {
				label: 'Failing',
				description: 'Not validating in latest consensus rounds'
			};

		return {
			label: 'Live',
			description: 'Live'
		};
	}

	static fromJSON(networkV1DTO: NetworkV1): Network {
		const nodes: Node[] = networkV1DTO.nodes.map((node: NodeV1) =>
			Node.fromNodeV1DTO(node)
		);

		const organizations: Organization[] = networkV1DTO.organizations.map(
			(organizationDTO: OrganizationV1) =>
				Organization.fromOrganizationV1DTO(organizationDTO)
		);

		const networkStatistics = NetworkStatistics.fromJSON(
			networkV1DTO.statistics
		);

		const time = new Date(networkV1DTO.time);

		const network = new Network(
			nodes,
			organizations,
			time,
			networkV1DTO.latestLedger,
			networkStatistics
		);

		network.id = networkV1DTO.id;
		network.name = networkV1DTO.name;
		network.passPhrase = networkV1DTO.passPhrase;

		if (isNumber(networkV1DTO.maxLedgerVersion))
			network.maxLedgerVersion = networkV1DTO.maxLedgerVersion;
		if (isNumber(networkV1DTO.overlayMinVersion))
			network.overlayMinVersion = networkV1DTO.overlayMinVersion;
		if (isNumber(networkV1DTO.overlayVersion))
			network.overlayVersion = networkV1DTO.overlayVersion;
		if (isString(networkV1DTO.stellarCoreVersion))
			network.stellarCoreVersion = networkV1DTO.stellarCoreVersion;
		if (networkV1DTO.quorumSetConfiguration)
			network.quorumSetConfiguration = networkV1DTO.quorumSetConfiguration;

		return network;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			name: this.name,
			time: this.time,
			latestLedger: this.latestLedger,
			transitiveQuorumSet: Array.from(
				this.nodesTrustGraph.networkTransitiveQuorumSet
			),
			scc: this.nodesTrustGraph.stronglyConnectedComponents
				.filter((scp) => scp.size > 1)
				.map((scp) => Array.from(scp)),
			nodes: this.nodes,
			organizations: this.organizations,
			statistics: this.networkStatistics
		};
	}
}
