import { findAllSubSets, intersects, isEqualSet, isSubsetOf } from "./Sets";

/**
 * WARNING: These implementations are not optimized for performance.
 * They are intended to work only with small Federated Byzantine Agreement Systems (FBAS)
 * for demonstrative purposes.
 */

export type NodeID = string;
export type QuorumSlice = Set<NodeID>;
export type QuorumFunction = Map<NodeID, QuorumSlice[]>;

interface FBAS {
  nodes: NodeID[];
  Q: QuorumFunction;
}

export function isQuorum(candidate: Set<NodeID>, Q: QuorumFunction): boolean {
  if (candidate.size === 0) return false;
  for (const validator of candidate) {
    const slices = Q.get(validator);
    if (!slices || slices.length === 0) return false;
    let found = false;
    for (const q of slices) {
      if (isSubsetOf(q, candidate)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

export function findQuorums(nodes: NodeID[], Q: QuorumFunction): Set<NodeID>[] {
  const subsets = findAllSubSets(new Set(nodes));
  const quorums: Set<NodeID>[] = [];
  for (const S of subsets) {
    if (isQuorum(S, Q)) {
      quorums.push(S);
    }
  }
  return quorums;
}

export function findMinimalQuorums(quorums: Set<NodeID>[]): Set<NodeID>[] {
  // A minimal quorum is one that has no quorum as a strict subset.
  quorums.sort((a, b) => a.size - b.size);
  const minimalQuorums: Set<NodeID>[] = [];
  for (let i = 0; i < quorums.length; i++) {
    const candidate = quorums[i];
    let isMinimal = true;
    for (const minimalQuorum of minimalQuorums) {
      if (
        isSubsetOf(minimalQuorum, candidate) &&
        !isEqualSet(minimalQuorum, candidate)
      ) {
        isMinimal = false;
        break;
      }
    }
    if (isMinimal) minimalQuorums.push(candidate);
  }
  return minimalQuorums;
}

export function hasQuorumIntersection(quorums: Set<NodeID>[]): boolean {
  // Check pairwise intersection for minimal quorums
  for (let i = 0; i < quorums.length; i++) {
    for (let j = i + 1; j < quorums.length; j++) {
      const first = quorums[i];
      const second = quorums[j];
      if (!intersects(first, second)) return false;
    }
  }
  return true;
}

export function deleteSetFromFBAS(fbas: FBAS, B: Set<NodeID>): FBAS {
  const { nodes, Q } = fbas;
  const newNodes = nodes.filter((n) => !B.has(n));
  const newQ: QuorumFunction = new Map();
  for (const v of newNodes) {
    const oldSlices = Q.get(v) || [];
    const newSlices: QuorumSlice[] = [];
    for (const slice of oldSlices) {
      const newSlice = new Set([...slice].filter((x) => !B.has(x)));
      if (newSlice.has(v)) {
        newSlices.push(newSlice);
      }
    }
    newQ.set(v, newSlices);
  }
  return { nodes: newNodes, Q: newQ };
}

export function checkSafetyDespiteB(fbas: FBAS, B: Set<NodeID>): boolean {
  const reduced = deleteSetFromFBAS(fbas, B);
  const quorums = findQuorums(reduced.nodes, reduced.Q);
  const minimalQs = findMinimalQuorums(quorums);
  return hasQuorumIntersection(minimalQs);
}

export function checkLivenessDespiteB(fbas: FBAS, B: Set<NodeID>): boolean {
  const remainingNodes = fbas.nodes.filter((n) => !B.has(n));
  if (remainingNodes.length === 0) {
    return true; //todo: how do we handle this? No nodes left is by definition live?
    // Everyone is ill-behaved, so does it even matter?
  }
  return isQuorum(new Set(remainingNodes), fbas.Q);
}

export function isDSet(fbas: FBAS, B: Set<NodeID>): boolean {
  const safety = checkSafetyDespiteB(fbas, B);
  const liveness = checkLivenessDespiteB(fbas, B);

  return safety && liveness;
}

export function findAllDSets(fbas: FBAS): Set<NodeID>[] {
  //They are determined a priori by the FBAS structure
  const subsets = findAllSubSets(new Set(fbas.nodes));

  const knownDSets: Set<NodeID>[] = [];
  for (const dSetCandidate of subsets) {
    const result = isDSet(fbas, dSetCandidate);
    if (result) {
      knownDSets.push(dSetCandidate);
    }
  }
  return knownDSets;
}

export function isNodeIntact(
  node: NodeID,
  illBehavedNodes: Set<NodeID>,
  allDSets: Set<NodeID>[],
): boolean {
  // v is intact if there exists a DSet B such that I ⊆ B and v ∉ B.
  for (const dSet of allDSets) {
    if (isSubsetOf(illBehavedNodes, dSet) && !dSet.has(node)) {
      return true;
    }
  }
  return false;
}

export function isNodeBefouled(
  node: NodeID,
  illBehavedNodes: Set<NodeID>,
  allDSets: Set<NodeID>[],
): boolean {
  return !isNodeIntact(node, illBehavedNodes, allDSets);
}

export function findAllIntactNodes(
  allNodes: NodeID[],
  illBehavedNodes: Set<NodeID>,
  allDSets: Set<NodeID>[],
) {
  return allNodes.filter((node) =>
    isNodeIntact(node, illBehavedNodes, allDSets),
  );
}
