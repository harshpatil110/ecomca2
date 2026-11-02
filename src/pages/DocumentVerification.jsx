import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ZeroHash } from 'ethers';
import { useRegistryData, lookupOnChainProperty } from '../services/registryDataService';

const OUTCOMES = {
  match: {
    icon: 'verified',
    color: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    iconColor: 'text-emerald-600',
    title: 'Hash Match Confirmed',
    description: "The selected document's SHA-256 hash is byte-for-byte identical to the registered document hash on Ethereum Sepolia. This cryptographically confirms that the file content is untampered and identical to what was registered.",
    disclaimer: 'A hash match does not prove legal ownership, deed validity, government title authenticity, or regulatory registration. It confirms only that the file content is identical to what was hashed at registration time.',
  },
  mismatch: {
    icon: 'cancel',
    color: 'bg-red-50 border-red-300 text-red-900',
    iconColor: 'text-red-600',
    title: 'Hash Mismatch Detected',
    description: "The selected document's SHA-256 hash does not match the registered hash on the blockchain. The document may have been edited, corrupted, re-formatted, or a different file was selected.",
    disclaimer: 'Even a single modified byte or whitespace difference produces a completely different cryptographic SHA-256 digest.',
  },
  zero_hash: {
    icon: 'help',
    color: 'bg-amber-50 border-amber-300 text-amber-900',
    iconColor: 'text-amber-600',
    title: 'Zero Hash / Document Not Registered',
    description: 'The registered document hash for this property is 0x0000000000000000000000000000000000000000000000000000000000000000 (empty hash). No cryptographic deed document was registered on-chain for this property.',
    disclaimer: 'Verification cannot proceed because there is no baseline document hash stored on the blockchain.',
  },
  property_not_found: {
    icon: 'search_off',
    color: 'bg-amber-50 border-amber-300 text-amber-900',
    iconColor: 'text-amber-600',
    title: 'Property Not Found on Blockchain',
    description: 'The specified Property ID does not exist in the Ethereum Sepolia smart contract registry. Please verify the ID.',
    disclaimer: null,
  },
  rpc_unavailable: {
    icon: 'cloud_off',
    color: 'bg-amber-50 border-amber-300 text-amber-900',
    iconColor: 'text-amber-600',
    title: 'Blockchain RPC Unavailable',
    description: 'The document hash was computed locally, but the Ethereum Sepolia smart contract could not be queried due to network or RPC provider unavailability.',
    disclaimer: 'Ensure you have an active internet connection or MetaMask connected to Sepolia testnet.',
  },
  unsupported_file: {
    icon: 'error',
    color: 'bg-red-50 border-red-300 text-red-900',
    iconColor: 'text-red-600',
    title: 'Unsupported / Unreadable File',
    description: 'The selected file could not be read into browser memory. The file may be locked by another application, corrupted, or exceeding browser memory limits.',
    disclaimer: null,
  },
};

