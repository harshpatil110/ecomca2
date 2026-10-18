import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BrowserProvider,
  Contract,
  getAddress,
  isAddress,
  isHexString,
  JsonRpcProvider,
  ZeroHash,
} from 'ethers';
import registryAbi from '../../blockchain/registryAbi.json';
import {
  REGISTRY_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_EXPLORER,
  SEPOLIA_RPC_URLS,
  isSepoliaNetwork,
} from '../../blockchain/registryConfig';
import { getListings, subscribeToListings, updateListing } from '../../services/listingsStore';
import DocumentIntegrityVerification from '../../blockchain/DocumentIntegrityVerification';

// Enum mappings per contract specification
const STATUS_ENUM = {
  0: 'Registered',
  1: 'Disputed',
  2: 'Suspended',
};

const inputClass =
  'w-full rounded-sm border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none transition-colors font-mono';
const selectClass =
  'w-full rounded-sm border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none transition-colors';
const buttonPrimaryClass =
  'rounded-sm bg-stone-900 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2';
const buttonSecondaryClass =
  'rounded-sm border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2';

function readableError(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    'An unexpected error occurred.'
  );
}

function normalizeAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  try {
    return getAddress(addr.trim()).toLowerCase();
  } catch {
    return addr.trim().toLowerCase();
  }
}

