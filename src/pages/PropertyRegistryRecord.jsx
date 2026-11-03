import { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import registryAbi from '../blockchain/registryAbi.json';
import { getListingById } from '../services/listingsStore';
import { SEPOLIA_EXPLORER, REGISTRY_ADDRESS, SEPOLIA_RPC_URLS, isSepoliaNetwork } from '../blockchain/registryConfig';
import DocumentIntegrityVerification from '../blockchain/DocumentIntegrityVerification';
import { useRegistryData } from '../services/registryDataService';
import StatusModerationModal from '../components/StatusModerationModal';

const STATUS_LABELS = ['Registered', 'Disputed', 'Suspended'];

const STATUS_COLORS = {
  Registered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Disputed: 'bg-red-50 text-red-800 border-red-200',
  Suspended: 'bg-stone-100 text-stone-600 border-stone-200',
  Unregistered: 'bg-amber-50 text-amber-900 border-amber-300',
  'Unregistered — Blockchain Registration Required': 'bg-amber-50 text-amber-900 border-amber-300',
};

function InfoRow({ label, value, mono = false, children }) {
  return (
    <div className="py-3 border-b border-stone-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 shrink-0 pt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
      <span className={`text-sm text-stone-800 sm:text-right break-all ${mono ? 'font-mono text-xs' : 'font-medium font-serif italic'}`}>
        {children || value || '—'}
      </span>
    </div>
  );
}

export default function PropertyRegistryRecord() {
  const { id } = useParams();
  const { records, contractAdmin, refresh } = useRegistryData();

  const listing = useMemo(() => {
    const local = getListingById(id);
    if (local) return local;
    return records.find((r) => String(r.id) === String(id) || String(r.blockchainPropertyId) === String(id)) || null;
  }, [id, records]);

  // Live on-chain contract state
  const [liveChainData, setLiveChainData] = useState(null);
  const [isChainLoading, setIsChainLoading] = useState(false);
  const [chainError, setChainError] = useState('');
  const [isVerifiedOnChain, setIsVerifiedOnChain] = useState(null);
  const [isModerationOpen, setIsModerationOpen] = useState(false);

  const isBlockchain = Boolean(listing?.blockchainPropertyId || listing?.isOnChain);

  useEffect(() => {
    let active = true;
    const fetchChainRecord = async () => {
      if (!isBlockchain || !listing?.blockchainPropertyId) return;
      setIsChainLoading(true);
      setChainError('');

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

        if (!provider) throw new Error('Could not connect to Sepolia RPC endpoints.');

        const contract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
        const [prop, verified, onChainHistory] = await Promise.all([
          contract.getProperty(listing.blockchainPropertyId),
          contract.verifyProperty(listing.blockchainPropertyId),
          contract.getOwnershipHistory(listing.blockchainPropertyId).catch(() => []),
        ]);

        if (active) {
          setLiveChainData({
            propertyId: prop.propertyId.toString(),
            currentOwner: prop.currentOwner,
            registeredBy: prop.registeredBy,
            locationReference: prop.locationReference,
            documentHash: prop.documentHash,
            registrationTimestamp: prop.registrationTimestamp.toString(),
            status: Number(prop.status),
            onChainHistory: onChainHistory || [],
          });
          setIsVerifiedOnChain(verified);
        }
      } catch (err) {
        if (active) setChainError(err.message || 'Error querying on-chain record');
      } finally {
        if (active) setIsChainLoading(false);
      }
    };

    fetchChainRecord();
    return () => { active = false; };
  }, [isBlockchain, listing]);

  if (!listing) {
    return (
      <div className="bg-[#fbf9f4] min-h-screen flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-stone-300">inventory_2</span>
          <h2 className="text-2xl font-black tracking-tighter text-stone-900 uppercase mt-4 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Record Not Found
          </h2>
          <p className="text-stone-500 font-serif italic text-sm mb-6">
            Property Registry ID <span className="font-mono text-stone-700">{id}</span> was not found in the local database.
          </p>
          <Link to="/records" className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-stone-800 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
            Browse Property Records
          </Link>
        </div>
      </div>
    );
  }

  const status = listing.registryStatus || listing.status || 'Registered';
  const ownershipHistory = Array.isArray(listing.ownershipHistory) ? listing.ownershipHistory : [];

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-24">
      <div className="max-w-screen-xl mx-auto px-8 pt-10">
        {/* Breadcrumb */}
        <Link
          to="/records"
          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 mb-8"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Property Records
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-stone-200 pb-8 mb-10">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`border px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                {status}
              </span>
              {isBlockchain ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">token</span>
                  Blockchain Registered #{listing.blockchainPropertyId}
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  Unregistered — Blockchain Registration Required
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {listing.name}
            </h1>
            <p className="text-lg font-serif italic text-stone-500">{listing.location}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {isBlockchain ? (
              <>
                <Link
                  to={`/verify?hash=${encodeURIComponent(listing.documentHash || '')}`}
                  className="border border-stone-300 text-stone-700 text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-sm hover:bg-[#f5f4ed] transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-sm">fingerprint</span>
                  Verify Document
                </Link>
                <Link
                  to={`/transfers?property=${listing.id}`}
                  className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-sm hover:bg-stone-800 transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  Transfer Ownership
                </Link>
              </>
            ) : (
              <Link
                to={`/register?ref=${encodeURIComponent(listing.propertyRef || listing.id)}&title=${encodeURIComponent(listing.name || '')}`}
                className="bg-amber-800 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-amber-900 transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Initiate Blockchain Registration
              </Link>
            )}
          </div>
        </div>

        {/* Pending Transfer Request Banner */}
        {listing.pendingTransferRequest && listing.pendingTransferRequest.status === 'PENDING_OWNER_AUTHORIZATION' && (
          <div className="mb-10 p-5 bg-purple-50 border border-purple-200 rounded-sm text-xs text-purple-950 space-y-3 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm text-purple-900">
                <span className="material-symbols-outlined text-purple-700">pending_actions</span>
                Administrator-Assisted Transfer Request Pending Authorization
              </div>
              <Link
                to={`/transfers?property=${listing.id}`}
                className="bg-purple-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm hover:bg-purple-950 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                Review & Authorize Transfer
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/60 font-sans text-xs">
              <div>
                <span className="text-purple-600 uppercase font-bold text-[10px] block">Proposed New Owner</span>
                <span className="font-bold text-stone-900">{listing.pendingTransferRequest.proposedOwnerName}</span>
              </div>
              <div>
                <span className="text-purple-600 uppercase font-bold text-[10px] block">Proposed Wallet Address</span>
                <span className="font-mono text-stone-900 break-all">{listing.pendingTransferRequest.proposedOwnerWallet}</span>
              </div>
              {listing.pendingTransferRequest.notes && (
                <div className="sm:col-span-2">
                  <span className="text-purple-600 uppercase font-bold text-[10px] block">Conveyance Notes</span>
                  <p className="font-serif italic text-stone-800">{listing.pendingTransferRequest.notes}</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-purple-800 font-serif italic">
              Notice: This transfer request was initiated by {listing.pendingTransferRequest.initiatedBy || 'an administrator'}. Blockchain ownership remains with the current owner until personally authorized and signed via MetaMask on Sepolia.
            </p>
          </div>
        )}

        {/* Off-Chain Unregistered Banner */}
        {!isBlockchain && (
          <div className="mb-10 p-5 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 space-y-2 font-sans">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
              <span className="material-symbols-outlined text-amber-700">warning</span>
              Unregistered Record Notice
            </div>
            <p className="leading-relaxed">
              This property record is currently stored only in local prototype storage and is <strong>not registered on the Ethereum blockchain</strong>. It does not carry a blockchain property identifier, cryptographic deed verification, or on-chain provenance.
            </p>
            <p className="leading-relaxed">
              To formalize this title, an administrator must register it on the Ethereum Sepolia smart contract.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-10">
            {/* Property Identification */}
            <section className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-5 pb-4 border-b border-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                Property Identification
              </h2>
              <InfoRow label="Property Registry ID" value={listing.id} mono />
              <InfoRow label="Property Title / Reference" value={listing.name} />
              <InfoRow label="Location Reference Code" value={listing.propertyRef} mono />
              <InfoRow label="Property Type" value={listing.type ? listing.type.charAt(0).toUpperCase() + listing.type.slice(1) : '—'} />
              <InfoRow label="Survey / Plot Number" value={listing.surveyNumber || listing.plotNumber} mono />
              <InfoRow label="Property Location" value={listing.location} />
              <InfoRow label="City / Region" value={listing.city} />
              <InfoRow label="Land / Built-up Area" value={listing.area} />
              <InfoRow label="Construction Year" value={listing.yearBuilt} />
              {listing.description && (
                <div className="pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Property Description</p>
                  <p className="text-sm text-stone-600 font-serif italic leading-relaxed">{listing.description}</p>
                </div>
              )}
            </section>

            {/* Registered Owner */}
            <section className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-5 pb-4 border-b border-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                Current Registered Owner
              </h2>
              <InfoRow label="Owner Full Name" value={listing.ownerName || '—'} />
              <InfoRow label="Owner Wallet Address" value={listing.ownerWallet || listing.initialOwner} mono />
              <InfoRow label="Registration Date" value={listing.publishedAt ? new Date(listing.publishedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '—'} />
            </section>

            {/* Live Blockchain Record */}
            {isBlockchain && (
              <section className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
                <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-5 pb-4 border-b border-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Smart Contract Deed Record
                </h2>
                <InfoRow label="Blockchain Property ID" value={`#${listing.blockchainPropertyId}`} mono />
                <InfoRow label="Smart Contract Address" value={REGISTRY_ADDRESS} mono />
                <InfoRow label="Sepolia Transaction Hash">
                  {listing.blockchainTxHash ? (
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${listing.blockchainTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-emerald-700 hover:text-emerald-900 underline break-all"
                    >
                      {listing.blockchainTxHash} ↗
                    </a>
                  ) : '—'}
                </InfoRow>
                <InfoRow label="Registered Document Hash" value={listing.documentHash} mono />

                {/* Live RPC Query Status */}
                <div className="mt-4 p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs font-sans space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block">Live Contract State (Sepolia)</span>
                  {isChainLoading ? (
                    <p className="text-stone-400 italic font-serif">Querying Sepolia testnet…</p>
                  ) : chainError ? (
                    <p className="text-amber-800 font-serif italic">RPC Query: {chainError}</p>
                  ) : liveChainData ? (
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div><strong>Current On-Chain Owner:</strong> <span className="break-all">{liveChainData.currentOwner}</span></div>
                      <div><strong>Registered By (Contract Admin):</strong> <span className="break-all">{liveChainData.registeredBy}</span></div>
                      <div>
                        <strong>Registration Timestamp (On-Chain):</strong>{' '}
                        {liveChainData.registrationTimestamp && Number(liveChainData.registrationTimestamp) > 0
                          ? new Date(Number(liveChainData.registrationTimestamp) * 1000).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }) + ` (Unix: ${liveChainData.registrationTimestamp})`
                          : '—'}
                      </div>
                      <div><strong>Location Reference:</strong> {liveChainData.locationReference}</div>
                      <div><strong>On-Chain Document Hash:</strong> <span className="break-all text-stone-600">{liveChainData.documentHash}</span></div>
                      <div>
                        <strong>Deed Status:</strong>{' '}
                        <span className={liveChainData.status === 0 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                          {STATUS_LABELS[liveChainData.status] || 'Unknown'} (Enum {liveChainData.status})
                        </span>
                      </div>
                      <div>
                        <strong>Contract Verification Check (verifyProperty):</strong>{' '}
                        <span className={isVerifiedOnChain ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                          {isVerifiedOnChain ? '✓ Active Registered Status' : '✕ Not Registered Status'}
                        </span>
                      </div>

                      {/* Complete On-Chain Ownership Chain of Custody */}
                      {liveChainData.onChainHistory?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1.5">
                            On-Chain Ownership Ledger (getOwnershipHistory)
                          </span>
                          <ol className="space-y-1">
                            {liveChainData.onChainHistory.map((addr, idx) => {
                              const isCurrent = idx === liveChainData.onChainHistory.length - 1;
                              return (
                                <li key={`${addr}-${idx}`} className="p-2 bg-white border border-stone-200 rounded-sm flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-2">
                                    <span className="font-bold text-stone-400">{idx + 1}.</span>
                                    <span className="break-all text-stone-800">{addr}</span>
                                  </span>
                                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm shrink-0 ${
                                    isCurrent ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'
                                  }`}>
                                    {isCurrent ? 'Current Owner' : idx === 0 ? 'Initial Owner' : 'Prior Owner'}
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-stone-400 font-serif italic">No contract data retrieved.</p>
                  )}
                </div>
              </section>
            )}

            {/* Ownership History */}
            {ownershipHistory.length > 0 && (
              <section className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
                <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-5 pb-4 border-b border-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Ownership Transfer History
                </h2>
                <ol className="space-y-3">
                  {ownershipHistory.map((entry, i) => (
                    <li key={i} className="flex gap-4 p-3 bg-[#fbf9f4] border border-stone-100 rounded-sm text-xs">
                      <span className="font-bold text-stone-400 w-6 shrink-0">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="font-bold text-stone-900 font-sans">{entry.owner}</p>
                        {entry.wallet && <p className="font-mono text-stone-400 text-[10px] mt-0.5 break-all">{entry.wallet}</p>}
                        {entry.txHash && (
                          <a
                            href={`${SEPOLIA_EXPLORER}/tx/${entry.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-emerald-700 text-[10px] underline block mt-0.5"
                          >
                            Tx: {entry.txHash.slice(0, 10)}…{entry.txHash.slice(-8)} ↗
                          </a>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-stone-400 font-serif italic text-[10px]">
                            {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                          </span>
                          <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase">
                            {entry.type || 'Transfer'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Document Integrity Verification */}
            <section className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-5 pb-4 border-b border-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                Document Integrity Verification
              </h2>
              <DocumentIntegrityVerification
                onChainDocumentHash={listing.documentHash}
                blockchainPropertyId={listing.blockchainPropertyId}
                verificationState={isVerifiedOnChain ? 'verified' : isBlockchain ? 'verified' : 'unavailable'}
                isOffChain={!isBlockchain}
                websiteListingId={listing.id}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Status Card */}
            <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Registry Status</h3>
              <span className={`border px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-widest w-full flex items-center justify-center ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                {status}
              </span>
              {listing.statusReason && (
                <p className="mt-3 text-xs font-serif italic text-stone-500 leading-relaxed">
                  Reason: {listing.statusReason}
                </p>
              )}
              <button
                type="button"
                onClick={() => setIsModerationOpen(true)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 rounded-sm transition-colors shadow-xs"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <span className="material-symbols-outlined text-xs">gavel</span>
                Change Status (1. Reg, 2. Disp, 3. Susp)
              </button>
            </div>

            {/* Quick Reference */}
            <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-sm space-y-3 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Record Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Registry ID</span>
                  <span className="font-mono font-bold text-stone-900">{listing.id}</span>
                </div>
                {listing.propertyRef && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Location Ref</span>
                    <span className="font-mono text-stone-700">{listing.propertyRef}</span>
                  </div>
                )}
                {listing.blockchainPropertyId ? (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Blockchain ID</span>
                    <span className="font-mono font-bold text-emerald-800">#{listing.blockchainPropertyId}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Blockchain Status</span>
                    <span className="font-bold text-amber-700">Unregistered</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Has Document Hash</span>
                  <span className={`font-bold ${listing.documentHash && !/^0x0+$/.test(listing.documentHash) ? 'text-emerald-700' : 'text-stone-400'}`}>
                    {listing.documentHash && !/^0x0+$/.test(listing.documentHash) ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsModerationOpen(true)}
                className="w-full flex items-center justify-between bg-stone-100 border border-stone-300 text-stone-900 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-sm hover:bg-stone-200 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <span>Change Property Status</span>
                <span className="material-symbols-outlined text-sm">gavel</span>
              </button>

              {isBlockchain ? (
                <>
                  <Link
                    to={`/transfers?property=${listing.blockchainPropertyId || listing.id}`}
                    className="w-full flex items-center justify-between bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-sm hover:bg-stone-800 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <span>Transfer Ownership</span>
                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  </Link>
                  <Link
                    to={`/verify?property=${listing.blockchainPropertyId || listing.id}&hash=${encodeURIComponent(listing.documentHash || '')}`}
                    className="w-full flex items-center justify-between bg-white border border-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-sm hover:bg-[#f5f4ed] transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <span>Verify Document</span>
                    <span className="material-symbols-outlined text-sm">fingerprint</span>
                  </Link>
                  {listing.blockchainTxHash && (
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${listing.blockchainTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-sm hover:bg-emerald-100 transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <span>View on Etherscan</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  )}
                </>
              ) : (
                <Link
                  to={`/register?ref=${encodeURIComponent(listing.propertyRef || listing.id)}&title=${encodeURIComponent(listing.name || '')}`}
                  className="w-full flex items-center justify-between bg-amber-800 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-sm hover:bg-amber-900 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span>Register on Blockchain</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 text-[11px] text-stone-600 font-serif italic leading-relaxed">
              <strong>Cryptographic Notice:</strong> Demonstrates decentralized property title registry on Ethereum Sepolia. Document integrity is cryptographically backed by SHA-256 hashes. Not an official government land records bureau.
            </div>
          </aside>
        </div>
      </div>

      {/* Admin Status Moderation Modal */}
      {isModerationOpen && (
        <StatusModerationModal
          property={{
            ...listing,
            blockchainPropertyId: listing.blockchainPropertyId || listing.id,
            onChainStatus: liveChainData?.status ?? (listing.status === 'Disputed' ? 1 : listing.status === 'Suspended' ? 2 : 0),
          }}
          contractAdmin={contractAdmin || liveChainData?.registeredBy}
          isOpen={isModerationOpen}
          onClose={() => setIsModerationOpen(false)}
          onStatusUpdated={() => {
            setIsModerationOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
