import 'reflect-metadata';
import { ArchivePerformanceTester } from '../ArchivePerformanceTester';

describe('buildConcurrencyRange', () => {
	it('should reproduce the historical ladder at the old ceiling', () => {
		// Guards the shape of the ladder: six rungs, same values as the list that
		// used to be hard coded, so raising the ceiling is the only behaviour
		// change.
		expect(ArchivePerformanceTester.buildConcurrencyRange(50)).toEqual([
			50, 35, 25, 20, 15, 10
		]);
	});

	it('should scale the ladder with the ceiling', () => {
		expect(ArchivePerformanceTester.buildConcurrencyRange(100)).toEqual([
			100, 70, 50, 40, 30, 20
		]);
	});

	it('should start at the ceiling and descend', () => {
		const range = ArchivePerformanceTester.buildConcurrencyRange(200);
		expect(range[0]).toEqual(200);
		expect([...range]).toEqual([...range].sort((a, b) => b - a));
	});

	it('should not cost more probes than before', () => {
		// Each rung is a full benchmark round, so the ladder must not grow.
		expect(
			ArchivePerformanceTester.buildConcurrencyRange(500).length
		).toBeLessThanOrEqual(6);
	});

	it('should collapse duplicate rungs and never drop below 1', () => {
		// A tiny ceiling rounds several ratios onto the same value; those must be
		// de-duplicated rather than benchmarked twice.
		const range = ArchivePerformanceTester.buildConcurrencyRange(2);
		expect(range).toEqual([...new Set(range)]);
		expect(Math.min(...range)).toBeGreaterThanOrEqual(1);
	});
});
