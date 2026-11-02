/**
 * scripts/test-features.js
 *
 * Automated verification suite for Bulk Demo Generation and Registry Ownership Transfer Workflow.
 */

import assert from 'node:assert';
import process from 'node:process';
import { generateDemoProperties } from './generate-demo-properties.js';
import {
  getListings,
  saveListing,
  transferOwnership,
  linkBlockchainRegistration,
  updateRegistryStatus,
  importDemoProperties,
  clearDemoProperties,
  getListingById
} from '../src/services/listingsStore.js';

// Polyfill localStorage in Node.js environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };
}

console.log(`\n========================================================`);
console.log(`  Lumina Realty - Automated Features Verification Suite`);
console.log(`========================================================\n`);

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [✓ PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [✗ FAIL] ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ── TEST GROUP 1: Feature A - Demo Data Generation ──
  console.log(`--- Test Group 1: Demo Property Generation ---`);

  test('Generates exactly 1,000 synthetic records', () => {
    const demos = generateDemoProperties(1000);
    assert.strictEqual(demos.length, 1000, `Expected 1000 records, got ${demos.length}`);
  });

  test('All website IDs and property references are strictly unique', () => {
    const demos = generateDemoProperties(1000);
    const idSet = new Set(demos.map((d) => d.id));
    const refSet = new Set(demos.map((d) => d.propertyRef));
    assert.strictEqual(idSet.size, 1000, `Found duplicate website IDs (size: ${idSet.size})`);
    assert.strictEqual(refSet.size, 1000, `Found duplicate propertyRefs (size: ${refSet.size})`);
  });

  test('Website IDs and references avoid colliding with existing default IDs', () => {
    const demos = generateDemoProperties(1000);
    const existingIds = ['1', '2', '3', '4'];
    const existingRefs = ['MUM-001', 'PSP-101', 'JTR-204', 'GRW-088'];
    for (const d of demos) {
      assert(!existingIds.includes(d.id), `Demo ID ${d.id} collided with existing user listing`);
      assert(!existingRefs.includes(d.propertyRef), `Demo ref ${d.propertyRef} collided with existing ref`);
    }
  });

  test('All records include Indian localities, valid metadata, and are marked demo', () => {
    const demos = generateDemoProperties(1000);
    for (let i = 0; i < 50; i++) {
      const d = demos[i];
      assert.strictEqual(d.isDemo, true);
      assert.strictEqual(d.isSyntheticDocument, true);
      assert.strictEqual(d.status, 'Registration Required');
      assert(d.city && d.location, `Missing city/location on ${d.id}`);
      assert(d.documentHash.startsWith('0x') && d.documentHash.length === 66, `Invalid hash on ${d.id}`);
      assert.strictEqual(d.blockchainPropertyId, null, `Unregistered property should have null blockchainPropertyId`);
    }
  });

  // ── TEST GROUP 2: Store Import & Duplicate Prevention ──
  console.log(`\n--- Test Group 2: Listings Store & Demo Import ---`);

  test('Dry-run import reports accurate counts without modifying store', () => {
    const initialListings = getListings();
    const mockDemos = [
      { id: 'TEST-DEMO-01', propertyRef: 'LUM-TEST-01', name: 'Test Villa', type: 'villa' },
      { id: 'TEST-DEMO-02', propertyRef: 'LUM-TEST-02', name: 'Test Estate', type: 'estate' },
      { id: '1', propertyRef: 'MUM-001', name: 'Duplicate Collision', type: 'villa' }, // collision
    ];

    const report = importDemoProperties(mockDemos, { dryRun: true });
    assert.strictEqual(report.dryRun, true);
    assert.strictEqual(report.totalCandidate, 3);
    assert.strictEqual(report.willCreate, 2);
    assert.strictEqual(report.duplicatesSkipped, 1);

    // Verify store was not changed
    const afterListings = getListings();
    assert.strictEqual(afterListings.length, initialListings.length);
  });

  test('Actual import appends new demo properties without overwriting user listings', () => {
    const beforeCount = getListings().length;
    const testProps = [
      { id: 'TEST-DEMO-A', propertyRef: 'LUM-TEST-A', name: 'Test Estate A', type: 'estate' },
      { id: 'TEST-DEMO-B', propertyRef: 'LUM-TEST-B', name: 'Test Estate B', type: 'estate' },
    ];
    const report = importDemoProperties(testProps, { dryRun: false });
    assert.strictEqual(report.willCreate, 2);

    const afterListings = getListings();
    assert.strictEqual(afterListings.length, beforeCount + 2);

    // Verify user listing '1' still exists unchanged
    const prop1 = getListingById('1');
    assert(prop1 && prop1.name === 'The Lumina Heights', 'Original user property was corrupted');
  });

  // ── TEST GROUP 3: Feature B - Ownership Transfer & Registry Lifecycle ──
  console.log(`\n--- Test Group 3: Ownership Transfer & Registry Lifecycle ---`);

  test('Transferring ownership updates current owner, sets lastTransferAt, and appends to audit history', () => {
    // Create temporary off-chain property record
    const testRecord = saveListing({
      id: 'TEST-TRANSFER-1',
      name: 'Banjara Hills Plot 14',
      ownerName: 'Initial Owner Rao',
      ownerWallet: '0x1111111111111111111111111111111111111111',
      ownershipHistory: [
        { owner: 'Initial Owner Rao', wallet: '0x1111111111111111111111111111111111111111', date: '2026-01-01', type: 'Initial Registration' },
      ],
      blockchainPropertyId: null,
    });
    assert.strictEqual(testRecord.ownerName, 'Initial Owner Rao');

    const transferred = transferOwnership('TEST-TRANSFER-1', 'Buyer Verma', '0x2222222222222222222222222222222222222222', '0xabc123tx');
    assert.strictEqual(transferred.ownerName, 'Buyer Verma');
    assert.strictEqual(transferred.ownerWallet, '0x2222222222222222222222222222222222222222');
    assert(transferred.lastTransferAt, 'Missing lastTransferAt timestamp');
    assert.strictEqual(transferred.ownershipHistory.length, 2, 'History must contain 2 records');

    // Confirm persistent retrieval
    const retrieved = getListingById('TEST-TRANSFER-1');
    assert.strictEqual(retrieved.ownerName, 'Buyer Verma');
  });

  test('Transferring an on-chain property preserves blockchainPropertyId and documentHash', () => {
    // Property '1' is blockchain registered with propertyId '1'
    const prop1 = getListingById('1');
    assert(prop1.blockchainPropertyId, 'Property 1 must be blockchain registered');
    const originalHash = prop1.documentHash;
    const originalChainId = prop1.blockchainPropertyId;

    const transferred = transferOwnership('1', 'New Registered Custodian', '0x3333333333333333333333333333333333333333', '0xdeadbeeftx');
    assert.strictEqual(transferred.ownerName, 'New Registered Custodian');
    assert.strictEqual(transferred.blockchainPropertyId, originalChainId, 'Blockchain ID was altered');
    assert.strictEqual(transferred.documentHash, originalHash, 'Document hash was altered');

    // Confirm in store
    const inStore = getListingById('1');
    assert.strictEqual(inStore.ownerName, 'New Registered Custodian');
    assert.strictEqual(inStore.blockchainPropertyId, originalChainId);
  });

  test('Updating registry status to Disputed annotates record and preserves on-chain ID', () => {
    const disputed = updateRegistryStatus('1', 'Disputed', 'Title court inquiry #402');
    assert.strictEqual(disputed.registryStatus, 'Disputed');
    assert.strictEqual(disputed.statusReason, 'Title court inquiry #402');

    const inStore = getListingById('1');
    assert.strictEqual(inStore.registryStatus, 'Disputed');
  });

  test('linkBlockchainRegistration transitions an unregistered record to Registered on-chain', () => {
    const linked = linkBlockchainRegistration('TEST-TRANSFER-1', '99', '0x9999txhash');
    assert.strictEqual(linked.blockchainPropertyId, '99');
    assert.strictEqual(linked.registryStatus, 'Registered');
    assert.strictEqual(linked.status, 'Registered');

    const inStore = getListingById('TEST-TRANSFER-1');
    assert.strictEqual(inStore.blockchainPropertyId, '99');
  });

  test('Clear demo properties removes only demo records', () => {
    clearDemoProperties();
    const remaining = getListings();
    assert(remaining.length >= 1, 'Should preserve non-demo listings');
    for (const r of remaining) {
      assert(!r.isDemo, `Found unremoved demo listing ${r.id}`);
    }
  });

  console.log(`\n========================================================`);
  console.log(`  Test Suite Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('[UNCAUGHT TEST RUNNER ERROR]', err);
  process.exit(1);
});
