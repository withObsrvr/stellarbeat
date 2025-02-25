import { FederatedVotingContext } from './../FederatedVotingContext';
import { mock, MockProxy } from 'jest-mock-extended';
import { FederatedVotingProtocol } from './../protocol/FederatedVotingProtocol';
import { Statement, Node, QuorumSet } from '../../';
import { ProtocolAction, UserAction } from '../../core';
import { Message } from '../Message';
import { BroadcastVoteRequested } from './../protocol/event/BroadcastVoteRequested';
import { Vote, Voted } from '../protocol';
import { SendMessage } from '../action/protocol/SendMessage';
import { ReceiveMessage } from '../action/protocol/ReceiveMessage';
import { UpdateQuorumSet } from '../action/user/UpdateQuorumSet';

describe('FederatedVotingContext', () => {
	let mockFederatedVotingProtocol: MockProxy<FederatedVotingProtocol>;
	let context: FederatedVotingContext;
	let node: Node;

	beforeEach(() => {
		mockFederatedVotingProtocol = mock<FederatedVotingProtocol>();
		context = new FederatedVotingContext(mockFederatedVotingProtocol);
		node = new Node('V1', new QuorumSet(1, ['Q'], []));
		jest.resetAllMocks();
		mockFederatedVotingProtocol.drainEvents.mockReturnValue([]);
		context.reset();
	});

	describe('reset', () => {
		it('should reset the context', () => {
			context.addNode(node);
			const mockStatement = mock<Statement>();
			context.vote(node.publicKey, mockStatement);
			context.sendMessage(new Message('sender', node.publicKey, mock<Vote>()));

			context.reset();

			expect(context.nodes.length).toBe(0);
			expect(context.drainEvents()).toEqual([]);
		});
	});

	describe('executeActions', () => {
		it('should execute protocol actions', () => {
			const protocolAction = mock<ProtocolAction>();
			const returnedProtocolAction = mock<ProtocolAction>();
			protocolAction.execute.mockReturnValue([returnedProtocolAction]);

			const returnedActions = context.executeActions([protocolAction], []);

			expect(returnedActions).toHaveLength(1);
			expect(returnedActions[0]).toBe(returnedProtocolAction);
		});

		it('should execute user actions', () => {
			const userAction = mock<UserAction>();
			const returnedProtocolAction = mock<ProtocolAction>();

			userAction.execute.mockReturnValue([returnedProtocolAction]);

			const returnedActions = context.executeActions([], [userAction]);

			expect(returnedActions).toHaveLength(1);
			expect(returnedActions[0]).toBe(returnedProtocolAction);
		});
	});

	describe('addNode', () => {
		it('should add a node', () => {
			context.addNode(node);
			expect(context.nodes).toHaveLength(1);
			expect(context.nodes[0]).toEqual(node);
		});

		it('should not add a node if the public key already exists', () => {
			context.addNode(node);
			const duplicateNode = new Node('V1', new QuorumSet(1, ['Q'], []));

			context.addNode(duplicateNode);

			expect(context.nodes).toHaveLength(1);
			expect(context.nodes[0]).toEqual(node);
		});
	});

	describe('updateQuorumSet', () => {
		it('should execute UpdateQuorumSetAction', () => {
			context.addNode(node);
			const action = new UpdateQuorumSet(
				node.publicKey,
				new QuorumSet(1, ['Q'], [])
			);

			const actions = context.executeActions([], [action]);

			expect(actions).toHaveLength(0);
			expect(context.getEvents()).toHaveLength(1);
		});
		it('should update the quorum set of a node', () => {
			context.addNode(node);
			const newQuorumSet = new QuorumSet(1, ['Q'], []);

			const actions = context.updateQuorumSet(node.publicKey, newQuorumSet);

			expect(actions).toHaveLength(0);
			expect(node.quorumSet).toEqual(newQuorumSet);
			expect(context.getEvents()).toHaveLength(1);
		});
	});

	describe('vote', () => {
		it('should vote if the node exists', () => {
			context.addNode(node);
			const mockStatement = mock<Statement>();
			mockFederatedVotingProtocol.drainEvents.mockReturnValue([
				new Voted(node.publicKey, mock<Vote>())
			]);

			const actions = context.vote(node.publicKey, mockStatement);

			expect(mockFederatedVotingProtocol.vote).toHaveBeenCalled();
			expect(mockFederatedVotingProtocol.drainEvents).toHaveBeenCalled();
			expect(actions).toHaveLength(0);
		});

		it('should not vote if the node does not exist', () => {
			const mockStatement = mock<Statement>();
			const actions = context.vote(node.publicKey, mockStatement);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.vote).not.toHaveBeenCalled();
		});

		it('should not allow a node to vote again if it has already voted', () => {
			context.addNode(node);
			context.vote(node.publicKey, mock<Statement>());
			const mockStatement = mock<Statement>();

			const actions = context.vote(node.publicKey, mockStatement);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.vote).not.toHaveBeenCalledTimes(1);
		});
	});

	describe('broadcast requests', () => {
		it('should process broadcast requests correctly', () => {
			const broadcastEvent = new BroadcastVoteRequested(
				node.publicKey,
				mock<Vote>()
			);
			mockFederatedVotingProtocol.drainEvents.mockReturnValue([broadcastEvent]);

			context.addNode(node);
			const actions = context.vote(node.publicKey, mock<Statement>());

			expect(actions).toHaveLength(1);
			expect(actions[0]).toBeInstanceOf(ProtocolAction);
		});
	});

	describe('canVote', () => {
		it('should return true if node can vote', () => {
			context.addNode(node);
			const result = context.canVote(node.publicKey);

			expect(result).toBe(true);
		});

		it('should return false if node does not exist', () => {
			const result = context.canVote('nonexistent');

			expect(result).toBe(false);
		});

		it('should return false if node has already voted', () => {
			context.addNode(node);
			context.getProtocolState(node.publicKey)!.voted = mock<Vote>();
			context.vote(node.publicKey, mock<Statement>());

			const result = context.canVote(node.publicKey);

			expect(result).toBe(false);
		});
	});

	describe('sendMessage', () => {
		it('should send a message and queue a Receive action', () => {
			context.addNode(node);
			const message = new Message('sender', node.publicKey, mock<Vote>());

			const actions = context.sendMessage(message);

			expect(actions).toHaveLength(1);
			expect(actions[0]).toBeInstanceOf(ReceiveMessage);
		});

		it('should process delivered messages and handle new broadcast events', () => {
			context.addNode(node);
			const message = new Message('sender', node.publicKey, mock<Vote>());

			mockFederatedVotingProtocol.drainEvents.mockReturnValue([
				new BroadcastVoteRequested(node.publicKey, message.vote)
			]);

			const actions = context.receiveMessage(message);

			expect(actions).toHaveLength(1);
			expect(actions[0]).toBeInstanceOf(SendMessage);

			expect(mockFederatedVotingProtocol.processVote).toHaveBeenCalledTimes(1);
		});

		it('should not process message if recipient node does not exist', () => {
			context.addNode(node);
			const message = new Message('sender', 'nonexistent', mock<Vote>());

			const actions = context.receiveMessage(message);

			expect(actions).toEqual([]);
			expect(mockFederatedVotingProtocol.processVote).not.toHaveBeenCalled();
		});
	});

	describe('nodes', () => {
		it('should return all nodes', () => {
			context.addNode(node);
			const nodes = context.nodes;

			expect(nodes).toHaveLength(1);
			expect(nodes[0]).toEqual(node);
		});
	});

	describe('publicKeysWithQuorumSets', () => {
		it('should return public keys with quorum sets', () => {
			context.addNode(node);

			const result = context.publicKeysWithQuorumSets;

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				publicKey: node.publicKey,
				quorumSet: node.quorumSet
			});
		});
	});

	describe('connections', () => {
		it('should return empty connections for a single node', () => {
			context.addNode(node);

			const result = context.connections;

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				publicKey: 'V1',
				connections: []
			});
		});

		it('should correctly compute connections between multiple nodes', () => {
			const node2 = new Node('V2', new QuorumSet(1, ['Q'], []));
			const node3 = new Node('V3', new QuorumSet(1, ['Q'], []));
			context.addNode(node);
			context.addNode(node2);
			context.addNode(node3);

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
