# Protocol 23 Update Plan for Stellarbeat

## Overview
This document outlines the required changes to support Protocol 23 on the Stellar network, which goes live on Testnet on June 30, 2025, and Mainnet vote on August 14, 2025.

## Key Protocol 23 Changes Affecting Stellarbeat

### 1. Database Structure Changes (CAP-0062)
- **Live State BucketList**: Separates live state from archived state
- **Hot Archive BucketList**: New structure for archived Soroban entries
- **Impact**: May affect ledger state parsing and display

### 2. Transaction Set Structure (CAP-0063)
- **Parallel Transaction Scheduling**: New transaction set structure for parallel execution
- **Impact**: History scanner needs updates for new transaction set parsing

### 3. Unified Asset Events (CAP-0067)
- **SAC Event Format**: Classic operations now emit events in Soroban format
- **M-account Support**: Multiplexed accounts in Soroban
- **Impact**: Event parsing and display updates needed

### 4. XDR-JSON Integer Type Changes
- **Non-protocol change**: But affects data serialization
- **Impact**: API responses and data parsing

### 5. Automatic Entry Restoration (CAP-0066)
- **Auto-restore**: Archived entries automatically restored
- **Impact**: May affect state tracking and display

## Required Code Updates

### Phase 1: Configuration Updates (June 30, 2025)
When Protocol 23 goes live on Testnet:

#### 1. Update Environment Variables
```bash
# apps/backend/.env
NETWORK_LEDGER_VERSION=23  # Currently 22
```

#### 2. Monitor Protocol Version Detection
The system should automatically detect nodes upgrading to Protocol 23 through existing mechanisms.

### Phase 2: Transaction Processing Updates

#### 1. Transaction Set Hash Verification
Location: `/apps/history-scanner/src/domain/scanner/verification/empty-transaction-sets/EmptyTransactionSetsHashVerifier.ts`

**Current Logic**:
- Protocol < 20: Uses `RegularTransactionSetHashPolicy`
- Protocol >= 20: Uses `GeneralizedTransactionSetHashPolicy`

**Potential Update**:
```typescript
// Add check for Protocol 23 if new transaction set structure
if (protocolVersion >= 23) {
    hashCalculationPolicy = new ParallelTransactionSetHashPolicy();
} else if (protocolVersion >= 20) {
    hashCalculationPolicy = new GeneralizedTransactionSetHashPolicy();
} else {
    hashCalculationPolicy = new RegularTransactionSetHashPolicy();
}
```

#### 2. Create New Hash Policy (if needed)
If Protocol 23 introduces a new transaction set format for parallel execution, create:
```
apps/history-scanner/src/domain/scanner/verification/empty-transaction-sets/hash-policies/ParallelTransactionSetHashPolicy.ts
```

### Phase 3: Event Processing Updates

#### 1. Asset Event Parser
Update event parsing to handle SAC-format events from classic operations:
- Check event parsing logic in backend services
- Update frontend event display components if needed

#### 2. M-account Support
Add support for displaying multiplexed accounts in:
- Node details pages
- Transaction displays
- Account information

### Phase 4: State Display Updates

#### 1. Live vs Archived State Indicators
Consider adding visual indicators for:
- Live state entries
- Archived state entries
- Auto-restored entries

#### 2. Performance Metrics
Protocol 23 enables significant performance improvements:
- Update performance displays to show:
  - Parallel transaction execution metrics
  - In-memory state read performance
  - Reduced fees from optimizations

### Phase 5: XDR Updates

#### 1. Update XDR Definitions
When Stellar releases updated XDR files:
- Update XDR parsing libraries
- Test integer type handling changes
- Verify API response formats

### Testing Plan

#### 1. Testnet Testing (Starting June 30, 2025)
- [ ] Deploy configuration updates to testnet environment
- [ ] Monitor node protocol version detection
- [ ] Test transaction set parsing
- [ ] Verify event processing
- [ ] Check XDR integer handling

#### 2. Integration Testing
- [ ] Test history scanner with Protocol 23 ledgers
- [ ] Verify API responses with new XDR formats
- [ ] Test frontend displays with new data structures

#### 3. Performance Testing
- [ ] Monitor for any performance impacts
- [ ] Verify handling of increased transaction throughput
- [ ] Test with parallel transaction sets

### Rollout Schedule

1. **June 30, 2025**: Protocol 23 live on Testnet
   - Deploy configuration updates
   - Begin testing and monitoring

2. **July 2025**: Development and Testing
   - Implement necessary code changes
   - Thorough testing on Testnet

3. **Early August 2025**: Pre-Mainnet Preparation
   - Final testing and bug fixes
   - Prepare Mainnet deployment

4. **August 14, 2025**: Mainnet Vote
   - Monitor vote progress
   - Be ready for immediate deployment if vote passes

### Monitoring and Alerts

1. **Protocol Version Monitoring**
   - Alert when nodes begin upgrading to Protocol 23
   - Track adoption percentage

2. **Error Monitoring**
   - Watch for parsing errors with new transaction sets
   - Monitor for XDR deserialization issues

3. **Performance Monitoring**
   - Track any changes in processing time
   - Monitor resource usage with new features

### Risk Mitigation

1. **Backward Compatibility**
   - Ensure system continues to handle Protocol 22 and earlier
   - Test mixed-protocol scenarios during transition

2. **Graceful Degradation**
   - Implement fallbacks for new features
   - Clear error messages for unsupported operations

3. **Data Integrity**
   - Verify historical data processing remains accurate
   - Test edge cases around protocol transition

### Communication Plan

1. **User Communication**
   - Announce Protocol 23 support before Testnet launch
   - Provide updates on implementation progress
   - Document any user-visible changes

2. **Developer Communication**
   - Update API documentation for any changes
   - Communicate XDR format changes
   - Provide migration guides if needed

## Conclusion

Protocol 23 brings significant improvements to the Stellar network. While the changes are substantial, Stellarbeat's modular architecture should handle most updates gracefully. The primary focus areas are:

1. Configuration updates
2. Transaction set parsing for parallel execution
3. Event format changes for unified assets
4. XDR integer type handling

By following this plan and starting testing on June 30, 2025, Stellarbeat will be ready to fully support Protocol 23 when it launches on Mainnet.