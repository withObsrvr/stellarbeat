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
export function findIntersections<A>(sets: Set<A>[]): A[][] {
  const allIntersections: A[][] = [];
  if (sets.length < 2) return sets.map((set) => Array.from(set));

  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const first = sets[i];
      const second = sets[j];

      // Compute the intersection
      const intersection = new Set<A>(
        [...first].filter((node) => second.has(node)),
      );

      // Add it to the list
      allIntersections.push(Array.from(intersection));
    }
  }

  return allIntersections;
}

//empty array is subset of all arrays
export function findMinimalSubSets<A>(sets: A[][]): A[][] {
  // 1. Sort by ascending length
  sets.sort((a, b) => a.length - b.length);
  if (sets.length === 0) return [];
  if (sets[0].length === 0) return [];

  const minimal: A[][] = [];

  // We'll iterate until we've exhausted the list
  // In each iteration, pick the smallest intersection & remove its supersets
  while (sets.length > 0) {
    // 2. Take the first (smallest) intersection
    const candidate = sets[0];

    // 3. Add it to the result
    minimal.push(candidate);

    // 4. Remove all intersections that contain candidate
    //    i.e. for which candidate is a subset
    sets = sets.filter(
      (intersection) => !candidate.every((elem) => intersection.includes(elem)),
    );
  }

  return minimal;
}
