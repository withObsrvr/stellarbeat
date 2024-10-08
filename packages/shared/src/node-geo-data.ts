import {NodeGeoDataV1} from "./dto/node-v1";

export class NodeGeoData {
	public countryCode: string | null = null;
	public countryName: string | null = null;
	public latitude: number | null = null;
	public longitude: number | null = null;

	toJSON(): Record<string, unknown> {
		return {
			countryCode: this.countryCode,
			countryName: this.countryName,
			latitude: this.latitude,
			longitude: this.longitude
		};
	}

	static fromNodeGeoDataV1(nodeGeoDataV1: NodeGeoDataV1): NodeGeoData {
		const newNodeGeo = new NodeGeoData();
		newNodeGeo.countryCode = nodeGeoDataV1.countryCode;
		newNodeGeo.countryName = nodeGeoDataV1.countryName;
		newNodeGeo.latitude = nodeGeoDataV1.latitude;
		newNodeGeo.longitude = nodeGeoDataV1.longitude;

		return newNodeGeo;
	}
}
