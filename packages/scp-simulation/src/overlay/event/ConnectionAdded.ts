import { Event } from '../../core/Event';

export class ConnectionAdded implements Event {
	type = 'connection-added';

	constructor(public publicKey: string, public connection: string) {}

	toString(): string {
		return `Connection added: ${this.publicKey} -> ${this.connection}`;
	}
}
