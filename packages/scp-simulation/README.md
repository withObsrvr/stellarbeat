# GOAL

- Educational implementation of SCP, starting with federated voting.
- Provide clear implementations, optimized for readability and learning.
- Event driven to allow for different gui visualizations (text, graph,...)
- Undo redo functionality
- Scenario create and replay
- Doesn't take quorum discovery into account for simplicity. All quorum slices
  for every node are known beforehand.
- Single slot consensus for simplicity
- Ignores security for simplicity (Message signing could be added in the future
  as it is an important part in why the algorithm works)

Current status = braindump, needs to be improved

# Install

```bash
pnpm install
```

# architecture & import guidelines

This package consists of the following modules:

- core: very stable classes usable by all other modules
- federated-voting: an implementation of federated voting that contains the
  protocol, and implements a core/Context to run the protocol in. Uses only the
  core module.
- simulation: Allows playing, manipulating a protocol. Uses the core module to
  operate on an abstract 'context'
- console-interface: A testing playground to play around with the protocol using
  the command line. Uses core, simulation and federated-voting modules.

No circular module dependencies are allowed.

Every module exports its public classes through an index.ts file. Other modules
refer to this index.ts file for imports and not the individual paths to allow a
module to reorganize paths etc without affecting depending modules. e.g. in
federated-voting, import {Event} from '../core' instead of {Event} from
'../core/Event'.

## Federated voting

Federated voting is a crucial part of the Stellar Consensus Protocol. It allows
a set of nodes in FBAS system to agree on values.

This library will implement the algorithm and also provide an overlay
simulation, to see the impacts of network configuration/outtages/... on the
Algorithms.

TODO: system state vs node state

### Definitions

Quorum slice: A node trusts other nodes through its quorum slices. It defines
sets of nodes (slices) that it will agree with. TODO: improve Quorum: A set of
nodes form a quorum, if every node has a quorum slice in this set of nodes.
Meaning every node in the set will be convinced of a statement by the nodes in
the set. TODO: improve Quorum intersection: Intact Node: Befauled Node:

### Federated voting

First we discuss issues with voting in general. Let's assume we have a set of
nodes that want to agree on a statement (e.g. a set of transactions to apply to
ledger x). But where do we start? There is no 'leader' node, every node is equal
and can vote for any statement they deem valid.  
Thus it is very easy to have a 'split vote'. No majority is possible because
there are too many different votes. To solve this, a node cannot simply vote for
another statement, contradicting it's previous vote. For example the node the
node cannot simply vote to apply a different transaction set to ledger x.  
Other nodes could do the same thing and chaos would erupt with constant vote
changing, never (consistently) reaching a majority. Also nodes could reach
consensus on an 'old' vote, not knowing that a node already changed its mind!
Thus if nodes can't change their vote, we could have a split vote. However we
could also have the scenario where there is a majority of nodes that agree, but
another intact node cannot join the consensus, because it voted for another
statement!

The problem we have to solve is that a statement that is voted on could get
STUCK because nodes cannot vote again for contradictory statements. This means
no consensus can be reached on the statement.

For example. If nodes vote for the statement: The value of ledger 200 is x. If
this statement would get stuck, we would never be able to reach consensus on the
value of ledger 200 because nodes cannot vote for contradictory statements. e.g.
'The value of ledger 200 is y'

To solve this we have to craft the statements we vote on carefully, to be able
to allow for

1. neutralization of statements. Obsoleting a stuck statement. A neutralizable
   statement cannot (should not) block progress if stuck.
2. irrefutable statements. If a statement cannot be voted against, it will never
   get stuck. Eventually everyone will agree. There is no statement that could
   contradict this statement.

Federated voting: In an FBAS we deal with quorums (see FBAS blogpost). If we
find a quorum that agrees on a statement in an FBAS with quorum intersection no
other quorum will disagree.

Because voters can vote for any valid statement, a vote has three possible
outcomes. Either the nodes agree on a statement, they agree on another
incompatible statement, or there is no agreement at all.

When a group of nodes reach consensus, another node v could get stuck if

- v or nodes in v's slices have voted for contradictory statements.
- some nodes that voted for the statement crashed afterwards and the node
  doesn't hear about the votes. (TODO: scenario)

The only way for a node to know that a statemtent could be acted upon, is if it
ratifies the statement first hand. Meaning that it observed a quorum ratify that
statement AND that it is a part of that quorum.

To solve this we perform two votes! The node votes for a statement and tries to
accept that statement (or another one accepted by a blocking set) The node votes
that an intact node accepted that statement and tries to ratify that statement.
TODO: wording needs work.

Federated voting

##### Voting for a statement

A node only votes for statement if it is valid and consistent with all
statements v has accepted (?TODO wording correct? is accepting here confusing?)
and it has never voted against it in the past. The node also promises it will
never vote against the statement in the future(i.e. contradict it).

TODO: explicit difference between there is a split vote and an intact node
cannot reach consensus even though some nodes did.

Definitions:

- A quorum RATIFIES a statement if every member votes for it.
- A node RATIFIES a statement if it is a member of a quorum that ratifies that
  statement. (First hand ratification)
- In an FBAS with quorum intersection, two contradictory statements can never be
  ratified! Thus intact nodes (TODO definition intact) can never ratify
  contradicting statements.

##### Accepting a statement

- a node accepts a statement if a V-blocking set has ACCEPTED that statement OR
  if a quorum where the node is a member of has accepted or voted for this
  statement (RATIFIED)
- This allows a node to vote for a statement, and later accept a different
  statement.
- Two intact nodes can never accept contradictory statements.

However two issues still persist:

1. Weakened safety due to accepting statements of V-blocking sets. TODO: example
2. There is still no guarantee that all intact nodes can accept the statement.
   They could be stuck on different statements. TODO: wording

##### Confirming a statement (holding a vote on the fact that the first vote succeeded)

- Vote on an irrefutable statement. e.g. vote that an intact node has accepted
  the statement. TODO example
- Only confirm when the statement is RATIFIED.

The ratifying property solves the safety issues. (TODO: Improve this) The
irrefutable statement solves the issue that nodes could get stuck. If a quorum
ratifies an irrefutable statement that is valid, and the node is part of that
quorum, it confirms that statement. i.e. it can change its vote

#### Why is federated voting not enough for concensus?

It is possible that no vote will ever get 'accepted' and the system will be
stuck. SCP is a protocol that uses federated voting and avoids STUCK states.

#### V-blocking

A set of nodes is v-blocking for a node, if the set overlaps every one of its
slices. TODO: explain algorithm + insert schema image

#### isQuorum

TODO: explain algorithm

## Reference

[SCP talk by D. Mazieres](https://www.youtube.com/watch?v=vmwnhZmEZjc)
[scp whitepaper](https://cdn.sanity.io/files/e2r40yh6/production-i18n/39856a57fa0c6e7d646b7db88f48f17688693fe4.pdf?dl=Stellar%20Consensus%20Protocol)
