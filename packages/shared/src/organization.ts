import {OrganizationId, PublicKey} from './network';
import PropertyMapper from './PropertyMapper';
import {OrganizationV1} from "./dto/organization-v1";

export function isOrganization(
	organization: Organization | undefined
): organization is Organization {
	return organization instanceof Organization;
}

export class Organization {
	readonly id: OrganizationId;
	name: string;
	dba: string | null = null;
	url: string | null = null;
	horizonUrl: string | null = null;
	logo: string | null = null;
	description: string | null = null;
	physicalAddress: string | null = null;
	phoneNumber: string | null = null;
	keybase: string | null = null;
	twitter: string | null = null;
	github: string | null = null;
	officialEmail: string | null = null;
	validators: PublicKey[] = [];
	subQuorumAvailable = false;
	has30DayStats = false;
	has24HourStats = false;
	subQuorum24HoursAvailability = 0;
	subQuorum30DaysAvailability = 0;
	public unknown = false;
	homeDomain: string | null = null; //todo: not nullable
	tomlState = 'Unknown'

	dateDiscovered?: Date;

	constructor(id: string, name: string) {
		this.id = id;
		this.name = name;
	}

	get subQuorumBlockedAt(): number {
		return this.validators.length - this.subQuorumThreshold + 1;
	}

	get subQuorumThreshold(): number {
		return Math.floor(
			this.validators.length - (this.validators.length - 1) / 2
		); //simple majority
	}

	get isTierOneOrganization(): boolean {
		if (!this.has30DayStats) return false;
		return (
			this.subQuorum30DaysAvailability >= 99 && this.validators.length >= 3
		);
	}

	public toJSON(): OrganizationV1 {
		return {
			id: this.id,
			name: this.name,
			dba: this.dba,
			url: this.url,
			horizonUrl: this.horizonUrl,
			logo: this.logo,
			description: this.description,
			physicalAddress: this.physicalAddress,
			phoneNumber: this.phoneNumber,
			keybase: this.keybase,
			twitter: this.twitter,
			github: this.github,
			officialEmail: this.officialEmail,
			validators: this.validators,
			subQuorumAvailable: this.subQuorumAvailable,
			subQuorum24HoursAvailability: this.subQuorum24HoursAvailability,
			subQuorum30DaysAvailability: this.subQuorum30DaysAvailability,
			has30DayStats: this.has30DayStats,
			has24HourStats: this.has24HourStats,
			dateDiscovered: this.dateDiscovered?.toISOString() ?? new Date().toISOString(),
			isTierOneOrganization: this.isTierOneOrganization,
			homeDomain: this.homeDomain ?? 'unknown',
			tomlState: this.tomlState
		};
	}

	static fromOrganizationV1DTO(
		organizationV1DTO: OrganizationV1
	): Organization {

		const organization = new Organization(
			organizationV1DTO.id,
			organizationV1DTO.name ?? organizationV1DTO.id
		);

		PropertyMapper.mapProperties(organizationV1DTO, organization, [
			'id',
			'name',
			'dateDiscovered',
			'isTierOneOrganization'
		]);

		organization.dateDiscovered = new Date(organizationV1DTO.dateDiscovered);

		return organization;
	}

	toString(): string {
		return `Organization (id: ${this.id}, name: ${this.name})`;
	}
}
