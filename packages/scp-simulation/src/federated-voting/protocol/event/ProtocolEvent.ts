import { Event } from '../../../core';

export abstract class ProtocolEvent implements Event {
	type = 'ProtocolEvent';
	abstract readonly subType: string; //to keep javascript happy and allow for instanceof checks

	constructor(public readonly publicKey: string) {}

	abstract toString(): string;
}
