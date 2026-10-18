import { useState } from 'react';
import { ZeroHash } from 'ethers';

export default function DocumentIntegrityVerification({
  onChainDocumentHash,
  blockchainPropertyId,
  verificationState = 'verified', // 'loading' | 'verified' | 'unverified' | 'unavailable'
  isOffChain = false,
  websiteListingId,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [computedHash, setComputedHash] = useState('');
  const [hashing, setHashing] = useState(false);
  const [outcome, setOutcome] = useState(null); // 'match' | 'mismatch' | 'missing' | 'unavailable' | 'error'
  const [copySuccess, setCopySuccess] = useState('');

  const isHashMissing =
    !onChainDocumentHash ||
    onChainDocumentHash.toLowerCase() === ZeroHash.toLowerCase() ||
    onChainDocumentHash.trim() === '0x' ||
    /^0x0+$/.test(onChainDocumentHash.trim());

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      rawSize: file.size,
      type: file.type || 'Document / Binary',
      lastModified: new Date(file.lastModified).toLocaleDateString(),
    });

    setHashing(true);
    setOutcome(null);
    setComputedHash('');

    try {
      // 100% Client-Side In-Memory SHA-256 Calculation via Web Crypto API (Never uploaded)
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setComputedHash(hashHex);

      // Determine outcome strictly based on requirements
      if (verificationState === 'unavailable') {
        setOutcome('unavailable');
      } else if (isHashMissing) {
        setOutcome('missing');
      } else if (hashHex.toLowerCase() === onChainDocumentHash.trim().toLowerCase()) {
        setOutcome('match');
      } else {
        setOutcome('mismatch');
      }
    } catch (err) {
      console.error('[DocumentIntegrityVerification] Error computing hash:', err);
      setOutcome('error');
    } finally {
      setHashing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setComputedHash('');
    setOutcome(null);
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(''), 2500);
    } catch {
      // ignore
    }
  };

  // Case 1: Off-Chain Property
  if (isOffChain) {
    return (
      <div className="bg-[#fbf9f4] p-6 rounded-sm border border-stone-200 space-y-3 font-sans">
        <div className="flex items-center gap-2 text-stone-800 text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-base text-stone-500">lock_open</span>
          Document Verification Unavailable
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          On-chain document integrity verification is <strong>unavailable</strong> for off-chain properties.
          This property is maintained in Lumina Realty's catalog (Website ID: {websiteListingId || 'Catalog'}) and is not recorded on the Ethereum blockchain. It is not blockchain-verified.
        </p>
      </div>
    );
  }

  // Case 2: On-Chain Property
  return (
    <div className="bg-white border border-stone-200 rounded-sm p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-stone-100 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans">
              Cryptographic Integrity
            </span>
            <span className="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm font-mono uppercase font-bold">
              SHA-256 (Client-Side)
            </span>
          </div>
          <h3 className="text-xl font-serif text-stone-900">
            Property Document Integrity Check
          </h3>
          <p className="text-xs text-stone-500 mt-1 font-sans leading-relaxed">
            Verify the cryptographic integrity of deed documents, blueprints, or agreements by computing their SHA-256 hash locally in your browser.
          </p>
        </div>

        {/* Client-Side Guarantee Tag */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#fbf9f4] border border-stone-200 rounded-sm text-[10px] font-mono text-stone-600">
          <span className="material-symbols-outlined text-xs text-emerald-600">security</span>
          <span>Never uploaded · 100% Local</span>
        </div>
      </div>

      {/* On-Chain Hash Reference Display */}
      <div className="p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            On-Chain Document Hash (Property #{blockchainPropertyId || '—'})
          </span>
          {onChainDocumentHash && !isHashMissing && (
            <button
              type="button"
              onClick={() => copyText(onChainDocumentHash, 'On-chain hash')}
              className="text-[10px] text-stone-500 hover:text-stone-900 font-sans uppercase font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
              {copySuccess === 'On-chain hash' ? 'Copied' : 'Copy Hash'}
            </button>
          )}
        </div>

        {verificationState === 'unavailable' ? (
          <div className="text-xs text-amber-800 font-sans flex items-center gap-2 py-1">
            <span className="material-symbols-outlined text-sm text-amber-600">cloud_off</span>
            <span>Blockchain information unavailable — Could not retrieve on-chain hash from Sepolia RPC.</span>
          </div>
        ) : isHashMissing ? (
          <div className="text-xs text-stone-500 font-sans italic py-1">
            Document hash unavailable — No cryptographic hash was stored on-chain at registration (Zero hash).
          </div>
        ) : (
          <div className="font-mono text-xs text-stone-900 break-all select-all font-semibold">
            {onChainDocumentHash}
          </div>
        )}
      </div>

      {/* File Selection Dropzone (Local in-browser only) */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-500 mb-2 font-sans">
          Select Document for Client-Side Hash Verification
        </label>

        <label className="border-2 border-dashed border-stone-300 rounded-sm p-6 sm:p-8 flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#f5f4ed] cursor-pointer transition-colors group relative">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            disabled={hashing}
          />
          <span className="material-symbols-outlined text-3xl text-stone-400 mb-2 group-hover:text-stone-900 transition-colors">
            fingerprint
          </span>
          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1 font-sans">
            {selectedFile ? 'Select a different file' : 'Choose Local Document to Verify'}
          </span>
          <span className="text-[11px] text-stone-500 font-serif italic text-center">
            PDF, PNG, JPG, DOCX, or TXT · Processed entirely in browser memory (never sent to server)
          </span>
        </label>
      </div>

      {/* Hashing Spinner */}
      {hashing && (
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-base text-stone-700 animate-spin">sync</span>
          <span className="text-xs font-bold uppercase tracking-widest text-stone-800 font-sans">
            Computing SHA-256 cryptographic digest in browser memory…
          </span>
        </div>
      )}

      {/* Selected File Details & Verification Result */}
      {selectedFile && !hashing && (
        <div className="space-y-4 pt-2">
          {/* File Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs font-sans gap-2">
            <div>
              <span className="font-bold text-stone-900 block">{selectedFile.name}</span>
              <span className="text-stone-500 text-[11px]">
                {selectedFile.size} · Modified {selectedFile.lastModified}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-900 self-start sm:self-auto"
            >
              Clear Selection
            </button>
          </div>

          {/* Computed Hash Box */}
          {computedHash && (
            <div className="p-4 bg-white border border-stone-200 rounded-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Computed Local SHA-256 Digest
                </span>
                <button
                  type="button"
                  onClick={() => copyText(computedHash, 'Computed hash')}
                  className="text-[10px] text-stone-500 hover:text-stone-900 font-sans uppercase font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  {copySuccess === 'Computed hash' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <span className="font-mono text-xs text-stone-800 break-all block font-semibold">
                {computedHash}
              </span>
            </div>
          )}

          {/* Outcome 1: Hash Matches */}
          {outcome === 'match' && (
            <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-sm space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-emerald-600">verified</span>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900">
                  Hash matches
                </h4>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
                ✓ Cryptographic Match Confirmed: The local document's SHA-256 hash is byte-for-byte identical to the hash stored on the Sepolia smart contract registry.
              </p>
              <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-800 font-serif italic leading-relaxed">
                <strong>Legal & Technical Explanation:</strong> A matching cryptographic hash proves that the selected local document's binary contents are identical to the document hashed at the time of registration. A hash match does not prove legal ownership, deed validity, government title authenticity, or regulatory registration.
              </div>
            </div>
          )}

          {/* Outcome 2: Hash Does Not Match */}
          {outcome === 'mismatch' && (
            <div className="p-6 bg-red-50 border border-red-300 rounded-sm space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-red-600">cancel</span>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-900">
                  Hash does not match
                </h4>
              </div>
              <p className="text-xs text-red-900 leading-relaxed font-semibold">
                ✕ Cryptographic Mismatch: The local document's SHA-256 hash differs from the document hash recorded on-chain.
              </p>
              <p className="text-xs text-red-800 leading-relaxed">
                The file you selected has different binary contents or has been modified since registration. Verify that you have selected the exact, unmodified deed document or blueprint.
              </p>
              <div className="pt-2 border-t border-red-200/70 text-[11px] text-red-700 font-serif italic leading-relaxed">
                <strong>Explanation:</strong> Any change in file formatting, metadata, or contents produces a completely different SHA-256 hash.
              </div>
            </div>
          )}

          {/* Outcome 3: Document Hash Unavailable */}
          {outcome === 'missing' && (
            <div className="p-6 bg-amber-50 border border-amber-300 rounded-sm space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-amber-600">help</span>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-900">
                  Document hash unavailable
                </h4>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                The on-chain record for Property #{blockchainPropertyId} does not have a registered cryptographic document hash (stored as ZeroHash). Document integrity cannot be compared against the smart contract.
              </p>
            </div>
          )}

          {/* Outcome 4: Blockchain Information Unavailable */}
          {outcome === 'unavailable' && (
            <div className="p-6 bg-amber-50 border border-amber-300 rounded-sm space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-amber-600">cloud_off</span>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-900">
                  Blockchain information unavailable
                </h4>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                The local document hash was computed successfully, but the Sepolia blockchain RPC could not be contacted to load the on-chain comparison hash. Please reconnect to Sepolia to verify.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimers & Distinction Notice */}
      <div className="pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500 font-serif italic leading-relaxed">
        <p>
          <strong>Status Distinction Notice:</strong> The smart contract ledger status (Registered, Disputed, or Suspended) reflects administrative recording on the blockchain and is entirely distinct from document integrity review.
        </p>
        <p>
          Document hashing is executed locally on your device via the W3C Web Cryptography API. Files are never uploaded, transmitted across the internet, or saved to external databases.
        </p>
      </div>
    </div>
  );
}
