import { FederatedVotingContext } from './../FederatedVotingContext';
import { mock, MockProxy } from 'jest-mock-extended';
import { FederatedVotingProtocol } from './../protocol/FederatedVotingProtocol';
import { FederatedVotingState } from './../protocol/FederatedVotingState';
import { Statement, Node, QuorumSet } from '../../';
import { ProtocolAction } from '../../core';
import { Message } from '../Message';
import { BroadcastVoteRequested } from './../protocol/event/BroadcastVoteRequested';
import { Vote, Voted } from '../protocol';
import { SendMessage } from '../action/protocol/SendMessage';

describe('FederatedVotingContext', () => {
	let mockFederatedVotingProtocol: MockProxy<FederatedVotingProtocol>;
	let context: FederatedVotingContext;
	let state: FederatedVotingState;

	beforeEach(() => {
		mockFederatedVotingProtocol = mock<FederatedVotingProtocol>();
		context = new FederatedVotingContext(mockFederatedVotingProtocol);
		state = new FederatedVotingState(
			new Node('V1', new QuorumSet(1, ['Q'], []))
		);
		jest.resetAllMocks();
		mockFederatedVotingProtocol.drainEvents.mockReturnValue([]);
		context.reset();
	});

	describe('reset', () => {
		it('should reset the context', () => {
			context.addNode(state);
			const mockStatement = mock<Statement>();
			context.vote(state.node.publicKey, mockStatement);
			context.sendMessage(
				new Message('sender', state.node.publicKey, mock<Vote>())
			);

			context.reset();

			expect(context.nodes.length).toBe(0);
			expect(context.drainEvents()).toEqual([]);
		});
	});

	describe('addNode', () => {
		it('should add a node', () => {
			context.addNode(state);
			expect(context.nodes).toHaveLength(1);
			expect(context.nodes[0]).toEqual(state.node);
		});

		it('should not add a node if the public key already exists', () => {
			context.addNode(state);
			const duplicateState = new FederatedVotingState(
				new Node('V1', new QuorumSet(1, ['Q'], []))
			);

			context.addNode(duplicateState);

			expect(context.nodes).toHaveLength(1);
			expect(context.nodes[0]).toEqual(state.node);
		});
	});

	describe('vote', () => {
		it('should vote if the node exists', () => {
			context.addNode(state);
			const mockStatement = mock<Statement>();
			mockFederatedVotingProtocol.drainEvents.mockReturnValue([
				new Voted(state.node.publicKey, mock<Vote>())
			]);

			const actions = context.vote(state.node.publicKey, mockStatement);

			expect(mockFederatedVotingProtocol.vote).toHaveBeenCalledWith(
				mockStatement,
				state
			);
			expect(mockFederatedVotingProtocol.drainEvents).toHaveBeenCalled();
			expect(actions).toHaveLength(0);
		});

		it('should not vote if the node does not exist', () => {
			const mockStatement = mock<Statement>();
			const actions = context.vote(state.node.publicKey, mockStatement);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.vote).not.toHaveBeenCalled();
		});

		it('should not allow a node to vote again if it has already voted', () => {
			context.addNode(state);
			state.voted = mock<Vote>();
			const mockStatement = mock<Statement>();

			const actions = context.vote(state.node.publicKey, mockStatement);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.vote).not.toHaveBeenCalled();
		});
	});

	describe('broadcast requests', () => {
		it('should process broadcast requests correctly', () => {
			const broadcastEvent = new BroadcastVoteRequested(
				state.node.publicKey,
				mock<Vote>()
			);
			mockFederatedVotingProtocol.drainEvents.mockReturnValue([broadcastEvent]);

			context.addNode(state);
			const actions = context.vote(state.node.publicKey, mock<Statement>());

			expect(actions).toHaveLength(1);
			expect(actions[0]).toBeInstanceOf(ProtocolAction);
		});
	});

	describe('canVote', () => {
		it('should return true if node can vote', () => {
			context.addNode(state);
			state.voted = null;

			const result = context.canVote(state.node.publicKey);

			expect(result).toBe(true);
		});

		it('should return false if node does not exist', () => {
			const result = context.canVote('nonexistent');

			expect(result).toBe(false);
		});

		it('should return false if node has already voted', () => {
			context.addNode(state);
			state.voted = mock<Vote>();

			const result = context.canVote(state.node.publicKey);

			expect(result).toBe(false);
		});
	});

	describe('sendMessage', () => {
		it('should send a message and deliver it', () => {
			context.addNode(state);
			const message = new Message('sender', state.node.publicKey, mock<Vote>());

			const actions = context.sendMessage(message);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.processVote).toHaveBeenCalledWith(
				message.vote,
				state
			);
		});

		it('should process delivered messages and handle new broadcast events', () => {
			context.addNode(state);
			const message = new Message('sender', state.node.publicKey, mock<Vote>());

			mockFederatedVotingProtocol.drainEvents.mockReturnValue([
				new BroadcastVoteRequested(state.node.publicKey, message.vote)
			]);

			const actions = context.sendMessage(message);

			expect(actions).toHaveLength(1);
			expect(actions[0]).toBeInstanceOf(SendMessage);

			expect(mockFederatedVotingProtocol.processVote).toHaveBeenCalledTimes(1);
		});

		it('should not process message if recipient node does not exist', () => {
			context.addNode(state);
			const message = new Message('sender', 'nonexistent', mock<Vote>());

			const actions = context.sendMessage(message);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.processVote).not.toHaveBeenCalled();
		});
	});

	describe('nodes', () => {
		it('should return all nodes', () => {
			context.addNode(state);
			const nodes = context.nodes;

			expect(nodes).toHaveLength(1);
			expect(nodes[0]).toEqual(state.node);
		});
	});

	describe('publicKeysWithQuorumSets', () => {
		it('should return public keys with quorum sets', () => {
			context.addNode(state);

			const result = context.publicKeysWithQuorumSets;

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				publicKey: state.node.publicKey,
				quorumSet: state.node.quorumSet
			});
		});
	});

	describe('connections', () => {
		it('should return empty connections for a single node', () => {
			context.addNode(state);

			const result = context.connections;

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				publicKey: 'V1',
				connections: []
			});
		});

		it('should correctly compute connections between multiple nodes', () => {
			const state2 = new FederatedVotingState(
				new Node('V2', new QuorumSet(1, ['Q'], []))
			);
			const state3 = new FederatedVotingState(
				new Node('V3', new QuorumSet(1, ['Q'], []))
			);
			context.addNode(state);
			context.addNode(state2);
			context.addNode(state3);

			const result = context.connections;

			expect(result).toHaveLength(3);
			expect(result).toContainEqual({
				publicKey: 'V1',
				connections: ['V2', 'V3']
			});
			expect(result).toContainEqual({
				publicKey: 'V2',
				connections: ['V1', 'V3']
			});
			expect(result).toContainEqual({
				publicKey: 'V3',
				connections: ['V1', 'V2']
			});
		});
	});
});
