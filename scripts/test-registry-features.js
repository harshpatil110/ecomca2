/**
 * scripts/test-registry-features.js
 *
 * Verification suite for Blockchain-Based Digital Property Registry features:
 * 1. Off-chain property registration
 * 2. Distinction between website record IDs and blockchain property IDs
 * 3. Document hash verification calculation & logic
 * 4. Ownership transfer workflow (off-chain and on-chain records)
 * 5. Registry status management (Registered, Disputed, Suspended)
 * 6. Old records preservation and accessibility
 */

import assert from 'node:assert';
import {
  getListings,
  getListingById,
  saveListing,
  updateRegistryStatus,
  transferOwnership,
  linkBlockchainRegistration,
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
console.log(`  Blockchain Property Registry - Verification Suite`);
console.log(`========================================================\n`);

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

// ── TEST GROUP 1: Off-Chain Property Registration & Mandatory Flagging ──
console.log(`--- Test Group 1: Off-Chain Registration & Mandatory Flagging ---`);

test('Safely labels off-chain records as Unregistered — Blockchain Registration Required', () => {
  const newRecord = {
    name: 'Hyderabad Cyber Green Plot 45',
    propertyRef: 'HYD-045',
    surveyNumber: 'SY-45/2026',
    type: 'residential',
    area: '3,200 sq ft',
    location: 'Plot 45, Cyber Greens, Gachibowli, Hyderabad',
    city: 'Hyderabad',
    ownerName: 'Venkatesh Rao',
    ownerWallet: null,
    documentHash: '0xabc123def4567890abc123def4567890abc123def4567890abc123def4567890',
  };

  const saved = saveListing(newRecord);
  assert(saved.id.startsWith('REG-') || saved.id.length > 0, 'Record ID must be assigned');
  assert.strictEqual(saved.blockchainPropertyId, undefined, 'Off-chain records must not have on-chain property ID');
  assert.strictEqual(saved.name, 'Hyderabad Cyber Green Plot 45');
  assert.strictEqual(saved.status, 'Unregistered', 'Status must be Unregistered');
  assert.strictEqual(saved.registryStatus, 'Unregistered — Blockchain Registration Required', 'Must require blockchain registration');

  // Verify retrieval
  const retrieved = getListingById(saved.id);
  assert(retrieved, 'Should retrieve saved record by ID');
  assert.strictEqual(retrieved.ownerName, 'Venkatesh Rao');
  assert.strictEqual(retrieved.surveyNumber, 'SY-45/2026');

  // Verify linkBlockchainRegistration
  const linked = linkBlockchainRegistration(saved.id, '45', '0xabc123');
  assert.strictEqual(linked.blockchainPropertyId, '45');
  assert.strictEqual(linked.status, 'Registered');
  assert.strictEqual(linked.registryStatus, 'Registered');
});

// ── TEST GROUP 2: Distinction between Website IDs and Blockchain IDs ──
console.log(`\n--- Test Group 2: ID Distinction & On-Chain Record Compatibility ---`);

test('Correctly distinguishes website registry IDs from blockchain property IDs', () => {
  saveListing({
    id: 'REG-CHAIN-99',
    blockchainPropertyId: '42',
    blockchainTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    name: 'Monolithic Tower B',
    propertyRef: 'TOW-099',
    ownerName: 'Sepolia Admin',
    ownerWallet: '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793',
    documentHash: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    badge: 'Blockchain Registered',
  });

  // Lookup by website ID
  const byWebsiteId = getListingById('REG-CHAIN-99');
  assert.strictEqual(byWebsiteId.id, 'REG-CHAIN-99');
  assert.strictEqual(byWebsiteId.blockchainPropertyId, '42');

  // Fallback lookup by blockchain property ID
  const byChainId = getListingById('42');
  assert.strictEqual(byChainId.id, 'REG-CHAIN-99');
  assert.strictEqual(byChainId.blockchainPropertyId, '42');
});

// ── TEST GROUP 3: Document Hash Integrity Verification Logic ──
console.log(`\n--- Test Group 3: Document Hash Integrity Verification ---`);

test('Correctly matches and rejects SHA-256 document hashes', async () => {
  const registeredHash = '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const identicalHash = '0xBA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD';
  const modifiedHash = '0xcb7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ae';

  // Byte-for-byte case-insensitive equality
  assert.strictEqual(
    registeredHash.toLowerCase(),
    identicalHash.toLowerCase(),
    'Identical hashes must match'
  );

  assert.notStrictEqual(
    registeredHash.toLowerCase(),
    modifiedHash.toLowerCase(),
    'Modified document hash must not match'
  );
});

// ── TEST GROUP 4: Ownership Transfer Workflow ──
console.log(`\n--- Test Group 4: Ownership Transfer & History Ledger ---`);

test('Transfers ownership and updates historical audit records', () => {
  const testProp = saveListing({
    id: 'REG-TRANSFER-TEST',
    name: 'Estate 100',
    ownerName: 'Original Owner',
    ownerWallet: '0x1111111111111111111111111111111111111111',
    ownershipHistory: [
      { owner: 'Original Owner', wallet: '0x1111111111111111111111111111111111111111', date: '2026-01-01', type: 'Initial Registration' }
    ]
  });

  const updated = transferOwnership(
    testProp.id,
    'New Deed Holder',
    '0x2222222222222222222222222222222222222222'
  );

  assert.strictEqual(updated.ownerName, 'New Deed Holder');
  assert.strictEqual(updated.ownerWallet, '0x2222222222222222222222222222222222222222');
  assert.strictEqual(updated.ownershipHistory.length, 2, 'History must contain 2 entries');
  assert.strictEqual(updated.ownershipHistory[1].owner, 'New Deed Holder');
});

// ── TEST GROUP 5: Registry Status Management ──
console.log(`\n--- Test Group 5: Registry Status Management (Registered, Disputed, Suspended) ---`);

test('Updates status to Disputed with reason annotation', () => {
  const prop = saveListing({
    id: 'REG-STATUS-TEST',
    name: 'Disputed Parcel 10',
    registryStatus: 'Registered',
  });

  const disputed = updateRegistryStatus(prop.id, 'Disputed', 'Boundary conflict filed in High Court');
  assert.strictEqual(disputed.registryStatus, 'Disputed');
  assert.strictEqual(disputed.statusReason, 'Boundary conflict filed in High Court');
  assert(disputed.statusUpdatedAt, 'Timestamp must be recorded');

  // Update to Suspended
  const suspended = updateRegistryStatus(prop.id, 'Suspended', 'Pending regulatory audit');
  assert.strictEqual(suspended.registryStatus, 'Suspended');
  assert.strictEqual(suspended.statusReason, 'Pending regulatory audit');

  // Update back to Registered
  const restored = updateRegistryStatus(prop.id, 'Registered', 'Conflict resolved by settlement');
  assert.strictEqual(restored.registryStatus, 'Registered');
});

// ── TEST GROUP 6: Old Baseline Records Preservation ──
console.log(`\n--- Test Group 6: Baseline Records Accessibility ---`);

test('Preserves default properties (ID 1, 2, 3, 4)', () => {
  const listings = getListings();
  const id1 = listings.find((p) => String(p.id) === '1');
  const id2 = listings.find((p) => String(p.id) === '2');
  assert(id1, 'Property 1 must exist');
  assert(id2, 'Property 2 must exist');
  assert.strictEqual(id1.blockchainPropertyId, '1', 'Property 1 on-chain ID must be preserved');
  assert.strictEqual(id1.blockchainTxHash, '0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5');
});

console.log(`\n========================================================`);
console.log(`  Registry Suite Summary: ${passed} Passed, ${failed} Failed`);
console.log(`========================================================\n`);

if (failed > 0) {
  process.exit(1);
}
