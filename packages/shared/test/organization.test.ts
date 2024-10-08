import { Organization } from '../src';
import Ajv from "ajv";
import * as addFormats from "ajv-formats";
import {OrganizationV1Schema} from "../src/dto/organization-v1";

describe('json', () => {
	const dateDiscovered = new Date();
	const organization = new Organization('1', 'Organization Name');
	organization.homeDomain = 'homeDomain.com';
	organization.dba = 'Organization DBA';
	organization.url = 'https://www.domain.com';
	organization.logo = 'https://www.domain.com/awesomelogo.jpg';
	organization.description = 'Description of issuer';
	organization.physicalAddress =
		'123 Sesame Street, New York, NY 12345, United States';
	organization.phoneNumber = '1 (123)-456-7890';
	organization.keybase = 'accountname';
	organization.twitter = 'orgtweet';
	organization.github = 'orgcode';
	organization.officialEmail = 'support@domain.com';
	organization.validators.push('GA');
	organization.subQuorum24HoursAvailability = 30;
	organization.subQuorum30DaysAvailability = 40.9;
	organization.has24HourStats = false;
	organization.has30DayStats = false;
	organization.subQuorumAvailable = false;
	organization.dateDiscovered = dateDiscovered;

	const organizationObject: Record<string, unknown> = {};
	organizationObject.name = 'Organization Name';
	organizationObject.dba = 'Organization DBA';
	organizationObject.url = 'https://www.domain.com';
	organizationObject.logo = 'https://www.domain.com/awesomelogo.jpg';
	organizationObject.description = 'Description of issuer';
	organizationObject.physicalAddress =
		'123 Sesame Street, New York, NY 12345, United States';
	organizationObject.phoneNumber = '1 (123)-456-7890';
	organizationObject.keybase = 'accountname';
	organizationObject.twitter = 'orgtweet';
	organizationObject.github = 'orgcode';
	organizationObject.officialEmail = 'support@domain.com';
	organizationObject.validators = ['GA'];
	organizationObject.id = '1';
	organizationObject.subQuorum24HoursAvailability = 30;
	organizationObject.subQuorum30DaysAvailability = 40.9;
	organizationObject.isTierOneOrganization = false;
	organizationObject.has24HourStats = false;
	organizationObject.has30DayStats = false;
	organizationObject.subQuorumAvailable = false;
	organizationObject.homeDomain = 'homeDomain.com';
	organizationObject.horizonUrl = null;
	organizationObject.dateDiscovered = dateDiscovered.toISOString();
	organizationObject.tomlState = 'Unknown'


	test('OrgToJson', () => {
		expect(JSON.parse(JSON.stringify(organization))).toEqual(
			organizationObject
		);
	});
	test('JsonToOrg', () => {
		const ajv = new Ajv();
		addFormats.default(ajv);
		const validate  = ajv.compile(OrganizationV1Schema);
		const valid = validate(organizationObject);
		expect(valid).toBeTruthy();
		if (!valid) {
			return
		}
		expect(Organization.fromOrganizationV1DTO(organizationObject)).toEqual(
			organization
		);
	});
});

describe('subquorum', () => {
	const organization = new Organization('1', 'me');
	organization.validators.push(...['1', '2', '3', '4']);
	test('threshold', () => {
		expect(organization.subQuorumThreshold).toEqual(2);
	});
	test('failAt', () => {
		expect(organization.subQuorumBlockedAt).toEqual(3);
	});
});

describe('tierOne', () => {
	test('true', () => {
		const organization = new Organization('1', 'me');
		organization.has30DayStats = true;
		organization.subQuorum30DaysAvailability = 99.5;
		organization.validators.push(...['1', '2', '3']);

		expect(organization.isTierOneOrganization).toBeTruthy();
	});

	test('not enough validators', () => {
		const organization = new Organization('1', 'me');
		organization.has30DayStats = true;
		organization.subQuorum30DaysAvailability = 99.5;
		organization.validators.push(...['1', '2']);

		expect(organization.isTierOneOrganization).toBeFalsy();
	});

	test('not enough measurements', () => {
		const organization = new Organization('1', 'me');
		organization.has30DayStats = false;
		organization.subQuorum30DaysAvailability = 99.5;
		organization.validators.push(...['1', '2', '3']);

		expect(organization.isTierOneOrganization).toBeFalsy();
	});

	test('availability too low', () => {
		const organization = new Organization('1', 'me');
		organization.has30DayStats = true;
		organization.subQuorum30DaysAvailability = 98;
		organization.validators.push(...['1', '2', '3']);

		expect(organization.isTierOneOrganization).toBeFalsy();
	});
});
