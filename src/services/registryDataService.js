import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, ZeroAddress } from 'ethers';
import registryAbi from '../blockchain/registryAbi.json';
import {
  REGISTRY_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_RPC_URLS,
  isSepoliaNetwork,
} from '../blockchain/registryConfig';
import { getListings, subscribeToListings } from './listingsStore';

const STATUS_MAP = {
  0: 'Registered',
  1: 'Disputed',
  2: 'Suspended',
};

function formatAddress(addr) {
  if (!addr || typeof addr !== 'string') return '—';
  const clean = addr.trim();
  if (clean.length < 12) return clean;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

let cachedState = {
  records: [],
  onChainRecords: [],
  contractAdmin: null,
  events: [],
  metrics: {
    totalBlockchainRecords: null,
    registeredProperties: 0,
    disputedProperties: 0,
    suspendedProperties: 0,
    registrationRequired: 0,
    verifiedDocuments: 0,
    ownershipTransfers: 0,
  },
  isLoading: true,
  isRpcUnavailable: false,
  rpcError: null,
  lastRefreshedAt: null,
};

const listeners = new Set();
function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(cachedState);
    } catch (err) {
      console.warn('[registryDataService] Listener error:', err);
    }
  }
}

/**
 * Gets a viable Sepolia provider (MetaMask BrowserProvider if on Sepolia, else public RPC)
 */
