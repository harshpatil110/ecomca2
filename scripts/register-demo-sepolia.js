/**
 * scripts/register-demo-sepolia.js
 *
 * Resumable Sepolia Registration Script for Lumina Realty Demo Properties.
 * Targets the deployed PropertyRegistry contract on Sepolia (Chain ID 11155111).
 *
 * Key safety & architectural rules:
 * 1. Contract address: 0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5
 * 2. Never hardcodes private keys. Reads from SEPOLIA_PRIVATE_KEY env var.
 * 3. Reconciles existing on-chain locationReferences before sending any transaction.
 * 4. Resumable via scripts/demo-registration-progress.json: saves after each transaction.
 * 5. Requires explicit --confirm flag to run more than 2 properties in a batch.
 * 6. Rate limits transactions to prevent RPC throttling and nonce issues.
 *
 * Usage:
 *   node scripts/register-demo-sepolia.js --dry-run
 *   node scripts/register-demo-sepolia.js --test 2
 *   node scripts/register-demo-sepolia.js --confirm --limit 10
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env from project root if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    // ignore .env read error
  }
}

// Contract Configuration
const CONTRACT_ADDRESS = '0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5';
const SEPOLIA_CHAIN_ID = 11155111n;

const FALLBACK_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
];

// Minimal ABI required for registration, reconciliation, and admin verification
const REGISTRY_ABI = [
  'function admin() view returns (address)',
  'function getPropertyCount() view returns (uint256)',
  'function getProperty(uint256 propertyId) view returns (tuple(uint256 propertyId, address currentOwner, address registeredBy, string locationReference, bytes32 documentHash, uint256 registrationTimestamp, uint8 status))',
  'function registerProperty(address initialOwner, string locationReference, bytes32 documentHash) returns (uint256)',
  'event PropertyRegistered(uint256 propertyId, address initialOwner, string locationReference, bytes32 documentHash)'
];

const PROGRESS_FILE = path.join(__dirname, 'demo-registration-progress.json');

/**
 * Load or initialize progress tracking file
 */
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      if (data && data.registrations) return data;
    } catch {
      console.warn('[!] Corrupted progress file. Initializing fresh tracking manifest.');
    }
  }

  return {
    contractAddress: CONTRACT_ADDRESS,
    chainId: Number(SEPOLIA_CHAIN_ID),
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    summary: { total: 0, confirmed: 0, pending: 0, failed: 0, skipped: 0 },
    registrations: {}
  };
}

function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

/**
 * Sleep helper for rate limiting and backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Establish working provider from fallback RPC list
 */
async function getHealthyProvider() {
  const rpcCandidate = process.env.SEPOLIA_RPC_URL || FALLBACK_RPC_URLS[0];
  const rpcList = [rpcCandidate, ...FALLBACK_RPC_URLS.filter(r => r !== rpcCandidate)];

  for (const rpc of rpcList) {
    try {
      const provider = new JsonRpcProvider(rpc, { chainId: 11155111, name: 'sepolia' }, { staticNetwork: true });
      const network = await provider.getNetwork();
      if (network.chainId === SEPOLIA_CHAIN_ID) {
        return { provider, rpcUrl: rpc };
      }
    } catch {
      // try next RPC
    }
  }
  throw new Error('Unable to connect to any Sepolia RPC provider.');
}

/**
 * Reconcile currently registered properties on-chain
 */
async function getOnChainRegisteredReferences(contract) {
  const onChainMap = new Map(); // locationReference -> { propertyId, currentOwner, documentHash }
  try {
    const totalCount = await contract.getPropertyCount();
    const count = Number(totalCount);
    console.log(`[i] Total properties currently registered on Sepolia contract: ${count}`);

    for (let i = 1; i <= count; i++) {
      try {
        const prop = await contract.getProperty(BigInt(i));
        const ref = (prop.locationReference || '').trim();
        if (ref) {
          onChainMap.set(ref, {
            propertyId: prop.propertyId.toString(),
            currentOwner: prop.currentOwner,
            documentHash: prop.documentHash
          });
        }
      } catch (err) {
        console.warn(`    Warning: failed reading on-chain property #${i}:`, err.message);
      }
    }
  } catch (err) {
    console.warn('[!] Could not query on-chain property count:', err.message);
  }
  return onChainMap;
}

