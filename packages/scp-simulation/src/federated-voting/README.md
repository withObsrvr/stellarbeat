# Federated voting implementation details

The FederatedVoting class is a service that allows you to perform a vote for a node and process incoming votes for a node.

The goal of Federated voting is to reach agreement on a statement, by voting. 

The AgreementAttempt class tracks such an attempt. It holds the Statement, the Phase of agreement, and the votes for the Statement. 

Nodes encapsulate their agreement attempts, because only 1 can move to accepted and/or confirmed phase. Nodes can vote for the statements they 
see fit, thus a Node can contain multiple Attempts. 

The FederatedVoting class and AgreementAttemptHandlers act as a state machine guiding an attempt from unknown to accepted to confirmed. 

The FederatedVoting class is responsible for sending out votes from the nodes if one of their agreement attempts changes phase,
or when a vote is triggered by calling the vote function. 
