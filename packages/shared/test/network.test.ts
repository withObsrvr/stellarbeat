import {Node, Network, QuorumSet, Organization, NetworkV1} from '../src';

const node1 = new Node('a');
node1.active = true;
node1.isValidating = true;
node1.quorumSet.threshold = 1;
const node2 = new Node('b');
node1.quorumSet.validators.push('b');

node2.quorumSet.threshold = 1;
node2.quorumSet.validators.push('a');
node2.active = true;
node2.isValidating = true;
const node3 = new Node('c');
const node4 = new Node('d');
const node5 = new Node('e');
node3.quorumSet.validators.push('a');
node3.quorumSet.threshold = 1;
node2.quorumSet.innerQuorumSets.push(new QuorumSet(5, ['c']));
node4.quorumSet.threshold = 1;
node4.quorumSet.innerQuorumSets.push(new QuorumSet(1, ['a']));
node4.quorumSet.innerQuorumSets.push(new QuorumSet(1, ['e']));

const organization = new Organization('orgId', 'org');
organization.validators = ['a', 'b', 'c', 'd'];
node1.organizationId = 'orgId';
node2.organizationId = 'orgId';
node3.organizationId = 'orgId';
node4.organizationId = 'orgId';
organization.subQuorumAvailable = true;
organization.subQuorumAvailable = true;
organization.subQuorumAvailable = true;
organization.subQuorumAvailable = true;
const otherOrganization = new Organization('otherId', 'otherOrg');
otherOrganization.validators = ['e'];
node5.organizationId = 'otherId';

let network: Network;

beforeEach(() => {
    network = new Network(
        [node1, node2, node3, node4, node5],
        [organization, otherOrganization]
    );
});
test('isOrganizationBlocked', () => {
    expect(network.isOrganizationBlocked(organization)).toBeFalsy();
    organization.subQuorumAvailable = false;
    expect(network.isOrganizationBlocked(organization)).toBeFalsy();
    expect(network.isOrganizationFailing(organization)).toBeTruthy();
    network.blockedNodes.add(node1.publicKey);
    network.blockedNodes.add(node2.publicKey);
    expect(network.isOrganizationBlocked(organization)).toBeFalsy();
    network.blockedNodes.add(node3.publicKey);
    expect(network.isOrganizationBlocked(organization)).toBeTruthy();
    organization.subQuorumAvailable = true; //needs refactoring
});
test('getTrustingNodes', () => {
    expect(network.getTrustingNodes(node1)).toEqual([node2, node3, node4]);
});

test('isQuorumSetFailing', () => {
    expect(network.isQuorumSetBlocked(node2)).toBeFalsy();
    expect(
        network.isQuorumSetBlocked(node2, node2.quorumSet.innerQuorumSets[0])
    ).toBeTruthy();
    expect(network.isQuorumSetBlocked(node3)).toBeFalsy();
});

test('isNodeFailing', () => {
    expect(network.isNodeFailing(node1)).toBeFalsy();
    expect(network.isNodeFailing(node2)).toBeFalsy();
    expect(network.isNodeFailing(node3)).toBeTruthy();
    expect(network.isNodeFailing(node4)).toBeTruthy();
    expect(network.isNodeFailing(new Node('unknown'))).toBeTruthy();
});

test('isOrganizationFailing', () => {
    expect(organization.subQuorumAvailable).toBeTruthy();
    node1.isValidating = false;
    network.recalculateNetwork();
    expect(organization.subQuorumAvailable).toBeFalsy();
    node1.isValidating = true; //needs refactoring
});
test('getTrustedOrganizationsByOrganization', () => {
    expect(network.getTrustedOrganizationsByOrganization(organization)).toEqual([
        otherOrganization
    ]);
});

it('should detect blocked nodes on hydration and after recalculation', function () {
    const nodeA = new Node('A');
    nodeA.active = true;
    nodeA.isValidating = false;
    nodeA.activeInScp = true;

    const nodeB = new Node('B');
    nodeB.active = true;
    nodeB.isValidating = false;
    nodeB.activeInScp = false;

    nodeA.quorumSet.threshold = 1;
    nodeA.quorumSet.validators.push('B');

    nodeB.quorumSet.threshold = 1;
    nodeB.quorumSet.validators.push('A');

    const network = new Network([nodeB, nodeA]);
    expect(network.blockedNodes).toEqual(new Set([nodeA.publicKey]));

    network.recalculateNetwork();
    expect(network.blockedNodes).toEqual(new Set([nodeA.publicKey]));

    nodeA.isValidating = true;
    nodeB.isValidating = true;
    network.recalculateNetwork();
    expect(network.blockedNodes).toEqual(new Set([]));

    nodeA.isValidating = false;
    nodeA.activeInScp = false;
    nodeB.isValidating = true;
    network.recalculateNetwork();
    expect(network.blockedNodes).toEqual(new Set([nodeB.publicKey]));
});

