import { Event } from '../../core';

export abstract class OverlayEvent implements Event {
	type = 'OverlayEvent';

	abstract readonly subType: string; //to keep javascript happy and allow for instanceof checks

	constructor(public readonly publicKey: string) {}

	abstract toString(): string;
}
