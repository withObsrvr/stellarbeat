import { mock } from 'jest-mock-extended';
import { Payload } from '../../Overlay';
import { Gossip } from '../Gossip';
import { QuorumSet, Vote } from '../../..';

describe('Gossip', () => {
	const sender = 'node1';
	const payload: Payload = new Vote(
		'pizza',
		true,
		sender,
		new QuorumSet(1, [], [])
	);

	describe('toJSON', () => {
		it('should serialize Gossip object to JSON', () => {
			const gossip = new Gossip(sender, payload);
			gossip.blackListNeighbors(['node2', 'node3']);
			gossip.isDisrupted = true;

			const json = gossip.toJSON();

			expect(json).toEqual({
				type: 'ProtocolAction',
				subType: 'Gossip',
				sender: sender,
				payload: payload,
				neighborBlackList: ['node2', 'node3'],
				isDisrupted: true
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize JSON to Gossip object', () => {
			const json = {
				type: 'ProtocolAction',
				subType: 'Gossip',
				sender: sender,
				payload: payload,
				neighborBlackList: ['node2', 'node3'],
				isDisrupted: true
			};

			const gossip = Gossip.fromJSON(json);

			expect(gossip).toBeInstanceOf(Gossip);
			expect(gossip.sender).toBe(sender);
			expect(gossip.payload).toEqual(payload);
			expect(gossip.getBlackList()).toEqual(['node2', 'node3']);
			expect(gossip.isDisrupted).toBe(true);
			expect(gossip.publicKey).toBe(sender);
		});
	});

	describe('serialization roundtrip', () => {
		it('should maintain all properties after serialization and deserialization', () => {
			const originalGossip = new Gossip(sender, payload);
			originalGossip.blackListNeighbors(['node2', 'node3']);
			originalGossip.isDisrupted = true;

			const json = originalGossip.toJSON();
			const deserializedGossip = Gossip.fromJSON(json);

			expect(deserializedGossip.sender).toBe(originalGossip.sender);
			expect(deserializedGossip.payload).toEqual(originalGossip.payload);
			expect(deserializedGossip.getBlackList()).toEqual(
				originalGossip.getBlackList()
			);
			expect(deserializedGossip.isDisrupted).toBe(originalGossip.isDisrupted);
		});
	});
});
