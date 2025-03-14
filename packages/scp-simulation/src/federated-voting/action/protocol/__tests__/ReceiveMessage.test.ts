import { ReceiveMessage } from '../ReceiveMessage';
import { Message } from '../../../Message';
import { Vote } from '../../../protocol/Vote';
import { QuorumSet } from '../../../../core';

describe('ReceiveMessage', () => {
	const sender = 'node1';
	const receiver = 'node2';
	const statement = 'test statement';
	const quorumSet = new QuorumSet(1, ['node3'], []);
	const vote = new Vote(statement, false, sender, quorumSet);
	const message = new Message(sender, receiver, vote);

	describe('toJSON', () => {
		it('should serialize ReceiveMessage object to JSON', () => {
			const receiveMessage = new ReceiveMessage(message);
			receiveMessage.isDisrupted = true;

			const json = receiveMessage.toJSON();

			expect(json).toEqual({
				type: 'ProtocolAction',
				subType: 'ReceiveMessage',
				message: message.toJSON(),
				isDisrupted: true
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize JSON to ReceiveMessage object', () => {
			const json = {
				type: 'ProtocolAction',
				subType: 'ReceiveMessage',
				message: message.toJSON(),
				isDisrupted: true
			};

			const receiveMessage = ReceiveMessage.fromJSON(json);

			expect(receiveMessage).toBeInstanceOf(ReceiveMessage);
			expect(receiveMessage.message.sender).toBe(sender);
			expect(receiveMessage.message.receiver).toBe(receiver);
			expect(receiveMessage.message.vote.statement).toBe(statement);
			expect(receiveMessage.isDisrupted).toBe(true);
			expect(receiveMessage.publicKey).toBe(receiver);
		});
	});

	describe('serialization roundtrip', () => {
		it('should maintain all properties after serialization and deserialization', () => {
			const originalReceiveMessage = new ReceiveMessage(message);
			originalReceiveMessage.isDisrupted = true;

			const json = originalReceiveMessage.toJSON();
			const deserializedReceiveMessage = ReceiveMessage.fromJSON(json);

			expect(deserializedReceiveMessage.message.sender).toBe(
				originalReceiveMessage.message.sender
			);
			expect(deserializedReceiveMessage.message.receiver).toBe(
				originalReceiveMessage.message.receiver
			);
			expect(deserializedReceiveMessage.message.vote.statement).toBe(
				originalReceiveMessage.message.vote.statement
			);
			expect(deserializedReceiveMessage.isDisrupted).toBe(
				originalReceiveMessage.isDisrupted
			);
			expect(deserializedReceiveMessage.publicKey).toBe(
				originalReceiveMessage.publicKey
			);
		});
	});
});
