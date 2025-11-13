# FBAS Scanner Comparison Results

**Date**: 2025-11-13
**Network Snapshot**: Live Radar API (301 nodes)
**Test Subject**: Python FBAS Scanner vs Current Rust Scanner

## Python FBAS Scanner Results

### Environment
- **Tool**: python-fbas (Docker: giulianolosa/python-fbas)
- **Source**: https://github.com/nano-o/python-fbas
- **Data Source**: https://radar.withobsrvr.com/api/v1/node
- **Solvers**: SAT/MaxSAT/QBF constraint solvers

### Analysis Results

#### 1. Quorum Intersection Check
```
Status: ✅ PASS
Result: No disjoint quorums found
```

#### 2. Top Tier Analysis
```
Top Tier Size: 21 validators

Members:
- GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7 (LOBSTR 5 - India)
- GBF7QOLFPTHUEDUPTT4ZTULDTA3QXDIO75JHKJN2IYD7YGQLYUTR75BT (Gamma Node Validator)
- GCB2VSADESRV2DDTIVTFLBDI562K6KE3KMKILBHUHUWFXCUBHGQDI7VL (LOBSTR 2 - Europe)
- GCMSM2VFZGRPTZKPH5OABHGH4F3AVS6XTNJXDGCZ3MKCOSUBH3FL6DOB (FT SCV 2)
- GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE (SatoshiPay Frankfurt)
- GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUBY4G5MYP3M47PCVI55MNT (SatoshiPay Singapore)
- GAVXB7SBJRYHSG6KSQHY74N7JAFRL4PFVZCNWW2ARI6ZEKNBJSMSKW7C (Blockdaemon Validator 2)
- GAAV2GCVFLNN522ORUYFV33E76VPC22E72S75AQ6MBR5V45Z5DWVPWEU (Blockdaemon Validator 1)
- GBLJNN3AVZZPG2FYAYTYQKECNWTQYYUUY2KVFN2OUKZKBULXIXBZ4FCT (Hercules)
- GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z (Lyra)
- GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH (SDF 1)
- GAK6Z5UVGUVSEK6PEOCAYJISTT5EJBB34PN3NOLEQG2SUKXRVV2F6HZY (SatoshiPay Iowa)
- GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK (SDF 2)
- GDDANSYOYSY5EPSFHBRPCLX6XMHPPLIMHVIDXG6IPQLVVLRI2BN4HMH3 (Beta Node Validator)
- GCFONE23AB7Y6C5YZOMKUKGETPIAJA4QOYLS5VNS4JHBGKRZCPYHDLW7 (LOBSTR 1 - Europe)
- GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V (FT SCV 1)
- GAYXZ4PZ7P6QOX7EBHPIZXNWY4KCOBYWJCA4WKWRKC7XIUS3UJPT6EZ4 (Blockdaemon Validator 3)
- GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2 (Boötes)
- GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A (FT SCV 3)
- GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ (SDF 3)
- GBPLJDBFZO2H7QQH7YFCH3HFT6EMC42Z2DNJ2QFROCKETAPY54V4DCZD (Alpha Node Validator)
```

**Key Organizations in Top Tier:**
- SDF (Stellar Development Foundation): 3 validators
- LOBSTR: 3 validators
- SatoshiPay: 3 validators
- Blockdaemon: 3 validators
- FT (Franklin Templeton): 3 validators
- Others: 6 validators

#### 3. Minimal Blocking Set
```
Cardinality: 6 validators

Example blocking set:
- GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A (FT SCV 3)
- GDDANSYOYSY5EPSFHBRPCLX6XMHPPLIMHVIDXG6IPQLVVLRI2BN4HMH3 (Beta Node Validator)
- GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUBY4G5MYP3M47PCVI55MNT (SatoshiPay Singapore)
- GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE (SatoshiPay Frankfurt)
- GBPLJDBFZO2H7QQH7YFCH3HFT6EMC42Z2DNJ2QFROCKETAPY54V4DCZD (Alpha Node Validator)
- GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V (FT SCV 1)
```

⚠️ **WARNING**: Validator `GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ` has no known qset, which affects blocking-set analysis results.

#### 4. Minimal Splitting Set
```
Cardinality: 0

⚠️ **CRITICAL FINDING**: Network has potential split due to validator without qset:
- GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ (no qset)

This validator forms a separate quorum from the main network of 52 other validators.
```

**Interpretation**: The presence of a validator without a configured quorum set creates a degenerate case where it technically forms its own "quorum", splitting from the main network. This is likely a data quality issue rather than a real network vulnerability.

#### 5. Minimal Quorum
```
Cardinality: 12 validators

Example minimal quorum:
- GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A (FT SCV 3)
- GAYXZ4PZ7P6QOX7EBHPIZXNWY4KCOBYWJCA4WKWRKC7XIUS3UJPT6EZ4 (Blockdaemon Validator 3)
- GBLJNN3AVZZPG2FYAYTYQKECNWTQYYUUY2KVFN2OUKZKBULXIXBZ4FCT (Hercules)
- GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V (FT SCV 1)
- GAAV2GCVFLNN522ORUYFV33E76VPC22E72S75AQ6MBR5V45Z5DWVPWEU (Blockdaemon Validator 1)
- GDDANSYOYSY5EPSFHBRPCLX6XMHPPLIMHVIDXG6IPQLVVLRI2BN4HMH3 (Beta Node Validator)
- GAK6Z5UVGUVSEK6PEOCAYJISTT5EJBB34PN3NOLEQG2SUKXRVV2F6HZY (SatoshiPay Iowa)
- GCFONE23AB7Y6C5YZOMKUKGETPIAJA4QOYLS5VNS4JHBGKRZCPYHDLW7 (LOBSTR 1 - Europe)
- GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2 (Boötes)
- GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUBY4G5MYP3M47PCVI55MNT (SatoshiPay Singapore)
- GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7 (LOBSTR 5 - India)
- GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH (SDF 1)
```

