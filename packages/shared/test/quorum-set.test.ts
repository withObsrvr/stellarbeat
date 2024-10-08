import { QuorumSet } from '../src';

const qs = new QuorumSet(
	2,
	['0', '1', '2', '3'],
	[
		new QuorumSet(2, ['4', '5'], [new QuorumSet(2, ['6', '7'])]),
		new QuorumSet(2, ['8', '9'])
	]
);

test('getAllValidators', () => {
	expect(QuorumSet.getAllValidators(qs)).toEqual([
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9'
	]);
});
