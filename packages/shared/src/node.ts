import { NodeGeoData } from './node-geo-data';
import { NodeStatistics } from './node-statistics';
import { QuorumSet } from './quorum-set';
import { NodeV1 } from './dto/node-v1';
import PropertyMapper from './PropertyMapper';

export class Node {
	public ip: string;
	public port: number;
	public publicKey: string;
	public name: string | null = null;
	public host: string | null = null;
	public ledgerVersion: number | null = null;
	public overlayVersion: number | null = null;
	public overlayMinVersion: number | null = null;
	public versionStr: string | null = null;
	public quorumSet: QuorumSet = new QuorumSet();
	public quorumSetHashKey: string | null = null;
	public active = false;
	public activeInScp = false;
	public geoData: NodeGeoData = new NodeGeoData();
	public statistics: NodeStatistics = new NodeStatistics();
	public dateDiscovered: Date = new Date();
	public dateUpdated: Date = new Date();
	public overLoaded = false;
	public isFullValidator = false;
	public isValidating = false;
	public homeDomain: string | null = null;
	public index = 0.0;
	public historyUrl: string | null = null;
	public alias: string | null = null;
	public isp: string | null = null;
	public organizationId: string | null = null;
	public unknown = false; //a node is unknown if it is not crawled or maybe archived
	public historyArchiveHasError = false;
	public connectivityError = false;
	public stellarCoreVersionBehind = false;
	public lag: number | null = null;
	public trustCentralityScore: number = 0;
	public pageRankScore: number = 0;
	public trustRank: number = 0;
	public lastTrustCalculation: Date | null = null;

	constructor(publicKey: string, ip = '127.0.0.1', port = 11625) {
		this.ip = ip;
		this.port = port;
		this.publicKey = publicKey;
	}

	get displayName() {
		if (this.name) {
			return this.name;
		}

		if (this.publicKey)
			return (
				this.publicKey.substring(0, 10) +
				'...' +
				this.publicKey.substring(50, 150)
			);

		return '';
	}

	get key() {
		return this.ip + ':' + this.port;
	}

	get isValidator(): boolean {
		return this.isValidating || this.quorumSet.hasValidators();
	}

	toJSON(): NodeV1 {
		return {
			ip: this.ip,
			port: this.port,
			host: this.host,
			publicKey: this.publicKey,
			name: this.name,
			ledgerVersion: this.ledgerVersion,
			overlayVersion: this.overlayVersion,
			overlayMinVersion: this.overlayMinVersion,
			versionStr: this.versionStr,
			active: this.active,
			activeInScp: this.activeInScp,
			overLoaded: this.overLoaded,
			quorumSet: this.quorumSet,
			quorumSetHashKey: this.quorumSetHashKey,
			geoData: this.geoData,
			statistics: this.statistics,
			dateDiscovered: this.dateDiscovered.toISOString(),
			dateUpdated: this.dateUpdated.toISOString(),
			isFullValidator: this.isFullValidator,
			isValidating: this.isValidating,
			isValidator: this.isValidator,
			index: this.index,
			homeDomain: this.homeDomain,
			organizationId: this.organizationId,
			historyUrl: this.historyUrl,
			alias: this.alias,
			isp: this.isp,
			historyArchiveHasError: this.historyArchiveHasError,
			connectivityError: this.connectivityError,
			stellarCoreVersionBehind: this.stellarCoreVersionBehind,
			lag: this.lag,
			trustCentralityScore: this.trustCentralityScore,
			pageRankScore: this.pageRankScore,
			trustRank: this.trustRank,
			lastTrustCalculation: this.lastTrustCalculation?.toISOString() || null
		};
	}

	toString() {
		return `Node (key: ${this.key}, publicKey: ${this.publicKey})`;
	}

	static fromNodeV1DTO(nodeV1DTO: NodeV1): Node {
		const node = new Node(nodeV1DTO.publicKey);

		if (nodeV1DTO.geoData !== null)
			node.geoData = NodeGeoData.fromNodeGeoDataV1(nodeV1DTO.geoData);

		if (nodeV1DTO.statistics !== null)
			node.statistics = NodeStatistics.fromNodeStatisticsV1(
				nodeV1DTO.statistics
			);

		if (nodeV1DTO.quorumSet !== null)
			node.quorumSet = QuorumSet.fromBaseQuorumSet(nodeV1DTO.quorumSet);

		PropertyMapper.mapProperties(nodeV1DTO, node, [
			'publicKey',
			'isValidator',
			'geoData',
			'quorumSet',
			'statistics',
			'dateDiscovered',
			'dateUpdated',
			'lastTrustCalculation',
			'trustCentralityScore',
			'pageRankScore',
			'trustRank'
		]);

		node.dateDiscovered = new Date(nodeV1DTO.dateDiscovered);
		node.dateUpdated = new Date(nodeV1DTO.dateUpdated);
		
		// Convert trust scores from strings to numbers (API returns strings for decimal values)
		node.trustCentralityScore = typeof nodeV1DTO.trustCentralityScore === 'string' 
			? parseFloat(nodeV1DTO.trustCentralityScore) || 0 
			: nodeV1DTO.trustCentralityScore || 0;
		node.pageRankScore = typeof nodeV1DTO.pageRankScore === 'string' 
			? parseFloat(nodeV1DTO.pageRankScore) || 0 
			: nodeV1DTO.pageRankScore || 0;
		node.trustRank = typeof nodeV1DTO.trustRank === 'string' 
			? parseInt(nodeV1DTO.trustRank) || 0 
			: nodeV1DTO.trustRank || 0;
		
		if (nodeV1DTO.lastTrustCalculation) {
			node.lastTrustCalculation = new Date(nodeV1DTO.lastTrustCalculation);
		}

		return node;
	}
}
