//fix for JSONSchemaType not correctly inferring nullable types, could be fixed in v9
export const nullable = <T>(input: T): T => {
    return {
        ...input,
        nullable: true
    } as T;
}