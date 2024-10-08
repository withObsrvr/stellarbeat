import { Organization } from './organization';
import {OrganizationSnapshotV1} from "./dto/organization-snapshot-v1";

export class OrganizationSnapShot {
	public startDate: Date;
	public endDate: Date;
	public organization: Organization;

	constructor(startDate: Date, endDate: Date, organization: Organization) {
		this.startDate = startDate;
		this.endDate = endDate;
		this.organization = organization;
	}

	toJSON(): Record<string, unknown> {
		return {
			startDate: this.startDate,
			endDate: this.endDate,
			organization: this.organization
		};
	}

	static fromOrganizationSnapShotV1DTO(
		snapShotObject: OrganizationSnapshotV1
	): OrganizationSnapShot {
		return new OrganizationSnapShot(
				new Date(snapShotObject.startDate),
				new Date(snapShotObject.endDate),
				Organization.fromOrganizationV1DTO(snapShotObject.organization)
			);
	}
}
