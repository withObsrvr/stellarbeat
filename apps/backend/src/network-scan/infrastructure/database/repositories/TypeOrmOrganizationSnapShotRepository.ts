import { Equal, LessThanOrEqual, Repository } from 'typeorm';
import OrganizationSnapShot from '../../../domain/organization/OrganizationSnapShot';
import { injectable } from 'inversify';
import { OrganizationSnapShotRepository } from '../../../domain/organization/OrganizationSnapShotRepository';
import { OrganizationId } from '../../../domain/organization/OrganizationId';

@injectable()
export default class TypeOrmOrganizationSnapShotRepository
	implements OrganizationSnapShotRepository
{
	constructor(private baseRepository: Repository<OrganizationSnapShot>) {}

	async findLatestByOrganizationId(
		organizationId: OrganizationId,
		at: Date = new Date()
	) {
		return await this.baseRepository.find({
			relations: ['_organization'],
			where: [
				{
					_organization: {
						organizationId: {
							value: Equal(organizationId.value)
						}
					},
					startDate: LessThanOrEqual(at)
				}
			],
			take: 10,
			order: {
				endDate: 'DESC'
			}
		});
	}

	/**
	 * If performance degrades because of too many rows,
	 * (which is unlikely because of indexes and nature of table),
	 * we could limit the subquery to latest x months
	 *  or we could write a permant raw subquery.
	 */
	async findLatest(at: Date = new Date()) {
		const subQuery = this.baseRepository
			.createQueryBuilder('sub')
			.select('MAX(sub.id)', 'id')
			.where('sub.startDate <= :at', { at })
			.groupBy('sub."OrganizationId"');

		return await this.baseRepository
			.createQueryBuilder('snapshot')
			.innerJoinAndSelect('snapshot._organization', 'organization')
			.where('snapshot.id IN (' + subQuery.getQuery() + ')')
			.setParameters({ at })
			.orderBy('snapshot.startDate', 'DESC')
			.take(10)
			.getMany();
	}
}
