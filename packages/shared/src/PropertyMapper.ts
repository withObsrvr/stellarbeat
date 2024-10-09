export default class PropertyMapper {
	static mapProperties(
		dto: any,
		domainObject: any,
		propertiesToSkip: string[]
	) {
		for (const [key] of Object.entries(dto)) {
			if (!propertiesToSkip.includes(key)) {
				PropertyMapper.mapProperty(key, dto, domainObject);
			}
		}
	}

	static mapProperty(property: string, dto: any, domainObject: any) {
		if (dto[property] === undefined) return;

		domainObject[property] = dto[property];
	}
}
