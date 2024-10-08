import { QuorumSet, QuorumSlicesGenerator, Node } from '../src';

const quorumSlicesGenerator = new QuorumSlicesGenerator();

const node1 = new Node('1');
const quorumSet1 = new QuorumSet();
quorumSet1.validators = ['3', '2', '1', '4'];
quorumSet1.threshold = 2;
node1.quorumSet = quorumSet1;

const node2 = new Node('2');
const quorumSet2 = new QuorumSet();
quorumSet2.validators = ['3', '2', '1'];
quorumSet2.threshold = 2;
node2.quorumSet = quorumSet2;

const node3 = new Node('3');
const quorumSet3 = new QuorumSet();
quorumSet3.validators = ['3', '2', '1'];
quorumSet3.threshold = 2;
node3.quorumSet = quorumSet3;

const node4 = new Node('4');
const quorumSet4 = new QuorumSet();
quorumSet4.validators = ['4', '2', '1', '3'];
quorumSet4.threshold = 3;
node4.quorumSet = quorumSet4;

describe('getSlices', function () {
	test('1slice', function () {
		expect(
			quorumSlicesGenerator.getSlices(new QuorumSet(2, ['1', '2']))
		).toEqual([['1', '2']]);
	});
	test('mSlices', function () {
		expect(
			quorumSlicesGenerator.getSlices(new QuorumSet(2, ['1', '2', '3']))
		).toEqual([
			['1', '2'],
			['1', '3'],
			['2', '3']
		]);
	});
	test('innerQS', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(2, ['1', '2'], [new QuorumSet(1, ['3', '4'])])
			)
		).toEqual([
			['1', '2'],
			['1', '3'],
			['1', '4'],
			['2', '3'],
			['2', '4']
		]);
	});
	test('innerQS2', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(2, ['1', '2'], [new QuorumSet(2, ['3', '4'])])
			)
		).toEqual([
			['1', '2'],
			['1', '3', '4'],
			['2', '3', '4']
		]);
	});
	test('innerQS3', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(
					2,
					['1', '2'],
					[new QuorumSet(2, ['3', '4']), new QuorumSet(2, ['5', '6'])]
				)
			)
		).toEqual([
			['1', '2'],
			['1', '3', '4'],
			['1', '5', '6'],
			['2', '3', '4'],
			['2', '5', '6'],
			['3', '4', '5', '6']
		]);
	});
	test('innerQS4', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(
					2,
					[],
					[new QuorumSet(2, ['3', '4']), new QuorumSet(2, ['5', '6'])]
				)
			)
		).toEqual([['3', '4', '5', '6']]);
	});
	test('innerQS5', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(
					1,
					[],
					[new QuorumSet(2, ['3', '4']), new QuorumSet(2, ['5', '6'])]
				)
			)
		).toEqual([
			['3', '4'],
			['5', '6']
		]);
	});
	test('innerQS6', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(
					2,
					['1'],
					[new QuorumSet(2, ['3', '4']), new QuorumSet(2, ['5', '6'])]
				)
			)
		).toEqual([
			['1', '3', '4'],
			['1', '5', '6'],
			['3', '4', '5', '6']
		]);
	});
	test('innerQS7', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(
					2,
					['1'],
					[new QuorumSet(2, ['3'], [new QuorumSet(1, ['4', '5'])])]
				)
			)
		).toEqual([
			['1', '3', '4'],
			['1', '3', '5']
		]);
	});
	test('innerQS8', function () {
		expect(
			quorumSlicesGenerator.getSlices(
				new QuorumSet(
					2,
					['1'],
					[new QuorumSet(1, ['3'], [new QuorumSet(1, ['4', '5'])])]
				)
			)
		).toEqual([
			['1', '3'],
			['1', '4'],
			['1', '5']
		]);
	});
});
