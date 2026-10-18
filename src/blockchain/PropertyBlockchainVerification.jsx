import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BrowserProvider, JsonRpcProvider, Contract, getAddress, isAddress, ZeroAddress } from 'ethers';
import registryAbi from './registryAbi.json';
import {
  REGISTRY_ADDRESS,
  SEPOLIA_EXPLORER,
  SEPOLIA_RPC_URL,
  SEPOLIA_RPC_URLS,
  isSepoliaNetwork,
} from './registryConfig';
import DocumentIntegrityVerification from './DocumentIntegrityVerification';
import { updateListing } from '../services/listingsStore';

const STATUS_LABELS = ['Registered', 'Disputed', 'Suspended'];

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

export default function PropertyBlockchainVerification({ listing, listingId, onStatusChange }) {
  const blockchainId = listing?.blockchainPropertyId ? String(listing.blockchainPropertyId).trim() : null;

  // On-Chain Read State
  // verificationState: 'idle' | 'loading' | 'verified' | 'unverified' | 'unavailable'
  const [verificationState, setVerificationState] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [onChainData, setOnChainData] = useState(null);
  const [isVerified, setIsVerified] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [readError, setReadError] = useState('');

  // Wallet State
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);

  // Transfer State Machine: 'idle' | 'awaiting_wallet' | 'pending' | 'confirmed' | 'rejection' | 'failure'
  const [transferState, setTransferState] = useState('idle');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const [transferTxHash, setTransferTxHash] = useState('');
  const [transferErrorMsg, setTransferErrorMsg] = useState('');
  const [transferReceipt, setTransferReceipt] = useState(null);
  const [transferredTo, setTransferredTo] = useState('');

  // Toast / Clipboard Feedback
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const isSepolia = Boolean(chainId && isSepoliaNetwork(chainId));
  const isCurrentOwner = Boolean(
    account &&
      onChainData?.currentOwner &&
      normalizeAddress(account) === normalizeAddress(onChainData.currentOwner)
  );

  const isDisputedOrSuspended = Boolean(onChainData && onChainData.status !== 0);
  const statusRestrictionReason =
    onChainData && onChainData.status === 1
      ? 'Property is currently marked as Disputed. Disputed properties cannot be transferred on-chain.'
      : onChainData && onChainData.status === 2
      ? 'Property is currently Suspended. Suspended properties cannot be transferred on-chain.'
      : '';

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // ── Fetch On-Chain Property Record with Multiple Fallback RPCs ──
  const fetchOnChainRecord = useCallback(
    async (idToQuery) => {
      if (!idToQuery || !/^[1-9]\d*$/.test(idToQuery)) return;

      setLoading(true);
      setVerificationState('loading');
      setReadError('');
      onStatusChange?.('loading');

      const candidateContracts = [];

      // 1. Try injected MetaMask provider if connected to Sepolia
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          const network = await browserProvider.getNetwork();
          if (isSepoliaNetwork(network.chainId)) {
            candidateContracts.push(new Contract(REGISTRY_ADDRESS, registryAbi, browserProvider));
          }
        } catch {
          // Continue to public RPC fallbacks
        }
      }

      // 2. Add public Sepolia RPC fallback providers
      const rpcUrls = SEPOLIA_RPC_URLS && SEPOLIA_RPC_URLS.length > 0 ? SEPOLIA_RPC_URLS : [SEPOLIA_RPC_URL];
      for (const url of rpcUrls) {
        try {
          const fallbackProvider = new JsonRpcProvider(url, 11155111, { staticNetwork: true });
          candidateContracts.push(new Contract(REGISTRY_ADDRESS, registryAbi, fallbackProvider));
        } catch {
          // continue
        }
      }

      let success = false;
      let lastErr = null;

      for (const contract of candidateContracts) {
        try {
          console.log(`[PropertyBlockchainVerification] Querying on-chain record #${idToQuery}...`);
          const [p, verified, history] = await Promise.all([
            contract.getProperty(idToQuery),
            contract.verifyProperty(idToQuery),
            contract.getOwnershipHistory(idToQuery),
          ]);

          setOnChainData({
            propertyId: p.propertyId.toString(),
            currentOwner: p.currentOwner,
            registeredBy: p.registeredBy,
            locationReference: p.locationReference,
            documentHash: p.documentHash,
            registrationTimestamp: p.registrationTimestamp.toString(),
            status: Number(p.status),
          });
          setIsVerified(verified);
          setOwnershipHistory(history);
          const stateResult = verified ? 'verified' : 'unverified';
          setVerificationState(stateResult);
          onStatusChange?.(stateResult);
          console.log(`[PropertyBlockchainVerification] Loaded record #${idToQuery} successfully:`, p);
          success = true;
          break;
        } catch (err) {
          lastErr = err;
          console.warn(
            `[PropertyBlockchainVerification] Contract query attempt failed, trying next provider...`,
            err?.message
          );
        }
      }

      if (!success) {
        console.error(`[PropertyBlockchainVerification] All providers failed for property #${idToQuery}:`, lastErr);
        // Clean out stale data on error to prevent displaying stale state as freshly verified
        setOnChainData(null);
        setIsVerified(null);
        setOwnershipHistory([]);
        setVerificationState('unavailable');
        onStatusChange?.('unavailable');
        setReadError(
          `Blockchain information unavailable: Could not reach Sepolia network. (${readableError(lastErr)})`
        );
      }

      setLoading(false);
    },
    [onStatusChange]
  );

  // ── Track MetaMask Account & Network ──
  const syncWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      setAccount(accounts && accounts.length > 0 ? accounts[0] : '');
    } catch (e) {
      console.error('[PropertyBlockchainVerification] Wallet sync error:', e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncWallet();
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccounts = (accs) => {
        setAccount(accs && accs.length > 0 ? accs[0] : '');
      };
      const handleChain = () => {
        syncWallet();
      };
      window.ethereum.on?.('accountsChanged', handleAccounts);
      window.ethereum.on?.('chainChanged', handleChain);
      return () => {
        window.ethereum.removeListener?.('accountsChanged', handleAccounts);
        window.ethereum.removeListener?.('chainChanged', handleChain);
      };
    }
  }, [syncWallet]);

  useEffect(() => {
    if (blockchainId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOnChainRecord(blockchainId);
    } else {
      setOnChainData(null);
      setIsVerified(null);
      setOwnershipHistory([]);
      setReadError('');
    }
  }, [blockchainId, fetchOnChainRecord]);

  // Connect Wallet helper
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      showToast('MetaMask is not installed. Please install MetaMask to interact with the blockchain.', 'error');
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      setAccount(accounts && accounts.length > 0 ? accounts[0] : '');
      showToast('MetaMask wallet connected successfully.');
    } catch (err) {
      showToast(`Connection failed: ${readableError(err)}`, 'error');
    }
  };

  // Switch Network to Sepolia helper
  const switchToSepolia = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      await syncWallet();
      showToast('Switched network to Ethereum Sepolia.');
    } catch (switchError) {
      if (switchError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia test network',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          await syncWallet();
          showToast('Added and switched to Ethereum Sepolia.');
        } catch (addError) {
          showToast(`Network switch failed: ${readableError(addError)}`, 'error');
        }
      } else {
        showToast(`Network switch failed: ${readableError(switchError)}`, 'error');
      }
    }
  };

  // Validate Recipient Address
  const validateRecipient = (addr) => {
    const trimmed = addr.trim();
    if (!trimmed) {
      return 'Please enter a recipient wallet address.';
    }
    if (!isAddress(trimmed)) {
      return 'Invalid Ethereum address format (must be 0x followed by 40 hex characters).';
    }
    if (trimmed.toLowerCase() === ZeroAddress.toLowerCase()) {
      return 'Cannot transfer property to the zero address (0x0000...0000).';
    }
    if (onChainData?.currentOwner && normalizeAddress(trimmed) === normalizeAddress(onChainData.currentOwner)) {
      return 'Recipient address is already the current owner of this property.';
    }
    return '';
  };

  // ── Execute Ownership Transfer (Owner Only with Full State Lifecycle) ──
  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferErrorMsg('');
    setRecipientError('');

    if (!blockchainId) return;

    if (!account) {
      setTransferErrorMsg('Please connect your MetaMask wallet before initiating a transfer.');
      return;
    }

    if (!isSepolia) {
      setTransferErrorMsg('Please switch MetaMask to the Sepolia testnet (Chain ID 11155111).');
      return;
    }

    if (!onChainData) {
      setTransferErrorMsg('On-chain property details are not available. Please retry blockchain verification.');
      return;
    }

    if (onChainData.status !== 0) {
      setTransferErrorMsg(
        statusRestrictionReason ||
          `Ownership transfer locked: Property status is ${STATUS_LABELS[onChainData.status] || 'Inactive'}. Disputed or suspended properties cannot be transferred.`
      );
      return;
    }

    if (!isCurrentOwner) {
      setTransferErrorMsg(
        `Unauthorized: Only the current registered owner (${onChainData.currentOwner.slice(0, 6)}…${onChainData.currentOwner.slice(-4)}) can transfer this property title.`
      );
      return;
    }

    const valErr = validateRecipient(recipientInput);
    if (valErr) {
      setRecipientError(valErr);
      return;
    }

    const recipientChecksum = getAddress(recipientInput.trim());

    // 1. Enter Awaiting Wallet Confirmation State
    setTransferState('awaiting_wallet');
    setTransferErrorMsg('');

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const writeContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);

      console.log(`[PropertyBlockchainVerification] Initiating transferProperty(${blockchainId}, ${recipientChecksum})...`);
      const tx = await writeContract.transferProperty(blockchainId, recipientChecksum);

      // 2. Wallet confirmed & broadcast! Enter Pending State
      setTransferTxHash(tx.hash);
      setTransferState('pending');
      console.log(`[PropertyBlockchainVerification] Transaction broadcast: ${tx.hash}. Awaiting Sepolia confirmation...`);

      // 3. Wait for confirmed receipt
      const receipt = await tx.wait();
      console.log(`[PropertyBlockchainVerification] Transaction confirmed in block ${receipt.blockNumber}:`, receipt);

      // 4. Enter Confirmed State
      setTransferReceipt(receipt);
      setTransferredTo(recipientChecksum);
      setTransferState('confirmed');

      // 5. Refresh on-chain current owner and ownership history ONLY AFTER confirmed transaction
      await fetchOnChainRecord(blockchainId);

      // 6. Update local listing persistence
      const targetId = listing?.id || listingId;
      if (targetId) {
        updateListing(targetId, {
          initialOwner: recipientChecksum,
          blockchainTxHash: receipt.hash,
        });
      }

      setRecipientInput('');
      showToast(`Ownership successfully transferred to ${recipientChecksum.slice(0, 8)}… on Sepolia!`);
    } catch (err) {
      console.error('[PropertyBlockchainVerification] Transfer error:', err);
      const isUserRejection =
        err?.code === 'ACTION_REJECTED' ||
        err?.info?.error?.code === 4001 ||
        /user rejected|user denied|rejected/i.test(err?.message || '');

      if (isUserRejection) {
        setTransferState('rejection');
        setTransferErrorMsg('Transaction signature was cancelled in MetaMask. No on-chain changes were made.');
      } else {
        setTransferState('failure');
        setTransferErrorMsg(`Transfer failed: ${readableError(err)}`);
      }
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard.`);
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  // ── CASE 1: Listing is NOT Registered On-Chain (Off-Chain Property) ──
  if (!blockchainId) {
    return (
      <section className="mb-20 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-stone-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
              <span className="material-symbols-outlined text-2xl">cloud_off</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="bg-stone-100 text-stone-600 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-stone-200"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Off-Chain Property
                </span>
                <span className="text-xs font-mono text-stone-400">
                  Website ID: {listing?.id || listingId}
                </span>
              </div>
              <h2 className="text-2xl font-serif text-stone-900 mt-1">Not Registered On-Chain</h2>
            </div>
          </div>
          <Link
            to="/admin/listings/new"
            className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-900 border border-stone-900 rounded-sm hover:bg-stone-50 transition-colors shadow-sm self-start md:self-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Register on Blockchain →
          </Link>
        </div>

        <div className="space-y-4">
          <div className="bg-[#fbf9f4] p-6 rounded-sm border border-stone-200 space-y-3">
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              This architectural listing is cataloged exclusively in Lumina Realty's private off-chain database and has <strong>not been registered</strong> on the Ethereum Sepolia smart contract registry.
            </p>
            <p className="text-xs text-stone-500 italic font-serif">
              Lumina Realty maintains strict isolation between website listings and blockchain records. Unregistered properties are never associated with unrelated on-chain records.
            </p>
          </div>

          {/* Explicit Notice: Blockchain Ownership Transfer Unavailable for Off-Chain Listings */}
          <div className="p-6 bg-stone-50 border border-stone-200 rounded-sm flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
            </div>
            <div className="space-y-1 text-xs font-sans">
              <h3 className="font-bold uppercase tracking-wider text-stone-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                Blockchain Ownership Transfer Unavailable
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Smart contract title deed transfers, immutable provenance logs, and cryptographic document verification are only available for properties registered on the Ethereum Sepolia testnet. Because this listing exists solely off-chain, blockchain ownership transfer cannot be performed.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── CASE 2: Listing IS Registered On-Chain ──
  return (
    <section className="mb-20 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`mb-6 p-4 rounded-sm text-xs font-sans flex items-center justify-between border ${
            toastType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {toastType === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-stone-400 hover:text-stone-700 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-stone-100 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-stone-900 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm font-mono flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              On-Chain Record #{blockchainId}
            </span>
            <span className="text-xs font-mono text-stone-400">
              Website ID: {listing?.id || listingId}
            </span>
          </div>
          <h2 className="text-3xl font-serif text-stone-900">On-Chain Title & Registry Verification</h2>
          <p className="text-xs font-sans uppercase tracking-widest text-stone-500 mt-1">
            Sepolia Testnet · Contract:{' '}
            <a
              href={`${SEPOLIA_EXPLORER}/address/${REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="underline font-mono"
            >
              {REGISTRY_ADDRESS.slice(0, 8)}…{REGISTRY_ADDRESS.slice(-6)}
            </a>
          </p>
        </div>

        {/* Dynamic Verification Badge */}
        <div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-600 bg-stone-100 px-4 py-2 rounded-full border border-stone-300">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              Querying Sepolia…
            </div>
          ) : verificationState === 'unavailable' ? (
            <div
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-900 bg-amber-50 px-4 py-2 rounded-full border border-amber-300 shadow-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base text-amber-600">cloud_off</span>
              Blockchain information unavailable
            </div>
          ) : isVerified ? (
            <div
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
              Blockchain registered
            </div>
          ) : onChainData ? (
            <div
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-4 py-2 rounded-full border border-amber-200 shadow-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-base text-amber-600">warning</span>
              ⚠ Status: {STATUS_LABELS[onChainData.status] || 'Unconfirmed'}
            </div>
          ) : null}
        </div>
      </div>

      {/* Unavailable / RPC Failure Banner with Retry Action */}
      {verificationState === 'unavailable' && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-300 rounded-sm text-xs space-y-3 font-sans">
          <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-base text-amber-700">warning</span>
            Blockchain information unavailable
          </div>
          <p className="text-amber-800 leading-relaxed">
            The Ethereum Sepolia testnet RPC could not be contacted to verify the live registry status for on-chain property <strong>#{blockchainId}</strong>.
            This property is registered on-chain and linked to Website ID <strong>{listing?.id || listingId}</strong>, but current blockchain details cannot be refreshed right now.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => fetchOnChainRecord(blockchainId)}
              className="px-4 py-2 bg-stone-900 text-white text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-xs">refresh</span>
              Retry Blockchain Verification
            </button>
            <span className="text-[11px] text-amber-700 italic font-serif">
              Stale records are guarded against false verification until RPC connectivity is re-established.
            </span>
          </div>
        </div>
      )}

      {readError && verificationState !== 'unavailable' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-800 text-xs font-sans">
          {readError}
        </div>
      )}

      {/* On-Chain Record Details Grid */}
      {onChainData && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-[#fbf9f4] p-6 rounded-sm border border-stone-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                On-Chain Property ID
              </span>
              <span className="font-mono font-black text-xl text-stone-900">#{onChainData.propertyId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                On-Chain Reference
              </span>
              <span className="font-bold text-sm text-stone-900">{onChainData.locationReference}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Registration Date
              </span>
              <span className="text-xs text-stone-700 font-sans">
                {new Date(Number(onChainData.registrationTimestamp) * 1000).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Registry Status
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm inline-block ${
                  onChainData.status === 0
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-amber-800 bg-amber-100'
                }`}
              >
                {STATUS_LABELS[onChainData.status] || 'Active'}
              </span>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-stone-200/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Current Deed Owner
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-stone-900 break-all">
                  {onChainData.currentOwner}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(onChainData.currentOwner, 'Current owner address')}
                  className="text-stone-400 hover:text-stone-900 p-1"
                  title="Copy Address"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
                <a
                  href={`${SEPOLIA_EXPLORER}/address/${onChainData.currentOwner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-400 hover:text-stone-900 p-1"
                  title="View on Sepolia Etherscan"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-stone-200/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Registered By (Admin)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-stone-700 break-all">{onChainData.registeredBy}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(onChainData.registeredBy, 'Admin address')}
                  className="text-stone-400 hover:text-stone-900 p-1"
                  title="Copy Admin Address"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-stone-200/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                Cryptographic Document Hash (bytes32)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-stone-600 break-all block">
                  {onChainData.documentHash}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(onChainData.documentHash, 'Document Hash')}
                  className="text-stone-400 hover:text-stone-900 p-1"
                  title="Copy Hash"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Property Document Integrity & Verification Panel */}
          <DocumentIntegrityVerification
            onChainDocumentHash={onChainData?.documentHash}
            blockchainPropertyId={blockchainId}
            verificationState={verificationState}
            websiteListingId={listing?.id || listingId}
          />

          {/* Chronological Ownership Provenance Timeline */}
          <div className="border border-stone-200 rounded-sm p-6 bg-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <h3
                  className="text-xs font-black uppercase tracking-widest text-stone-900"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Chronological Ownership History ({ownershipHistory.length} Record
                  {ownershipHistory.length === 1 ? '' : 's'})
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Chronological provenance of Ethereum owner addresses retrieved directly from smart contract call{' '}
                  <code className="font-mono">getOwnershipHistory(#{blockchainId})</code>. Addresses are displayed verbatim without synthetic identity labels.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase text-stone-500 bg-[#fbf9f4] border border-stone-200 px-2.5 py-1 rounded-sm self-start sm:self-auto">
                Total Deeds: {ownershipHistory.length}
              </span>
            </div>

            {ownershipHistory.length === 0 ? (
              <p className="text-xs text-stone-500 italic font-serif py-4">
                No ownership records found on-chain.
              </p>
            ) : (
              <div className="relative pl-8 sm:pl-10 before:absolute before:left-3.5 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-200 space-y-6">
                {ownershipHistory.map((addr, idx) => {
                  const isOrigin = idx === 0;
                  const isCurrent = idx === ownershipHistory.length - 1;
                  const normalizedAddr = normalizeAddress(addr);
                  const isConnectedAccountOwner = Boolean(
                    account && normalizeAddress(account) === normalizedAddr
                  );

                  return (
                    <div key={`${addr}-${idx}`} className="relative group">
                      {/* Timeline node icon */}
                      <div
                        className={`absolute -left-8 sm:-left-10 top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-transform group-hover:scale-110 shadow-xs ${
                          isCurrent
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                            : isOrigin
                            ? 'bg-stone-900 text-white ring-4 ring-stone-100'
                            : 'bg-stone-500 text-white ring-4 ring-stone-100'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Timeline Card */}
                      <div
                        className={`p-4 rounded-sm border transition-all ${
                          isCurrent
                            ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                            : 'bg-[#fbf9f4] border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                                isCurrent
                                  ? 'bg-emerald-700 text-white'
                                  : isOrigin
                                  ? 'bg-stone-900 text-white'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {isOrigin && isCurrent
                                ? 'Initial Registered Deed Holder & Current Owner'
                                : isOrigin
                                ? 'Initial Registered Deed Holder (Origin)'
                                : isCurrent
                                ? 'Current Title Deed Holder'
                                : `Transfer #${idx} Title Holder`}
                            </span>

                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-widest rounded-sm font-sans flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active Deed Holder
                              </span>
                            )}

                            {isConnectedAccountOwner && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-sm">
                                Your Connected Wallet
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-mono text-stone-400">
                            Sequence Step #{idx + 1}
                          </span>
                        </div>

                        {/* Monospace Address & Quick Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="font-mono text-xs font-semibold text-stone-900 break-all select-all">
                            {addr}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(addr, `Owner #${idx + 1} address`)}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-white border border-stone-200 rounded-sm hover:bg-stone-100 hover:text-stone-900 transition-colors flex items-center gap-1 shadow-xs"
                              style={{ fontFamily: 'Inter, sans-serif' }}
                              title="Copy wallet address"
                            >
                              <span className="material-symbols-outlined text-xs">content_copy</span>
                              Copy
                            </button>
                            <a
                              href={`${SEPOLIA_EXPLORER}/address/${addr}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-900 bg-white border border-stone-200 rounded-sm hover:bg-stone-100 transition-colors flex items-center gap-1 shadow-xs"
                              style={{ fontFamily: 'Inter, sans-serif' }}
                              title="View on Sepolia Etherscan"
                            >
                              <span className="material-symbols-outlined text-xs">open_in_new</span>
                              Etherscan
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Etherscan Verification Links */}
          <div className="space-y-3">
            <h3
              className="text-xs font-black uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Sepolia Etherscan Explorer Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
              {listing?.blockchainTxHash && (
                <a
                  href={`${SEPOLIA_EXPLORER}/tx/${listing.blockchainTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-[#fbf9f4] border border-stone-200 rounded-sm hover:border-stone-400 transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-stone-900 block truncate">Registration Tx</span>
                    <span className="font-mono text-stone-500 text-[11px]">
                      {listing.blockchainTxHash.slice(0, 10)}…{listing.blockchainTxHash.slice(-8)}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-stone-400 group-hover:text-stone-900 transition-transform">
                    open_in_new
                  </span>
                </a>
              )}

              {transferTxHash && (
                <a
                  href={`${SEPOLIA_EXPLORER}/tx/${transferTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-sm hover:border-emerald-400 transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-emerald-900 block truncate">Transfer Tx</span>
                    <span className="font-mono text-emerald-700 text-[11px]">
                      {transferTxHash.slice(0, 10)}…{transferTxHash.slice(-8)}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-emerald-600 transition-transform">
                    open_in_new
                  </span>
                </a>
              )}

              <a
                href={`${SEPOLIA_EXPLORER}/address/${REGISTRY_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-[#fbf9f4] border border-stone-200 rounded-sm hover:border-stone-400 transition-colors group"
              >
                <div className="min-w-0">
                  <span className="font-bold text-stone-900 block truncate">Smart Contract</span>
                  <span className="font-mono text-stone-500 text-[11px]">
                    {REGISTRY_ADDRESS.slice(0, 8)}…{REGISTRY_ADDRESS.slice(-6)}
                  </span>
                </div>
                <span className="material-symbols-outlined text-sm text-stone-400 group-hover:text-stone-900 transition-transform">
                  open_in_new
                </span>
              </a>
            </div>
          </div>

          {/* ── Ownership Transfer Section (Owner Only with Full Lifecycle States) ── */}
          <div className="p-8 border border-stone-200 rounded-sm bg-white space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Smart Contract Method: transferProperty(propertyId, newOwner)
                  </span>
                  <h3 className="text-xl font-serif text-stone-900">
                    On-Chain Deed Ownership Transfer
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {!account ? (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="px-4 py-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Connect MetaMask
                    </button>
                  ) : !isSepolia ? (
                    <button
                      type="button"
                      onClick={switchToSepolia}
                      className="px-4 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-amber-700 transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Switch to Sepolia
                    </button>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed font-sans mt-2">
                Under the smart contract security rules, ownership transfer can only be executed by the currently registered on-chain deed holder ({onChainData.currentOwner.slice(0, 6)}…{onChainData.currentOwner.slice(-4)}) on Ethereum Sepolia.
              </p>
            </div>

            {/* Transfer Eligibility Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#fbf9f4] p-4 rounded-sm border border-stone-200 text-xs font-sans">
              {/* 1. Status Restriction */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  1. Registry Status
                </span>
                {onChainData.status === 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Active (Registered)
                  </span>
                ) : (
                  <span className="text-red-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    {STATUS_LABELS[onChainData.status]} (Locked)
                  </span>
                )}
              </div>

              {/* 2. Network */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  2. Network Check
                </span>
                {isSepolia ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Sepolia (11155111)
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {chainId ? `Chain ID ${chainId}` : 'Not Connected'}
                  </span>
                )}
              </div>

              {/* 3. Wallet Connection */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  3. Connected Wallet
                </span>
                {account ? (
                  <span className="font-mono text-[11px] text-stone-900 truncate block">
                    {account.slice(0, 6)}…{account.slice(-4)}
                  </span>
                ) : (
                  <span className="text-stone-400 italic">Disconnected</span>
                )}
              </div>

              {/* 4. Owner Authorization */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  4. Owner Match
                </span>
                {isCurrentOwner ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    Owner Authorized
                  </span>
                ) : (
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Unauthorized
                  </span>
                )}
              </div>
            </div>

            {/* Condition 1: Property Disputed or Suspended */}
            {isDisputedOrSuspended && (
              <div className="p-5 bg-amber-50 border border-amber-300 rounded-sm text-xs space-y-2 font-sans">
                <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base text-amber-700">block</span>
                  Ownership Transfer Disabled: {STATUS_LABELS[onChainData.status]}
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {statusRestrictionReason} Smart contract rule requires properties to be in active <code>Registered (0)</code> status before deed transfer can occur.
                </p>
              </div>
            )}

            {/* Condition 2: Connected wallet is not current owner */}
            {!isDisputedOrSuspended && !isCurrentOwner && (
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-sm text-xs space-y-3 font-sans">
                <div className="flex items-center gap-2 text-stone-800 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base text-stone-500">lock</span>
                  Title Transfer Restricted to Current Owner
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Only the verified on-chain current owner can sign and submit a title deed transfer transaction.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-white p-3 rounded-sm border border-stone-200">
                  <div>
                    <span className="text-stone-400 block uppercase font-sans font-bold text-[9px]">
                      Current On-Chain Owner
                    </span>
                    <span className="text-stone-900 break-all">{onChainData.currentOwner}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block uppercase font-sans font-bold text-[9px]">
                      Your Connected Account
                    </span>
                    <span className="text-stone-600 break-all">
                      {account || 'No wallet connected in MetaMask'}
                    </span>
                  </div>
                </div>
                {!account && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="px-4 py-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Connect Current Owner Wallet
                  </button>
                )}
              </div>
            )}

            {/* Condition 3: Connected wallet IS current owner & status is 0 */}
            {!isDisputedOrSuspended && isCurrentOwner && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="recipient-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-800"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Recipient Ethereum Wallet Address (New Owner)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id="recipient-input"
                      type="text"
                      value={recipientInput}
                      onChange={(e) => {
                        setRecipientInput(e.target.value);
                        setRecipientError('');
                        if (transferState === 'rejection' || transferState === 'failure') {
                          setTransferState('idle');
                        }
                      }}
                      placeholder="Enter new owner address (0x...)"
                      disabled={transferState === 'awaiting_wallet' || transferState === 'pending'}
                      className="flex-1 bg-[#fbf9f4] border border-stone-300 rounded-sm px-4 py-3 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500 transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={
                        transferState === 'awaiting_wallet' ||
                        transferState === 'pending' ||
                        !recipientInput.trim()
                      }
                      className="px-6 py-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2 shadow-sm"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {transferState === 'awaiting_wallet' ? (
                        <>
                          <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                          Awaiting Signature…
                        </>
                      ) : transferState === 'pending' ? (
                        <>
                          <span className="material-symbols-outlined text-xs animate-spin">hourglass_empty</span>
                          Mining on Sepolia…
                        </>
                      ) : (
                        'Transfer Deed On-Chain'
                      )}
                    </button>
                  </div>

                  {recipientError && (
                    <p className="text-xs text-red-600 font-sans mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {recipientError}
                    </p>
                  )}
                  <p className="text-[11px] text-stone-400 font-sans">
                    Warning: Once confirmed on Sepolia, title deed control will transfer permanently to the recipient address. This action is irreversible.
                  </p>
                </div>
              </form>
            )}

            {/* ── Transaction State Feedbacks (All 5 Accurate States) ── */}

            {/* State 1: Awaiting Wallet Confirmation */}
            {transferState === 'awaiting_wallet' && (
              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-sm text-xs font-sans space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-indigo-900 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  Awaiting Wallet Confirmation in MetaMask
                </div>
                <p className="text-indigo-800 leading-relaxed">
                  Please open your MetaMask extension and confirm the transaction for <code className="font-mono">transferProperty({blockchainId}, {recipientInput})</code>.
                </p>
              </div>
            )}

            {/* State 2: Pending Transaction on Sepolia */}
            {transferState === 'pending' && (
              <div className="p-5 bg-amber-50 border border-amber-300 rounded-sm text-xs font-sans space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base animate-spin text-amber-700">hourglass_top</span>
                  Transaction Pending on Sepolia Testnet
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Your deed transfer transaction has been broadcast to the Sepolia mempool. Waiting for block inclusion and receipt confirmation…
                </p>
                {transferTxHash && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 font-mono truncate">
                      Tx: {transferTxHash}
                    </span>
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${transferTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white border border-amber-300 text-amber-900 text-[10px] uppercase font-bold tracking-wider rounded-sm hover:bg-amber-100 transition-colors shrink-0 flex items-center gap-1"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Track on Etherscan
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* State 3: Confirmed Success */}
            {transferState === 'confirmed' && (
              <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-sm text-xs font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-lg text-emerald-600">verified</span>
                    Ownership Transfer Confirmed On-Chain!
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransferState('idle')}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                  >
                    ✕ Dismiss
                  </button>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Property #{blockchainId} title deed was successfully transferred to{' '}
                  <strong className="font-mono">{transferredTo}</strong> on Ethereum Sepolia block #{transferReceipt?.blockNumber}. The on-chain ownership provenance history and deed record have been refreshed.
                </p>
                {transferTxHash && (
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${transferTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-xs">receipt_long</span>
                      View Confirmed Receipt on Sepolia Etherscan
                    </a>
                    <button
                      type="button"
                      onClick={() => setTransferState('idle')}
                      className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-emerald-100 transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* State 4: User Rejection in Wallet */}
            {transferState === 'rejection' && (
              <div className="p-5 bg-amber-50 border border-amber-300 rounded-sm text-xs font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base text-amber-700">cancel</span>
                    Transaction Cancelled
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransferState('idle')}
                    className="text-amber-700 hover:text-amber-900 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {transferErrorMsg || 'The transaction request was rejected in your MetaMask wallet. No gas was spent and title deed ownership remains unchanged.'}
                </p>
                <button
                  type="button"
                  onClick={() => setTransferState('idle')}
                  className="px-4 py-2 bg-stone-900 text-white text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-stone-800 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* State 5: Transaction Failure / Revert */}
            {transferState === 'failure' && (
              <div className="p-5 bg-red-50 border border-red-300 rounded-sm text-xs font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-900 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base text-red-700">error</span>
                    Transaction Failed
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransferState('idle')}
                    className="text-red-700 hover:text-red-900 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-red-800 leading-relaxed break-all">
                  {transferErrorMsg || 'The smart contract reverted the transaction or network communication failed.'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTransferState('idle')}
                    className="px-4 py-2 bg-stone-900 text-white text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-stone-800 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchOnChainRecord(blockchainId)}
                    className="px-4 py-2 bg-white border border-stone-300 text-stone-800 text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-stone-100 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Refresh On-Chain State
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