/**
 * Main execution routine
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isTest = args.includes('--test');
  const hasConfirm = args.includes('--confirm');

  let limit = 1000;
  const limitIdx = args.indexOf('--limit');
  const testIdx = args.indexOf('--test');

  if (testIdx !== -1 && args[testIdx + 1] && !args[testIdx + 1].startsWith('--')) {
    limit = parseInt(args[testIdx + 1], 10);
  } else if (isTest) {
    limit = 2; // Default test batch size
  } else if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }

  // Safety gate: Require --confirm or --test for batches > 2
  if (!isDryRun && limit > 2 && !hasConfirm) {
    console.error(`\n[SAFETY HALT] Bulk registration of ${limit} properties requires explicit confirmation.`);
    console.error(`Reason: The contract registers one property per transaction.`);
    console.error(`Each transaction consumes Sepolia testnet ETH and gas.\n`);
    console.error(`To perform a small test run first (1-2 properties):`);
    console.error(`  node scripts/register-demo-sepolia.js --test 2\n`);
    console.error(`To explicitly proceed with a larger batch:`);
    console.error(`  node scripts/register-demo-sepolia.js --limit ${limit} --confirm\n`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  Lumina Realty - Sepolia Demo Registration Workflow`);
  console.log(`======================================================`);
  console.log(`Target Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Target Chain:    Sepolia (ID: ${SEPOLIA_CHAIN_ID})`);
  console.log(`Mode:            ${isDryRun ? 'DRY-RUN (Safe Read-Only Simulation)' : isTest ? `TEST BATCH (limit: ${limit})` : `BATCH (limit: ${limit})`}`);

  // Load demo properties from JSON
  const dataPath = path.join(__dirname, '../src/data/demoProperties.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`\n[ERROR] Demo data not found at ${dataPath}.`);
    console.error(`Please run: node scripts/generate-demo-properties.js --count 1000`);
    process.exit(1);
  }

  const allDemoProps = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`[✓] Loaded ${allDemoProps.length} demo property definitions from store.`);

  // Connect to Sepolia Provider
  const { provider, rpcUrl } = await getHealthyProvider();
  console.log(`[✓] Connected to Sepolia RPC: ${rpcUrl}`);

  const readContract = new Contract(CONTRACT_ADDRESS, REGISTRY_ABI, provider);
  const contractAdmin = await readContract.admin();
  console.log(`[✓] Contract Admin on-chain: ${contractAdmin}`);

  // Reconcile on-chain records
  console.log(`\nReconciling existing on-chain registrations...`);
  const onChainMap = await getOnChainRegisteredReferences(readContract);

  // Load progress manifest
  const progress = loadProgress();

  // Reconcile existing records into progress manifest
  let alreadyRegisteredCount = 0;
  for (const item of allDemoProps) {
    if (onChainMap.has(item.propertyRef)) {
      const match = onChainMap.get(item.propertyRef);
      progress.registrations[item.propertyRef] = {
        websiteId: item.id,
        propertyRef: item.propertyRef,
        status: 'confirmed',
        blockchainPropertyId: match.propertyId,
        documentHash: match.documentHash,
        reconciledFromChain: true,
        lastUpdated: new Date().toISOString()
      };
      alreadyRegisteredCount++;
    }
  }
  saveProgress(progress);

  console.log(`[i] Reconciled ${alreadyRegisteredCount} properties already confirmed on-chain.`);

  // Find remaining unconfirmed properties
  const candidates = allDemoProps.filter((item) => {
    const existing = progress.registrations[item.propertyRef];
    return !existing || existing.status !== 'confirmed';
  });

  console.log(`[i] Unregistered candidate properties: ${candidates.length} of ${allDemoProps.length}`);

  if (candidates.length === 0) {
    console.log(`\n[✓] All ${allDemoProps.length} properties are already registered on Sepolia!`);
    printFinalSummary(progress, allDemoProps.length);
    return;
  }

  const batchToProcess = candidates.slice(0, limit);
  console.log(`[i] This run will process: ${batchToProcess.length} properties.`);

  if (isDryRun) {
    console.log(`\n--- Dry-Run Execution Plan ---`);
    batchToProcess.slice(0, 5).forEach((p, idx) => {
      console.log(`  ${idx + 1}. Website ID: ${p.id} | Ref: ${p.propertyRef} | Loc: ${p.location}`);
      console.log(`     Placeholder Hash: ${p.documentHash.slice(0, 18)}... (Synthetic Demo Hash)`);
    });
    if (batchToProcess.length > 5) {
      console.log(`  ... and ${batchToProcess.length - 5} more.`);
    }
    console.log(`\n[INFO] Dry-run complete. No transactions sent, no gas spent.`);
    return;
  }

  // Setup Signer
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error(`\n[ERROR] Missing SEPOLIA_PRIVATE_KEY environment variable.`);
    console.error(`To register properties on-chain, provide your private key securely in .env or CLI:`);
    console.error(`  SEPOLIA_PRIVATE_KEY="0x..." node scripts/register-demo-sepolia.js --test 2`);
    console.error(`Note: Never commit private keys to git.`);
    process.exit(1);
  }

  const wallet = new Wallet(privateKey, provider);
  const signerAddress = await wallet.getAddress();
  console.log(`[✓] Signer Address: ${signerAddress}`);

  if (signerAddress.toLowerCase() !== contractAdmin.toLowerCase()) {
    console.warn(`[!] WARNING: Signer address (${signerAddress}) does not match contract admin (${contractAdmin}).`);
    console.warn(`    The contract requires admin privileges to call registerProperty().`);
  }

  const balance = await provider.getBalance(signerAddress);
  console.log(`[✓] Signer Sepolia Balance: ${(Number(balance) / 1e18).toFixed(4)} ETH`);

  if (balance === 0n) {
    console.error(`[ERROR] Signer account has 0 Sepolia ETH. Please fund it with testnet ETH.`);
    process.exit(1);
  }

  const writeContract = new Contract(CONTRACT_ADDRESS, REGISTRY_ABI, wallet);

  console.log(`\nBeginning registration of ${batchToProcess.length} properties (Sequential rate-limited)...`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < batchToProcess.length; i++) {
    const item = batchToProcess[i];
    console.log(`\n[${i + 1}/${batchToProcess.length}] Processing ${item.id} (${item.propertyRef})...`);

    // Double check if already registered on-chain
    if (onChainMap.has(item.propertyRef)) {
      console.log(`    → Already registered on-chain. Skipping.`);
      continue;
    }

    // Record pending attempt in progress
    progress.registrations[item.propertyRef] = {
      websiteId: item.id,
      propertyRef: item.propertyRef,
      status: 'pending',
      attemptedAt: new Date().toISOString()
    };
    saveProgress(progress);

    let retries = 3;
    let txReceipt = null;
    let confirmedPropertyId = null;

    while (retries > 0 && !txReceipt) {
      try {
        console.log(`    Submitting registerProperty("${item.initialOwner || signerAddress}", "${item.propertyRef}", "${item.documentHash.slice(0, 10)}...")...`);
        
        // Fee data estimation for Sepolia
        const feeData = await provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 120n) / 100n : undefined;
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : undefined;

        const tx = await writeContract.registerProperty(
          item.initialOwner || signerAddress,
          item.propertyRef,
          item.documentHash,
          {
            maxFeePerGas,
            maxPriorityFeePerGas
          }
        );

        console.log(`    Transaction submitted: ${tx.hash}`);
        console.log(`    Waiting for 1 block confirmation...`);

        const receipt = await tx.wait(1);
        txReceipt = receipt;

        // Parse PropertyRegistered event
        if (receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = writeContract.interface.parseLog(log);
              if (parsed && parsed.name === 'PropertyRegistered') {
                confirmedPropertyId = parsed.args.propertyId.toString();
                break;
              }
            } catch {
              // ignore non-matching logs
            }
          }
        }

        if (!confirmedPropertyId) {
          // Fallback to latest property count
          const newCount = await readContract.getPropertyCount();
          confirmedPropertyId = newCount.toString();
        }

        console.log(`    [SUCCESS] Confirmed in block #${receipt.blockNumber}! Assigned Blockchain Property ID: #${confirmedPropertyId}`);

        // Update progress file
        progress.registrations[item.propertyRef] = {
          websiteId: item.id,
          propertyRef: item.propertyRef,
          status: 'confirmed',
          blockchainPropertyId: confirmedPropertyId,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          confirmedAt: new Date().toISOString(),
          initialOwner: item.initialOwner || signerAddress,
          documentHash: item.documentHash
        };
        saveProgress(progress);

        // Also update local data/demoProperties.json so website matches confirmed on-chain state
        updateLocalJsonFile(dataPath, item.id, confirmedPropertyId, receipt.hash);

        successCount++;
      } catch (err) {
        retries--;
        const errMsg = err?.message || String(err);
        console.warn(`    [!] Transaction attempt failed (${retries} retries left): ${errMsg}`);

        if (retries > 0) {
          console.log(`    Backing off for 4 seconds before retry...`);
          await sleep(4000);
        } else {
          progress.registrations[item.propertyRef] = {
            websiteId: item.id,
            propertyRef: item.propertyRef,
            status: 'failed',
            error: errMsg,
            failedAt: new Date().toISOString()
          };
          saveProgress(progress);
          failureCount++;
        }
      }
    }

    // Rate-limiting delay between sequential transactions
    if (i < batchToProcess.length - 1) {
      console.log(`    Cooldown delay (2500ms) before next transaction...`);
      await sleep(2500);
    }
  }

  printFinalSummary(progress, allDemoProps.length, successCount, failureCount);
}

/**
 * Updates a single property in the local demo JSON file
 */
