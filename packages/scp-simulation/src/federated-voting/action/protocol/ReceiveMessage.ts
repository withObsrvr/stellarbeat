import { Message } from '../../Message';
import { Context, ProtocolAction } from '../../../core';

export class ReceiveMessage extends ProtocolAction {
	subType = 'ReceiveMessage';
	readonly publicKey: string;

	constructor(public readonly message: Message) {
		super();
		this.publicKey = message.receiver;
	}

	execute(context: Context): ProtocolAction[] {
		return context.receiveMessage(this.message, this.isDisrupted);
	}

	toString(): string {
		return `${this.message.toString()}`;
	}

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			message: this.message.toJSON(),
			isDisrupted: this.isDisrupted
		};
	}

	static fromJSON(json: any): ReceiveMessage {
		const message = Message.fromJSON(json.message);
		const receiveMessage = new ReceiveMessage(message);
		receiveMessage.isDisrupted = json.isDisrupted;
		return receiveMessage;
	}
}
