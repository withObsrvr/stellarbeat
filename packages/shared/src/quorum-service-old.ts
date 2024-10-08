/*import {QuorumSet} from "./quorum-set";
import {intersection, isEqual} from "lodash";
import {Node} from "./node";
import {Network, PublicKey} from "./network";
import {QuorumSlicesGenerator} from "./quorum-slices-generator";*/

/**
 * Based on:
 * https://www.stellar.org/papers/stellar-consensus-protocol
 * https://arxiv.org/abs/1902.06493
 * https://arxiv.org/abs/2002.08101
 */
//@ts-ignore
export default {
	/*hasQuorumIntersection(network: Network) {
        console.time("Quorum intersection");
        if (network.graph.networkTransitiveQuorumSet.size === 0) {
            console.log("No transitive quorumSet");
            return false;
        }

        let isTransitiveQuorumSetSymmetric = true; //todo calculate

        let quorumsInTransitiveQuorumSet;

        if(isTransitiveQuorumSetSymmetric)
             quorumsInTransitiveQuorumSet = this.getQuorumsInSymmetricStronglyConnectedComponent(Array.from(network.graph.networkTransitiveQuorumSet), network);
        else //todo could be optimized by splitting between symmetric and non symmetric quorumsets
            quorumsInTransitiveQuorumSet = this.getQuorumsInStronglyConnectedComponentBruteForce(Array.from(network.graph.networkTransitiveQuorumSet), network);

        if (quorumsInTransitiveQuorumSet.length === 0) {
            console.log("No quorums in transitive quorumSet");
            return false;
        }

        //console.log(quorumsInTransitiveQuorumSetBF.length);
        //console.log(quorumsInTransitiveQuorumSet.length);
        //let minimumTransitiveQuorumSetQuorums = this.getMinimumQuorums(quorumsInTransitiveQuorumSet, network); //todo: are they already minimal for a symmetric cluster?
        //console.log(minimumTransitiveQuorumSetQuorums.length);

        let otherStronglyConnectedComponentsWithQuorums = network.graph.stronglyConnectedComponents
            .filter(scp => !isEqual(Array.from(scp), Array.from(network.graph.networkTransitiveQuorumSet)))
            .filter(scp => this.containsQuorum(Array.from(scp), network));


        if (otherStronglyConnectedComponentsWithQuorums.length > 0) {
            console.log("If other strongly connected components contain quorums, there is no quorum intersection with the transitive quorumset")
            return false;
        }

        console.log('Are the quorums intersecting?');
        if(isTransitiveQuorumSetSymmetric){
            //all nodes have the same quorumSet, so pick one
            let nodeInTransitiveQuorumSet:Node = network.getNodeByPublicKey(Array.from(network.graph.networkTransitiveQuorumSet)[0]!)!;
            if(!this.hasSufficientOverlap(nodeInTransitiveQuorumSet.quorumSet)){
                console.log("no sufficient overlap in quorumSet, no quorum interserction");
                return false;
            }
        } else {
            let allNodes = new Set<string>([]);
            quorumsInTransitiveQuorumSet.forEach(quorum => quorum.map(publicKey => allNodes.add(publicKey)));
            let maxSize = allNodes.size;
            console.log(maxSize);

            console.log(quorumsInTransitiveQuorumSet);

            console.time("overlap");
            let intersections:Set<string> = new Set();
            let nonIntersectingQuorums = quorumsInTransitiveQuorumSet.slice();
            while(nonIntersectingQuorums.length > 0){
                let intersects = true;
                for(let i = 1; i<nonIntersectingQuorums.length; i++){
                    let currentIntersection:string[] = intersection(nonIntersectingQuorums[i],nonIntersectingQuorums[0]);
                    if(currentIntersection.length === 0){
                        console.log("non intersecting quorums: ")
                        console.log(nonIntersectingQuorums[0]);
                        console.log(nonIntersectingQuorums[i]);
                        intersects = false;
                        break;
                    }
                    //sort and convert to string to remove duplicates in set.
                    let sortedCurrentIntersectionString = JSON.stringify(currentIntersection.sort());
                    intersections.add(sortedCurrentIntersectionString);
                }
                if(intersects)
                    nonIntersectingQuorums.splice(0,1);
                else
                    break;
            }
            console.timeEnd("overlap");
            console.log(intersections.size);

            if(nonIntersectingQuorums.length > 0) {
                console.log("Quorums do not overlap!");
                return false;
            }
        }

        console.timeEnd("Quorum intersection");

        return true;
    },

    hasSufficientOverlap(quorumSet:QuorumSet):boolean {
        //minimum entities with sufficient overlap that are needed for this quorumSet to overlap
        //entity = validator or inner quorumset
        let nrOfEntities = quorumSet.validators.length + quorumSet.innerQuorumSets.length;
        //between two quorums there will always be this number of overlapping entities:
        let overlap = quorumSet.threshold - (nrOfEntities - quorumSet.threshold);

        //an inner quorumset with no overlap can cause two quorums not to intersect
        quorumSet.innerQuorumSets.forEach(quorumSet => {
            if(!this.hasSufficientOverlap(quorumSet))
                overlap--;
        })

        return overlap > 0;
    },

    containsQuorum(stronglyConnectedComponent: PublicKey[], network: Network): boolean {
        let satisfiable = stronglyConnectedComponent.slice();
        stronglyConnectedComponent.forEach(publicKey => {
            let bitSet = 1;
            for (let i = 1; i < stronglyConnectedComponent.length; i++) {
                bitSet = (bitSet << 1);
                bitSet += 1;
            }
            if (!this.containsSlice(bitSet, network.getNodeByPublicKey(publicKey)!.quorumSet, satisfiable))
                satisfiable.splice(satisfiable.indexOf(publicKey), 1);

        })

        return satisfiable.length > 0;
    },

    getQuorumsInSymmetricStronglyConnectedComponent(stronglyConnectedComponent: string[], network: Network) {
        //todo handle symmetry.
        let quorumSlicesGenerator = new QuorumSlicesGenerator();

        //if symmetric, we can use the quorumSlices of any node to generate possible quorums because they are all the same
        return quorumSlicesGenerator.getSlices(network.getNodeByPublicKey(stronglyConnectedComponent[0])!.quorumSet);
    },

    getMinimumQuorums(quorums: PublicKey[][], network: Network) {
        return quorums.filter(quorum => {
                let isMinimal = true;
                let tester = quorum.slice();
                //if we remove a node, and it is still a quorum, it is not minimal
                for (let publicKey of quorum) {
                    tester.splice(quorum.indexOf(publicKey), 1);

                    if (this.containsQuorum(tester, network)) {
                        isMinimal = false;
                        break;
                    }

                    tester.push(publicKey);
                }

                return isMinimal;
            }
        )
    },

    getQuorumsInStronglyConnectedComponentBruteForce(stronglyConnectedComponent: string[], network: Network) {
        console.log("getting quorums in scp: ");
        console.log(stronglyConnectedComponent);
        let combinationGenerator = this.getCombinationsGenerator(stronglyConnectedComponent);
        let next = combinationGenerator.next();
        let quorums = [];
        while (!next.done) {
            let quorumCandidateBitSet = next.value[0];
            let quorumCandidate = next.value[1];

            if (this.quorumContainsSliceForEveryNode(quorumCandidate, quorumCandidateBitSet, stronglyConnectedComponent, network)) {
                quorums.push(quorumCandidate);
            }

            next = combinationGenerator.next();
        }
        console.log("nr of quorums detected: " + quorums.length);

        return quorums;
    },


    quorumContainsSliceForEveryNode(quorumCandidate: PublicKey[], quorumCandidateBitSet: number, stronglyConnectedComponent: PublicKey[], network: Network) {
        let containsSliceForEveryNode = true;
        quorumCandidate.some(nodePk => {
            if (network.getNodeByPublicKey(nodePk)!.quorumSet.threshold > quorumCandidate.length) {
                containsSliceForEveryNode = false;
                return true; //stop loop
            }

            let hasSubsetSlice = this.containsSlice(quorumCandidateBitSet, network.getNodeByPublicKey(nodePk)!.quorumSet, stronglyConnectedComponent);

            if (!hasSubsetSlice) {
                containsSliceForEveryNode = false;
                return true;//stop loop
            }
        });

        return containsSliceForEveryNode;
    },

    getBitRepresentation(validator: string, publicKeys: string[]) {
        let index = publicKeys.indexOf(validator);
        return (1 << index);
    },

    containsSlice: function (quorumCandidateBitSet: number, nodeQuorumSet: QuorumSet, stronglyConnectedComponent: string[]) {
        let validatorBitSets = nodeQuorumSet.validators
            .filter(publicKey => stronglyConnectedComponent.indexOf(publicKey) >= 0)
            .map(publicKey => this.getBitRepresentation(publicKey, stronglyConnectedComponent));
        let remainingThreshold = nodeQuorumSet.threshold;

        for (let i = 0; i < validatorBitSets.length && remainingThreshold !== 0; i++) {
            if ((validatorBitSets[i] & quorumCandidateBitSet) === validatorBitSets[i]) {
                remainingThreshold--; //match!
            }
        }

        for (let i = 0; i < nodeQuorumSet.innerQuorumSets.length && remainingThreshold !== 0; i++) {
            if (this.containsSlice(quorumCandidateBitSet, nodeQuorumSet.innerQuorumSets[i], stronglyConnectedComponent)) {
                remainingThreshold--; //match!
            }
        }

        return remainingThreshold === 0; //enough matches to satisfy threshold?
    },

    getCombinationsGenerator: function* (publicKeys: string[]): Generator<[number, string[]]> {
        let max = Math.pow(2, publicKeys.length);
        console.log(max);
        for (let i = 1; i < max; i++) {
            if (i % 10000 === 0)
                console.log(i);
            let binary = i;
            let binaryIndex = 0;
            let currentCombination = [];
            while (binary !== 0) {
                if (binary & 1) {
                    currentCombination.push(publicKeys[binaryIndex]);
                }
                binary = binary >>> 1;
                binaryIndex++;
            }

            yield [i, currentCombination];
        }
    }
*/
};
