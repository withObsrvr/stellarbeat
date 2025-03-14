import { ForgeMessage } from '../ForgeMessage';
import { Message } from '../../../Message';
import { Vote } from '../../../protocol/Vote';
import { mock, MockProxy } from 'jest-mock-extended';

describe('ForgeMessage', () => {
	let vote: MockProxy<Vote>;
	let message: Message;
	let forgeMessage: ForgeMessage;

	beforeEach(() => {
		vote = mock<Vote>();
		vote.toJSON.mockReturnValue({ voteType: 'mockVote', value: 'testValue' });
		message = new Message('sender1', 'receiver1', vote);
		message.toJSON = jest.fn().mockReturnValue({
			sender: 'sender1',
			receiver: 'receiver1',
			vote: { voteType: 'mockVote', value: 'testValue' }
		});
		forgeMessage = new ForgeMessage(message);
	});

	describe('toJSON', () => {
		it('should correctly serialize the ForgeMessage to JSON', () => {
			const json = forgeMessage.toJSON();

			expect(json).toEqual({
				type: 'UserAction',
				subType: 'ForgeMessage',
				message: {
					sender: 'sender1',
					receiver: 'receiver1',
					vote: { voteType: 'mockVote', value: 'testValue' }
				}
			});
			expect(message.toJSON).toHaveBeenCalledTimes(1);
		});
	});

	describe('fromJSON', () => {
		it('should correctly deserialize from JSON to ForgeMessage', () => {
			// Mock the Message.fromJSON static method
			const mockMessage = new Message('sender1', 'receiver1', vote);
			const originalFromJSON = Message.fromJSON;
			Message.fromJSON = jest.fn().mockReturnValue(mockMessage);

			const json = {
				type: 'UserAction',
				subType: 'ForgeMessage',
				message: {
					sender: 'sender1',
					receiver: 'receiver1',
					vote: { voteType: 'mockVote', value: 'testValue' }
				}
			};

			const action = ForgeMessage.fromJSON(json);

			expect(action).toBeInstanceOf(ForgeMessage);
			expect(Message.fromJSON).toHaveBeenCalledWith(json.message);
			expect(action.message).toBe(mockMessage);

			// Restore original method
			Message.fromJSON = originalFromJSON;
		});
	});

	describe('serialization roundtrip', () => {
		it('should maintain data integrity through serialization and deserialization', () => {
			// Setup
			const mockMessage = new Message('sender1', 'receiver1', vote);
			const originalAction = new ForgeMessage(mockMessage);

			// Mock Message.fromJSON to return our mock message
			const originalFromJSON = Message.fromJSON;
			Message.fromJSON = jest.fn().mockReturnValue(mockMessage);

			// Execute roundtrip
			const json = originalAction.toJSON();
			const deserializedAction = ForgeMessage.fromJSON(json);

			// Verify
			expect(deserializedAction.message).toBe(mockMessage);
			expect(deserializedAction.publicKey).toBe(originalAction.publicKey);

			// Restore original method
			Message.fromJSON = originalFromJSON;
		});
	});
});
