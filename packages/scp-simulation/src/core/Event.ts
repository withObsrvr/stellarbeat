//Encodes what has happened. For example a vote has been casted, a message has been sent, a node has been added, etc.
export interface Event {
	type: string;
	toString(): string;
}
