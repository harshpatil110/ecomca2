import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BrowserProvider, Contract, getAddress, isAddress, ZeroAddress } from 'ethers';
import registryAbi from '../blockchain/registryAbi.json';
import { REGISTRY_ADDRESS, SEPOLIA_EXPLORER, isSepoliaNetwork, SEPOLIA_RPC_URLS } from '../blockchain/registryConfig';
import {
  getListings,
  getListingById,
  transferOwnership,
  createTransferRequest,
  cancelTransferRequest,
  subscribeToListings,
} from '../services/listingsStore';

const STATUS_LABELS = ['Registered', 'Disputed', 'Suspended'];

function normalizeAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  try {
    return getAddress(addr.trim()).toLowerCase();
  } catch {
    return addr.trim().toLowerCase();
  }
}

function formatAddress(addr) {
  if (!addr) return '—';
  const clean = String(addr).trim();
  if (clean.length < 12) return clean;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

function readableError(error) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return 'Transaction was rejected by the owner in MetaMask. No changes were made to the blockchain.';
  }
  return error?.shortMessage || error?.reason || error?.info?.error?.message || error?.message || 'An unexpected error occurred.';
}

export default function OwnershipTransfers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState(() => getListings());
  const [selectedRecordId, setSelectedRecordId] = useState('');

  // Mode: 'assisted' (Admin prepares request) vs 'direct' (Owner transfers directly)
  const [transferMode, setTransferMode] = useState('assisted');

  // Transfer Form inputs
  const [proposedNewOwnerName, setProposedNewOwnerName] = useState('');
  const [proposedNewOwnerWallet, setProposedNewOwnerWallet] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Web3 / Wallet State
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [contractAdmin, setContractAdmin] = useState('');
  const [onChainPropertyData, setOnChainPropertyData] = useState(null);
  const [onChainHistory, setOnChainHistory] = useState([]);
  const [isContractLoading, setIsContractLoading] = useState(false);

  // Workflow status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successConfirmation, setSuccessConfirmation] = useState(null);
  const [statusNotice, setStatusNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    return subscribeToListings((updated) => setListings(updated));
  }, []);

  // Pre-select property from query param if available
  useEffect(() => {
    const propParam = searchParams.get('property');
    if (propParam) {
      setSelectedRecordId(propParam);
    }
  }, [searchParams]);

  // Selected property from store
  const selectedProperty = useMemo(() => {
    if (!selectedRecordId) return null;
    return listings.find((item) => String(item.id).toLowerCase() === String(selectedRecordId).toLowerCase()) || getListingById(selectedRecordId);
  }, [selectedRecordId, listings]);

  const isBlockchain = Boolean(selectedProperty?.blockchainPropertyId);
  const pendingRequest = selectedProperty?.pendingTransferRequest?.status === 'PENDING_OWNER_AUTHORIZATION'
    ? selectedProperty.pendingTransferRequest
    : null;

  // Sync inputs when pending request is loaded or changed
  useEffect(() => {
    if (pendingRequest) {
      setProposedNewOwnerName(pendingRequest.proposedOwnerName || '');
      setProposedNewOwnerWallet(pendingRequest.proposedOwnerWallet || '');
      setTransferNotes(pendingRequest.notes || '');
    }
  }, [pendingRequest]);

  // Sync MetaMask
  const syncWallet = useCallback(async (requestPrompt = false) => {
    if (!window.ethereum) {
      if (requestPrompt) setErrorMessage('MetaMask extension was not detected. Please install or enable MetaMask.');
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      let accounts = [];
      if (requestPrompt) {
        accounts = await provider.send('eth_requestAccounts', []);
      } else {
        accounts = await provider.send('eth_accounts', []);
      }

      const network = await provider.getNetwork();
      setChainId(network.chainId);
      const activeAccount = accounts && accounts.length > 0 ? accounts[0] : '';
      setAccount(activeAccount);
    } catch (err) {
      console.error('[OwnershipTransfers] Wallet sync error:', err);
      if (requestPrompt) setErrorMessage(readableError(err));
    }
  }, []);

  useEffect(() => {
    syncWallet(false);
    if (!window.ethereum) return undefined;
    const handleAccounts = (accounts) => {
      setAccount(accounts && accounts.length > 0 ? accounts[0] : '');
    };
    const handleChain = (newChainId) => {
      setChainId(newChainId);
    };
    window.ethereum.on?.('accountsChanged', handleAccounts);
    window.ethereum.on?.('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum.removeListener?.('chainChanged', handleChain);
    };
  }, [syncWallet]);

  // Load On-Chain Property Record, History & Contract Admin
  const loadChainData = useCallback(async () => {
    if (!isBlockchain || !selectedProperty?.blockchainPropertyId) {
      setOnChainPropertyData(null);
      setOnChainHistory([]);
      return;
    }
    setIsContractLoading(true);
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
            const rp = new BrowserProvider({
              request: async ({ method, params }) => {
                const res = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
                });
                const data = await res.json();
                return data.result;
              },
            });
            await rp.getBlockNumber();
            provider = rp;
            break;
          } catch { continue; }
        }
      }

      if (!provider) return;

      const contract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
      const pId = selectedProperty.blockchainPropertyId;

      const [p, owners, adminAddr] = await Promise.all([
        contract.getProperty(pId),
        contract.getOwnershipHistory(pId).catch(() => []),
        contract.admin().catch(() => ''),
      ]);

      setContractAdmin(adminAddr);
      setOnChainPropertyData({
        propertyId: p.propertyId.toString(),
        currentOwner: p.currentOwner,
        registeredBy: p.registeredBy,
        locationReference: p.locationReference,
        documentHash: p.documentHash,
        registrationTimestamp: p.registrationTimestamp?.toString() || '0',
        status: Number(p.status),
      });
      setOnChainHistory(owners);
    } catch (err) {
      console.error('[OwnershipTransfers] Failed to load on-chain property:', err);
    } finally {
      setIsContractLoading(false);
    }
  }, [isBlockchain, selectedProperty]);

  useEffect(() => {
    loadChainData();
  }, [loadChainData]);

  // Derived authorization checks
  const isSepolia = Boolean(chainId && isSepoliaNetwork(chainId));
  const isCurrentOwnerWallet = Boolean(
    account &&
    onChainPropertyData?.currentOwner &&
    normalizeAddress(account) === normalizeAddress(onChainPropertyData.currentOwner)
  );
  const isConnectedAsAdmin = Boolean(
    account &&
    contractAdmin &&
    normalizeAddress(account) === normalizeAddress(contractAdmin)
  );

  const isRestrictedStatus = Boolean(
    onChainPropertyData && onChainPropertyData.status !== 0
  );

  const canOwnerTransfer = Boolean(
    account &&
    isSepolia &&
    onChainPropertyData &&
    onChainPropertyData.status === 0 &&
    isCurrentOwnerWallet &&
    !isSubmitting
  );

  // ── Shareable link generator ──
  const shareableOwnerLink = useMemo(() => {
    if (typeof window === 'undefined' || !selectedProperty) return '';
    return `${window.location.origin}/transfers?property=${encodeURIComponent(selectedProperty.id)}`;
  }, [selectedProperty]);

  const handleCopyLink = () => {
    if (!shareableOwnerLink) return;
    navigator.clipboard?.writeText(shareableOwnerLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // ── Handle Administrator Initiation of Transfer Request ──
  const handleInitiateTransferRequest = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusNotice('');
    setSuccessConfirmation(null);

    const nameClean = proposedNewOwnerName.trim();
    const walletClean = proposedNewOwnerWallet.trim();

    if (!nameClean) {
      setErrorMessage('Proposed new owner name is required.');
      return;
    }

    if (!isAddress(walletClean) || walletClean.toLowerCase() === ZeroAddress.toLowerCase()) {
      setErrorMessage('A valid non-zero Ethereum recipient wallet address is required.');
      return;
    }

    if (onChainPropertyData?.currentOwner && normalizeAddress(walletClean) === normalizeAddress(onChainPropertyData.currentOwner)) {
      setErrorMessage('Proposed recipient wallet is already the current registered owner of this property.');
      return;
    }

    try {
      createTransferRequest(selectedProperty.id, {
        proposedOwnerName: nameClean,
        proposedOwnerWallet: walletClean,
        notes: transferNotes.trim(),
        initiatedBy: isConnectedAsAdmin ? `Administrator (${formatAddress(account)})` : 'Registry Administrator',
      });

      setStatusNotice(
        'Administrator-assisted transfer request successfully prepared! Notice: Creating this request does not transfer ownership on the blockchain. The current registered owner must personally connect their MetaMask wallet and sign transferProperty().'
      );
    } catch (err) {
      setErrorMessage(err.message || 'Failed to prepare transfer request.');
    }
  };

  // ── Cancel / Revoke Transfer Request ──
  const handleCancelRequest = () => {
    if (!selectedProperty) return;
    try {
      cancelTransferRequest(selectedProperty.id);
      setStatusNotice('Transfer request was cancelled. Property returned to normal registered status.');
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel request.');
    }
  };

  // ── Execute Mandatory On-Chain Transfer (Signed Personally by Current Owner) ──
  const handleExecuteOnChainTransfer = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusNotice('');
    setSuccessConfirmation(null);

    if (!isBlockchain || !selectedProperty?.blockchainPropertyId) {
      setErrorMessage('This property does not have an on-chain registration on Sepolia.');
      return;
    }

    if (!isAddress(proposedNewOwnerWallet.trim())) {
      setErrorMessage('A valid Ethereum recipient wallet address is required.');
      return;
    }

    const targetRecipient = proposedNewOwnerWallet.trim();

    if (normalizeAddress(targetRecipient) === normalizeAddress(onChainPropertyData.currentOwner)) {
      setErrorMessage('Recipient wallet address is already the current registered owner.');
      return;
    }

    if (!isCurrentOwnerWallet) {
      setErrorMessage(
        `Cryptographic authorization failure: The smart contract transferProperty() requires a signature from current owner ${formatAddress(onChainPropertyData.currentOwner)}. Your connected account is ${formatAddress(account)}.`
      );
      return;
    }

    if (isRestrictedStatus) {
      setErrorMessage(
        `Ownership transfer blocked: Property #${onChainPropertyData.propertyId} is currently ${STATUS_LABELS[onChainPropertyData.status]}. Contract safeguard strictly reverts any transferProperty calls while under dispute or suspension.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const writeContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);

      const pId = selectedProperty.blockchainPropertyId;
      const prevOwner = onChainPropertyData.currentOwner;

      setStatusNotice(`Submitting transferProperty(#${pId}, ${formatAddress(targetRecipient)}) to MetaMask...`);

      const tx = await writeContract.transferProperty(pId, targetRecipient);
      setStatusNotice(`Transaction broadcast to Sepolia (TX: ${tx.hash.slice(0, 10)}…). Waiting for block confirmation…`);

      const receipt = await tx.wait();

      // Parse on-chain event log
      let eventNotice = '';
      for (const log of receipt.logs) {
        try {
          const parsed = writeContract.interface.parseLog(log);
          if (parsed?.name === 'PropertyTransferred') {
            eventNotice = `Emitted on-chain event PropertyTransferred (Property #${parsed.args.propertyId.toString()}, New Owner: ${parsed.args.newOwner})`;
            break;
          }
        } catch { /* skip */ }
      }

      // Update local store with new owner & clear pendingTransferRequest
      const resolvedName = proposedNewOwnerName.trim() || `Owner (${formatAddress(targetRecipient)})`;
      transferOwnership(
        selectedProperty.id,
        resolvedName,
        targetRecipient,
        receipt.hash
      );

      // Re-query updated property state and ownership history from smart contract
      const [updatedProp, updatedOwners] = await Promise.all([
        writeContract.getProperty(pId),
        writeContract.getOwnershipHistory(pId),
      ]);

      setOnChainPropertyData({
        propertyId: updatedProp.propertyId.toString(),
        currentOwner: updatedProp.currentOwner,
        registeredBy: updatedProp.registeredBy,
        locationReference: updatedProp.locationReference,
        documentHash: updatedProp.documentHash,
        registrationTimestamp: updatedProp.registrationTimestamp?.toString() || '0',
        status: Number(updatedProp.status),
      });
      setOnChainHistory(updatedOwners);

      setSuccessConfirmation({
        propertyId: pId,
        propertyName: selectedProperty.name,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        previousOwner: prevOwner,
        newOwner: targetRecipient,
        newOwnerName: resolvedName,
        eventNotice,
      });

      setStatusNotice('');
      setProposedNewOwnerName('');
      setProposedNewOwnerWallet('');
      setTransferNotes('');
    } catch (err) {
      console.error('[OwnershipTransfers] Transfer failed:', err);
      setErrorMessage(readableError(err));
      setStatusNotice('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-28">
      {/* Header */}
      <div className="border-b border-stone-200/40 px-8 pt-10 pb-8 max-w-5xl mx-auto">
        <Link
          to="/records"
          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 mb-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Property Records
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Ownership Transfers
            </h1>
            <p className="text-base font-serif italic text-stone-500 mt-2">
              Administrator-assisted transfer preparation and mandatory owner-authorized execution on Sepolia.
            </p>
          </div>
          {account && (
            <div className="bg-white border border-stone-200 px-4 py-2.5 rounded-sm shadow-sm flex items-center gap-2 self-start md:self-auto">
              <span className={`w-2 h-2 rounded-full ${isSepolia ? 'bg-emerald-600' : 'bg-red-500'}`}></span>
              <span className="font-mono text-xs font-bold text-stone-900">{formatAddress(account)}</span>
              {isConnectedAsAdmin && (
                <span className="bg-amber-100 text-amber-900 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                  Contract Admin
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-10 space-y-8">
        {/* Post-Transfer Success Confirmation Modal / Banner */}
        {successConfirmation && (
          <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-sm shadow-sm space-y-4 font-sans text-emerald-950">
            <div className="flex items-center gap-2.5 font-bold uppercase tracking-wide text-emerald-900">
              <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
              Ownership Transfer Confirmed on Ethereum Sepolia!
            </div>
            <p className="text-sm leading-relaxed">
              Legal deed conveyance for <strong>{successConfirmation.propertyName} (Blockchain #{successConfirmation.propertyId})</strong> has been verified and recorded in Sepolia Block #{successConfirmation.blockNumber}.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white/70 p-4 rounded-sm border border-emerald-200">
              <div>
                <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">Previous Registered Owner</span>
                <span className="font-mono text-stone-800 break-all">{successConfirmation.previousOwner}</span>
              </div>
              <div>
                <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">New Registered Owner</span>
                <span className="font-mono font-bold text-emerald-900 break-all">{successConfirmation.newOwner}</span>
                <span className="text-[11px] text-stone-600 block font-sans">({successConfirmation.newOwnerName})</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-stone-400 uppercase font-bold text-[10px] block mb-0.5">Transaction Hash</span>
                <a
                  href={`${SEPOLIA_EXPLORER}/tx/${successConfirmation.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-700 underline break-all inline-flex items-center gap-1 hover:text-emerald-900"
                >
                  {successConfirmation.txHash}
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
              </div>
              {successConfirmation.eventNotice && (
                <div className="md:col-span-2 text-[11px] text-emerald-800 font-mono">
                  ✓ {successConfirmation.eventNotice}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status / Error Alerts */}
        {statusNotice && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">info</span>
            <div className="leading-relaxed">{statusNotice}</div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-sm flex items-start gap-3 font-semibold">
            <span className="material-symbols-outlined text-red-600 text-base shrink-0 mt-0.5">error</span>
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Step 1: Property Selector */}
        <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
              1. Select Property Record for Transfer
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
              {listings.filter((l) => l.blockchainPropertyId).length} On-Chain Properties
            </span>
          </div>
          <div>
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value);
                setSearchParams({ property: e.target.value });
                setErrorMessage('');
                setStatusNotice('');
                setSuccessConfirmation(null);
              }}
              className="w-full bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-xs font-serif italic focus:outline-none focus:border-stone-400"
            >
              <option value="">-- Choose an on-chain property from the registry --</option>
              {listings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.id}) — {item.blockchainPropertyId ? `Blockchain #${item.blockchainPropertyId}` : 'Off-Chain'} [Owner: {item.ownerName || 'N/A'}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Transfer Workflow */}
        {selectedProperty && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Record Information & Transfer Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Details Card */}
              <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
                      {isBlockchain ? 'Blockchain Property Record' : 'Off-Chain Record (Registration Required)'}
                    </span>
                    <h3 className="text-xl font-bold text-stone-900">{selectedProperty.name}</h3>
                    <p className="text-xs font-serif italic text-stone-500 mt-0.5">{selectedProperty.location}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm ${
                    isBlockchain ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}>
                    {isBlockchain ? `Blockchain #${selectedProperty.blockchainPropertyId}` : 'Off-Chain'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-stone-400 font-bold uppercase text-[10px] block">Property Registry ID</span>
                    <span className="font-mono text-stone-900">{selectedProperty.id}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-bold uppercase text-[10px] block">Current Store Owner</span>
                    <span className="font-bold text-stone-900">{selectedProperty.ownerName || 'N/A'}</span>
                  </div>
                </div>

                {/* Live Smart Contract State */}
                {isBlockchain && (
                  <div className="p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Live Sepolia Smart Contract Deed State
                      </span>
                      {onChainPropertyData && (
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm ${
                          onChainPropertyData.status === 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}>
                          {STATUS_LABELS[onChainPropertyData.status] || 'Unknown'} ({onChainPropertyData.status === 0 ? 'Eligible for Transfer' : 'Transfers Blocked'})
                        </span>
                      )}
                    </div>

                    {isContractLoading ? (
                      <p className="text-stone-400 italic font-serif">Querying Sepolia contract state…</p>
                    ) : onChainPropertyData ? (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div>
                          <strong className="text-stone-500 font-sans">Current On-Chain Owner:</strong>{' '}
                          <span className="break-all font-bold text-stone-900">{onChainPropertyData.currentOwner}</span>
                        </div>
                        <div>
                          <strong className="text-stone-500 font-sans">Registered By (Admin):</strong>{' '}
                          <span className="break-all text-stone-700">{onChainPropertyData.registeredBy}</span>
                        </div>
                        <div>
                          <strong className="text-stone-500 font-sans">Registration Time:</strong>{' '}
                          <span className="text-stone-700 font-sans">
                            {onChainPropertyData.registrationTimestamp && Number(onChainPropertyData.registrationTimestamp) > 0
                              ? new Date(Number(onChainPropertyData.registrationTimestamp) * 1000).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic font-serif">Sepolia contract state unavailable.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pending Transfer Request Banner (if any) */}
              {pendingRequest && (
                <div className="p-6 bg-purple-50 border border-purple-200 rounded-sm shadow-sm space-y-4 font-sans text-purple-950">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-xs text-purple-900">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                      Administrator-Assisted Transfer Request Pending Authorization
                    </div>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-sm">
                      {pendingRequest.requestId}
                    </span>
                  </div>

                  <p className="text-xs text-purple-900 leading-relaxed">
                    An administrator has prepared a proposed ownership transfer. <strong>Blockchain ownership remains unchanged</strong> until the current registered owner ({formatAddress(onChainPropertyData?.currentOwner || selectedProperty.ownerWallet)}) connects and personally signs the transaction in MetaMask.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-4 rounded-sm border border-purple-200/80">
                    <div>
                      <span className="text-purple-600 font-bold uppercase text-[10px] block mb-0.5">Proposed New Owner</span>
                      <span className="font-bold text-stone-900">{pendingRequest.proposedOwnerName}</span>
                    </div>
                    <div>
                      <span className="text-purple-600 font-bold uppercase text-[10px] block mb-0.5">Proposed Ethereum Wallet</span>
                      <span className="font-mono text-stone-800 break-all">{pendingRequest.proposedOwnerWallet}</span>
                    </div>
                    {pendingRequest.notes && (
                      <div className="sm:col-span-2">
                        <span className="text-purple-600 font-bold uppercase text-[10px] block mb-0.5">Conveyance Notes / Reason</span>
                        <p className="font-serif italic text-stone-700">{pendingRequest.notes}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2 text-[10px] text-stone-500 font-serif italic pt-1 border-t border-purple-100">
                      Initiated by {pendingRequest.initiatedBy} on {new Date(pendingRequest.initiatedAt).toLocaleString('en-IN')}.
                    </div>
                  </div>

                  {/* Shareable Link Box */}
                  <div className="space-y-2 pt-2 border-t border-purple-200/60">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-purple-900 block">
                      Shareable Owner Authorization Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={shareableOwnerLink}
                        className="flex-1 bg-white border border-purple-200 rounded-sm px-3 py-2 text-xs font-mono text-stone-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-purple-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-purple-950 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">{copiedLink ? 'check' : 'content_copy'}</span>
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                    <p className="text-[10px] text-purple-700 font-serif italic">
                      Send this link to the property owner to review and authorize the transaction using their personal MetaMask wallet.
                    </p>
                  </div>

                  {/* Cancel Request Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCancelRequest}
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-700 hover:text-rose-900 hover:underline"
                    >
                      Cancel / Revoke This Request
                    </button>
                  </div>
                </div>
              )}

              {/* Transfer Form (Tabs: Assisted Request vs Direct Owner Transfer) */}
              <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                  <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
                    2. Ownership Transfer Execution & Authorization
                  </h2>
                  {!pendingRequest && (
                    <div className="flex rounded-sm border border-stone-200 p-0.5 bg-[#f5f4ed] text-[10px] font-bold uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => setTransferMode('assisted')}
                        className={`px-3 py-1 rounded-sm transition-colors ${transferMode === 'assisted' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                      >
                        Admin-Assisted Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferMode('direct')}
                        className={`px-3 py-1 rounded-sm transition-colors ${transferMode === 'direct' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
                      >
                        Direct Owner Transfer
                      </button>
                    </div>
                  )}
                </div>

                {/* If NO pending request and transferMode is 'assisted', display Admin Request Preparation Form */}
                {!pendingRequest && transferMode === 'assisted' && (
                  <form onSubmit={handleInitiateTransferRequest} className="space-y-5">
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 leading-relaxed font-sans">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] mb-1">
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Administrator-Assisted Transfer Preparation
                      </div>
                      The administrator can prepare the proposed transferee's details and generate a pending authorization link.
                      <strong> Creating this request does not transfer ownership on the blockchain.</strong> The current registered owner must personally sign the transaction via MetaMask.
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                        Proposed New Owner Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={proposedNewOwnerName}
                        onChange={(e) => setProposedNewOwnerName(e.target.value)}
                        placeholder="e.g. Ramesh Varma"
                        className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                        Proposed New Owner Ethereum Wallet Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={proposedNewOwnerWallet}
                        onChange={(e) => setProposedNewOwnerWallet(e.target.value)}
                        placeholder="0x..."
                        className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 font-mono text-xs focus:outline-none focus:border-stone-400"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                        Conveyance Reason / Registry Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={transferNotes}
                        onChange={(e) => setTransferNotes(e.target.value)}
                        placeholder="e.g. Registered conveyance deed executed; pending cryptographic settlement"
                        className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-200 flex justify-end">
                      <button
                        type="submit"
                        className="px-8 py-3.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">assignment_add</span>
                        Prepare Transfer Request & Generate Link
                      </button>
                    </div>
                  </form>
                )}

                {/* If pending request exists OR direct mode is active: Current Owner On-Chain Execution Section */}
                {(pendingRequest || transferMode === 'direct') && (
                  <form onSubmit={handleExecuteOnChainTransfer} className="space-y-6">
                    {/* Mandatory Owner Cryptographic Rule Card */}
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm text-xs space-y-2 font-sans">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block">
                        Mandatory Smart Contract Security Rule
                      </span>
                      <p className="text-stone-700 leading-relaxed">
                        The Sepolia smart contract function <code className="font-mono font-bold text-stone-900">transferProperty(propertyId, newOwner)</code> strictly validates:
                        <code className="block mt-1 font-mono text-[11px] bg-stone-200/70 p-2 rounded text-stone-900">
                          require(msg.sender == properties[propertyId].currentOwner, "Only current owner can transfer");
                        </code>
                      </p>
                      <p className="text-stone-600 font-serif italic text-[11px]">
                        The contract administrator cannot execute this transfer using the admin wallet unless they are also the current registered owner of this property.
                      </p>
                    </div>

                    {/* Proposed Recipient Details */}
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                          Recipient Owner Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={proposedNewOwnerName}
                          onChange={(e) => setProposedNewOwnerName(e.target.value)}
                          placeholder="e.g. Ramesh Varma"
                          className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                        />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                          Recipient Ethereum Wallet Address (newOwner) *
                        </label>
                        <input
                          type="text"
                          required
                          value={proposedNewOwnerWallet}
                          onChange={(e) => setProposedNewOwnerWallet(e.target.value)}
                          placeholder="0x..."
                          className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 font-mono text-xs focus:outline-none focus:border-stone-400"
                        />
                      </div>
                    </div>

                    {/* Wallet Connection & Role Verification Card */}
                    <div className="pt-4 border-t border-stone-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                          Connected Wallet Authorization Check
                        </span>
                        {account && (
                          <span className="font-mono text-xs font-bold text-stone-900">{formatAddress(account)}</span>
                        )}
                      </div>

                      {!account ? (
                        <div className="p-4 bg-stone-100 border border-stone-300 rounded-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="text-xs text-stone-700">
                            <strong>MetaMask Not Connected:</strong> Connect the registered owner's wallet to authorize this on-chain transfer.
                          </div>
                          <button
                            type="button"
                            onClick={() => syncWallet(true)}
                            className="px-6 py-2.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition-colors"
                          >
                            Connect MetaMask
                          </button>
                        </div>
                      ) : !isSepolia ? (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm space-y-1">
                          <p className="font-bold">Wrong Network</p>
                          <p>Please switch your MetaMask network to Ethereum Sepolia (Chain ID 11155111).</p>
                        </div>
                      ) : isConnectedAsAdmin && !isCurrentOwnerWallet ? (
                        /* Case: Administrator is connected, but is NOT the owner */
                        <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 space-y-2">
                          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-amber-950">
                            <span className="material-symbols-outlined text-base text-amber-600">admin_panel_settings</span>
                            Administrator Wallet Connected ({formatAddress(account)})
                          </div>
                          <p className="leading-relaxed">
                            <strong>Administrator Restriction:</strong> As the contract administrator, you cannot execute this ownership transfer. Smart contract security rules enforce <code className="font-mono">require(msg.sender == currentOwner)</code>.
                          </p>
                          <p className="leading-relaxed">
                            Only the current registered owner (<code className="font-mono font-bold">{formatAddress(onChainPropertyData?.currentOwner)}</code>) has the cryptographic authority to sign <code className="font-mono">transferProperty()</code>.
                          </p>
                          <p className="font-semibold text-amber-950">
                            Action Required: Provide the shareable authorization link to the owner, or switch to the owner's MetaMask account to sign.
                          </p>
                        </div>
                      ) : !isCurrentOwnerWallet ? (
                        /* Case: Random non-owner account connected */
                        <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-sm space-y-1.5">
                          <p className="font-bold uppercase tracking-wider text-[11px]">Unauthorized Wallet Connected</p>
                          <p className="leading-relaxed">
                            Connected account <code className="font-mono">{formatAddress(account)}</code> does not match registered owner <code className="font-mono font-bold">{formatAddress(onChainPropertyData?.currentOwner)}</code>.
                          </p>
                          <p className="text-[11px] text-red-800">Please switch accounts in MetaMask to the property owner's address.</p>
                        </div>
                      ) : isRestrictedStatus ? (
                        /* Case: Property is Disputed or Suspended */
                        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-sm space-y-1">
                          <p className="font-bold uppercase tracking-wider text-[11px]">Transfers Blocked on Smart Contract</p>
                          <p>
                            Property #{onChainPropertyData.propertyId} holds status <strong>{STATUS_LABELS[onChainPropertyData.status]} ({onChainPropertyData.status})</strong>. The smart contract strictly reverts any transfer attempt until restored to Registered status.
                          </p>
                        </div>
                      ) : (
                        /* Case: Current Owner is connected and authorized */
                        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs rounded-sm space-y-1 font-sans">
                          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-900 text-[11px]">
                            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                            Authorized: Connected as Current On-Chain Owner ({formatAddress(account)})
                          </div>
                          <p>
                            You hold the cryptographic key to transfer this deed on Ethereum Sepolia. Click the button below to review and sign the transaction in MetaMask.
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={!canOwnerTransfer || isSubmitting}
                          className="px-8 py-3.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                              Confirming in MetaMask…
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">swap_horiz</span>
                              Sign & Authorize Transfer on Sepolia
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar: Historical Provenance & Previous Ownership */}
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                <h3 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-3">
                  Ownership Provenance Ledger
                </h3>

                {isBlockchain && onChainHistory.length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      On-Chain getOwnershipHistory ({onChainHistory.length} records)
                    </span>
                    <ol className="space-y-2">
                      {onChainHistory.map((addr, idx) => {
                        const isInitial = idx === 0;
                        const isCurrent = idx === onChainHistory.length - 1;
                        return (
                          <li key={idx} className="p-3 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs font-mono break-all space-y-1">
                            <div className="flex justify-between items-center text-[9px] uppercase font-bold text-stone-400 font-sans">
                              <span>Record #{idx + 1}</span>
                              <span className={`px-1.5 py-0.2 rounded-sm ${
                                isCurrent ? 'bg-emerald-100 text-emerald-900 font-bold' : isInitial ? 'bg-stone-200 text-stone-700' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {isCurrent ? 'Current Owner' : isInitial ? 'Initial Owner' : 'Prior Owner'}
                              </span>
                            </div>
                            <span className="text-stone-900 font-medium block">{addr}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : Array.isArray(selectedProperty?.ownershipHistory) && selectedProperty.ownershipHistory.length > 0 ? (
                  <ol className="space-y-2">
                    {selectedProperty.ownershipHistory.map((rec, idx) => (
                      <li key={idx} className="p-3 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-stone-900">{rec.owner}</span>
                          <span className="text-[9px] uppercase font-bold text-stone-400">{rec.type || 'Transfer'}</span>
                        </div>
                        {rec.wallet && <p className="font-mono text-[10px] text-stone-500 break-all">{rec.wallet}</p>}
                        {rec.txHash && (
                          <a
                            href={`${SEPOLIA_EXPLORER}/tx/${rec.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[10px] text-emerald-700 underline block"
                          >
                            TX: {rec.txHash.slice(0, 8)}… ↗
                          </a>
                        )}
                        <p className="text-[10px] text-stone-400 font-serif italic">
                          {rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-stone-400 font-serif italic">
                    No previous transfer events recorded for this property.
                  </p>
                )}
              </div>

              <div className="p-4 bg-stone-900 text-white rounded-sm text-xs space-y-2 font-sans">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-stone-300">
                  <span className="material-symbols-outlined text-sm">security</span>
                  Cryptographic Deed Invariant
                </div>
                <p className="text-stone-300 font-serif italic text-[11px] leading-relaxed">
                  Every ownership transfer must originate from a transaction signed by the property's current on-chain owner. Neither administrators nor platform operators can transfer a deed without the owner's private key.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
