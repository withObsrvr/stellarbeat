import { Broadcast } from '../Broadcast';
import { mock } from 'jest-mock-extended';
import { Payload } from '../../../../overlay/Overlay';

describe('Broadcast', () => {
	const broadcaster = 'node';
	const payload = mock<Payload>();
	let action: Broadcast;

	beforeEach(() => {
		action = new Broadcast(broadcaster, payload, ['neighbor']);
		action.isDisrupted = true;
	});

	describe('toJSON', () => {
		it('should serialize the action correctly', () => {
			const json = action.toJSON();
			expect(json).toEqual({
				type: 'ProtocolAction',
				subType: 'Broadcast',
				broadcaster: broadcaster,
				payload: payload,
				neighborBlackList: ['neighbor'],
				isDisrupted: true
			});
		});
	});

	describe('fromJSON', () => {
		it('should deserialize the action correctly', () => {
			const json = {
				subType: 'Broadcast',
				broadcaster: broadcaster,
				payload: payload
			};
			const deserialized = Broadcast.fromJSON(json);
			expect(deserialized).toBeInstanceOf(Broadcast);
			expect(deserialized.payload).toEqual(payload);
			expect(deserialized.publicKey).toBe(broadcaster);
		});
	});

	describe('serialization round trip', () => {
		it('should maintain action properties after serialization and deserialization', () => {
			const json = action.toJSON();
			const deserialized = Broadcast.fromJSON(json);
			expect(deserialized.publicKey).toBe(action.publicKey);
			expect(deserialized.payload).toBe(action.payload);
			expect(deserialized.getBlackList()).toEqual(['neighbor']);
			expect(deserialized.isDisrupted).toBe(action.isDisrupted);
			expect(deserialized.toString()).toBe(action.toString());
		});
	});
});
