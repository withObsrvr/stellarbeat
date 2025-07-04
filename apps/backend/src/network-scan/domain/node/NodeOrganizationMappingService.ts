import { inject, injectable } from 'inversify';
import { NETWORK_TYPES } from '../../infrastructure/di/di-types';
import { OrganizationRepository } from '../organization/OrganizationRepository';
import Node from './Node';
import { OrganizationId } from '../organization/OrganizationId';

@injectable()
export class NodeOrganizationMappingService {
	constructor(
		@inject(NETWORK_TYPES.OrganizationRepository)
		private organizationRepository: OrganizationRepository
	) {}

	async mapNodesToOrganizations(nodes: Node[]): Promise<Map<string, OrganizationId | null>> {
		const organizations = await this.organizationRepository.findActive();
		const nodeOrganizationMap = new Map<string, OrganizationId | null>();

		for (const node of nodes) {
			const organization = organizations.find(org => 
				org.validators.contains(node.publicKey)
			);
			
			nodeOrganizationMap.set(
				node.publicKey.value,
				organization ? organization.organizationId : null
			);
		}

		return nodeOrganizationMap;
	}
}