export default function DocumentVerification() {
  const [searchParams] = useSearchParams();
  const { records, isRpcUnavailable } = useRegistryData();

  // Mode: 'property' (select on-chain property) or 'manual' (enter bytes32 hash)
  const [mode, setMode] = useState('property');
  const [selectedPropId, setSelectedPropId] = useState(() => searchParams.get('property') || '');
  const [manualHash, setManualHash] = useState(() => searchParams.get('hash') || '');

  // Live on-chain property data if looking up directly
  const [propLoading, setPropLoading] = useState(false);
  const [propError, setPropError] = useState('');
  const [fetchedProp, setFetchedProp] = useState(null);

  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [computedHash, setComputedHash] = useState('');
  const [computedAt, setComputedAt] = useState(null);
  const [hashing, setHashing] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // List of on-chain properties for dropdown
  const onChainProperties = useMemo(() => {
    return records.filter((r) => r.isOnChain);
  }, [records]);

  // When selectedPropId changes, fetch or lookup document hash
  useEffect(() => {
    if (!selectedPropId) {
      setFetchedProp(null);
      setPropError('');
      return;
    }

    // Try finding in records first
    const matched = records.find(
      (r) => String(r.blockchainPropertyId) === String(selectedPropId) || String(r.id) === String(selectedPropId)
    );

    if (matched && matched.documentHash) {
      setFetchedProp(matched);
      setPropError('');
      return;
    }

    // If not found in records or missing docHash, query on-chain directly
    let active = true;
    setPropLoading(true);
    setPropError('');
    lookupOnChainProperty(selectedPropId)
      .then((data) => {
        if (active) {
          setFetchedProp(data);
          setPropError('');
        }
      })
      .catch((err) => {
        if (active) {
          setFetchedProp(null);
          setPropError(err.message || 'Property not found.');
        }
      })
      .finally(() => {
        if (active) setPropLoading(false);
      });

    return () => { active = false; };
  }, [selectedPropId, records]);

  // Determine current active reference hash
  const activeReferenceHash = useMemo(() => {
    if (mode === 'manual') return manualHash.trim();
    if (fetchedProp) return fetchedProp.documentHash || '';
    return '';
  }, [mode, manualHash, fetchedProp]);

  // Process file and evaluate 6 outcomes
  const processFile = async (file) => {
    if (!file) return;

    setSelectedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      rawSize: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: new Date(file.lastModified).toLocaleString(),
    });

    setHashing(true);
    setOutcome(null);
    setComputedHash('');

    try {
      // 100% Client-Side In-Memory SHA-256 Calculation via Web Crypto API
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setComputedHash(hashHex);
      setComputedAt(new Date().toLocaleTimeString());

      // Evaluate verification state
      evaluateState(hashHex);
    } catch (err) {
      console.error('[DocumentVerification] File read error:', err);
      setOutcome('unsupported_file');
    } finally {
      setHashing(false);
    }
  };

  const evaluateState = (hashToCompare) => {
    const hash = hashToCompare || computedHash;
    if (!hash) return;

    if (mode === 'property') {
      if (isRpcUnavailable && !fetchedProp) {
        setOutcome('rpc_unavailable');
        return;
      }
      if (propError || (!propLoading && !fetchedProp)) {
        setOutcome('property_not_found');
        return;
      }
      const refHash = fetchedProp.documentHash;
      if (!refHash || refHash.toLowerCase() === ZeroHash.toLowerCase() || /^0x0+$/.test(refHash.trim())) {
        setOutcome('zero_hash');
        return;
      }
      if (hash.toLowerCase() === refHash.trim().toLowerCase()) {
        setOutcome('match');
      } else {
        setOutcome('mismatch');
      }
    } else {
      // Manual mode
      if (!manualHash.trim()) {
        setOutcome(null);
        return;
      }
      if (manualHash.toLowerCase() === ZeroHash.toLowerCase() || /^0x0+$/.test(manualHash.trim())) {
        setOutcome('zero_hash');
        return;
      }
      if (hash.toLowerCase() === manualHash.trim().toLowerCase()) {
        setOutcome('match');
      } else {
        setOutcome('mismatch');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setComputedHash('');
    setComputedAt(null);
    setOutcome(null);
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(''), 2500);
    } catch { /* ignore */ }
  };

  const outcomeData = outcome ? OUTCOMES[outcome] : null;

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-24">
      <div className="max-w-3xl mx-auto px-8 pt-10">
        {/* Breadcrumb */}
        <Link
          to="/records"
          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 mb-8"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Property Records
        </Link>

        {/* Title */}
        <div className="mb-10 border-b border-stone-200 pb-8">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Cryptographic Integrity Audit · SHA-256 Client-Side
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Document Verification
          </h1>
          <p className="text-base font-serif italic text-stone-500">
            Verify the cryptographic authenticity and integrity of property documents against on-chain records stored on Ethereum Sepolia.
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1: Select Property or Enter Hash */}
          <div className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Step 1 — Baseline Reference Document Hash
                </h2>
                <p className="text-xs font-serif italic text-stone-500 mt-0.5">
                  Select a registered on-chain property or paste a reference bytes32 SHA-256 hash.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-stone-100 p-0.5 rounded-sm shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                <button
                  type="button"
                  onClick={() => { setMode('property'); setOutcome(null); }}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition ${
                    mode === 'property' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  On-Chain Property
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('manual'); setOutcome(null); }}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition ${
                    mode === 'manual' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Manual Hash
                </button>
              </div>
            </div>

            {mode === 'property' ? (
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Select On-Chain Property
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={selectedPropId}
                    onChange={(e) => { setSelectedPropId(e.target.value); setOutcome(null); }}
                    className="sm:col-span-2 bg-[#fbf9f4] border border-stone-200 rounded-sm px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-800"
                  >
                    <option value="">— Select an On-Chain Property —</option>
                    {onChainProperties.map((p) => (
                      <option key={p.blockchainPropertyId || p.id} value={p.blockchainPropertyId || p.id}>
                        Property #{p.blockchainPropertyId} — {p.name || p.propertyRef || 'On-Chain Record'}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Or enter ID (e.g. 1)"
                    value={selectedPropId}
                    onChange={(e) => { setSelectedPropId(e.target.value); setOutcome(null); }}
                    className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-3 py-2.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-800 placeholder:font-serif placeholder:italic placeholder:text-stone-400"
                  />
                </div>

                {propLoading && (
                  <p className="text-stone-400 font-serif italic text-xs">Querying property record on Sepolia…</p>
                )}

                {propError && (
                  <p className="text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-sm text-xs font-mono">
                    {propError}
                  </p>
                )}

                {fetchedProp && (
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-sm space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-900">
                        Property #{fetchedProp.blockchainPropertyId || fetchedProp.propertyId}: {fetchedProp.name || fetchedProp.locationReference || 'Sepolia Property'}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                        {fetchedProp.status || fetchedProp.statusName || 'Registered'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-400 uppercase font-bold text-[9px]">Registered On-Chain Hash:</span>
                        {fetchedProp.documentHash && (
                          <button
                            type="button"
                            onClick={() => copyText(fetchedProp.documentHash, 'refHash')}
                            className="text-[9px] text-stone-500 hover:text-stone-900 font-bold uppercase flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[10px]">content_copy</span>
                            {copySuccess === 'refHash' ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-stone-800 break-all bg-white p-2 border border-stone-200 rounded-sm font-semibold select-all">
                        {fetchedProp.documentHash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Registered Document Hash (bytes32 hex)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualHash}
                    onChange={(e) => { setManualHash(e.target.value); setOutcome(null); }}
                    placeholder="0x1234567890abcdef... (bytes32 hash)"
                    className="w-full bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-800"
                  />
                  {manualHash && (
                    <button
                      onClick={() => { setManualHash(''); setOutcome(null); }}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload or Drop File */}
          <div className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Step 2 — Select Document for Hashing
            </h2>
            <p className="text-xs font-serif italic text-stone-500 mb-5">
              Files are processed entirely in browser memory and are never uploaded to any server or cloud API.
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-sm p-10 flex flex-col items-center justify-center transition-colors cursor-pointer group ${
                isDragging ? 'border-stone-900 bg-stone-100' : 'border-stone-300 bg-[#fbf9f4] hover:bg-[#f5f4ed]'
              }`}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                disabled={hashing}
              />
              <span className="material-symbols-outlined text-4xl text-stone-400 mb-3 group-hover:text-stone-900 transition-colors">
                fingerprint
              </span>
              <p className="text-sm font-bold text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {selectedFile ? 'Drop a different file or click to replace' : 'Click to Browse or Drag & Drop File'}
              </p>
              <p className="text-xs font-serif italic text-stone-500 text-center">
                Deed PDF, scanned title, survey map, PNG, JPG, or any digital asset
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] text-stone-500 font-sans">
              <span className="material-symbols-outlined text-sm text-emerald-600">security</span>
              <span>W3C Web Cryptography API (<code className="font-mono">crypto.subtle.digest</code>) · 100% Client-Side In-Memory Execution</span>
            </div>
          </div>

          {/* Hashing Progress */}
          {hashing && (
            <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-700 animate-spin">sync</span>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                Calculating SHA-256 digest in client memory…
              </span>
            </div>
          )}

          {/* Results Display */}
          {selectedFile && !hashing && (
            <div className="space-y-5">
              {/* File Metadata */}
              <div className="bg-[#fbf9f4] border border-stone-200 rounded-sm p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div>
                  <p className="font-bold text-stone-900">{selectedFile.name}</p>
                  <p className="text-stone-400 text-[10px] italic font-serif mt-0.5">
                    {selectedFile.size} · Type: {selectedFile.type} · Computed at {computedAt || 'just now'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-900 self-start sm:self-auto"
                >
                  Clear File
                </button>
              </div>

              {/* Computed Hash */}
              {computedHash && (
                <div className="bg-white border border-stone-200 rounded-sm p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Locally Computed SHA-256 Digest
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(computedHash, 'computed')}
                      className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 flex items-center gap-1"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      {copySuccess === 'computed' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-stone-800 break-all select-all font-bold">
                    {computedHash}
                  </p>
                </div>
              )}

              {/* Outcome Banner */}
              {outcomeData && (
                <div className={`border rounded-sm p-6 space-y-3 ${outcomeData.color}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${outcomeData.iconColor}`}>
                      {outcomeData.icon}
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {outcomeData.title}
                    </h3>
                  </div>

                  <p className="text-sm leading-relaxed font-sans">{outcomeData.description}</p>

                  {/* Hash Comparison Table if Match or Mismatch */}
                  {(outcome === 'match' || outcome === 'mismatch') && activeReferenceHash && (
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-current/20 text-xs font-mono">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">
                          Registered Reference Hash:
                        </p>
                        <p className="break-all select-all bg-white/60 p-2 rounded-sm border border-current/10">
                          {activeReferenceHash}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">
                          Locally Computed Hash:
                        </p>
                        <p className="break-all select-all bg-white/60 p-2 rounded-sm border border-current/10">
                          {computedHash}
                        </p>
                      </div>
                    </div>
                  )}

                  {outcomeData.disclaimer && (
                    <p className="text-[11px] font-serif italic opacity-85 border-t border-current/20 pt-3">
                      <strong>Cryptographic Scope:</strong> {outcomeData.disclaimer}
                    </p>
                  )}
                </div>
              )}

              {/* Manual compare trigger if user enters/changes hash afterwards */}
              {computedHash && !outcome && (
                <button
                  type="button"
                  onClick={() => evaluateState()}
                  className="w-full bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="material-symbols-outlined text-sm">compare_arrows</span>
                  Verify Document Against Hash
                </button>
              )}
            </div>
          )}

          {/* Prominent Legal Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 text-xs text-amber-900 font-serif italic leading-relaxed space-y-2.5">
            <p className="font-bold uppercase tracking-wider not-italic text-[10px] text-amber-800 font-sans">
              Cryptographic Integrity Disclaimer
            </p>
            <p>
              Cryptographic integrity verification confirms only that the byte-level file contents match the registered SHA-256 hash stored in the Ethereum Sepolia smart contract.
            </p>
            <p>
              A hash match does <strong>NOT</strong> constitute legal proof of title, valid deed execution, government registration with state land authorities, non-encumbrance, or freedom from title disputes. Lumina Realty is an independent decentralized technical demonstration registry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}