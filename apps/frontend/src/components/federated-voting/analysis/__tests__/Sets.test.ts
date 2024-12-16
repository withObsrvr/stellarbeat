import {
  findSubSetsOfSize,
  findAllSubSets,
  setCacheKey,
  intersects,
  isEqualSet,
  isSubsetOf,
  findIntersection,
} from "../Sets";

describe("Sets utility functions", () => {
  describe("findSubSetsOfSize", () => {
    test("should return all subsets of given size", () => {
      const mySet = new Set([1, 2, 3]);
      const subsets = findSubSetsOfSize(mySet, 2);
      const expectedSubsets = [
        new Set([1, 2]),
        new Set([1, 3]),
        new Set([2, 3]),
      ];
      expect(subsets.length).toBe(3);
      expect(subsets).toEqual(expect.arrayContaining(expectedSubsets));
    });

    test("should return empty array if size is larger than set size", () => {
      const mySet = new Set([1, 2]);
      const subsets = findSubSetsOfSize(mySet, 5);
      expect(subsets).toEqual([]);
    });

    test("should return array with empty set if size is zero", () => {
      const mySet = new Set([1, 2]);
      const subsets = findSubSetsOfSize(mySet, 0);
      expect(subsets).toEqual([new Set()]);
    });
  });

  describe("findAllSubSets", () => {
    test("should return all subsets of the set", () => {
      const mySet = new Set([1, 2]);
      const subsets = findAllSubSets(mySet);
      const expectedSubsets = [
        new Set(),
        new Set([1]),
        new Set([2]),
        new Set([1, 2]),
      ];
      expect(subsets.length).toBe(4);
      expect(subsets).toEqual(expect.arrayContaining(expectedSubsets));
    });
  });

  describe("setCacheKey", () => {
    test("should return sorted string of elements", () => {
      const mySet = new Set(["b", "a", "c"]);
      const key = setCacheKey(mySet);
      expect(key).toBe("a,b,c");
    });
  });

  describe("intersects", () => {
    test("should return true if sets have common elements", () => {
      const setA = new Set([1, 2, 3]);
      const setB = new Set([3, 4, 5]);
      expect(intersects(setA, setB)).toBe(true);
    });

    test("should return false if sets have no common elements", () => {
      const setA = new Set([1, 2]);
      const setB = new Set([3, 4]);
      expect(intersects(setA, setB)).toBe(false);
    });
  });

  describe("isEqualSet", () => {
    test("should return true for sets with same elements", () => {
      const setA = new Set([1, 2, 3]);
      const setB = new Set([3, 2, 1]);
      expect(isEqualSet(setA, setB)).toBe(true);
    });

    test("should return false for sets with different elements", () => {
      const setA = new Set([1, 2]);
      const setB = new Set([1, 2, 3]);
      expect(isEqualSet(setA, setB)).toBe(false);
    });
  });

  describe("isSubsetOf", () => {
    test("should return true if first set is a subset of second", () => {
      const setA = new Set([1, 2]);
      const setB = new Set([1, 2, 3]);
      expect(isSubsetOf(setA, setB)).toBe(true);
    });

    test("should return false if first set is not a subset of second", () => {
      const setA = new Set([1, 4]);
      const setB = new Set([1, 2, 3]);
      expect(isSubsetOf(setA, setB)).toBe(false);
    });
  });

  describe("findIntersection", () => {
    test("should return intersection of two sets", () => {
      const setA = new Set([1, 2, 3]);
      const setB = new Set([2, 3, 4]);
      const intersection = findIntersection(setA, setB);
      expect(intersection).toEqual(new Set([2, 3]));
    });

    test("should return empty set if no intersection", () => {
      const setA = new Set([1, 2]);
      const setB = new Set([3, 4]);
      const intersection = findIntersection(setA, setB);
      expect(intersection.size).toBe(0);
    });
  });
});
