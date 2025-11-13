#!/usr/bin/env node

/**
 * Test script for Rust FBAS scanner comparison
 * Runs same analyses as Python scanner for side-by-side comparison
 */

const fs = require('fs');
const path = require('path');
const stellar_analysis = require('@stellarbeat/stellar_analysis_nodejs');

console.log('=== Rust FBAS Scanner Test ===\n');

// Load network snapshot
const snapshotPath = process.argv[2] || path.join(__dirname, '..', '..', 'python-fbas-evaluation', 'network-snapshot.json');
const absolutePath = path.resolve(snapshotPath);
console.log(`Loading network snapshot from: ${absolutePath}`);
const nodes = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
console.log(`Loaded ${nodes.length} nodes\n`);

// Extract organizations from nodes
const orgMap = new Map();
nodes.forEach(node => {
  if (node.organizationId && !orgMap.has(node.organizationId)) {
    // Create organization object
    const orgValidators = nodes
      .filter(n => n.organizationId === node.organizationId)
      .map(n => n.publicKey);

    orgMap.set(node.organizationId, {
      id: node.organizationId,
      name: node.organizationId, // Could extract from first node name
      validators: orgValidators
    });
  }
});

const organizations = Array.from(orgMap.values());
console.log(`Extracted ${organizations.length} organizations\n`);

// Map nodes to FBAS analysis format (filter out nodes without quorum sets)
const fbasNodes = nodes
  .filter(node => node.quorumSet && node.quorumSet.threshold > 0)
  .map(node => ({
    publicKey: node.publicKey,
    name: node.name || null,
    quorumSet: node.quorumSet,
    geoData: node.geoData ? {
      countryName: node.geoData.countryName || null
    } : null,
    isp: node.isp || null
  }));

console.log(`Filtered to ${fbasNodes.length} nodes with valid quorum sets\n`);

// Identify faulty nodes (not validating, but have quorum sets)
const fbasPublicKeys = new Set(fbasNodes.map(n => n.publicKey));
const faultyNodes = nodes
  .filter(node => fbasPublicKeys.has(node.publicKey) && !node.isValidating)
  .map(node => node.publicKey);

console.log(`Identified ${faultyNodes.length} non-validating (faulty) nodes\n`);

// Prepare JSON strings
const fbasJSON = JSON.stringify(fbasNodes);
const orgsJSON = JSON.stringify(organizations);
const faultyJSON = JSON.stringify(faultyNodes);

// MergeBy enum values
const MergeBy = {
  DoNotMerge: 0,
  Orgs: 1,
  ISPs: 2,
  Countries: 3
};

console.log('Starting FBAS Analysis...\n');
console.log('═'.repeat(60));

// 1. Top Tier Analysis (no merge)
console.log('\n1. TOP TIER ANALYSIS');
console.log('─'.repeat(60));
const startTopTier = Date.now();
try {
  const topTierResult = stellar_analysis.analyze_top_tier(
    fbasJSON,
    orgsJSON,
    MergeBy.DoNotMerge
  );
  const timeTopTier = Date.now() - startTopTier;

  console.log(`Top Tier Size: ${topTierResult.top_tier_size}`);
  console.log(`Cache Hit: ${topTierResult.cache_hit}`);
  console.log(`Top Tier Members (${topTierResult.top_tier.length}):`);
  topTierResult.top_tier.slice(0, 10).forEach(key => {
    const node = nodes.find(n => n.publicKey === key);
    console.log(`  - ${key} ${node ? `(${node.name || 'Unknown'})` : ''}`);
  });
  if (topTierResult.top_tier.length > 10) {
    console.log(`  ... and ${topTierResult.top_tier.length - 10} more`);
  }
  console.log(`\nExecution Time: ${timeTopTier}ms`);
} catch (error) {
  console.error('ERROR:', error.message);
}

