import { Event } from './Event';

/**
 * Simple event collector that can be used to collect events from multiple domain sources
 * and then drain them to be processed by a single event handler.
 *
 * This works because no real time constraints are placed on the events. This is just a simulation and events need only to be processed when the
 * domain logic is complete.
 */
export class InMemoryEventCollector implements EventCollector {
	private events: Event[];
	constructor() {
		this.events = [];
	}

	protected registerEvent(event: Event): void {
		this.events.push(event);
	}

	protected registerEvents(events: Event[]): void {
		this.events.push(...events);
	}

	public drainEvents(): Event[] {
		const events = this.events;
		this.events = [];
		return events;
	}

	public getEvents(): Event[] {
		return this.events;
	}
}

export interface EventCollector {
	drainEvents(): Event[];
}
