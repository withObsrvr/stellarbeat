import { Event } from '../../core/Event';

export class NodeAdded implements Event {
	type = 'node-added';

	constructor(public publicKey: string) {}

	toString(): string {
		return `Node added: ${this.publicKey}`;
	}
}
