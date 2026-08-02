# Network component

## Operations documentation

- [Validator discovery testing](VALIDATOR_DISCOVERY_TESTING.md) describes how to
  diagnose stale validator IPs and validators that have never been discovered.
- [Creit connectivity diagnostic](CREIT_CONNECTIVITY_DIAGNOSTIC_2026-07-29.md)
  records the July 29, 2026 Beta validator handshake failure and administrator
  remediation tests.
- [Validator discovery improvement plan](VALIDATOR_DISCOVERY_IMPROVEMENT_PLAN.md)
  defines the phased implementation derived from the Creit and Marketnode
  incidents.
- [Endpoint discovery operations and implementation status](ENDPOINT_DISCOVERY_OPERATIONS.md)
  documents the Phase 1-4 implementation, runtime candidate API, and local Radar
  acceptance procedure.

## Description

Nodes and organizations are persisted through snapshotting.

## crawler and snapshotter/backend decoupling and storage for nodes

Every node is represented by one or more snapshots in the database. A snapshot
has a start and end time to designate when it was 'active'. A node can only have
one active snapshot at a time.

The snapshot contains the data that could change over time like name, ip,
version,... Only when the data has changed, a new snapshot is created with the
new data.

A node also has measurements, e.g. validating, active,... Every backend run
these measurements are saved.

Every backend run, the crawler provides nodes to the snapshotter. The
snapshotter has a database of the nodes it knows, and checks if the provided
nodes have changed (geodata, name,...).

- If a node has changed: create a new snapshot for that node, and update the
  endtime for the previous active snapshot.
- If the node is new to the snapshotter: create a fresh snapshot for that node.
- A node could also be missing, maybe due to a software bug in the crawler. The
  snapshotter doesn't register a change. However, it does record a measurement
  for this node. e.g. active = false, validating = false, ...

A separate archiver process is run to deactivate snapshots of nodes that are
inactive for over 7 days. A deactivated snapshot is no longer fed to the crawler
on the next run. No more measurements for that node will be stored. this
archival could be improved by looking at the lifetime of nodes. We don't need to
store 7 days of measurements for a node that was only active for an hour in its
lifetime, or was just used in a test(script) for example.

## IN PROGRESS

currently in the progress of moving out js-stellar-domain classes (Node,
Organization, Network) to the application layer. Will take some time to finish
this.