test('fromJSON', () => {
    const networkV1: NetworkV1 = {
        nodes: [node1.toJSON(), node2.toJSON(), node3.toJSON(), node4.toJSON(), node5.toJSON()],
        organizations: [organization.toJSON(), otherOrganization.toJSON()],
        name: 'test',
        id: 'id',
        passPhrase: 'passPhrase',
        quorumSetConfiguration: {
            threshold: 1,
            innerQuorumSets: [
                {
                    threshold: 1,
                    validators: ['a'],
                    innerQuorumSets: []
                }],
            validators: ['b']
        },
        stellarCoreVersion: 'v1.0.0',
        overlayVersion: 2,
        overlayMinVersion: 1,
        latestLedger: "3",
        scc: [],
        maxLedgerVersion: 3,
        statistics: {
            hasQuorumIntersection: true,
            hasSymmetricTopTier: true,
            hasTransitiveQuorumSet: true,
            minBlockingSetCountryFilteredSize: 1,
            minBlockingSetCountrySize: 2,
            minBlockingSetSize: 3,
            minBlockingSetFilteredSize: 4,
            minBlockingSetISPFilteredSize: 5,
            minBlockingSetISPSize: 6,
            minBlockingSetOrgsFilteredSize: 7,
            minBlockingSetOrgsSize: 8,
            minSplittingSetCountrySize: 9,
            minSplittingSetISPSize: 10,
            minSplittingSetOrgsSize: 11,
            minSplittingSetSize: 12,
            nrOfActiveFullValidators: 13,
            nrOfActiveOrganizations: 14,
            nrOfActiveValidators: 15,
            nrOfActiveWatchers: 16,
            topTierOrgsSize: 17,
            topTierSize: 18,
            transitiveQuorumSetSize: 19,
            time: 'now',
        },
        transitiveQuorumSet: [node1.publicKey],
        time: 'now',
    }

    const network = Network.fromJSON(networkV1);
    expect(network.nodes.length).toBe(5);
    expect(network.organizations.length).toBe(2);
    expect(network.name).toBe('test');
    expect(network.id).toBe('id');
    expect(network.quorumSetConfiguration?.threshold).toBe(1);
    expect(network.quorumSetConfiguration?.innerQuorumSets.length).toBe(1);
    expect(network.quorumSetConfiguration?.innerQuorumSets[0].threshold).toBe(1);
    expect(network.quorumSetConfiguration?.innerQuorumSets[0].validators.length).toBe(1);
    expect(network.quorumSetConfiguration?.innerQuorumSets[0].validators[0]).toBe('a');
    expect(network.quorumSetConfiguration?.validators.length).toBe(1);
    expect(network.quorumSetConfiguration?.validators[0]).toBe('b');
    expect(network.stellarCoreVersion).toBe('v1.0.0');
    expect(network.overlayVersion).toBe(2);
    expect(network.overlayMinVersion).toBe(1);
    expect(network.latestLedger).toBe("3");
    expect(network.maxLedgerVersion).toBe(3);
    expect(network.networkStatistics.hasQuorumIntersection).toBeTruthy();
    expect(network.networkStatistics.hasSymmetricTopTier).toBeTruthy();
    expect(network.networkStatistics.hasTransitiveQuorumSet).toBeTruthy();
    expect(network.networkStatistics.minBlockingSetCountryFilteredSize).toBe(1);
    expect(network.networkStatistics.minBlockingSetCountrySize).toBe(2);
    expect(network.networkStatistics.minBlockingSetSize).toBe(3);
    expect(network.networkStatistics.minBlockingSetFilteredSize).toBe(4);
    expect(network.networkStatistics.minBlockingSetISPFilteredSize).toBe(5);
    expect(network.networkStatistics.minBlockingSetISPSize).toBe(6);
    expect(network.networkStatistics.minBlockingSetOrgsFilteredSize).toBe(7);
    expect(network.networkStatistics.minBlockingSetOrgsSize).toBe(8);
    expect(network.networkStatistics.minSplittingSetCountrySize).toBe(9);
    expect(network.networkStatistics.minSplittingSetISPSize).toBe(10);
    expect(network.networkStatistics.minSplittingSetOrgsSize).toBe(11);
    expect(network.networkStatistics.minSplittingSetSize).toBe(12);
    expect(network.networkStatistics.nrOfActiveFullValidators).toBe(13);
    expect(network.networkStatistics.nrOfActiveOrganizations).toBe(14);
    expect(network.networkStatistics.nrOfActiveValidators).toBe(15);
    expect(network.networkStatistics.nrOfActiveWatchers).toBe(16);
    expect(network.networkStatistics.topTierOrgsSize).toBe(17);
    expect(network.networkStatistics.topTierSize).toBe(18);
    expect(network.networkStatistics.transitiveQuorumSetSize).toBe(19);
    expect(network.passPhrase).toBe('passPhrase');
});