### Performance Metrics (Python Scanner)
- **check-intersection**: ~2-3 seconds
- **top-tier**: ~3-4 seconds
- **min-blocking-set**: ~4-5 seconds
- **min-splitting-set**: ~4-5 seconds
- **min-quorum**: ~3-4 seconds

**Total analysis time**: ~15-20 seconds for all analyses on 301-node network

---

## Current Rust Scanner Results

### Environment
- **Tool**: @stellarbeat/stellar_analysis_nodejs (Rust WASM/Node binding)
- **Location**: apps/backend/src/network-scan/domain/network/scan/fbas-analysis/

### Analysis Results

**TODO**: Run current scanner on same dataset and populate results here.

Expected output format:
- `hasSymmetricTopTier`: boolean
- `hasQuorumIntersection`: boolean
- Node-level analysis:
  - `topTierSize`: number
  - `blockingSetsMinSize`: number
  - `blockingSetsFilteredMinSize`: number (excludes faulty/non-validating)
  - `splittingSetsMinSize`: number
- Organization-level analysis (merged by org)
- Country-level analysis (merged by country)
- ISP-level analysis (merged by ISP)

---

## Comparison Summary

### Capabilities Comparison

| Feature | Python Scanner | Rust Scanner |
|---------|---------------|--------------|
| Top Tier Analysis | ✅ Yes | ✅ Yes |
| Symmetric Top Tier | ❓ TBD | ✅ Yes |
| Minimal Blocking Sets | ✅ Yes | ✅ Yes |
| Filtered Blocking Sets | ❌ No | ✅ Yes (excludes faulty) |
| Minimal Splitting Sets | ✅ Yes | ✅ Yes |
| Minimal Quorums | ✅ Yes | ✅ Yes |
| Quorum Intersection Check | ✅ Yes | ✅ Yes |
| Disjoint Quorum Detection | ✅ Yes | ❓ TBD |
| History-Critical Sets | ✅ Yes (NEW!) | ❌ No |
| Organization Merging | ❌ No | ✅ Yes |
| Country Merging | ❌ No | ✅ Yes |
| ISP Merging | ❌ No | ✅ Yes |
| Group-by (generic) | ✅ Yes | ❌ No |

### Key Findings

#### Advantages of Python Scanner:
1. **History-Critical Sets**: NEW capability to identify validators whose failure could cause history loss
2. **Explicit Disjoint Quorum Detection**: Found validator without qset creating potential split
3. **More rigorous algorithms**: Uses SAT/MaxSAT/QBF solvers (academically sound)
4. **Better scalability claims**: Authors claim superior performance on large networks
5. **Generic grouping**: Can group by any field (homeDomain, etc.)
6. **Active development**: Recent commits, academic backing

#### Advantages of Current Rust Scanner:
1. **Filtered analysis**: Can exclude faulty/non-validating nodes from blocking sets
2. **Multi-level aggregation**: Built-in support for org/country/ISP merging
3. **Integration**: Already integrated into scan pipeline
4. **Caching**: Top-tier results are cached

#### Critical Issues Identified:
1. **Data Quality**: Validator `GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ` has no qset
   - Need to investigate if this is a data ingestion bug or real network issue
   - Affects splitting set analysis accuracy

---

## Next Steps

### Week 1 Remaining Tasks:
- [ ] Run current Rust scanner on same network snapshot
- [ ] Compare numerical results (top tier size, blocking set size, etc.)
- [ ] Investigate validator with missing qset
- [ ] Performance benchmarking (memory, time at scale)
- [ ] Test on historical snapshots

### Week 2 Integration Planning:
- [ ] Design adapter architecture (HTTP service vs subprocess vs library)
- [ ] Map Python outputs to current domain models
- [ ] Plan feature flag approach for gradual rollout
- [ ] Design fallback/rollback strategy

---

## Technical Notes

### Data Format Compatibility
Python scanner successfully consumed Radar API JSON format without modification:
- Nodes array with `publicKey`, `quorumSet`, `name`, etc.
- Nested `quorumSet` structure: `threshold`, `validators`, `innerQuorumSets`
- Additional metadata (geoData, isp, etc.) ignored but not problematic

### Python Scanner Configuration
Default config used:
```yaml
stellar_data_url: https://radar.withobsrvr.com/api/v1/node
sat_solver: cryptominisat5
card_encoding: totalizer
max_sat_algo: LSU
validator_display: both
```

### Docker Integration
Successfully ran via Docker:
```bash
docker run --rm -v /path/to/data:/work -w /work \
  giulianolosa/python-fbas \
  python-fbas --fbas=/work/network-snapshot.json [command]
```

---

**Status**: ⏱️ 50% through Week 1 (Left side of hill chart - figuring things out)