function formatAddress(addr) {
  if (!addr) return 'N/A';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts) {
  if (!ts || ts === '0' || ts === 0) return 'N/A';
  try {
    const d = new Date(Number(ts) * 1000);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

export default function BlockchainManagementDashboard({ embedded = false }) {
  // ── Navigation Tab State ──
  const [activeTab, setActiveTab] = useState('management'); // 'management' | 'register' | 'transfer' | 'lookup' | 'bulk' | 'funding'

  // ── Listings from Store ──
  const [websiteListings, setWebsiteListings] = useState(() => getListings());

  // ── On-Chain Registry Data ──
  const [onChainRecords, setOnChainRecords] = useState({});
  const [onChainCount, setOnChainCount] = useState(null);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);
  const [rpcError, setRpcError] = useState(null);

  // ── Web3 & Wallet State ──
  const [account, setAccount] = useState('');
  const [contractAdmin, setContractAdmin] = useState('');
  const [chainId, setChainId] = useState(null);
  const [walletError, setWalletError] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // ── Toast / General Notification ──
  const [toastMessage, setToastMessage] = useState(null);

  // ── Status Update Modal State ──
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('1'); // '0' | '1' | '2'
  const [statusReason, setStatusReason] = useState('');
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);
  const [modalError, setModalError] = useState('');
  const [txState, setTxState] = useState({
    phase: 'idle', // 'idle' | 'prompting' | 'pending' | 'confirmed' | 'rejected' | 'failed'
    txHash: '',
    blockNumber: null,
    error: '',
  });

  // ── Tab 2: Register Form State ──
  const [registerOwner, setRegisterOwner] = useState('');
  const [registerRef, setRegisterRef] = useState('');
  const [registerDocHash, setRegisterDocHash] = useState(ZeroHash);
  const [registerBusy, setRegisterBusy] = useState(false);
  const [registerMsg, setRegisterMsg] = useState('');
  const [registerErr, setRegisterErr] = useState('');

  // ── Tab 3: Transfer Form State ──
  const [transferPropId, setTransferPropId] = useState('');
  const [transferNewOwner, setTransferNewOwner] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferMsg, setTransferMsg] = useState('');
  const [transferErr, setTransferErr] = useState('');

  // ── Tab 4: Lookup State ──
  const [lookupId, setLookupId] = useState('');
  const [lookupRecord, setLookupRecord] = useState(null);
  const [lookupVerified, setLookupVerified] = useState(null);
  const [lookupHistory, setLookupHistory] = useState([]);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupErr, setLookupErr] = useState('');

  // ── Copy Helper ──
  const [copiedKey, setCopiedKey] = useState('');
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // ── Sepolia Test ETH Funding State ──
  const [sepoliaBalance, setSepoliaBalance] = useState(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // ── Bulk Registration State ──
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkGasPerTx, setBulkGasPerTx] = useState(125000);
  const [bulkPhase, setBulkPhase] = useState('idle'); // 'idle' | 'previewing' | 'running' | 'paused' | 'done'
  const [bulkLog, setBulkLog] = useState([]); // array of { websiteId, ref, status, blockchainId, txHash, error }
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkFailed, setBulkFailed] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkConfirmed, setBulkConfirmed] = useState(false); // explicit operator confirmation
  const bulkAbortRef = useRef(false); // set to true to stop the loop

  // ── Derived Web3 Status ──
  const isSepolia = Boolean(chainId && isSepoliaNetwork(chainId));
  const isAdminMatch = Boolean(
    account && contractAdmin && normalizeAddress(account) === normalizeAddress(contractAdmin)
  );
  const canAdminTransact = Boolean(account && isSepolia && isAdminMatch);

  // ── Subscribe to Local Listings Store ──
  useEffect(() => {
    return subscribeToListings((updated) => setWebsiteListings(updated));
  }, []);

  // ── Sync Wallet State ──
  const syncWallet = useCallback(async (requestAccounts = false) => {
    if (!window.ethereum) {
      if (requestAccounts) {
        setWalletError('MetaMask was not detected. Please install or enable MetaMask.');
      }
      return;
    }

    try {
      if (requestAccounts) setIsConnectingWallet(true);
      const provider = new BrowserProvider(window.ethereum);
      let accounts = [];
      if (requestAccounts) {
        accounts = await provider.send('eth_requestAccounts', []);
      } else {
        accounts = await provider.send('eth_accounts', []);
      }

      const net = await provider.getNetwork();
      setChainId(net.chainId);
      const currentAccount = accounts && accounts.length > 0 ? accounts[0] : '';
      setAccount(currentAccount);

      if (isSepoliaNetwork(net.chainId)) {
        setWalletError('');
      } else if (currentAccount) {
        setWalletError('Wrong network. Please switch MetaMask to Sepolia (Chain ID 11155111).');
      }
    } catch (err) {
      console.error('[BlockchainDashboard] Wallet sync error:', err);
      if (requestAccounts) {
        setWalletError(readableError(err));
      }
    } finally {
      if (requestAccounts) setIsConnectingWallet(false);
    }
  }, []);

  // ── Fetch On-Chain Data from Contract via Public RPC or Browser Provider ──
  const fetchOnChainData = useCallback(async () => {
    setIsLoadingOnChain(true);
    setRpcError(null);

    let provider = null;

    // 1. Try BrowserProvider if available on Sepolia
    if (window.ethereum) {
      try {
        const browserProv = new BrowserProvider(window.ethereum);
        const net = await browserProv.getNetwork();
        if (isSepoliaNetwork(net.chainId)) {
          provider = browserProv;
        }
      } catch {
        // Fallback to public RPC
      }
    }

    // 2. Fallback through configured Sepolia RPC URLs
    if (!provider) {
      for (const url of SEPOLIA_RPC_URLS) {
        try {
          const testProv = new JsonRpcProvider(url, { chainId: 11155111, name: 'sepolia' });
          await testProv.getBlockNumber();
          provider = testProv;
          break;
        } catch {
          continue;
        }
      }
    }

    if (!provider) {
      setRpcError('Unable to connect to Sepolia RPC endpoints. Blockchain status is unavailable.');
      setIsLoadingOnChain(false);
      return;
    }

    try {
      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
      const [adminAddr, countBig] = await Promise.all([
        contract.admin(),
        contract.getPropertyCount(),
      ]);

      const adminStr = String(adminAddr);
      setContractAdmin(adminStr);
      const countNum = Number(countBig);
      setOnChainCount(countNum);

      // Collect IDs to query: 1 through countNum, plus any blockchainPropertyId from listings
      const idsToFetch = new Set();
      for (let i = 1; i <= countNum; i++) {
        idsToFetch.add(String(i));
      }
      const currentListings = getListings();
      currentListings.forEach((item) => {
        if (item.blockchainPropertyId && /^[1-9]\d*$/.test(String(item.blockchainPropertyId))) {
          idsToFetch.add(String(item.blockchainPropertyId));
        }
      });

      const promises = Array.from(idsToFetch).map(async (id) => {
        try {
          const p = await contract.getProperty(id);
          return {
            propertyId: String(p.propertyId),
            currentOwner: p.currentOwner,
            registeredBy: p.registeredBy,
            locationReference: p.locationReference,
            documentHash: p.documentHash,
            registrationTimestamp: p.registrationTimestamp.toString(),
            status: Number(p.status), // 0: Registered, 1: Disputed, 2: Suspended
            isUnavailable: false,
          };
        } catch (err) {
          console.warn(`[BlockchainDashboard] Error reading property #${id}:`, err);
          return {
            propertyId: String(id),
            status: 'unavailable',
            isUnavailable: true,
            error: readableError(err),
          };
        }
      });

      const recordsList = await Promise.all(promises);
      const recordMap = {};
      recordsList.forEach((rec) => {
        recordMap[rec.propertyId] = rec;
      });
      setOnChainRecords(recordMap);
    } catch (err) {
      console.error('[BlockchainDashboard] Failed to query smart contract:', err);
      setRpcError(readableError(err));
    } finally {
      setIsLoadingOnChain(false);
    }
  }, []);

  // ── Switch to Sepolia Network ──
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) {
      setWalletError('MetaMask is not detected. Please install or enable MetaMask.');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID 11155111 in hex
      });
    } catch (switchErr) {
      // Chain not added to MetaMask — add it
      if (switchErr?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        } catch (addErr) {
          setWalletError(readableError(addErr));
        }
      } else if (switchErr?.code !== 4001) {
        setWalletError(readableError(switchErr));
      }
    }
  }, []);

  // ── Fetch Live Sepolia ETH Balance ──
  const fetchSepoliaBalance = useCallback(async (addr) => {
    const targetAddr = addr || account;
    if (!targetAddr) {
      setBalanceError('Connect a wallet to see your Sepolia ETH balance.');
      return;
    }
    setIsFetchingBalance(true);
    setBalanceError('');
    setSepoliaBalance(null);
    try {
      let provider = null;
      if (window.ethereum) {
        try {
          const bp = new BrowserProvider(window.ethereum);
          const net = await bp.getNetwork();
          if (isSepoliaNetwork(net.chainId)) provider = bp;
        } catch { /* fallback */ }
      }
      if (!provider) {
        for (const url of SEPOLIA_RPC_URLS) {
          try {
            const rp = new JsonRpcProvider(url, { chainId: 11155111, name: 'sepolia' });
            await rp.getBlockNumber();
            provider = rp;
            break;
          } catch { continue; }
        }
      }
      if (!provider) throw new Error('Cannot reach any Sepolia RPC endpoint.');
      const bal = await provider.getBalance(targetAddr);
      // Format to 6 decimal places
      const formatted = (Number(bal) / 1e18).toFixed(6);
      setSepoliaBalance(formatted);
    } catch (err) {
      setBalanceError(readableError(err));
    } finally {
      setIsFetchingBalance(false);
    }
  }, [account]);

  // Initial load and MetaMask event listeners
  useEffect(() => {
    syncWallet(false);
    fetchOnChainData();

    if (!window.ethereum) return undefined;

    const handleAccounts = () => {
      syncWallet(false);
      fetchOnChainData();
    };

    const handleChain = () => {
      syncWallet(false);
      fetchOnChainData();
    };

    window.ethereum.on?.('accountsChanged', handleAccounts);
    window.ethereum.on?.('chainChanged', handleChain);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum.removeListener?.('chainChanged', handleChain);
    };
  }, [syncWallet, fetchOnChainData]);

  // ── Compute Dashboard Statistics ──
  const stats = useMemo(() => {
    const totalWebsite = websiteListings.length;
    const blockchainRegistered = websiteListings.filter((l) => Boolean(l.blockchainPropertyId)).length;
    const offChain = websiteListings.filter((l) => !l.blockchainPropertyId).length;

    if (rpcError) {
      return {
        totalWebsite,
        blockchainRegistered,
        offChain,
        disputed: 'Unavailable',
        suspended: 'Unavailable',
        registeredOnChain: 'Unavailable',
        totalOnChain: 'Unavailable',
      };
    }

    const records = Object.values(onChainRecords);
    const disputedCount = records.filter((r) => !r.isUnavailable && r.status === 1).length;
    const suspendedCount = records.filter((r) => !r.isUnavailable && r.status === 2).length;
    const registeredCount = records.filter((r) => !r.isUnavailable && r.status === 0).length;

    return {
      totalWebsite,
      blockchainRegistered,
      offChain,
      disputed: disputedCount,
      suspended: suspendedCount,
      registeredOnChain: registeredCount,
      totalOnChain: onChainCount !== null ? onChainCount : records.length,
    };
  }, [websiteListings, onChainRecords, onChainCount, rpcError]);

  // Check if any property in the registry currently has Disputed or Suspended status
  const hasRestrictedProperties = useMemo(() => {
    if (rpcError) return false;
    return Object.values(onChainRecords).some(
      (r) => !r.isUnavailable && (r.status === 1 || r.status === 2)
    );
  }, [onChainRecords, rpcError]);

  // ── Combined Roster for Management Table ──
  const propertyRoster = useMemo(() => {
    // 1. Start with all website listings
    const mapped = websiteListings.map((item) => {
      const bId = item.blockchainPropertyId ? String(item.blockchainPropertyId) : null;
      const onChainData = bId ? onChainRecords[bId] : null;

      let statusBadge = 'offchain';
      let currentOwner = 'N/A';
      let regTimestamp = null;

      if (bId) {
        if (rpcError || onChainData?.isUnavailable) {
          statusBadge = 'unavailable';
        } else if (onChainData) {
          statusBadge = onChainData.status; // 0, 1, or 2
          currentOwner = onChainData.currentOwner;
          regTimestamp = onChainData.registrationTimestamp;
        } else if (isLoadingOnChain) {
          statusBadge = 'loading';
        } else {
          statusBadge = 'unavailable';
        }
      }

      return {
        key: `website-${item.id}`,
        websiteId: item.id,
        name: item.name,
        city: item.city,
        price: item.price,
        blockchainPropertyId: bId,
        isOffChain: !bId,
        currentOwner,
        registrationTimestamp: regTimestamp,
        onChainStatus: statusBadge,
        statusReason: onChainData?.statusReason || '',
      };
    });

    // 2. Identify pure on-chain records not linked to any website listing
    const linkedBIds = new Set(
      websiteListings
        .filter((l) => l.blockchainPropertyId)
        .map((l) => String(l.blockchainPropertyId))
    );

    Object.values(onChainRecords).forEach((rec) => {
      if (!linkedBIds.has(rec.propertyId)) {
        mapped.push({
          key: `onchain-${rec.propertyId}`,
          websiteId: '—',
          name: rec.locationReference ? `Registry Item (${rec.locationReference})` : `On-Chain Property #${rec.propertyId}`,
          city: 'Sepolia Registry',
          price: '—',
          blockchainPropertyId: rec.propertyId,
          isOffChain: false,
          currentOwner: rec.currentOwner || 'N/A',
          registrationTimestamp: rec.registrationTimestamp,
          onChainStatus: rec.isUnavailable ? 'unavailable' : rec.status,
          statusReason: '',
        });
      }
    });

    return mapped;
  }, [websiteListings, onChainRecords, rpcError, isLoadingOnChain]);

  // ── Open Status Update Modal ──
  const openStatusUpdateModal = (prop) => {
    if (prop.isOffChain) return; // Requirement 14: Off-chain properties do not expose status management
    setSelectedTarget(prop);
    // Suggest a different status by default
    const curStatus = typeof prop.onChainStatus === 'number' ? prop.onChainStatus : 0;
    setSelectedNewStatus(curStatus === 1 ? '0' : '1');
    setStatusReason('');
    setIsConfirmationStep(false);
    setModalError('');
    setTxState({ phase: 'idle', txHash: '', blockNumber: null, error: '' });
    setIsStatusModalOpen(true);
  };

  // ── Handle Modal Proceed to Confirmation Step (Requirement 9) ──
  const handleProceedToConfirmation = (e) => {
    e.preventDefault();
    if (!statusReason.trim()) {
      setModalError('A non-empty reason is strictly required for this on-chain status update.');
      return;
    }
    setModalError('');
    setIsConfirmationStep(true);
  };

  // ── Execute Status Change Transaction (Requirements 6, 7, 8, 10, 11, 12) ──
  const handleConfirmAndSendTx = async () => {
    if (!selectedTarget || !selectedTarget.blockchainPropertyId) return;
    if (!statusReason.trim()) {
      setModalError('A non-empty reason is strictly required.');
      setIsConfirmationStep(false);
      return;
    }

    setModalError('');
    setTxState({
      phase: 'prompting',
      txHash: '',
      blockNumber: null,
      error: '',
    });

    try {
      if (!window.ethereum) throw new Error('MetaMask is not detected. Please install or enable MetaMask.');
      const provider = new BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();

      if (!isSepoliaNetwork(net.chainId)) {
        throw new Error('Please switch MetaMask network to Sepolia (Chain ID 11155111).');
      }

      const signer = await provider.getSigner();
      const currentSignerAddress = await signer.getAddress();

      // Verify connected wallet against contract.admin() (Requirement 10)
      if (!contractAdmin || normalizeAddress(currentSignerAddress) !== normalizeAddress(contractAdmin)) {
        throw new Error(
          `Unauthorized: Connected wallet (${formatAddress(currentSignerAddress)}) is not the contract admin (${formatAddress(contractAdmin)}).`
        );
      }

      const writeContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);
      const propId = selectedTarget.blockchainPropertyId;
      const newStatusNum = Number(selectedNewStatus); // 0, 1, or 2

      // Submit transaction
      const tx = await writeContract.updatePropertyStatus(propId, newStatusNum, statusReason.trim());

      setTxState({
        phase: 'pending',
        txHash: tx.hash,
        blockNumber: null,
        error: '',
      });

      // Wait for block confirmation (Requirement 12: Refresh only after confirmed success)
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setTxState({
          phase: 'confirmed',
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          error: '',
        });

        // Trigger on-chain data refresh
        await fetchOnChainData();

        setToastMessage({
          type: 'success',
          text: `Status for Property #${propId} successfully updated to ${STATUS_ENUM[newStatusNum]} on-chain.`,
        });
      } else {
        setTxState({
          phase: 'failed',
          txHash: tx.hash,
          blockNumber: null,
          error: 'Transaction reverted or failed on-chain.',
        });
      }
    } catch (err) {
      console.error('[BlockchainDashboard] Transaction error:', err);
      const isRejection =
        err?.code === 4001 ||
        err?.code === 'ACTION_REJECTED' ||
        err?.info?.error?.code === 4001 ||
        err?.message?.toLowerCase().includes('user rejected') ||
        err?.message?.toLowerCase().includes('user denied');

      if (isRejection) {
        setTxState({
          phase: 'rejected',
          txHash: '',
          blockNumber: null,
          error: 'Transaction was rejected by the user in MetaMask.',
        });
      } else {
        setTxState({
          phase: 'failed',
          txHash: '',
          blockNumber: null,
          error: readableError(err),
        });
      }
    }
  };

  // ── Tab 2: Register Property Function ──
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterErr('');
    setRegisterMsg('');

    if (!isAddress(registerOwner)) {
      setRegisterErr('Enter a valid Ethereum initial owner address.');
      return;
    }
    if (!registerRef.trim()) {
      setRegisterErr('Enter a location reference (e.g. MUM-001 or LUM-742).');
      return;
    }
    if (!isHexString(registerDocHash, 32)) {
      setRegisterErr('Document hash must be a valid 32-byte hex string (0x followed by 64 hex characters).');
      return;
    }

    if (!canAdminTransact) {
      setRegisterErr('Admin wallet on Sepolia (Chain ID 11155111) is required to register properties.');
      return;
    }

    setRegisterBusy(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);

      const tx = await contract.registerProperty(registerOwner.trim(), registerRef.trim(), registerDocHash);
      setRegisterMsg(`Transaction submitted (Hash: ${tx.hash.slice(0, 10)}...). Waiting for confirmation on Sepolia...`);
      const receipt = await tx.wait();

      let assignedId = '';
      const iface = contract.interface;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'PropertyRegistered') {
            assignedId = parsed.args.propertyId.toString();
            break;
          }
        } catch {
          // ignore unrelated logs
        }
      }

      setRegisterMsg(
        `Property registered successfully!${assignedId ? ` Assigned on-chain ID: #${assignedId}.` : ''} Tx confirmed in block ${receipt.blockNumber}.`
      );
      setRegisterOwner('');
      setRegisterRef('');
      setRegisterDocHash(ZeroHash);
      await fetchOnChainData();
    } catch (err) {
      setRegisterErr(readableError(err));
    } finally {
      setRegisterBusy(false);
    }
  };

  // ── Tab 3: Transfer Property Function ──
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferErr('');
    setTransferMsg('');

    if (!/^[1-9]\d*$/.test(String(transferPropId).trim())) {
      setTransferErr('Enter a valid on-chain property ID (positive integer).');
      return;
    }
    if (!isAddress(transferNewOwner)) {
      setTransferErr('Enter a valid recipient Ethereum address.');
      return;
    }

    // Check if the property is currently Disputed or Suspended
    const rec = onChainRecords[String(transferPropId).trim()];
    if (rec && !rec.isUnavailable && rec.status !== 0) {
      setTransferErr(
        `Ownership transfer blocked: Property #${transferPropId} is currently ${STATUS_ENUM[rec.status]}. The smart contract strictly blocks transfers for disputed or suspended properties.`
      );
      return;
    }

    setTransferBusy(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not detected.');
      const provider = new BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();
      if (!isSepoliaNetwork(net.chainId)) {
        throw new Error('Please switch MetaMask network to Sepolia (Chain ID 11155111).');
      }

      const signer = await provider.getSigner();
      const signerAddr = await signer.getAddress();

      if (rec && rec.currentOwner && normalizeAddress(signerAddr) !== normalizeAddress(rec.currentOwner)) {
        throw new Error(
          `Connected wallet (${formatAddress(signerAddr)}) does not match property owner (${formatAddress(rec.currentOwner)}).`
        );
      }

      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);
      const tx = await contract.transferProperty(transferPropId.trim(), transferNewOwner.trim());
      setTransferMsg(`Transfer transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for confirmation...`);

      const receipt = await tx.wait();
      setTransferMsg(`Ownership transfer confirmed in block ${receipt.blockNumber}! Property #${transferPropId} successfully transferred.`);
      setTransferPropId('');
      setTransferNewOwner('');
      await fetchOnChainData();
    } catch (err) {
      setTransferErr(readableError(err));
    } finally {
      setTransferBusy(false);
    }
  };

  // ── Tab 4: Lookup & Integrity Function ──
  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    setLookupErr('');
    setLookupRecord(null);
    setLookupVerified(null);
    setLookupHistory([]);

    const cleanId = String(lookupId).trim();
    if (!/^[1-9]\d*$/.test(cleanId)) {
      setLookupErr('Enter a valid on-chain property ID.');
      return;
    }

    setLookupBusy(true);
    try {
      let provider = null;
      if (window.ethereum) {
        try {
          const bp = new BrowserProvider(window.ethereum);
          const net = await bp.getNetwork();
          if (isSepoliaNetwork(net.chainId)) provider = bp;
        } catch { /* fallback */ }
      }
      if (!provider) {
        for (const url of SEPOLIA_RPC_URLS) {
          try {
            const testP = new JsonRpcProvider(url, { chainId: 11155111, name: 'sepolia' });
            await testP.getBlockNumber();
            provider = testP;
            break;
          } catch { continue; }
        }
      }

      if (!provider) throw new Error('Could not reach Sepolia RPC.');

      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
      const [prop, isVerified, owners] = await Promise.all([
        contract.getProperty(cleanId),
        contract.verifyProperty(cleanId),
        contract.getOwnershipHistory(cleanId),
      ]);

      setLookupRecord({
        propertyId: prop.propertyId.toString(),
        currentOwner: prop.currentOwner,
        registeredBy: prop.registeredBy,
        locationReference: prop.locationReference,
        documentHash: prop.documentHash,
        registrationTimestamp: prop.registrationTimestamp.toString(),
        status: Number(prop.status),
      });
      setLookupVerified(isVerified);
      setLookupHistory(owners);
    } catch (err) {
      setLookupErr(readableError(err));
    } finally {
      setLookupBusy(false);
    }
  };

  // ── Bulk Registration Engine ──
  // Derives candidates: website listings that have no blockchainPropertyId yet
  const bulkCandidates = useMemo(() => {
    return websiteListings
      .filter((l) => !l.blockchainPropertyId && l.propertyRef)
      .slice(0, bulkCount);
  }, [websiteListings, bulkCount]);

  const appendBulkLog = (entry) => {
    setBulkLog((prev) => [entry, ...prev]);
  };

  const handleBulkRegister = async () => {
    if (!canAdminTransact) return;
    if (!bulkConfirmed) {
      appendBulkLog({ status: 'error', error: 'Please check the confirmation checkbox before starting.' });
      return;
    }
    if (bulkCandidates.length === 0) {
      appendBulkLog({ status: 'error', error: 'No unregistered properties found to register.' });
      return;
    }

    bulkAbortRef.current = false;
    setBulkPhase('running');
    setBulkLog([]);
    setBulkDone(0);
    setBulkFailed(0);
    setBulkTotal(bulkCandidates.length);

    let doneCount = 0;
    let failCount = 0;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();
      if (!isSepoliaNetwork(net.chainId)) {
        appendBulkLog({ status: 'error', error: 'Switch MetaMask to Sepolia (Chain ID 11155111) before starting.' });
        setBulkPhase('idle');
        return;
      }
      const signer = await provider.getSigner();
      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);

      for (let i = 0; i < bulkCandidates.length; i++) {
        if (bulkAbortRef.current) {
          appendBulkLog({ status: 'stopped', error: 'Bulk registration stopped by operator.' });
          break;
        }

        const item = bulkCandidates[i];
        const logKey = item.id || item.propertyRef;

        // Skip if already registered (check live onChainRecords too)
        if (item.blockchainPropertyId) {
          appendBulkLog({ websiteId: item.id, ref: item.propertyRef, status: 'skipped', note: 'Already has blockchainPropertyId' });
          continue;
        }

        appendBulkLog({ websiteId: item.id, ref: item.propertyRef, status: 'pending', note: `[${i + 1}/${bulkCandidates.length}] Submitting to MetaMask...` });

        try {
          const owner = item.initialOwner || account;
          const ref = item.propertyRef || item.id;
          const docHash = item.documentHash || ZeroHash;

          const feeData = await provider.getFeeData();
          const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 120n) / 100n : undefined;
          const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : undefined;

          const tx = await contract.registerProperty(owner, ref, docHash, { maxFeePerGas, maxPriorityFeePerGas });

          // Update log: tx submitted
          setBulkLog((prev) => prev.map((e) =>
            e.websiteId === item.id && e.status === 'pending'
              ? { ...e, status: 'mining', txHash: tx.hash, note: `Tx ${tx.hash.slice(0, 10)}... confirming...` }
              : e
          ));

          const receipt = await tx.wait(1);

          // Parse assigned blockchain property ID from event
          let assignedId = null;
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed?.name === 'PropertyRegistered') {
                assignedId = parsed.args.propertyId.toString();
                break;
              }
            } catch { /* skip non-matching logs */ }
          }

          // Persist the blockchainPropertyId back into the listings store
          if (assignedId) {
            updateListing(item.id, {
              blockchainPropertyId: assignedId,
              blockchainTxHash: receipt.hash,
              badge: 'Blockchain registered',
            });
          }

          setBulkLog((prev) => prev.map((e) =>
            e.websiteId === item.id && e.status === 'mining'
              ? { ...e, status: 'confirmed', blockchainId: assignedId, note: `Confirmed! On-chain ID: #${assignedId} (Block ${receipt.blockNumber})` }
              : e
          ));
          doneCount++;
          setBulkDone(doneCount);
        } catch (err) {
          const isRejection =
            err?.code === 4001 ||
            err?.code === 'ACTION_REJECTED' ||
            err?.message?.toLowerCase().includes('user rejected');

          const errMsg = isRejection ? 'Rejected in MetaMask' : readableError(err);
          setBulkLog((prev) => prev.map((e) =>
            e.websiteId === item.id && (e.status === 'pending' || e.status === 'mining')
              ? { ...e, status: 'failed', error: errMsg }
              : e
          ));
          failCount++;
          setBulkFailed(failCount);

          if (isRejection) {
            // Stop the loop if user rejected — they may not want to keep approving
            appendBulkLog({ status: 'stopped', error: 'Loop stopped: transaction was rejected in MetaMask. Resume or stop manually.' });
            setBulkPhase('paused');
            return;
          }
        }

        // Rate-limit between sequential transactions
        if (i < bulkCandidates.length - 1 && !bulkAbortRef.current) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // Refresh on-chain data after batch
      if (!bulkAbortRef.current) {
        await fetchOnChainData();
        setBulkPhase('done');
        setToastMessage({ type: 'success', text: `Bulk registration complete: ${doneCount} confirmed, ${failCount} failed.` });
      }
    } catch (err) {
      appendBulkLog({ status: 'error', error: readableError(err) });
      setBulkPhase('idle');
    }
  };

  const handleBulkStop = () => {
    bulkAbortRef.current = true;
    setBulkPhase('paused');
  };

  const handleBulkReset = () => {
    bulkAbortRef.current = false;
    setBulkPhase('idle');
    setBulkLog([]);
    setBulkDone(0);
    setBulkFailed(0);
    setBulkTotal(0);
    setBulkConfirmed(false);
  };

  return (
    <div className={embedded ? 'mt-8' : 'pt-8 pb-20 px-12 max-w-7xl mx-auto'}>
      {/* ── Page Header (When Standalone) ── */}
      {!embedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-stone-900 text-lg">token</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                On-Chain Operations Console
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Blockchain Management
            </h1>
            <p className="text-lg font-serif italic text-stone-500 mt-2">
              Auditable governance, real-time registry status verification, and smart contract administration on Sepolia.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchOnChainData();
                syncWallet(false);
              }}
              disabled={isLoadingOnChain}
              className={buttonSecondaryClass}
              title="Refresh live on-chain status from Sepolia contract"
            >
              <span className={`material-symbols-outlined text-sm ${isLoadingOnChain ? 'animate-spin' : ''}`}>
                refresh
              </span>
              Refresh Live Data
            </button>
            <Link
              to="/admin/listings"
              className={buttonSecondaryClass}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-sm">apartment</span>
              Listings Manager
            </Link>
          </div>
        </div>
      )}

      {/* ── Dashboard Title in Embedded Mode ── */}
      {embedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-t border-stone-200/80 pt-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-stone-900 text-base">token</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                Smart Contract Control Center
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Blockchain Registry & Management
            </h2>
            <p className="text-sm font-serif italic text-stone-500 mt-1">
              Live Sepolia registry records, status moderation, and ownership integrity controls.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchOnChainData();
                syncWallet(false);
              }}
              disabled={isLoadingOnChain}
              className={buttonSecondaryClass}
            >
              <span className={`material-symbols-outlined text-sm ${isLoadingOnChain ? 'animate-spin' : ''}`}>
                refresh
              </span>
              Sync Contract State
            </button>
          </div>
        </div>
      )}

      {/* ── Dashboard Statistics Cards (Requirement 2 & 3) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {/* Total Website Listings */}
        <div className="bg-white p-5 border border-stone-200 rounded-sm shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Website Listings
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              {stats.totalWebsite}
            </span>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Store</span>
          </div>
        </div>

        {/* Blockchain Registered Listings */}
        <div className="bg-white p-5 border border-stone-200 rounded-sm shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Blockchain Registered
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tighter text-emerald-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              {stats.blockchainRegistered}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">On-Chain</span>
          </div>
        </div>

        {/* Off-Chain Listings */}
        <div className="bg-white p-5 border border-stone-200 rounded-sm shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Off-Chain Listings
          </p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tighter text-stone-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {stats.offChain}
            </span>
            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-sm">Local</span>
          </div>
        </div>

        {/* On-Chain Disputed Status */}
        <div className={`p-5 border rounded-sm shadow-sm flex flex-col justify-between ${
          stats.disputed > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              Disputed Status
            </p>
            {stats.disputed > 0 && (
              <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-black tracking-tighter ${
              rpcError ? 'text-stone-400 text-xl' : stats.disputed > 0 ? 'text-amber-800' : 'text-stone-900'
            }`} style={{ fontFamily: 'Inter, sans-serif' }}>
              {stats.disputed}
            </span>
            <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              Enum 1
            </span>
          </div>
        </div>

        {/* On-Chain Suspended Status */}
        <div className={`p-5 border rounded-sm shadow-sm flex flex-col justify-between ${
          stats.suspended > 0 ? 'bg-rose-50/60 border-rose-300' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              Suspended Status
            </p>
            {stats.suspended > 0 && (
              <span className="material-symbols-outlined text-rose-600 text-sm">block</span>
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-3xl font-black tracking-tighter ${
              rpcError ? 'text-stone-400 text-xl' : stats.suspended > 0 ? 'text-rose-800' : 'text-stone-900'
            }`} style={{ fontFamily: 'Inter, sans-serif' }}>
              {stats.suspended}
            </span>
            <span className="text-[9px] font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              Enum 2
            </span>
          </div>
        </div>
      </div>

      {/* ── RPC Failure Alert (Requirement 15) ── */}
      {rpcError && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3 text-red-800 text-sm">
          <span className="material-symbols-outlined text-red-600 text-xl shrink-0 mt-0.5">error</span>
          <div className="flex-1">
            <p className="font-bold uppercase tracking-wider text-xs">Sepolia RPC Connection Unavailable</p>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Live blockchain data could not be retrieved from the network. On-chain registry statuses are marked as <strong>Unavailable</strong> to prevent misleading verification claims.
            </p>
            <button
              onClick={fetchOnChainData}
              disabled={isLoadingOnChain}
              className="mt-3 bg-red-800 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-red-700 transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* ── Global Restriction Notice Banner for Disputed & Suspended (Requirement 13) ── */}
      {hasRestrictedProperties && (
        <div className="mb-8 bg-[#fef7ee] border-l-4 border-amber-500 border-stone-200 border p-4 rounded-sm flex items-start gap-4">
          <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0">gavel</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Active Smart Contract Restriction Notice
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              One or more properties currently have <strong>Disputed</strong> or <strong>Suspended</strong> status on-chain.
              Under the deployed Sepolia smart contract rules, ownership transfer functions (<code className="font-mono font-bold">transferProperty</code>) are strictly prohibited and will revert on-chain for these records until restored to <strong>Registered</strong> status by an authorized admin.
            </p>
          </div>
        </div>
      )}

      {/* ── Smart Contract Admin & Wallet Authorization Bar (Requirement 10) ── */}
      <div className="bg-white border border-stone-200 rounded-sm p-5 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs flex-1">
            {/* Contract Info */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Registry Contract (Sepolia)
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`${SEPOLIA_EXPLORER}/address/${REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-stone-900 hover:underline font-bold"
                >
                  {formatAddress(REGISTRY_ADDRESS)}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(REGISTRY_ADDRESS, 'contract')}
                  className="text-stone-400 hover:text-stone-900 text-xs"
                  title="Copy contract address"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedKey === 'contract' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Smart Contract Admin */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Contract Admin Wallet (admin())
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-stone-900 font-bold">
                  {contractAdmin ? formatAddress(contractAdmin) : isLoadingOnChain ? 'Checking contract...' : 'Unavailable'}
                </span>
                {contractAdmin && (
                  <button
                    type="button"
                    onClick={() => handleCopy(contractAdmin, 'admin')}
                    className="text-stone-400 hover:text-stone-900 text-xs"
                    title="Copy admin address"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedKey === 'admin' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Connected Wallet */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Connected Account
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-stone-900 font-bold">
                  {account ? formatAddress(account) : 'Not Connected'}
                </span>
                {account && (
                  <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                    isSepolia ? 'bg-stone-100 text-stone-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {isSepolia ? 'Sepolia (11155111)' : `Chain ${chainId?.toString() || '?'}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action & Verification Badge */}
          <div className="flex items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-200">
            {account ? (
              <div className="flex items-center gap-2 flex-wrap">
                {isAdminMatch && isSepolia ? (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Authorized Admin
                  </span>
                ) : !isSepolia ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      Wrong Network
                    </span>
                    <button
                      type="button"
                      onClick={switchToSepolia}
                      className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-stone-700 transition flex items-center gap-1.5"
                      title="Switch MetaMask to Sepolia Testnet (Chain ID 11155111)"
                    >
                      <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                      Switch to Sepolia
                    </button>
                  </div>
                ) : (
                  <span className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" title="Connected wallet does not match contract admin address">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    Unauthorized (Non-Admin)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => syncWallet(true)}
                  className="text-stone-500 hover:text-stone-900 text-xs font-bold uppercase tracking-wider underline ml-1"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => syncWallet(true)}
                disabled={isConnectingWallet}
                className={buttonPrimaryClass}
              >
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                {isConnectingWallet ? 'Connecting...' : 'Connect Admin Wallet'}
              </button>
            )}
          </div>
        </div>

        {walletError && (
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-red-600 font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{walletError}</span>
          </div>
        )}
      </div>

      {/* ── Sub-Navigation Tabs (Consolidated Tools, Zero Duplication) ── */}
      <div className="flex border-b border-stone-200 mb-8 overflow-x-auto gap-1">
        {[
          { id: 'management', label: 'Status Moderation & Roster', icon: 'tune' },
          { id: 'register', label: 'Register Property On-Chain', icon: 'add_circle' },
          { id: 'transfer', label: 'Ownership Transfer', icon: 'swap_horiz' },
          { id: 'lookup', label: 'Lookup & Hash Verification', icon: 'verified' },
          { id: 'bulk', label: 'Bulk Registration', icon: 'deployed_code_update' },
          { id: 'funding', label: 'Sepolia Test ETH', icon: 'water_drop' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                active
                  ? 'border-stone-900 text-stone-900 bg-white'
                  : 'border-transparent text-stone-400 hover:text-stone-800'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: STATUS MANAGEMENT & LISTING ROSTER (Core Req 4, 5, 6, 7, 8, 14) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fbf9f4]">
              <div>
                <h3 className="text-lg font-black tracking-tight text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Property Roster & Governance Status
                </h3>
                <p className="text-xs font-serif italic text-stone-500 mt-0.5">
                  Live comparison of website listings and Sepolia on-chain registry records.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Registered (0)
                </span>
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Disputed (1)
                </span>
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span> Suspended (2)
                </span>
                <span className="flex items-center gap-1.5 text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-stone-300"></span> Off-chain
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead className="bg-[#f5f4ed]">
                  <tr className="border-b border-stone-200">
                    <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">
                      Website ID / Property
                    </th>
                    <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">
                      Blockchain ID
                    </th>
                    <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">
                      Current Owner
                    </th>
                    <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">
                      Registration Time
                    </th>
                    <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">
                      On-Chain Status
                    </th>
                    <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 text-stone-600 text-xs">
                  {propertyRoster.map((prop) => {
                    const isRestricted = prop.onChainStatus === 1 || prop.onChainStatus === 2;
                    return (
                      <tr key={prop.key} className="hover:bg-[#fbf9f4] transition-colors">
                        {/* Website ID & Title */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-bold text-stone-900">{prop.name}</p>
                              <p className="text-[11px] text-stone-400 font-mono">
                                Website ID: {prop.websiteId} · {prop.city}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Blockchain Property ID */}
                        <td className="py-4 px-6">
                          {prop.blockchainPropertyId ? (
                            <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-200">
                              #{prop.blockchainPropertyId}
                            </span>
                          ) : (
                            <span className="font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm text-[10px]">
                              Off-chain
                            </span>
                          )}
                        </td>

                        {/* Current Owner */}
                        <td className="py-4 px-6">
                          {prop.currentOwner !== 'N/A' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-medium text-stone-800" title={prop.currentOwner}>
                                {formatAddress(prop.currentOwner)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(prop.currentOwner, prop.key)}
                                className="text-stone-400 hover:text-stone-900"
                                title="Copy address"
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {copiedKey === prop.key ? 'check' : 'content_copy'}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">N/A (Off-chain)</span>
                          )}
                        </td>

                        {/* Registration Timestamp */}
                        <td className="py-4 px-6 text-stone-500 font-sans">
                          {formatTimestamp(prop.registrationTimestamp)}
                        </td>

                        {/* On-Chain Status Badge (Exact Enums 0, 1, 2) */}
                        <td className="py-4 px-6">
                          {prop.isOffChain ? (
                            <span className="bg-stone-100 text-stone-500 border border-stone-200 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                              Off-chain
                            </span>
                          ) : prop.onChainStatus === 'unavailable' ? (
                            <span className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Unavailable
                            </span>
                          ) : prop.onChainStatus === 'loading' ? (
                            <span className="bg-stone-100 text-stone-400 px-2.5 py-1 rounded-sm text-[10px] font-mono animate-pulse">
                              Loading...
                            </span>
                          ) : prop.onChainStatus === 0 ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Registered (0)
                            </span>
                          ) : prop.onChainStatus === 1 ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                Disputed (1)
                              </span>
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                                Transfers Blocked
                              </span>
                            </div>
                          ) : prop.onChainStatus === 2 ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="bg-rose-50 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                Suspended (2)
                              </span>
                              <span className="text-[9px] font-bold text-rose-800 bg-rose-100/70 border border-rose-200 px-1.5 py-0.5 rounded-sm">
                                Transfers Blocked
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400">Unknown</span>
                          )}
                        </td>

                        {/* Actions (Requirement 6 & 14) */}
                        <td className="py-4 px-6 text-right">
                          {prop.isOffChain ? (
                            <span className="text-[10px] font-medium text-stone-400 italic">
                              Off-chain listing
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => openStatusUpdateModal(prop)}
                                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all shadow-sm ${
                                  canAdminTransact
                                    ? isRestricted
                                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                                      : 'bg-stone-900 text-white hover:bg-stone-800'
                                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                }`}
                                title={
                                  !account
                                    ? 'Connect MetaMask to update status'
                                    : !isSepolia
                                    ? 'Switch to Sepolia to update status'
                                    : !isAdminMatch
                                    ? 'Only contract admin wallet can change status'
                                    : 'Change on-chain property status'
                                }
                              >
                                Update Status
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: REGISTER PROPERTY (Preserving Core Registry Functionality)  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div className="bg-white border border-stone-200 rounded-sm p-8 max-w-3xl shadow-sm">
          <div className="mb-6 border-b border-stone-200 pb-4">
            <h3 className="text-2xl font-serif italic text-stone-900">Register On-Chain Property Record</h3>
            <p className="text-xs font-serif text-stone-500 mt-1">
              Admin-only action: writes a brand-new sequential record to the Sepolia smart contract.
            </p>
          </div>

          {registerMsg && (
            <div className="mb-6 p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{registerMsg}</span>
            </div>
          )}
          {registerErr && (
            <div className="mb-6 p-4 rounded-sm bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{registerErr}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Initial Owner Address (0x...)
              </label>
              <input
                className={inputClass}
                value={registerOwner}
                onChange={(e) => setRegisterOwner(e.target.value)}
                placeholder="0x..."
                disabled={registerBusy}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Property Reference / Identifier
              </label>
              <input
                className={inputClass}
                value={registerRef}
                onChange={(e) => setRegisterRef(e.target.value)}
                placeholder="e.g. MUM-001 or LUM-742"
                disabled={registerBusy}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Document Hash (bytes32 Hex)
              </label>
              <input
                className={inputClass}
                value={registerDocHash}
                onChange={(e) => setRegisterDocHash(e.target.value)}
                placeholder="0x..."
                disabled={registerBusy}
                required
              />
              <p className="text-[11px] text-stone-400 mt-1 italic">
                Use ZeroHash (0x00...00) or generate SHA-256 hash using the integrity verification tool.
              </p>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end gap-4 items-center">
              <button
                type="submit"
                disabled={registerBusy || !canAdminTransact}
                className={buttonPrimaryClass}
              >
                {registerBusy ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Submitting to Sepolia...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    Register on Blockchain
                  </>
                )}
              </button>
            </div>
            {!canAdminTransact && (
              <p className="text-[11px] text-amber-700 text-right mt-1">
                {!account
                  ? 'Connect MetaMask to enable registration.'
                  : !isSepolia
                  ? 'Switch MetaMask to Sepolia (Chain ID 11155111).'
                  : 'Only the smart contract admin wallet can register properties.'}
              </p>
            )}
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: OWNERSHIP TRANSFER (Preserving Core Registry Functionality) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfer' && (
        <div className="bg-white border border-stone-200 rounded-sm p-8 max-w-3xl shadow-sm">
          <div className="mb-6 border-b border-stone-200 pb-4">
            <h3 className="text-2xl font-serif italic text-stone-900">Transfer On-Chain Property Ownership</h3>
            <p className="text-xs font-serif text-stone-500 mt-1">
              Must be called by the current on-chain owner's wallet. Blocked automatically for disputed or suspended properties.
            </p>
          </div>

          {transferMsg && (
            <div className="mb-6 p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{transferMsg}</span>
            </div>
          )}
          {transferErr && (
            <div className="mb-6 p-4 rounded-sm bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{transferErr}</span>
            </div>
          )}

          <form onSubmit={handleTransferSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                On-Chain Property ID
              </label>
              <input
                className={inputClass}
                value={transferPropId}
                onChange={(e) => setTransferPropId(e.target.value)}
                placeholder="e.g. 1"
                disabled={transferBusy}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                New Owner Address (0x...)
              </label>
              <input
                className={inputClass}
                value={transferNewOwner}
                onChange={(e) => setTransferNewOwner(e.target.value)}
                placeholder="0x..."
                disabled={transferBusy}
                required
              />
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end gap-4 items-center">
              <button
                type="submit"
                disabled={transferBusy || !account || !isSepolia}
                className={buttonPrimaryClass}
              >
                {transferBusy ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Executing Transfer...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                    Execute Transfer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: LOOKUP & INTEGRITY VERIFICATION                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'lookup' && (
        <div className="space-y-8 max-w-4xl">
          <div className="bg-white border border-stone-200 rounded-sm p-8 shadow-sm">
            <h3 className="text-2xl font-serif italic text-stone-900 mb-4">On-Chain Property Lookup</h3>
            <form onSubmit={handleLookupSubmit} className="flex gap-3">
              <input
                className={inputClass}
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter On-Chain Property ID (e.g. 1)"
                disabled={lookupBusy}
              />
              <button type="submit" disabled={lookupBusy} className={buttonPrimaryClass}>
                {lookupBusy ? 'Querying...' : 'Lookup'}
              </button>
            </form>

            {lookupErr && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
                {lookupErr}
              </div>
            )}

            {lookupRecord && (
              <div className="mt-8 border-t border-stone-200 pt-6 space-y-6">
                <div className={`p-4 rounded-sm border ${
                  lookupVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <p className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      {lookupVerified ? 'verified' : 'warning'}
                    </span>
                    {lookupVerified ? 'Registered Status Confirmed' : 'Not Currently Verified'}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed">
                    {lookupVerified
                      ? 'The smart contract reports this record exists and holds Registered (0) status.'
                      : 'The record is in Disputed (1) or Suspended (2) status, restricting transfers.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-stone-400 block mb-1">Property ID</span>
                    <span className="font-mono font-bold text-stone-900">#{lookupRecord.propertyId}</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-stone-400 block mb-1">Status</span>
                    <span className="font-bold">{STATUS_ENUM[lookupRecord.status] || 'Unknown'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold uppercase tracking-wider text-stone-400 block mb-1">Current Owner</span>
                    <span className="font-mono break-all">{lookupRecord.currentOwner}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold uppercase tracking-wider text-stone-400 block mb-1">Document Hash</span>
                    <span className="font-mono text-stone-700 break-all">{lookupRecord.documentHash}</span>
                  </div>
                </div>

                {lookupHistory.length > 0 && (
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-stone-400 text-xs mb-3">Ownership Chain of Custody</h4>
                    <ol className="space-y-1.5 text-xs font-mono">
                      {lookupHistory.map((addr, idx) => (
                        <li key={`${addr}-${idx}`} className="bg-[#fbf9f4] p-2 rounded-sm border border-stone-200 flex items-center gap-2">
                          <span className="font-bold text-stone-400">{idx + 1}.</span>
                          <span className="break-all">{addr}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Embedded Document Integrity Verification Tool */}
                <div className="pt-6 border-t border-stone-200">
                  <DocumentIntegrityVerification
                    onChainDocumentHash={lookupRecord.documentHash}
                    blockchainPropertyId={lookupRecord.propertyId}
                    verificationState={lookupVerified ? 'verified' : 'unverified'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: BULK REGISTRATION                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bulk' && (
        <div className="space-y-8 max-w-5xl">

          {/* ── Safety Banner ── */}
          <div className="bg-amber-50 border border-amber-300 rounded-sm p-5 flex items-start gap-4">
            <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0">warning</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                Bulk On-Chain Registration — Real Sepolia Transactions
              </h3>
              <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
                Each registration sends a real Sepolia transaction via MetaMask — MetaMask will prompt you for every single TX.
                Start with a small batch (5–10) first to verify gas and flow. All registered properties immediately appear as
                <strong> Blockchain registered</strong> on the website after confirmation.
              </p>
            </div>
          </div>

          {/* ── Configuration & Candidate Preview ── */}
          <div className="bg-white border border-stone-200 rounded-sm p-8 shadow-sm">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Registration Batch Configuration
                </h3>
                <p className="text-xs font-serif italic text-stone-500 mt-0.5">Select batch size, review candidates, confirm gas, then start.</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-1.5 ${
                canAdminTransact ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${canAdminTransact ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                {canAdminTransact ? 'Admin Wallet Ready' : account ? (!isSepolia ? 'Switch to Sepolia' : 'Non-Admin Wallet') : 'Wallet Not Connected'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-[#f5f4ed] rounded-sm p-4 border border-stone-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Unregistered</p>
                <p className="text-3xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {websiteListings.filter((l) => !l.blockchainPropertyId && l.propertyRef).length}
                </p>
              </div>
              <div className="bg-[#f5f4ed] rounded-sm p-4 border border-stone-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Selected Batch</p>
                <p className="text-3xl font-black tracking-tighter text-emerald-800" style={{ fontFamily: 'Inter, sans-serif' }}>{bulkCandidates.length}</p>
              </div>
              <div className="bg-[#f5f4ed] rounded-sm p-4 border border-stone-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Est. Cost @5gwei</p>
                <p className="text-xl font-black tracking-tighter text-stone-700 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {((bulkCandidates.length * bulkGasPerTx * 5 * 1.25) / 1e9).toFixed(5)}
                  <span className="text-sm text-stone-400 ml-1">ETH</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Batch Size
                </label>
                <input
                  type="number" min={1} max={1000} value={bulkCount}
                  onChange={(e) => setBulkCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
                  disabled={bulkPhase === 'running'} className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Estimated Gas per TX
                </label>
                <input
                  type="number" min={80000} max={500000} step={5000} value={bulkGasPerTx}
                  onChange={(e) => setBulkGasPerTx(Math.max(80000, Number(e.target.value)))}
                  disabled={bulkPhase === 'running'} className={inputClass}
                />
                <p className="text-[11px] text-stone-400 mt-1 italic">registerProperty() typically uses 120,000–135,000 gas.</p>
              </div>
            </div>

            {bulkCandidates.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Candidate Preview (first {Math.min(5, bulkCandidates.length)} of {bulkCandidates.length})
                </p>
                <div className="overflow-x-auto border border-stone-200 rounded-sm">
                  <table className="w-full text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <thead className="bg-[#f5f4ed] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-4 text-left font-black text-[10px] uppercase tracking-widest text-stone-400">#</th>
                        <th className="py-2.5 px-4 text-left font-black text-[10px] uppercase tracking-widest text-stone-400">Website ID</th>
                        <th className="py-2.5 px-4 text-left font-black text-[10px] uppercase tracking-widest text-stone-400">Ref</th>
                        <th className="py-2.5 px-4 text-left font-black text-[10px] uppercase tracking-widest text-stone-400">Name</th>
                        <th className="py-2.5 px-4 text-left font-black text-[10px] uppercase tracking-widest text-stone-400">Initial Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {bulkCandidates.slice(0, 5).map((item, idx) => (
                        <tr key={item.id} className="hover:bg-[#fbf9f4]">
                          <td className="py-2.5 px-4 text-stone-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono text-stone-700">{item.id}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-stone-900">{item.propertyRef}</td>
                          <td className="py-2.5 px-4 text-stone-600 max-w-[180px] truncate">{item.name}</td>
                          <td className="py-2.5 px-4 font-mono text-stone-500">{formatAddress(item.initialOwner || account || '—')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkCandidates.length > 5 && (
                    <p className="text-center text-[11px] text-stone-400 py-2 italic">… and {bulkCandidates.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {bulkCandidates.length === 0 && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-sm p-4 text-xs text-emerald-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                All website listings with a property reference are already registered on-chain.
              </div>
            )}

            {bulkPhase === 'idle' && bulkCandidates.length > 0 && (
              <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-stone-50 border border-stone-200 rounded-sm">
                <input
                  type="checkbox" checked={bulkConfirmed} onChange={(e) => setBulkConfirmed(e.target.checked)}
                  className="mt-0.5 accent-stone-900 h-4 w-4 shrink-0"
                />
                <span className="text-xs text-stone-700 leading-relaxed">
                  I understand this will submit <strong>{bulkCandidates.length} real Sepolia transactions</strong> via MetaMask,
                  consuming approximately <strong>{((bulkCandidates.length * bulkGasPerTx * 5 * 1.25) / 1e9).toFixed(5)} Sepolia ETH</strong> in gas.
                  MetaMask will prompt me for each transaction. I have verified my balance in the
                  <button type="button" onClick={() => setActiveTab('funding')} className="underline font-semibold mx-1">Sepolia Test ETH tab</button>
                  and I am ready to proceed.
                </span>
              </label>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {(bulkPhase === 'idle' || bulkPhase === 'paused') && (
                <button type="button" onClick={handleBulkRegister}
                  disabled={!canAdminTransact || bulkCandidates.length === 0 || !bulkConfirmed}
                  className={buttonPrimaryClass}>
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  {bulkPhase === 'paused' ? 'Resume Registration' : 'Start Bulk Registration'}
                </button>
              )}
              {bulkPhase === 'running' && (
                <button type="button" onClick={handleBulkStop}
                  className="rounded-sm bg-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-amber-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">pause_circle</span>
                  Stop After Current TX
                </button>
              )}
              {(bulkPhase === 'paused' || bulkPhase === 'done') && (
                <button type="button" onClick={handleBulkReset} className={buttonSecondaryClass}>
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset
                </button>
              )}
              <button type="button" onClick={() => setActiveTab('funding')} className={buttonSecondaryClass}>
                <span className="material-symbols-outlined text-sm">water_drop</span>
                Check Balance
              </button>
            </div>

            {!canAdminTransact && (
              <p className="text-[11px] text-amber-700 mt-3">
                {!account ? 'Connect Admin Wallet above to enable bulk registration.' : !isSepolia ? 'Switch MetaMask to Sepolia (Chain ID 11155111).' : 'Connected wallet is not the contract admin.'}
              </p>
            )}
          </div>

          {/* ── Live Progress Log ── */}
          {(bulkPhase === 'running' || bulkPhase === 'paused' || bulkPhase === 'done') && bulkTotal > 0 && (
            <div className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-black uppercase tracking-tight text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {bulkPhase === 'running' ? '⟳ Registration in Progress…' : bulkPhase === 'done' ? '✓ Batch Complete' : '⏸ Paused'}
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-700 font-bold">{bulkDone} confirmed</span>
                  {bulkFailed > 0 && <span className="text-red-600 font-bold">{bulkFailed} failed</span>}
                  <span className="text-stone-400">{bulkTotal} total</span>
                </div>
              </div>
              <div className="h-2 bg-stone-100 rounded-full mb-5 overflow-hidden">
                <div className="h-full bg-stone-900 rounded-full transition-all duration-500"
                  style={{ width: `${bulkTotal > 0 ? Math.round(((bulkDone + bulkFailed) / bulkTotal) * 100) : 0}%` }} />
              </div>
              <div className="bg-stone-950 rounded-sm p-4 max-h-64 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {bulkLog.length === 0 && <p className="text-stone-500 italic">Initialising…</p>}
                {bulkLog.map((entry, idx) => {
                  const color = entry.status === 'confirmed' ? 'text-emerald-400' : entry.status === 'failed' ? 'text-red-400' : entry.status === 'mining' ? 'text-amber-300' : entry.status === 'stopped' ? 'text-amber-500' : entry.status === 'error' ? 'text-red-300' : entry.status === 'skipped' ? 'text-stone-500' : 'text-stone-300';
                  const icon = entry.status === 'confirmed' ? '✓' : entry.status === 'failed' ? '✗' : entry.status === 'mining' ? '⟳' : entry.status === 'stopped' ? '⏸' : entry.status === 'error' ? '!' : entry.status === 'skipped' ? '–' : '·';
                  return (
                    <div key={idx} className={`flex items-start gap-2 ${color}`}>
                      <span className="shrink-0 font-bold w-4">{icon}</span>
                      <div className="flex-1 min-w-0">
                        {entry.websiteId && <span className="text-stone-400 mr-2">[{entry.websiteId} / {entry.ref}]</span>}
                        {entry.status === 'confirmed' && entry.blockchainId && (
                          <span>On-chain ID <strong className="text-emerald-300">#{entry.blockchainId}</strong>
                            {entry.txHash && <a href={`${SEPOLIA_EXPLORER}/tx/${entry.txHash}`} target="_blank" rel="noreferrer" className="ml-2 underline text-emerald-500">↗ Etherscan</a>}
                          </span>
                        )}
                        {entry.note && <span>{entry.note}</span>}
                        {entry.error && <span className="break-all">{entry.error}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {bulkPhase === 'done' && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Batch complete. {bulkDone} properties registered on Sepolia and labelled <strong>Blockchain registered</strong> in the website store.
                  {bulkFailed > 0 && ` ${bulkFailed} failed — reset and retry.`}
                </div>
              )}
            </div>
          )}

          {/* ── CLI Reference ── */}
          <div className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-tight text-stone-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>CLI Alternative: register-demo-sepolia.js</h3>
            <p className="text-xs text-stone-500 italic mb-4">For large batches (&gt;50), the CLI script handles rate-limiting, progress-saving, and resume automatically.</p>
            <div className="bg-stone-900 text-emerald-400 rounded-sm p-4 font-mono text-xs space-y-1 overflow-x-auto">
              <p><span className="text-stone-500"># Dry-run (no transactions)</span></p>
              <p>node scripts/register-demo-sepolia.js --dry-run</p>
              <p className="mt-2"><span className="text-stone-500"># Test batch</span></p>
              <p>node scripts/register-demo-sepolia.js --test 2</p>
              <p className="mt-2"><span className="text-stone-500"># Full batch with confirmation flag</span></p>
              <p>node scripts/register-demo-sepolia.js --limit 100 --confirm</p>
            </div>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: SEPOLIA TEST ETH FUNDING                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'funding' && (
        <div className="space-y-8 max-w-4xl">
          {/* Disclaimer Banner */}
          <div className="bg-stone-900 text-white rounded-sm p-5 flex items-start gap-4">
            <span className="material-symbols-outlined text-stone-300 text-2xl shrink-0">info</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sepolia Testnet ETH — Not Real Money
              </h3>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                Sepolia ETH has no monetary value. It exists solely on the Sepolia testnet for development and testing.
                This tool cannot and does not mint, generate, or transfer ETH. Test funds must come from a legitimate public faucet.
              </p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-white border border-stone-200 rounded-sm p-8 shadow-sm">
            <h3 className="text-xl font-black tracking-tight text-stone-900 uppercase mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Connected Wallet Balance</h3>
            <p className="text-xs font-serif italic text-stone-500 mb-6">Live Sepolia ETH balance for your connected MetaMask wallet, fetched from the Sepolia network.</p>

            {/* Address display */}
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Connected Wallet Address</p>
              {account ? (
                <div className="flex items-center gap-3 bg-[#f5f4ed] rounded-sm p-3 border border-stone-200">
                  <span className="font-mono text-sm text-stone-900 font-bold break-all flex-1">{account}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(account, 'wallet-address')}
                    className="shrink-0 flex items-center gap-1.5 text-stone-500 hover:text-stone-900 text-xs font-bold uppercase tracking-wider transition-colors"
                    title="Copy wallet address"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedKey === 'wallet-address' ? 'check' : 'content_copy'}
                    </span>
                    {copiedKey === 'wallet-address' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <div className="bg-stone-100 rounded-sm p-3 border border-stone-200 text-stone-500 text-xs italic">
                  No wallet connected. Use the <strong>Connect Admin Wallet</strong> button above.
                </div>
              )}
            </div>

            {/* Network status */}
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Network</p>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${
                  isSepolia
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : account
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-stone-100 text-stone-500 border-stone-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isSepolia ? 'bg-emerald-600' : account ? 'bg-red-600' : 'bg-stone-400'
                  }`}></span>
                  {isSepolia ? 'Sepolia Testnet (Chain ID 11155111)' : account ? `Wrong Network (Chain ID ${chainId?.toString() || '?'})` : 'Not Connected'}
                </span>
                {account && !isSepolia && (
                  <button
                    type="button"
                    onClick={switchToSepolia}
                    className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-stone-700 transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                    Switch to Sepolia
                  </button>
                )}
              </div>
            </div>

            {/* Balance display */}
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Sepolia ETH Balance</p>
              <div className="flex items-end gap-4">
                {sepoliaBalance !== null ? (
                  <span className="text-4xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {sepoliaBalance}
                    <span className="text-xl text-stone-400 ml-2 font-bold">ETH</span>
                  </span>
                ) : (
                  <span className="text-2xl font-black text-stone-300 tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {isFetchingBalance ? 'Fetching...' : '—'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fetchSepoliaBalance(account)}
                  disabled={isFetchingBalance || !account}
                  className={buttonSecondaryClass}
                  title="Refresh Sepolia ETH balance from network"
                >
                  <span className={`material-symbols-outlined text-sm ${isFetchingBalance ? 'animate-spin' : ''}`}>refresh</span>
                  {isFetchingBalance ? 'Loading...' : 'Refresh Balance'}
                </button>
              </div>
              {balanceError && (
                <p className="text-xs text-red-700 mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {balanceError}
                </p>
              )}
              {sepoliaBalance !== null && (
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href={`${SEPOLIA_EXPLORER}/address/${account}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-stone-500 hover:text-stone-900 underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    View on Sepolia Etherscan
                  </a>
                </div>
              )}
            </div>

            {!account && (
              <button
                type="button"
                onClick={() => syncWallet(true)}
                disabled={isConnectingWallet}
                className={buttonPrimaryClass}
              >
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                {isConnectingWallet ? 'Connecting...' : 'Connect Wallet to Check Balance'}
              </button>
            )}
          </div>

          {/* Faucet Directory */}
          <div className="bg-white border border-stone-200 rounded-sm p-8 shadow-sm">
            <h3 className="text-xl font-black tracking-tight text-stone-900 uppercase mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Reputable Sepolia Faucets</h3>
            <p className="text-xs font-serif italic text-stone-500 mb-6">
              Faucets distribute free test ETH. Note: access may require sign-in, eligibility checks (e.g. mainnet balance), rate limits, or browser mining. ETH quantities are approximate and subject to change.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  name: 'Google Cloud Web3 Faucet',
                  url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
                  limit: '0.05 ETH / day',
                  icon: 'cloud',
                  requirements: 'Google login. No mainnet balance required.',
                  color: 'blue',
                },
                {
                  name: 'Alchemy Sepolia Faucet',
                  url: 'https://sepoliafaucet.com',
                  limit: '0.5 ETH / day',
                  icon: 'bolt',
                  requirements: 'Alchemy account. Requires ≥ 0.001 ETH on Ethereum mainnet.',
                  color: 'purple',
                },
                {
                  name: 'PK910 Proof-of-Work Faucet',
                  url: 'https://sepolia-faucet.pk910.de',
                  limit: 'Variable (browser mining)',
                  icon: 'memory',
                  requirements: 'No sign-in or mainnet balance. CPU mining in browser.',
                  color: 'green',
                },
                {
                  name: 'QuickNode Sepolia Faucet',
                  url: 'https://faucet.quicknode.com/ethereum/sepolia',
                  limit: '0.05–0.1 ETH / day',
                  icon: 'flash_on',
                  requirements: 'QuickNode account or Twitter/X verification.',
                  color: 'orange',
                },
              ].map((faucet) => (
                <div key={faucet.name} className="border border-stone-200 rounded-sm p-5 flex flex-col gap-3 hover:border-stone-400 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-stone-500 text-lg">{faucet.icon}</span>
                      <h4 className="text-sm font-bold text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{faucet.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-sm shrink-0">{faucet.limit}</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{faucet.requirements}</p>
                  <a
                    href={faucet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm hover:bg-stone-700 transition-colors self-start"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    Open Faucet
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#f5f4ed] border border-stone-200 rounded-sm text-xs text-stone-600">
              <p className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                Tips for Bulk Registration Funding
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-500 leading-relaxed">
                <li>A batch of 100 registrations typically requires <strong>0.06–0.15 Sepolia ETH</strong> at current gas prices.</li>
                <li>A full batch of 1,000 registrations may require <strong>0.6–1.5 Sepolia ETH</strong> — use multiple faucets over several days.</li>
                <li>The PK910 PoW faucet accumulates ETH over time through browser mining — ideal for larger amounts.</li>
                <li>Always check your balance in the <strong>Refresh Balance</strong> section above before starting a large batch.</li>
                <li>Run the CLI auditor script (<code className="font-mono">npm run sepolia:check-funding</code>) for a precise live estimate.</li>
              </ul>
            </div>
          </div>

          {/* Explorer Link */}
          <div className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Sepolia Block Explorer</p>
              <p className="text-sm font-bold text-stone-900 mt-0.5">sepolia.etherscan.io</p>
              <p className="text-xs text-stone-500 mt-1">View transactions, balances, and contract interactions on the Sepolia testnet.</p>
            </div>
            <a
              href={SEPOLIA_EXPLORER}
              target="_blank"
              rel="noreferrer"
              className={buttonSecondaryClass}
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Open Etherscan
            </a>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATUS UPDATE & CONFIRMATION MODAL (Requirements 6, 7, 8, 9, 11)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isStatusModalOpen && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={() => {
              if (txState.phase !== 'prompting' && txState.phase !== 'pending') {
                setIsStatusModalOpen(false);
              }
            }}
          ></div>

          <div className="relative bg-[#fbf9f4] border border-stone-300 w-full max-w-lg rounded-sm shadow-2xl p-8 overflow-hidden animate-[fade-in_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="border-b border-stone-200 pb-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-stone-900 text-sm">gavel</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Smart Contract Governance
                </span>
              </div>
              <h2 className="text-2xl font-serif italic text-stone-900">
                {isConfirmationStep ? 'Confirm Status Update' : 'Update Property On-Chain Status'}
              </h2>
              <p className="text-xs font-serif text-stone-500 mt-1">
                Property #{selectedTarget.blockchainPropertyId} · {selectedTarget.name}
              </p>
            </div>

            {/* Error Message within Modal */}
            {modalError && (
              <div className="mb-6 p-3 rounded-sm bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{modalError}</span>
              </div>
            )}

            {/* Transaction Lifecycle Status (Requirement 11) */}
            {txState.phase !== 'idle' && (
              <div className="mb-6 space-y-3">
                {txState.phase === 'prompting' && (
                  <div className="p-4 rounded-sm bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 animate-pulse">
                    <span className="material-symbols-outlined text-base text-blue-600">hourglass_top</span>
                    <div>
                      <p className="font-bold uppercase tracking-wider">Awaiting Signature in MetaMask</p>
                      <p className="mt-0.5">Please review and confirm the status update transaction in your wallet window.</p>
                    </div>
                  </div>
                )}

                {txState.phase === 'pending' && (
                  <div className="p-4 rounded-sm bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-amber-600 animate-spin">progress_activity</span>
                    <div className="flex-1">
                      <p className="font-bold uppercase tracking-wider">Transaction Mining on Sepolia</p>
                      <p className="mt-0.5">Waiting for block confirmation...</p>
                      {txState.txHash && (
                        <a
                          href={`${SEPOLIA_EXPLORER}/tx/${txState.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] underline block mt-2 hover:text-stone-900 break-all"
                        >
                          View Transaction: {txState.txHash} ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {txState.phase === 'confirmed' && (
                  <div className="p-4 rounded-sm bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                    <div className="flex-1">
                      <p className="font-bold uppercase tracking-wider">Status Update Confirmed</p>
                      <p className="mt-0.5">
                        Property #{selectedTarget.blockchainPropertyId} successfully updated to{' '}
                        <strong>{STATUS_ENUM[Number(selectedNewStatus)]}</strong> on-chain.
                      </p>
                      {txState.blockNumber && (
                        <p className="text-[11px] text-emerald-700 mt-1">Confirmed in Block #{txState.blockNumber}.</p>
                      )}
                      {txState.txHash && (
                        <a
                          href={`${SEPOLIA_EXPLORER}/tx/${txState.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] underline block mt-2 text-emerald-800 break-all"
                        >
                          Etherscan Receipt: {txState.txHash} ↗
                        </a>
                      )}
                      <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsStatusModalOpen(false)}
                          className={buttonPrimaryClass}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {txState.phase === 'rejected' && (
                  <div className="p-4 rounded-sm bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-amber-600">cancel</span>
                    <div>
                      <p className="font-bold uppercase tracking-wider">Transaction Cancelled</p>
                      <p className="mt-0.5">{txState.error || 'The transaction request was rejected in MetaMask.'}</p>
                    </div>
                  </div>
                )}

                {txState.phase === 'failed' && (
                  <div className="p-4 rounded-sm bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-red-600">error</span>
                    <div>
                      <p className="font-bold uppercase tracking-wider">Transaction Failed</p>
                      <p className="mt-0.5 break-words">{txState.error || 'An error occurred during transaction execution.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: FORM INPUT */}
            {!isConfirmationStep && txState.phase !== 'confirmed' && (
              <form onSubmit={handleProceedToConfirmation} className="space-y-5">
                {/* Current Info */}
                <div className="bg-white p-4 rounded-sm border border-stone-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold uppercase tracking-wider text-stone-400">Current Status</span>
                    <span className="font-bold text-stone-900">
                      {typeof selectedTarget.onChainStatus === 'number'
                        ? `${STATUS_ENUM[selectedTarget.onChainStatus]} (${selectedTarget.onChainStatus})`
                        : selectedTarget.onChainStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold uppercase tracking-wider text-stone-400">Current Owner</span>
                    <span className="font-mono font-medium">{formatAddress(selectedTarget.currentOwner)}</span>
                  </div>
                </div>

                {/* Status Selection (Exact Enums 0, 1, 2 - Requirement 7) */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Select Proposed Status (uint8 enum)
                  </label>
                  <select
                    className={selectClass}
                    value={selectedNewStatus}
                    onChange={(e) => setSelectedNewStatus(e.target.value)}
                    disabled={txState.phase === 'pending' || txState.phase === 'prompting'}
                  >
                    <option value="0">0 — Registered (Normal / Active)</option>
                    <option value="1">1 — Disputed (Freezes Ownership Transfers)</option>
                    <option value="2">2 — Suspended (Freezes Ownership Transfers)</option>
                  </select>
                </div>

                {/* Reason Input (Requirement 8) */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Reason for Status Change (Required)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-sm border border-stone-200 bg-white p-3 text-xs text-stone-900 focus:border-stone-900 focus:outline-none transition-colors font-serif"
                    placeholder="Provide an auditable legal or compliance justification (e.g. Legal injunction from municipal registry, deed dispute filed by lender...)"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    disabled={txState.phase === 'pending' || txState.phase === 'prompting'}
                    required
                  />
                  <p className="text-[11px] text-stone-400 mt-1 italic">
                    This reason will be emitted in the on-chain <code className="font-mono">PropertyStatusUpdated</code> event.
                  </p>
                </div>

                {/* Restriction Notice if choosing Disputed or Suspended (Requirement 13) */}
                {(selectedNewStatus === '1' || selectedNewStatus === '2') && (
                  <div className="p-3.5 rounded-sm bg-[#fef7ee] border-l-4 border-amber-500 border border-stone-200 text-xs text-amber-900">
                    <p className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                      Transfer Freeze Warning
                    </p>
                    <p className="mt-1 leading-relaxed text-[11px]">
                      Selecting <strong>{STATUS_ENUM[Number(selectedNewStatus)]}</strong> will block all on-chain ownership transfers (<code className="font-mono">transferProperty</code>) for this property until restored to Registered.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(false)}
                    className={buttonSecondaryClass}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!statusReason.trim() || !canAdminTransact}
                    className={buttonPrimaryClass}
                  >
                    Review & Confirm ↗
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: CONFIRMATION VIEW (Requirement 9) */}
            {isConfirmationStep && txState.phase !== 'confirmed' && (
              <div className="space-y-6">
                <div className="bg-white border border-stone-200 rounded-sm p-5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="font-bold uppercase tracking-wider text-stone-400">Target Property</span>
                    <span className="font-bold text-stone-900">
                      #{selectedTarget.blockchainPropertyId} — {selectedTarget.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="font-bold uppercase tracking-wider text-stone-400">Previous Status</span>
                    <span className="font-mono font-bold text-stone-700">
                      {typeof selectedTarget.onChainStatus === 'number'
                        ? `${STATUS_ENUM[selectedTarget.onChainStatus]} (${selectedTarget.onChainStatus})`
                        : selectedTarget.onChainStatus}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-2">
                    <span className="font-bold uppercase tracking-wider text-stone-400">Proposed New Status</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-sm ${
                      selectedNewStatus === '0'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : selectedNewStatus === '1'
                        ? 'bg-amber-50 text-amber-900 border border-amber-300'
                        : 'bg-rose-50 text-rose-900 border border-rose-300'
                    }`}>
                      {STATUS_ENUM[Number(selectedNewStatus)]} ({selectedNewStatus})
                    </span>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-stone-400 block mb-1">Audit Reason</span>
                    <p className="bg-[#fbf9f4] p-2.5 rounded-sm border border-stone-200 text-stone-800 italic font-serif leading-relaxed">
                      "{statusReason}"
                    </p>
                  </div>
                </div>

                {/* Transfer restriction notice if proposed status is Disputed or Suspended */}
                {(selectedNewStatus === '1' || selectedNewStatus === '2') && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">lock</span>
                    <p className="leading-relaxed">
                      Notice: Once confirmed, the smart contract will immediately block ownership transfers for this property.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-200 flex justify-between gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmationStep(false);
                      setTxState({ phase: 'idle', txHash: '', blockNumber: null, error: '' });
                    }}
                    disabled={txState.phase === 'pending' || txState.phase === 'prompting'}
                    className={buttonSecondaryClass}
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndSendTx}
                    disabled={txState.phase === 'pending' || txState.phase === 'prompting'}
                    className={buttonPrimaryClass}
                  >
                    {txState.phase === 'prompting' || txState.phase === 'pending' ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">send</span>
                        Confirm & Submit Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-stone-900 text-white px-6 py-4 rounded-sm shadow-xl flex items-center gap-3 animate-[fade-in_0.3s_ease-out]">
          <span className="material-symbols-outlined text-[#bedafd] text-lg">check_circle</span>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
            {toastMessage.text}
          </p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
