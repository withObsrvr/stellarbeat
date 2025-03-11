import {
	BroadcastFailed,
	Gossip,
	Message,
	MessageReceived,
	MessageSent
} from '../..';
import { ReceiveMessage } from '../../federated-voting/action/protocol/ReceiveMessage';
import { Payload } from '../Overlay';
import { Overlay } from './../';

describe('Overlay', () => {
	let overlay: Overlay;
	const dummyPayload = {
		hash: () => 'dummy'
	} as Payload;

	beforeEach(() => {
		overlay = new Overlay();
	});

	describe('Node Management', () => {
		test('should add nodes correctly', () => {
			overlay.addNode('node1');
			overlay.addNode('node2');

			expect(overlay.nodes.has('node1')).toBe(true);
			expect(overlay.nodes.has('node2')).toBe(true);
			expect(overlay.nodes.size).toBe(2);
		});

		test('should remove nodes correctly', () => {
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.removeNode('node1');

			expect(overlay.nodes.has('node1')).toBe(false);
			expect(overlay.nodes.has('node2')).toBe(true);
			expect(overlay.nodes.size).toBe(1);
		});

		test('removing a node should remove all its connections', () => {
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node1', 'node3');

			overlay.removeNode('node1');

			expect(overlay.connections.get('node2')?.has('node1')).toBeFalsy();
			expect(overlay.connections.get('node3')?.has('node1')).toBeFalsy();
		});
	});

	describe('Connection Management', () => {
		test('should add bidirectional connections between nodes', () => {
			overlay = new Overlay(false, false);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addConnection('node1', 'node2');

			expect(overlay.connections.get('node1')?.has('node2')).toBe(true);
			expect(overlay.connections.get('node2')?.has('node1')).toBe(true);
		});

		test('should remove bidirectional connections correctly', () => {
			overlay = new Overlay(false, false);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node1', 'node3');
			overlay.removeConnection('node1', 'node2');
			expect(overlay.connections.get('node1')?.has('node2')).toBe(false);
			expect(overlay.connections.get('node1')?.has('node3')).toBe(true);
			expect(overlay.connections.get('node2')?.has('node1')).toBe(false);
			expect(overlay.connections.get('node3')?.has('node1')).toBe(true);
			expect(overlay.connections.get('node2')?.has('node3')).toBe(false);
			expect(overlay.connections.get('node3')?.has('node2')).toBe(false);
		});
	});

	describe('Fully Connected Mode', () => {
		test('should connect all nodes when fully connected is enabled', () => {
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');

			expect(overlay.connections.get('node1')?.has('node2')).toBe(true);
			expect(overlay.connections.get('node1')?.has('node3')).toBe(true);
			expect(overlay.connections.get('node2')?.has('node1')).toBe(true);
			expect(overlay.connections.get('node2')?.has('node3')).toBe(true);
			expect(overlay.connections.get('node3')?.has('node1')).toBe(true);
			expect(overlay.connections.get('node3')?.has('node2')).toBe(true);
		});

		test('should automatically connect new nodes when fully connected is enabled', () => {
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');

			expect(overlay.connections.get('node1')?.has('node3')).toBe(true);
			expect(overlay.connections.get('node2')?.has('node3')).toBe(true);
			expect(overlay.connections.get('node3')?.has('node1')).toBe(true);
			expect(overlay.connections.get('node3')?.has('node2')).toBe(true);
		});
	});

	describe('Broadcasting', () => {
		test('should broadcast payload to all neigbours', () => {
			overlay = new Overlay(false);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addNode('node4');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node1', 'node3');

			const actions = overlay.broadcast('node1', dummyPayload);

			expect(actions.length).toBe(2); //Two receivers
			expect(actions[0]).toBeInstanceOf(ReceiveMessage);
			expect(
				actions.some(
					(action) => (action as ReceiveMessage).message.receiver === 'node1'
				)
			).toBe(false);
			expect(
				actions.some(
					(action) => (action as ReceiveMessage).message.receiver === 'node4'
				)
			).toBeFalsy();
			expect(
				actions.every(
					(action) => (action as ReceiveMessage).message.sender === 'node1'
				)
			).toBeTruthy();
			expect(
				actions.every(
					(action) => (action as ReceiveMessage).message.vote === dummyPayload
				)
			).toBeTruthy();
			expect(
				actions.some(
					(action) => (action as ReceiveMessage).message.receiver === 'node2'
				)
			).toBe(true);
			expect(
				actions.some(
					(action) => (action as ReceiveMessage).message.receiver === 'node3'
				)
			).toBe(true);

			const events = overlay.drainEvents();
			console.log(events);
			expect(
				events.filter((event) => event instanceof MessageSent).length
			).toBe(2);
			expect(
				events.some(
					(event) =>
						event instanceof MessageSent && event.message.receiver === 'node2'
				)
			).toBe(true);
			expect(
				events.some(
					(event) =>
						event instanceof MessageSent && event.message.receiver === 'node3'
				)
			).toBe(true);
			expect(
				events.filter(
					(event) =>
						event instanceof MessageSent && event.message.sender === 'node1'
				).length
			).toBe(2);
		});

		test('should register broadcast failure if no connections', () => {
			overlay = new Overlay(false);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');

			const actions = overlay.broadcast('node1', dummyPayload);

			expect(actions.length).toBe(0);
			const events = overlay.drainEvents();
			expect(events.length).toBe(1);
			expect(events[0]).toBeInstanceOf(BroadcastFailed);
			expect((events[0] as BroadcastFailed).payload).toBe(dummyPayload);
		});

		test('should not broadcast to blacklisted nodes', () => {
			overlay = new Overlay(false);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node1', 'node3');

			const actions = overlay.broadcast('node1', dummyPayload, ['node2']);

			expect(actions.length).toBe(1);
			expect(actions[0]).toBeInstanceOf(ReceiveMessage);
			expect((actions[0] as ReceiveMessage).message.receiver).toBe('node3');
		});
	});

	describe('Message Receiving', () => {
		test('should track received messages', () => {
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.drainEvents();

			const message = new Message('node1', 'node2', dummyPayload);
			overlay.receiveMessage(message, false);

			const events = overlay.drainEvents();
			expect(events.length).toBe(1);
			const event = events[0] as ReceiveMessage;
			expect(event.message).toBe(message);
			expect(event.publicKey).toBe('node2');
		});
	});

	describe('Gossip Protocol', () => {
		test('should create gossip action when gossip is enabled and there is a need for gossip', () => {
			overlay = new Overlay(true, true);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node2', 'node3');

			const message = new Message('node1', 'node2', dummyPayload);
			const results = overlay.receiveMessage(message, false);
			overlay.drainEvents();

			// Should have ReceivedMessage and GossipMessage
			expect(results.length).toBe(1);
			expect(results[0]).toBeInstanceOf(Gossip);

			const gossipAction = results[0] as Gossip;
			expect(gossipAction.sender).toBe('node2');
			expect(gossipAction.payload).toBe(dummyPayload);
		});

		test('should not create gossip action when gossip is disabled', () => {
			overlay = new Overlay(true, false);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node2', 'node3');

			const message = new Message('node1', 'node2', dummyPayload);
			const results = overlay.receiveMessage(message, false);
			overlay.drainEvents();

			expect(results.length).toBe(0);
		});

		test('gossipMessage should send to connected nodes that have not received the message', () => {
			overlay = new Overlay(false, true);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addNode('node4');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node2', 'node3');
			overlay.addConnection('node3', 'node4');
			overlay.drainEvents();

			const actions = overlay.broadcast('node1', dummyPayload);
			const events = overlay.drainEvents();
			expect(events.length).toBe(1);
			expect(events[0] instanceof MessageSent).toBe(true);
			const event = events[0] as MessageSent;
			expect(event.message.receiver).toBe('node2');
			expect(event.message.sender).toBe('node1');
			expect(event.message.vote).toBe(dummyPayload);

			expect(actions.length).toBe(1);
			expect(actions[0] instanceof ReceiveMessage).toBe(true);
			const action = actions[0] as ReceiveMessage;
			expect(action.message.receiver).toBe('node2');
			expect(action.message.sender).toBe('node1');
			expect(action.message.vote).toBe(dummyPayload);

			const actions2 = overlay.receiveMessage(action.message, false);
			const events2 = overlay.drainEvents();
			expect(events2.length).toBe(1);
			expect(events2[0] instanceof MessageReceived).toBe(true);

			expect(actions2.length).toBe(1);
			expect(actions2[0] instanceof Gossip).toBe(true);
			const gossipAction = actions2[0] as Gossip;
			expect(gossipAction.sender).toBe('node2');
			expect(gossipAction.payload).toBe(dummyPayload);

			const actions3 = overlay.gossip(
				gossipAction.sender,
				gossipAction.payload,
				[]
			);
			expect(actions3.length).toBe(1);
			expect(actions3[0] instanceof ReceiveMessage).toBe(true);
			const receiveAction = actions3[0] as ReceiveMessage;
			expect(receiveAction.message.receiver).toBe('node3');
			expect(receiveAction.message.sender).toBe('node2');
			expect(receiveAction.message.vote).toBe(dummyPayload);

			const events3 = overlay.drainEvents();
			expect(events3.length).toBe(1);
			expect(events3[0] instanceof MessageSent).toBe(true);

			const actions4 = overlay.receiveMessage(receiveAction.message, false);
			overlay.drainEvents();
			expect(actions4.length).toBe(1);
			expect(actions4[0] instanceof Gossip).toBe(true);
			const gossipAction2 = actions4[0] as Gossip;

			const actions5 = overlay.gossip(
				gossipAction2.sender,
				gossipAction2.payload,
				[]
			);
			overlay.drainEvents();
			expect(actions5.length).toBe(1);
			expect(actions5[0] instanceof ReceiveMessage).toBe(true);
			const receiveAction2 = actions5[0] as ReceiveMessage;

			const actions6 = overlay.receiveMessage(receiveAction2.message, false);
			overlay.drainEvents();
			expect(actions6.length).toBe(0);
		});

		test('gossipMessage should not send to nodes that have already received the message', () => {
			overlay = new Overlay(false, true);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node1', 'node3');
			overlay.drainEvents();

			const actions = overlay.broadcast('node1', dummyPayload);
			expect(
				actions.flatMap((action) =>
					overlay.receiveMessage((action as ReceiveMessage).message, false)
				)
			).toHaveLength(0);
		});

		test('gossipMessage should not send to nodes that are blacklisted', () => {
			overlay = new Overlay(false, true);
			overlay.addNode('node1');
			overlay.addNode('node2');
			overlay.addNode('node3');
			overlay.addConnection('node1', 'node2');
			overlay.addConnection('node1', 'node3');
			overlay.drainEvents();

			const actions = overlay.gossip('node1', dummyPayload, ['node2']);
			expect(actions.length).toBe(1);
			expect(actions[0] instanceof ReceiveMessage).toBe(true);
			const action = actions[0] as ReceiveMessage;
			expect(action.message.receiver).toBe('node3');
		});
	});
});
