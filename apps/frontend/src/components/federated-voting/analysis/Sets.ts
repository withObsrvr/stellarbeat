export function isSubsetOf<A>(a: Set<A>, b: Set<A>): boolean {
  if (a.size > b.size) return false;
  for (const element of a) {
    if (!b.has(element)) return false;
  }
  return true;
}

export function isEqualSet<A>(first: Set<A>, second: Set<A>): boolean {
  if (first.size !== second.size) return false;
  for (const element of first) if (!second.has(element)) return false;
  return true;
}

export function findIntersection<A>(first: Set<A>, second: Set<A>): Set<A> {
  const [small, big] =
    first.size < second.size ? [first, second] : [second, first];
  const result = new Set<A>();
  for (const element of small) {
    if (big.has(element)) result.add(element);
  }
  return result;
}

export function intersects<A>(first: Set<A>, second: Set<A>): boolean {
  const [small, big] =
    first.size < second.size ? [first, second] : [second, first];
  for (const element of small) {
    if (big.has(element)) return true;
  }
  return false;
}

export function setCacheKey(mySet: Set<string>): string {
  return Array.from(mySet).sort().join(",");
}

export function findAllSubSets<A>(mySet: Set<A>): Set<A>[] {
  const arr = Array.from(mySet);
  const subsets: Set<A>[] = [];

  function generateSubsets(index: number, currentSubset: Set<A>) {
    if (index === arr.length) {
      subsets.push(new Set(currentSubset));
      return;
    }

    // Include the current element
    currentSubset.add(arr[index]);
    generateSubsets(index + 1, currentSubset);

    // Exclude the current element
    currentSubset.delete(arr[index]);
    generateSubsets(index + 1, currentSubset);
  }

  generateSubsets(0, new Set<A>());
  return subsets;
}

export function findSubSetsOfSize<A>(mySet: Set<A>, size: number): Set<A>[] {
  const arr = Array.from(mySet);
  const subsets: Set<A>[] = [];

  function generateSubsets(index: number, currentSubset: Set<A>) {
    if (currentSubset.size === size) {
      subsets.push(new Set(currentSubset));
      return;
    }

    if (index === arr.length) return;

    // Include the current element
    currentSubset.add(arr[index]);
    generateSubsets(index + 1, currentSubset);

    // Exclude the current element
    currentSubset.delete(arr[index]);
    generateSubsets(index + 1, currentSubset);
  }

  generateSubsets(0, new Set<A>());
  return subsets;
}

//if only 1 set is passed, return it
export function findIntersections(sets: Set<string>[]): string[][] {
  const allIntersections: string[][] = [];
  if (sets.length < 2) return sets.map((set) => Array.from(set));

  // Set to track unique intersections
  const seen = new Set<string>();

  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const first = sets[i];
      const second = sets[j];

      const intersection = [...first].filter((node) => second.has(node));
      const key = intersection.sort().join(",");

      if (!seen.has(key)) {
        seen.add(key);
        allIntersections.push(intersection);
      }
    }
  }

  return allIntersections;
}
