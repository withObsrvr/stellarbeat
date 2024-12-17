import {
  NodeID,
  QuorumFunction,
  isQuorum,
  findQuorums,
  findMinimalQuorums,
  hasQuorumIntersection,
  deleteSetFromFBAS,
  checkSafetyDespiteB,
  checkLivenessDespiteB,
  isDSet,
  findAllDSets,
  isNodeIntact,
  isNodeBefouled,
  findAllIntactNodes,
} from "../DSetAnalysis";
import { isEqualSet } from "../Sets";

describe("FBAS DSet computation and intact node detection", () => {
  // Define a simple FBAS for testing
  let fbas: { nodes: NodeID[]; Q: QuorumFunction };
  beforeAll(() => {
    fbas = {
      nodes: ["a", "b", "c", "d"],
      Q: new Map([
        ["a", [new Set(["a", "b", "c"])]],
        ["b", [new Set(["b", "c", "d"])]],
        ["c", [new Set(["a", "c"]), new Set(["c", "d"])]],
        ["d", [new Set(["b", "c", "d"])]],
      ]),
    };
  });

  test("isQuorum works correctly", () => {
    expect(isQuorum(new Set(["b", "c", "d"]), fbas.Q)).toBe(true);
    expect(isQuorum(new Set(["a", "c"]), fbas.Q)).toBe(false); // a needs {a,b,c}
  });

  test("findQuorums finds correct quorums", () => {
    const quorums = findQuorums(fbas.nodes, fbas.Q);
    // {b,c,d} is a known quorum
    // {a,b,c,d} also forms a quorum (since it contains {b,c,d})
    expect(quorums.some((q) => isEqualSet(q, new Set(["b", "c", "d"])))).toBe(
      true,
    );
    expect(
      quorums.some((q) => isEqualSet(q, new Set(["a", "b", "c", "d"]))),
    ).toBe(true);
  });

  test("findMinimalQuorums", () => {
    const quorums = findQuorums(fbas.nodes, fbas.Q);
    const minimal = findMinimalQuorums(quorums);
    // minimal quorum is {b,c,d} only
    expect(minimal.length).toBe(1);
    expect(isEqualSet(minimal[0], new Set(["b", "c", "d"]))).toBe(true);
  });

  test("hasQuorumIntersection", () => {
    expect(hasQuorumIntersection([new Set(["b", "c", "d"])])).toBe(true);
    expect(
      hasQuorumIntersection([new Set(["b", "c", "d"]), new Set(["b", "f"])]),
    ).toBe(true);

    expect(
      hasQuorumIntersection([
        new Set(["a", "b"]),
        new Set(["b", "c"]),
        new Set(["c", "d"]),
      ]),
    ).toBe(false);
  });

  test("deleteSetFromFBAS", () => {
    const B = new Set(["b"]);
    const reduced = deleteSetFromFBAS(fbas, B);
    // nodes after removing b: ["a","c","d"]
    expect(reduced.nodes.sort()).toEqual(["a", "c", "d"]);
    // a's slice {a,b,c} becomes {a,c} after removing b
    // c's slices {a,c}, {c,d} remain {a,c}, {c,d}
    // d's slice {b,c,d} becomes {c,d} after removing b
    console.log(fbas.Q.get("a"));
    expect(
      isEqualSet(new Set(reduced.Q.get("a")![0]), new Set(["a", "c"])),
    ).toBe(true);
    expect(
      isEqualSet(new Set(reduced.Q.get("c")![0]), new Set(["a", "c"])),
    ).toBe(true);
    expect(
      isEqualSet(new Set(reduced.Q.get("c")![1]), new Set(["c", "d"])),
    ).toBe(true);
    expect(
      isEqualSet(new Set(reduced.Q.get("d")![0]), new Set(["c", "d"])),
    ).toBe(true);
  });

  test("checkSafetyDespiteB", () => {
    const B = new Set(["a"]);
    // After removing a:
    // nodes: {b,c,d}
    // {b,c,d} is still a quorum
    // minimal quorum is {b,, "c"c,d} alone
    // trivially intersection holds
    expect(checkSafetyDespiteB(fbas, B)).toBe(true);

    //after removing b and c, a is the only node left in its slice and forms a single (forking) quorum
    expect(checkSafetyDespiteB(fbas, new Set(["b", "c"]))).toBe(false);
  });

  test("checkLivenessDespiteB", () => {
    // Removing {c} leaves {a,b,d}
    // a needs {a,b,c}, c missing. fails
    // b needs {b,c,d}, c missing. fails
    // d needs {b,c,d}, c missing. fails
    // no liveness.
    expect(checkLivenessDespiteB(fbas, new Set(["c"]))).toBe(false);

    // Removing {a} leaves {b,c,d} which is a quorum
    expect(checkLivenessDespiteB(fbas, new Set(["a"]))).toBe(true);
  });

  test("isDSet", () => {
    // Removing {c} fails liveness
    expect(isDSet(fbas, new Set(["c"]))).toBe(false);

    // {b,c,d} remains as only quorum
    expect(isDSet(fbas, new Set(["a"]))).toBe(true);
  });

  test("findAllDSets", () => {
    const dsets = findAllDSets(fbas);
    expect(dsets.length).toBe(3);
    expect(
      dsets.find((d) => isEqualSet(d, new Set(["a", "b", "c", "d"]))),
    ).toBeTruthy();
    expect(dsets.find((d) => isEqualSet(d, new Set(["a"])))).toBeTruthy();
    expect(dsets.find((d) => isEqualSet(d, new Set([])))).toBeTruthy(); //empty DSET is necessary for the
    //scenario of no ill-behaved nodes
  });

  test("findAllDSets in an unsafe FBAS", () => {
    const unsafeFBAS = {
      nodes: ["a", "b"],
      Q: new Map([
        ["a", [new Set(["a"])]],
        ["b", [new Set(["b"])]],
      ]),
    };

    const dsets = findAllDSets(unsafeFBAS);
    expect(dsets.length).toBe(3);

    expect(dsets.find((d) => isEqualSet(d, new Set(["a", "b"])))).toBeTruthy();
    expect(dsets.find((d) => isEqualSet(d, new Set(["a"])))).toBeTruthy();
    expect(dsets.find((d) => isEqualSet(d, new Set(["b"])))).toBeTruthy();

    //empty set is NOT a DSET.
    expect(dsets.find((d) => isEqualSet(d, new Set([])))).toBeFalsy();
  });

  test("isNodeIntact", () => {
    const all = findAllDSets(fbas);
    // Suppose illBehaved = {b,c}
    // We want to see if "a" is intact.
    // a node is intact if exists DSet B with {b,c}⊆B and a∉B
    // Let's see known DSet {a}, does {b,c}⊆{a}? no
    // If no DSet contains {b,c}, then no node is intact w.r.t. {b,c}
    expect(isNodeIntact("a", new Set(["b", "c"]), all)).toBe(false);

    // illBehaved = {a}
    // If illBehaved = {a}, we need a DSet B containing {a} but not "b" to say b is intact
    // {a} is a DSet and contains {a}. Does it contain b? no.
    // so b is intact w.r.t. {a}
    expect(isNodeIntact("b", new Set(["a"]), all)).toBe(true);
    expect(isNodeBefouled("b", new Set(["a"]), all)).toBe(false);
  });

  test("findAllIntactNodes", () => {
    const all = findAllDSets(fbas);
    const intact = findAllIntactNodes(fbas.nodes, new Set(["a"]), all);
    expect(intact.sort()).toEqual(["b", "c", "d"]);
  });
});