function updateLocalJsonFile(filePath, websiteId, blockchainPropertyId, txHash) {
  try {
    if (!fs.existsSync(filePath)) return;
    const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const idx = list.findIndex(p => p.id === websiteId);
    if (idx !== -1) {
      list[idx].blockchainPropertyId = blockchainPropertyId;
      list[idx].blockchainTxHash = txHash;
      list[idx].badge = 'Blockchain registered';
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn(`[!] Failed updating local JSON file:`, err.message);
  }
}

/**
 * Print summary report
 */
function printFinalSummary(progress, totalTarget, runSuccess = 0, runFailed = 0) {
  const allEntries = Object.values(progress.registrations);
  const confirmed = allEntries.filter(e => e.status === 'confirmed').length;
  const failed = allEntries.filter(e => e.status === 'failed').length;
  const pending = allEntries.filter(e => e.status === 'pending').length;

  console.log(`\n======================================================`);
  console.log(`  Sepolia Demo Registration Final Report`);
  console.log(`======================================================`);
  console.log(`Total Target Properties:      ${totalTarget}`);
  console.log(`Confirmed On-Chain:           ${confirmed} / ${totalTarget}`);
  console.log(`Failed / Pending:             ${failed + pending}`);
  if (runSuccess > 0 || runFailed > 0) {
    console.log(`Current Session Successful:   ${runSuccess}`);
    console.log(`Current Session Failed:       ${runFailed}`);
  }
  console.log(`Progress File:                ${PROGRESS_FILE}`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('\n[FATAL SCRIPT ERROR]', err);
  process.exit(1);
});
