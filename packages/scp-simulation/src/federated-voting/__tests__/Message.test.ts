import { Message } from '../Message';
import { Vote } from '../protocol/Vote';
import { mock, MockProxy } from 'jest-mock-extended';

describe('Message', () => {
	let vote: MockProxy<Vote>;
	let message: Message;

	beforeEach(() => {
		vote = mock<Vote>();
		vote.toJSON.mockReturnValue({ voteType: 'mockVote', value: 'testValue' });
		Vote.fromJSON = jest.fn().mockReturnValue(vote);
		message = new Message('sender1', 'receiver1', vote);
	});

	describe('toJSON', () => {
		it('should correctly serialize the Message to JSON', () => {
			const json = message.toJSON();

			expect(json).toEqual({
				sender: 'sender1',
				receiver: 'receiver1',
				vote: { voteType: 'mockVote', value: 'testValue' }
			});
			expect(vote.toJSON).toHaveBeenCalledTimes(1);
		});
	});

	describe('fromJSON', () => {
		it('should correctly deserialize from JSON to Message', () => {
			const json = {
				sender: 'sender1',
				receiver: 'receiver1',
				vote: { voteType: 'mockVote', value: 'testValue' }
			};

			const deserializedMessage = Message.fromJSON(json);

			expect(deserializedMessage.sender).toBe('sender1');
			expect(deserializedMessage.receiver).toBe('receiver1');
			expect(Vote.fromJSON).toHaveBeenCalledWith(json.vote);
		});
	});

	describe('serialization roundtrip', () => {
		it('should maintain data integrity through serialization and deserialization', () => {
			const json = message.toJSON();
			const deserializedMessage = Message.fromJSON(json);

			expect(deserializedMessage.sender).toBe(message.sender);
			expect(deserializedMessage.receiver).toBe(message.receiver);
			// Vote is mocked, so we're just checking it was processed correctly
		});
	});
});
