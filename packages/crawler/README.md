# crawler

Crawl the Stellar Network. Identify the nodes and determine their validating
status, version, lag,....

## How does it work?

See readme in src/README.md for an overview of the functionality and
architecture.

## install

`pnpm install`

## build code

`pnpm build`: builds code in lib folder

## Usage

### Create crawler

```
let myCrawler = createCrawler({
    nodeConfig: getConfigFromEnv(),
    maxOpenConnections: 25,
    maxCrawlTime: 900000
});
```

The crawler is itself a
[node](https://github.com/stellarbeat/js-stellar-node-connector) and needs to be
configured accordingly. You can limit the number of simultaneous open
connections to not overwhelm your server and set the maxCrawlTime as a safety if
the crawler should be stuck.

### Run crawl

```
let result = await myCrawler.crawl(
			nodes, // [[ip, port], [ip, port]]
			trustedQSet, //a quorumSet the crawler uses the determine the latest closed ledger
		    latestKnownLedger //a previous detected ledger the crawler can use to ignore older externalize messages
		);
```

### example script

Check out `examples/crawl.js` for an example on how to crawl the network. You
can try it out using the bundled seed file with the following command:  
`pnpm examples:crawl seed/nodes.json`

### history

History of this package can be found at
https://github.com/stellarbeat/js-stellar-node-crawler
