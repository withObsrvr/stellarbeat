# node-connector

Connect and interact with nodes in the Stellar Network over the tcp protocol.

This package consists of two main classes. Node and Connection.

The Node class allows you to connect to and accept connections from other nodes.

A connection to a Node is encapsulated in the Connection class. It handles the
Stellar Network handshake and message authentication. It is a custom
[duplex stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex)
in [object mode](https://nodejs.org/api/stream.html#stream_object_mode) that
wraps a [tcp socket](https://nodejs.org/api/net.html#net_class_net_socket) and
respects
[backpressure](https://nodejs.org/en/docs/guides/backpressuring-in-streams/). It
emits and allows you to send
[Stellar Messages](https://github.com/stellar/js-stellar-base/blob/6e0fa3e1a25910e193041d1f377b71f125ec4d1c/src/generated/stellar-xdr_generated.js#L2470)
.

Stellar Messages are the
[xdr](https://github.com/stellar/stellar-core/tree/master/src/xdr) structures
used in Stellar core used to pass data between nodes. They are made available in
javascript thanks to the
[Stellar base](https://github.com/stellar/js-stellar-base) and
[js-xdr](https://github.com/stellar/js-xdr) packages.

## Install, build and run tests

`pnpm install`

`pnpm run build` : builds code in lib folder

`pnpm run test`

#### Optional: copy .env.dist to .env and fill in parameters

## Usage

### Initiate connection to other node

```
import { createNode } from 'src'
let node = createNode(true, getConfigFromEnv());
//Interact with the public network. Configuration in environment variables. Uses defaults if env values are missing.`

let connection:Connection = node.connectTo(peerIp, peerPort); //connect to a node;
```

The Connection class wraps a
[net socket](https://nodejs.org/api/net.html#net_class_net_socket) and emits the
same events with two twists:

- the connect event includes PublicKey and NodeInfo (version,
  overlayVersion,...).
- data/readable passes StellarMessageWork objects that contain
  [StellarMessages](https://github.com/stellar/js-stellar-base/blob/6e0fa3e1a25910e193041d1f377b71f125ec4d1c/src/generated/stellar-xdr_generated.js#L2470)
  and a 'done' callback. The done callback is needed for the custom flow control
  protocol implemented in stellar nodes. This protocol controls the amount of
  flood messages (transaction, scp) that are sent to peers.

For example handling an SCP message:

```
connection.on("data", (stellarMessageWork: StellarMessageWork) => {
    const stellarMessage = stellarMessageWork.stellarMessage;
    if (stellarMessage.switch().value === MessageType.scpMessage().value) {
        console.log(stellarMessage.envelope().signature().toString());
        //do work...
        //signal done processing for flow control
        stellarMessageWork.done();
    }
}
```

To send a StellarMessage to a node use the sendStellarMessage or more generic
write method:

`connection.sendStellarMessage(StellarMessage.getScpState(0));`

### Accept connections from other nodes

_Disclaimer: at the moment this is rather limited and only used for integration
testing. For example flow control is not implemented_

```
node.acceptIncomingConnections(11623, '127.0.0.1');
node.on("connection", (connection:Connection) => {
        connection.on("connect", () => {
            console.log("Fully connected and ready to send/receive Stellar Messages");
        });
        connection.on("data", (stellarMessageWork: StellarMessageWork) => {
            //do something
        });
});
```

### Configuration

Checkout the NodeConf class. The following env parameters are available:

- LOG_LEVEL=debug | info | trace
- PRIVATE_KEY //If no secret key is supplied, one is generated at startup.
- [LEDGER_VERSION](https://github.com/stellar/stellar-core/blob/7d73fddb0489081bfc1350a691515ff39556c1d6/src/main/Config.h#L318)
- [OVERLAY_VERSION](https://github.com/stellar/stellar-core/blob/7d73fddb0489081bfc1350a691515ff39556c1d6/src/main/Config.h#L328)
- [OVERLAY_MIN_VERSION](https://github.com/stellar/stellar-core/blob/7d73fddb0489081bfc1350a691515ff39556c1d6/src/main/Config.h#L327)
- [VERSION_STRING](https://github.com/stellar/stellar-core/blob/7d73fddb0489081bfc1350a691515ff39556c1d6/src/main/Config.h#L329)
- LISTENING_PORT=11625
- RECEIVE_TRANSACTION_MSG=true //will the Connection class emit Transaction
  messages
- RECEIVE_SCP_MSG=true //will the Connection class emit SCP messages
- PEER_FLOOD_READING_CAPACITY=200 //max number of messages that can be processed
  simultaneously from a peer
- FLOW_CONTROL_SEND_MORE_BATCH_SIZE=40 //number of messages that can be received
  before sending a FLOW_CONTROL_SEND_MORE and reclaiming flood reading capacity
- PEER_FLOOD_READING_CAPACITY_BYTES=3000000 //max number of bytes that can be
  processed simultaneously from a peer
- FLOW_CONTROL_SEND_MORE_BATCH_SIZE_BYTES=1000000 //number of bytes that can be
  received before sending a FLOW_CONTROL_SEND_MORE and reclaiming flood reading
  capacity //see
  [stellar core config](https://github.com/stellar/stellar-core/blob/6177299100b114aa108584053414371f38aebf53/docs/stellar-core_example.cfg#L485)
  for info on flood control parameters

### Example: Connect to a node

You can connect to any node with the example script:

```
pnpm examples:connect ip port
```

You can find ip/port of nodes on https://radar.withobsrvr.com

The script connects to the node and logs the xdr stellar messages it receives to
standard output. Using
[Stellar laboratory](https://laboratory.stellar.org/#xdr-viewer?input=AAAACAAAAAIAAAAAVLkjMqFSTqiF2nhSF6zfatXkIxwm9h3NAah7%2FoJqpfwAAABkAhPUSgAPY%2FIAAAAAAAAAAAAAAAEAAAAAAAAAAwAAAAFHVE4AAAAAACJWAPBnEjR3slaKYj1uzT4ZkcOW8dg2e6shBFN2ro8wAAAAAAAAAAAAAAAAAAKKOwADDUAAAAAAMHXkhQAAAAAAAAABgmql%2FAAAAEAPXdZYvTZvbFUU0phuw5JwH6REiiTS5NiwRvlmtvQacigoyeYWF1PWOyN6ITKUu1CFUb6iY0WKV69y69seTSQI&type=StellarMessage&network=test)
you can inspect the content of the messages without coding.

## history

You can find the history off this package on
https://github.com/stellarbeat/js-stellar-node-connector.
