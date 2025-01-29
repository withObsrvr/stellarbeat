# Scan data models

The Scan entity represents a part of a chain of scans for a specific history
archive. The scanInitData together with the url identifies a chain of scans for
a specific archive.

The start and end dates tell when this part of the chain was executed.

The latestScannedLedgerHeader tells the last ledger header that was scanned and
is used to continue the scan on a later date.

For example a scan chain could be initiated and started at 01/01/2022, from
ledger 0 to 20000000. At startDate 01/02/2022, the chain is continued from
ledger 20000000 to 40000000. etc.

## Create a scan(chain)

### ScanJob

A ScanJob can be requested by a history archive scanner (worker) You can create
a ScanJob that creates a new ScanChain. But you can also create a job that
continues a scan chain by passing the previous scan in the constructor.

### Scan Entity

This data model is a finished scan and is returned from the worker and is stored
in the database. It contains the url, the execution dates, the ScanResult and a
ScanError if there was a failure.