// 2. Symmetric Top Tier
console.log('\n2. SYMMETRIC TOP TIER ANALYSIS');
console.log('─'.repeat(60));
const startSymmetric = Date.now();
try {
  const symmetricResult = stellar_analysis.analyze_symmetric_top_tier(
    fbasJSON,
    orgsJSON,
    MergeBy.DoNotMerge
  );
  const timeSymmetric = Date.now() - startSymmetric;

  console.log(`Has Symmetric Top Tier: ${symmetricResult.symmetric_top_tier ? 'YES' : 'NO'}`);
  if (symmetricResult.symmetric_top_tier) {
    console.log(`Threshold: ${symmetricResult.symmetric_top_tier.threshold}`);
    console.log(`Validators: ${symmetricResult.symmetric_top_tier.validators.length}`);
  }
  console.log(`\nExecution Time: ${timeSymmetric}ms`);
} catch (error) {
  console.error('ERROR:', error.message);
}

// 3. Minimal Blocking Sets
console.log('\n3. MINIMAL BLOCKING SETS ANALYSIS');
console.log('─'.repeat(60));
const startBlocking = Date.now();
try {
  const blockingResult = stellar_analysis.analyze_minimal_blocking_sets(
    fbasJSON,
    orgsJSON,
    faultyJSON,
    MergeBy.DoNotMerge
  );
  const timeBlocking = Date.now() - startBlocking;

  console.log(`Minimal Blocking Set Size: ${blockingResult.min}`);
  console.log(`Total Sets Found: ${blockingResult.size}`);
  console.log(`Example Blocking Set (${blockingResult.result[0]?.length || 0} validators):`);
  if (blockingResult.result[0]) {
    blockingResult.result[0].forEach(key => {
      const node = nodes.find(n => n.publicKey === key);
      console.log(`  - ${key} ${node ? `(${node.name || 'Unknown'})` : ''}`);
    });
  }
  console.log(`\nExecution Time: ${timeBlocking}ms`);
} catch (error) {
  console.error('ERROR:', error.message);
}

// 4. Minimal Splitting Sets
console.log('\n4. MINIMAL SPLITTING SETS ANALYSIS');
console.log('─'.repeat(60));
const startSplitting = Date.now();
try {
  const splittingResult = stellar_analysis.analyze_minimal_splitting_sets(
    fbasJSON,
    orgsJSON,
    MergeBy.DoNotMerge
  );
  const timeSplitting = Date.now() - startSplitting;

  console.log(`Minimal Splitting Set Size: ${splittingResult.min}`);
  console.log(`Total Sets Found: ${splittingResult.size}`);
  if (splittingResult.result[0]) {
    console.log(`Example Splitting Set (${splittingResult.result[0].length} validators):`);
    splittingResult.result[0].slice(0, 5).forEach(key => {
      const node = nodes.find(n => n.publicKey === key);
      console.log(`  - ${key} ${node ? `(${node.name || 'Unknown'})` : ''}`);
    });
    if (splittingResult.result[0].length > 5) {
      console.log(`  ... and ${splittingResult.result[0].length - 5} more`);
    }
  }
  console.log(`\nExecution Time: ${timeSplitting}ms`);
} catch (error) {
  console.error('ERROR:', error.message);
}

// 5. Minimal Quorums
console.log('\n5. MINIMAL QUORUMS ANALYSIS');
console.log('─'.repeat(60));
const startQuorums = Date.now();
try {
  const quorumsResult = stellar_analysis.analyze_minimal_quorums(
    fbasJSON,
    orgsJSON,
    MergeBy.DoNotMerge
  );
  const timeQuorums = Date.now() - startQuorums;

  console.log(`Quorum Intersection: ${quorumsResult.quorum_intersection ? 'YES' : 'NO'}`);
  console.log(`Minimal Quorum Size: ${quorumsResult.min}`);
  console.log(`Total Quorums Found: ${quorumsResult.size}`);
  console.log(`Example Minimal Quorum (${quorumsResult.result[0]?.length || 0} validators):`);
  if (quorumsResult.result[0]) {
    quorumsResult.result[0].forEach(key => {
      const node = nodes.find(n => n.publicKey === key);
      console.log(`  - ${key} ${node ? `(${node.name || 'Unknown'})` : ''}`);
    });
  }
  console.log(`\nExecution Time: ${timeQuorums}ms`);
} catch (error) {
  console.error('ERROR:', error.message);
}

console.log('\n═'.repeat(60));
console.log('\n=== Test Complete ===');