async function getViableProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const bp = new BrowserProvider(window.ethereum);
      const net = await bp.getNetwork();
      if (isSepoliaNetwork(net.chainId)) {
        return bp;
      }
    } catch {
      // Fall through to public RPC
    }
  }

  for (const url of SEPOLIA_RPC_URLS) {
    try {
      const rp = new JsonRpcProvider(
        url,
        { chainId: Number(SEPOLIA_CHAIN_ID), name: 'sepolia' },
        { staticNetwork: true }
      );
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC probe timeout')), 2500)
      );
      await Promise.race([rp.getBlockNumber(), timeout]);
      return rp;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Main Data Fetcher and Reconciler
 */
export async function refreshRegistryData() {
  cachedState = {
    ...cachedState,
    isLoading: true,
    rpcError: null,
  };
  notifyListeners();

  const localListings = getListings();
  const provider = await getViableProvider();

  if (!provider) {
    // Offline / RPC unavailable mode
    const registrationRequired = localListings.filter((l) => !l.blockchainPropertyId).length;
    const knownBlockchainListings = localListings.filter((l) => Boolean(l.blockchainPropertyId));

    cachedState = {
      ...cachedState,
      records: localListings.map((l) => ({
        ...l,
        status: l.blockchainPropertyId ? (l.registryStatus || l.status || 'Registered') : 'Registration Required',
        registryStatus: l.blockchainPropertyId ? (l.registryStatus || l.status || 'Registered') : 'Registration Required',
        isOnChain: Boolean(l.blockchainPropertyId),
      })),
      onChainRecords: [],
      metrics: {
        totalBlockchainRecords: null, // strictly null when on-chain state cannot be determined
        registeredProperties: knownBlockchainListings.filter((l) => (l.registryStatus || l.status) === 'Registered').length,
        disputedProperties: knownBlockchainListings.filter((l) => (l.registryStatus || l.status) === 'Disputed').length,
        suspendedProperties: knownBlockchainListings.filter((l) => (l.registryStatus || l.status) === 'Suspended').length,
        registrationRequired,
        verifiedDocuments: knownBlockchainListings.filter((l) => l.documentHash && !/^0x0+$/.test(l.documentHash)).length,
        ownershipTransfers: 0,
      },
      isLoading: false,
      isRpcUnavailable: true,
      rpcError: 'Unable to reach Ethereum Sepolia RPC endpoints. Displaying local cache.',
      lastRefreshedAt: new Date(),
    };
    notifyListeners();
    return cachedState;
  }

  try {
    const contract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);

    // 1. Fetch Admin and Count
    const [adminAddr, countBig] = await Promise.all([
      contract.admin().catch(() => null),
      contract.getPropertyCount().catch(() => 0n),
    ]);

    const totalCount = Number(countBig);

    // 2. Fetch all on-chain properties in parallel
    const propPromises = [];
    for (let pId = 1; pId <= totalCount; pId++) {
      propPromises.push(
        contract.getProperty(pId).catch((err) => {
          console.warn(`[registryDataService] Failed to fetch property #${pId}:`, err);
          return null;
        })
      );
    }
    const rawProps = await Promise.all(propPromises);

    const onChainRecords = [];
    for (const p of rawProps) {
      if (p && p.propertyId) {
        onChainRecords.push({
          propertyId: p.propertyId.toString(),
          currentOwner: p.currentOwner,
          registeredBy: p.registeredBy,
          locationReference: p.locationReference || '',
          documentHash: p.documentHash || '',
          registrationTimestamp: p.registrationTimestamp?.toString() || '0',
          status: Number(p.status),
          statusLabel: STATUS_MAP[Number(p.status)] || 'Unknown',
        });
      }
    }

    // 3. Query emitted events
    let contractEvents = [];
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 50000);

      const [regLogs, statusLogs, transferLogs] = await Promise.all([
        contract.queryFilter('PropertyRegistered', fromBlock).catch(() => []),
        contract.queryFilter('PropertyStatusUpdated', fromBlock).catch(() => []),
        contract.queryFilter('PropertyTransferred', fromBlock).catch(() => []),
      ]);

      contractEvents = [
        ...regLogs.map((log) => ({
          id: `${log.transactionHash}-${log.index}`,
          type: 'PropertyRegistered',
          propertyId: log.args?.[0]?.toString() || '—',
          initialOwner: log.args?.[1] || '—',
          locationReference: log.args?.[2] || '—',
          documentHash: log.args?.[3] || '—',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
        ...statusLogs.map((log) => ({
          id: `${log.transactionHash}-${log.index}`,
          type: 'PropertyStatusUpdated',
          propertyId: log.args?.[0]?.toString() || '—',
          newStatus: Number(log.args?.[1] ?? 0),
          statusLabel: STATUS_MAP[Number(log.args?.[1] ?? 0)] || 'Unknown',
          reason: log.args?.[2] || '—',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
        ...transferLogs.map((log) => ({
          id: `${log.transactionHash}-${log.index}`,
          type: 'PropertyTransferred',
          propertyId: log.args?.[0]?.toString() || '—',
          newOwner: log.args?.[1] || '—',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        })),
      ].sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (evtErr) {
      console.warn('[registryDataService] Events query error:', evtErr);
    }

    // 4. Reconcile Local Metadata with On-Chain Truth
    // Deduplicate local listings by blockchainPropertyId
    const localByChainId = new Map();
    const seenChainIds = new Set();

    for (const item of localListings) {
      if (item.blockchainPropertyId) {
        const bId = String(item.blockchainPropertyId);
        if (!seenChainIds.has(bId)) {
          seenChainIds.add(bId);
          localByChainId.set(bId, item);
        }
      }
    }

    const combinedRecords = [];
    const matchedChainIds = new Set();

    // 4a. Process all on-chain records
    for (const chainProp of onChainRecords) {
      const bId = chainProp.propertyId;
      matchedChainIds.add(bId);
      const local = localByChainId.get(bId);

      const statusName = STATUS_MAP[chainProp.status] || 'Registered';

      if (local) {
        combinedRecords.push({
          ...local,
          blockchainPropertyId: bId,
          currentOwner: chainProp.currentOwner,
          ownerWallet: chainProp.currentOwner,
          registeredBy: chainProp.registeredBy,
          locationReference: chainProp.locationReference,
          documentHash: chainProp.documentHash,
          registrationTimestamp: chainProp.registrationTimestamp,
          status: statusName,
          statusCode: chainProp.status,
          registryStatus: statusName,
          isOnChain: true,
        });
      } else {
        // Pure on-chain record with no local metadata
        combinedRecords.push({
          id: `CHAIN-${bId}`,
          blockchainPropertyId: bId,
          name: chainProp.locationReference ? `Property #${bId} — ${chainProp.locationReference}` : `Sepolia Property #${bId}`,
          location: chainProp.locationReference || 'Sepolia On-Chain Registry',
          city: 'On-Chain',
          surveyNumber: `SEPOLIA-${bId}`,
          type: 'Registry Deed',
          area: '—',
          ownerName: `Owner (${formatAddress(chainProp.currentOwner)})`,
          currentOwner: chainProp.currentOwner,
          ownerWallet: chainProp.currentOwner,
          registeredBy: chainProp.registeredBy,
          locationReference: chainProp.locationReference,
          documentHash: chainProp.documentHash,
          registrationTimestamp: chainProp.registrationTimestamp,
          status: statusName,
          statusCode: chainProp.status,
          registryStatus: statusName,
          publishedAt: Number(chainProp.registrationTimestamp) > 0
            ? new Date(Number(chainProp.registrationTimestamp) * 1000).toISOString()
            : null,
          isOnChain: true,
          ownershipHistory: [
            {
              owner: chainProp.currentOwner,
              date: Number(chainProp.registrationTimestamp) > 0
                ? new Date(Number(chainProp.registrationTimestamp) * 1000).toISOString()
                : new Date().toISOString(),
              type: 'Initial Registration',
            },
          ],
        });
      }
    }

    // 4b. Process local records that are NOT on-chain (Registration Required)
    for (const local of localListings) {
      if (!local.blockchainPropertyId || !matchedChainIds.has(String(local.blockchainPropertyId))) {
        combinedRecords.push({
          ...local,
          blockchainPropertyId: null,
          status: 'Registration Required',
          statusCode: null,
          registryStatus: 'Registration Required',
          isOnChain: false,
        });
      }
    }

    // 5. Compute Exact Consolidated Metrics
    const registeredProperties = onChainRecords.filter((p) => p.status === 0).length;
    const disputedProperties = onChainRecords.filter((p) => p.status === 1).length;
    const suspendedProperties = onChainRecords.filter((p) => p.status === 2).length;
    const registrationRequired = combinedRecords.filter((p) => !p.isOnChain).length;
    const verifiedDocuments = onChainRecords.filter((p) => p.documentHash && !/^0x0+$/.test(p.documentHash)).length;
    const transferEventCount = contractEvents.filter((e) => e.type === 'PropertyTransferred').length;

    cachedState = {
      records: combinedRecords,
      onChainRecords,
      contractAdmin: adminAddr ? String(adminAddr) : null,
      events: contractEvents,
      metrics: {
        totalBlockchainRecords: totalCount,
        registeredProperties,
        disputedProperties,
        suspendedProperties,
        registrationRequired,
        verifiedDocuments,
        ownershipTransfers: transferEventCount,
      },
      isLoading: false,
      isRpcUnavailable: false,
      rpcError: null,
      lastRefreshedAt: new Date(),
    };

    notifyListeners();
    return cachedState;
  } catch (err) {
    console.error('[registryDataService] Refresh error:', err);
    cachedState = {
      ...cachedState,
      isLoading: false,
      isRpcUnavailable: true,
      rpcError: err.message || 'Error communicating with Sepolia smart contract.',
      lastRefreshedAt: new Date(),
    };
    notifyListeners();
    return cachedState;
  }
}

/**
 * Hook to consume unified registry data in components
 */
export function useRegistryData() {
  const [data, setData] = useState(() => cachedState);
  const initializedRef = useRef(false);

  useEffect(() => {
    listeners.add(setData);
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshRegistryData();
    }
    const unsubStore = subscribeToListings(() => {
      refreshRegistryData();
    });

    return () => {
      listeners.delete(setData);
      unsubStore();
    };
  }, []);

  const refresh = useCallback(() => {
    return refreshRegistryData();
  }, []);

  return {
    ...data,
    refresh,
  };
}

export function getCachedRegistryData() {
  return cachedState;
}

/**
 * Fetch live Sepolia ETH balance for any address
 */
export async function fetchSepoliaBalance(address) {
  if (!address) throw new Error('No address provided');
  const provider = await getViableProvider();
  if (!provider) throw new Error('Cannot reach any Sepolia RPC endpoint');
  const bal = await provider.getBalance(address);
  return (Number(bal) / 1e18).toFixed(6);
}

/**
 * Look up on-chain property by ID
 */
export async function lookupOnChainProperty(propertyId) {
  const pId = Number(propertyId);
  if (!pId || pId <= 0) throw new Error('Invalid Property ID');
  const provider = await getViableProvider();
  if (!provider) throw new Error('Cannot reach any Sepolia RPC endpoint');
  const contract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);

  const raw = await contract.getProperty(pId);
  if (!raw || !raw[0] || raw[0] === ZeroAddress) {
    throw new Error(`Property #${pId} not found on Ethereum Sepolia.`);
  }

  let history = [];
  try {
    const rawHist = await contract.getOwnershipHistory(pId);
    history = rawHist.map((rec) => ({
      owner: rec.owner || rec[0],
      transferTimestamp: Number(rec.transferTimestamp || rec[1] || 0),
    }));
  } catch {
    // history fallback
  }

  return {
    propertyId: pId,
    currentOwner: raw[0],
    locationReference: raw[1] || '',
    documentHash: raw[2] || '',
    registrationTimestamp: Number(raw[3] || 0),
    registeredBy: raw[4] || '',
    status: Number(raw[5] || 0),
    statusName: STATUS_MAP[Number(raw[5] || 0)] || 'Unknown',
    ownershipHistory: history,
  };
}
