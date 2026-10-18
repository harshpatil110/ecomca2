/**
 * scripts/check-sepolia-funding.js
 *
 * Read-only Sepolia Test ETH Funding & Gas Requirement Auditor.
 * Analyzes whether an operator wallet holds sufficient testnet ETH to execute
 * a proposed batch of property registrations on the PropertyRegistry contract.
 *
 * Safety & Security:
 * - Read-only: Never sends transactions or requires private keys.
 * - Accurate: Queries live Sepolia balance via JSON-RPC.
 * - Transparent: Never claims to "mint" ETH or alter balances.
 * - Explains verified public faucets and eligibility rules.
 *
 * Usage:
 *   node scripts/check-sepolia-funding.js
 *   node scripts/check-sepolia-funding.js --address 0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793 --count 10
 *   node scripts/check-sepolia-funding.js --count 1000 --gas 135000
 */

import process from 'node:process';
import { JsonRpcProvider, formatEther, parseUnits } from 'ethers';

// Contract admin address on Sepolia
const DEFAULT_ADMIN_ADDRESS = '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793';
const SEPOLIA_CHAIN_ID = 11155111n;

const FALLBACK_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
];

// Verified public faucets for Ethereum Sepolia testnet
export const VERIFIED_FAUCETS = [
  {
    name: 'Google Cloud Web3 Sepolia Faucet',
    url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
    dailyLimit: '0.05 Sepolia ETH',
    requirements: 'Google login. No mainnet balance required.',
  },
  {
    name: 'Alchemy Sepolia Faucet',
    url: 'https://sepoliafaucet.com',
    dailyLimit: '0.5 Sepolia ETH',
    requirements: 'Alchemy login. Requires >= 0.001 ETH on Ethereum mainnet to prevent sybil abuse.',
  },
  {
    name: 'PK910 Proof-of-Work Sepolia Faucet',
    url: 'https://sepolia-faucet.pk910.de',
    dailyLimit: 'Variable (PoW mining in browser)',
    requirements: 'Browser CPU mining. No sign-in or mainnet balance required.',
  },
  {
    name: 'QuickNode Sepolia Faucet',
    url: 'https://faucet.quicknode.com/ethereum/sepolia',
    dailyLimit: '0.05 - 0.1 Sepolia ETH',
    requirements: 'QuickNode account or Twitter verification.',
  },
];

async function getHealthyProvider() {
  const rpcCandidate = process.env.SEPOLIA_RPC_URL || FALLBACK_RPC_URLS[0];
  const rpcList = [rpcCandidate, ...FALLBACK_RPC_URLS.filter((r) => r !== rpcCandidate)];

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

async function checkFunding() {
  const args = process.argv.slice(2);

  // Parse arguments
  const addrIdx = args.indexOf('--address');
  const targetAddress =
    addrIdx !== -1 && args[addrIdx + 1]
      ? args[addrIdx + 1]
      : process.env.SEPOLIA_ADDRESS || DEFAULT_ADMIN_ADDRESS;

  const countIdx = args.indexOf('--count');
  const count = countIdx !== -1 && args[countIdx + 1] ? parseInt(args[countIdx + 1], 10) : 10;

  const gasIdx = args.indexOf('--gas');
  const gasPerTx = gasIdx !== -1 && args[gasIdx + 1] ? parseInt(args[gasIdx + 1], 10) : 125000;

  const priceIdx = args.indexOf('--gas-price');
  const manualGasPriceGwei = priceIdx !== -1 && args[priceIdx + 1] ? parseFloat(args[priceIdx + 1]) : null;

  console.log(`\n=============================================================`);
  console.log(`  Lumina Realty - Sepolia Test ETH Funding & Gas Auditor`);
  console.log(`=============================================================`);
  console.log(`Audited Wallet Address:   ${targetAddress}`);
  console.log(`Target Registrations:     ${count} properties`);
  console.log(`Estimated Gas / TX:       ${gasPerTx.toLocaleString()} gas units`);
  console.log(`Safety Margin Factor:     1.25x (+25% buffer for base fee volatility)`);

  const { provider, rpcUrl } = await getHealthyProvider();
  console.log(`Connected RPC Provider:   ${rpcUrl}`);

  // Fetch current live balance
  const balanceWei = await provider.getBalance(targetAddress);
  const balanceEth = parseFloat(formatEther(balanceWei));

  // Fetch live fee data
  const feeData = await provider.getFeeData();
  const liveMaxFeeGwei = feeData.maxFeePerGas
    ? Number(feeData.maxFeePerGas) / 1e9
    : manualGasPriceGwei || 5.0;

  const gasPriceGwei = manualGasPriceGwei !== null ? manualGasPriceGwei : Math.max(liveMaxFeeGwei, 2.5);

  // Calculations
  const totalGasUnits = BigInt(count) * BigInt(gasPerTx);
  const gasPriceWei = parseUnits(gasPriceGwei.toFixed(4), 'gwei');
  const estimatedCostWei = totalGasUnits * gasPriceWei;
  const estimatedCostEth = parseFloat(formatEther(estimatedCostWei));
  const recommendedCostEth = estimatedCostEth * 1.25;

  const deficitEth = Math.max(0, recommendedCostEth - balanceEth);
  const isSufficient = balanceEth >= recommendedCostEth;

  console.log(`\n---------------- Financial Summary -------------------------`);
  console.log(`Current Sepolia Balance:  ${balanceEth.toFixed(4)} Sepolia ETH`);
  console.log(`Live Estimated Gas Price: ${gasPriceGwei.toFixed(2)} Gwei`);
  console.log(`Total Gas Required:       ${totalGasUnits.toLocaleString()} gas`);
  console.log(`Base Estimated Cost:      ${estimatedCostEth.toFixed(5)} Sepolia ETH`);
  console.log(`Recommended Funding:      ${recommendedCostEth.toFixed(5)} Sepolia ETH (with buffer)`);
  console.log(`Status:                   ${isSufficient ? '[✓] SUFFICIENT FUNDING' : '[!] INSUFFICIENT BALANCE'}`);

  if (!isSufficient) {
    console.log(`Deficit to Faucet:        ${deficitEth.toFixed(5)} Sepolia ETH`);
  }

  console.log(`\n---------------- Reputable Sepolia Faucets -----------------`);
  console.log(`Testnet ETH cannot be minted or faked; obtain test funds from:`);
  VERIFIED_FAUCETS.forEach((f, idx) => {
    console.log(`\n${idx + 1}. ${f.name}`);
    console.log(`   URL:          ${f.url}`);
    console.log(`   Allowance:    ${f.dailyLimit}`);
    console.log(`   Requirements: ${f.requirements}`);
  });

  console.log(`\n---------------- Explorer Reference ------------------------`);
  console.log(`View address on Sepolia Etherscan:`);
  console.log(`https://sepolia.etherscan.io/address/${targetAddress}`);
  console.log(`=============================================================\n`);
}

checkFunding().catch((err) => {
  console.error('\n[ERROR in check-sepolia-funding]', err.message);
  process.exit(1);
});
