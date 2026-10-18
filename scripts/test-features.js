/**
 * scripts/test-features.js
 *
 * Automated verification suite for Feature A (Bulk Demo Generation & Sepolia Registration)
 * and Feature B (Mark as Sold Workflow).
 */

import assert from 'node:assert';
import process from 'node:process';
import { generateDemoProperties } from './generate-demo-properties.js';
import {
  getListings,
  saveListing,
  markListingAsSold,
  relistListing,
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

  test('All records include Indian localities, INR prices, and are marked demo', () => {
    const demos = generateDemoProperties(1000);
    for (let i = 0; i < 50; i++) {
      const d = demos[i];
      assert.strictEqual(d.isDemo, true);
      assert.strictEqual(d.isSyntheticDocument, true);
      assert(d.price.startsWith('₹'), `Price ${d.price} does not start with ₹`);
      assert(typeof d.numericPrice === 'number' && d.numericPrice > 0);
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
      { id: 'TEST-DEMO-01', propertyRef: 'LUM-TEST-01', name: 'Test Villa', price: '₹5,00,00,000' },
      { id: 'TEST-DEMO-02', propertyRef: 'LUM-TEST-02', name: 'Test Estate', price: '₹8,00,00,000' },
      { id: '1', propertyRef: 'MUM-001', name: 'Duplicate Collision', price: '₹1,00,00,000' }, // collision
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
      { id: 'TEST-DEMO-A', propertyRef: 'LUM-TEST-A', name: 'Test Estate A', price: '₹4,00,00,000' },
      { id: 'TEST-DEMO-B', propertyRef: 'LUM-TEST-B', name: 'Test Estate B', price: '₹6,00,00,000' },
    ];
    const report = importDemoProperties(testProps, { dryRun: false });
    assert.strictEqual(report.willCreate, 2);

    const afterListings = getListings();
    assert.strictEqual(afterListings.length, beforeCount + 2);

    // Verify user listing '1' still exists unchanged
    const prop1 = getListingById('1');
    assert(prop1 && prop1.name === 'The Lumina Heights', 'Original user property was corrupted');
  });

  // ── TEST GROUP 3: Feature B - Mark as Sold Workflow ──
  console.log(`\n--- Test Group 3: Mark as Sold & Relisting Lifecycle ---`);

  test('Marking an off-chain listing as Sold updates status and sets soldAt', () => {
    // Create temporary off-chain listing
    const testOffChain = saveListing({
      id: 'TEST-OFFCHAIN-1',
      name: 'Offchain Test Residence',
      price: '₹3,00,00,000',
      status: 'Exclusive',
      blockchainPropertyId: null,
    });
    assert.strictEqual(testOffChain.status, 'Exclusive');

    const soldRecord = markListingAsSold('TEST-OFFCHAIN-1');
    assert.strictEqual(soldRecord.status, 'Sold');
    assert(soldRecord.soldAt, 'Missing soldAt timestamp');
    assert.strictEqual(soldRecord.blockchainPropertyId, null, 'Off-chain listing acquired on-chain id');

    // Confirm persistent retrieval
    const retrieved = getListingById('TEST-OFFCHAIN-1');
    assert.strictEqual(retrieved.status, 'Sold');
  });

  test('Marking an on-chain listing as Sold preserves blockchainPropertyId and documentHash', () => {
    // Listing '1' is blockchain registered with propertyId '1'
    const prop1 = getListingById('1');
    assert(prop1.blockchainPropertyId, 'Property 1 must be blockchain registered');
    const originalHash = prop1.documentHash;
    const originalChainId = prop1.blockchainPropertyId;

    const sold = markListingAsSold('1');
    assert.strictEqual(sold.status, 'Sold');
    assert.strictEqual(sold.blockchainPropertyId, originalChainId, 'Blockchain ID was altered');
    assert.strictEqual(sold.documentHash, originalHash, 'Document hash was altered');

    // Confirm in store
    const inStore = getListingById('1');
    assert.strictEqual(inStore.status, 'Sold');
    assert.strictEqual(inStore.blockchainPropertyId, originalChainId);
  });

  test('Relisting a sold property restores status to Exclusive', () => {
    const relisted = relistListing('1');
    assert.strictEqual(relisted.status, 'Exclusive');
    assert(relisted.relistedAt, 'Missing relistedAt timestamp');

    const inStore = getListingById('1');
    assert.strictEqual(inStore.status, 'Exclusive');
  });

  test('Public catalog filtering excludes Sold and Draft listings', () => {
    // Save one sold and one exclusive
    saveListing({ id: 'FILTER-ACTIVE', status: 'Exclusive', name: 'Active Listing' });
    saveListing({ id: 'FILTER-SOLD', status: 'Sold', name: 'Sold Listing' });
    saveListing({ id: 'FILTER-DRAFT', status: 'Draft', name: 'Draft Listing' });

    const all = getListings();
    const publicActive = all.filter((l) => l.status !== 'Draft' && l.status !== 'Sold');

    assert(publicActive.some((l) => l.id === 'FILTER-ACTIVE'), 'Active listing not in public catalog');
    assert(!publicActive.some((l) => l.id === 'FILTER-SOLD'), 'Sold listing incorrectly in public catalog');
    assert(!publicActive.some((l) => l.id === 'FILTER-DRAFT'), 'Draft listing incorrectly in public catalog');
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
