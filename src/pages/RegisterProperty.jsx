import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BrowserProvider, Contract, getAddress, isAddress, isHexString, ZeroHash } from 'ethers';
import registryAbi from '../blockchain/registryAbi.json';
import { REGISTRY_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_EXPLORER, isSepoliaNetwork } from '../blockchain/registryConfig';
import { getListings, saveListing } from '../services/listingsStore';

function normalizeAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  try {
    return getAddress(addr.trim()).toLowerCase();
  } catch {
    return addr.trim().toLowerCase();
  }
}

function readableError(error) {
  return error?.shortMessage || error?.reason || error?.info?.error?.message || error?.message || 'An unexpected error occurred.';
}

export default function RegisterProperty() {
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    propertyRef: '',
    propertyType: 'residential',
    surveyNumber: '',
    plotNumber: '',
    area: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    ownerFullName: '',
    ownerWalletAddress: '',
    description: '',
    additionalNotes: '',
  });

  // Supporting Document & Hash State
  const [documentFile, setDocumentFile] = useState(null);
  const [documentHash, setDocumentHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);

  // Blockchain & MetaMask State
  const [account, setAccount] = useState('');
  const [contractAdmin, setContractAdmin] = useState('');
  const [chainId, setChainId] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // Workflow progress states: 'idle' | 'validating' | 'awaiting_wallet' | 'registering' | 'saving' | 'published' | 'error'
  const [progressState, setProgressState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [savedResult, setSavedResult] = useState(null);

  const isSepolia = Boolean(chainId && isSepoliaNetwork(chainId));
  const isAdminMatch = Boolean(
    account && contractAdmin && normalizeAddress(account) === normalizeAddress(contractAdmin)
  );

  // Sync Wallet
  const syncWallet = useCallback(async (requestPrompt = false) => {
    if (!window.ethereum) {
      if (requestPrompt) setFormError('MetaMask was not detected. Please install or enable MetaMask to register properties.');
      return;
    }
    try {
      if (requestPrompt) setIsWalletConnecting(true);
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

      if (!isSepoliaNetwork(network.chainId)) {
        setContractAdmin('');
        if (requestPrompt) setFormError('Switch MetaMask to Sepolia testnet (Chain ID 11155111).');
        return;
      }

      const readContract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
      try {
        const adminAddr = await readContract.admin();
        const adminStr = String(adminAddr);
        setContractAdmin(adminStr);

        setFormData((prev) => ({
          ...prev,
          ownerWalletAddress: prev.ownerWalletAddress || activeAccount || adminStr,
        }));
      } catch (err) {
        console.error('[RegisterProperty] Error reading contract admin:', err);
      }
    } catch (err) {
      console.error('[RegisterProperty] Wallet sync error:', err);
      if (requestPrompt) setFormError(readableError(err));
    } finally {
      setIsWalletConnecting(false);
    }
  }, []);

  useEffect(() => {
    syncWallet(false);

    if (!window.ethereum) return undefined;
    const handleAccounts = () => {
      syncWallet(false);
    };
    const handleChain = () => {
      syncWallet(false);
    };

    window.ethereum.on?.('accountsChanged', handleAccounts);
    window.ethereum.on?.('chainChanged', handleChain);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum.removeListener?.('chainChanged', handleChain);
    };
  }, [syncWallet]);

  // Auto-generate reference code
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      let ref = prev.propertyRef;
      if (!ref || ref.startsWith('REG-') || ref.startsWith('PR-')) {
        const slug = val ? val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() : 'PR';
        const randNum = Math.floor(100 + Math.random() * 900);
        ref = `${slug || 'PR'}-${randNum}`;
      }
      return { ...prev, title: val, propertyRef: ref };
    });
  };

  // Local Document Hash Calculation via W3C Web Crypto API
  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || 'Document / Binary',
    });

    setIsHashing(true);
    setFormError('');

    try {
      const buffer = await file.arrayBuffer();
      const digestBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(digestBuffer));
      const hashHex = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setDocumentHash(hashHex);
    } catch (err) {
      console.error('[RegisterProperty] SHA-256 calculation error:', err);
      setFormError('Failed to calculate SHA-256 digest of supporting document.');
    } finally {
      setIsHashing(false);
    }
  };

  // Duplicate Check
  const checkDuplicateRegistration = (ref) => {
    if (!ref || !ref.trim()) return null;
    const all = getListings();
    return (
      all.find(
        (item) =>
          item.propertyRef &&
          item.propertyRef.trim().toLowerCase() === ref.trim().toLowerCase() &&
          item.blockchainPropertyId
      ) || null
    );
  };

  // Validation
  const validateForm = () => {
    if (!formData.title.trim()) return 'Property Title / Reference is required.';
    if (!formData.propertyRef.trim()) return 'Property Reference code is required.';
    if (!formData.streetAddress.trim()) return 'Property Street Address is required.';
    if (!formData.city.trim()) return 'City is required.';
    if (!formData.ownerFullName.trim()) return "Current Owner's Full Name is required.";
    if (!account) return 'MetaMask connection is required. Connect your wallet to proceed.';
    if (!isSepolia) return 'MetaMask must be connected to Ethereum Sepolia testnet (Chain ID 11155111).';
    if (!isAdminMatch) return `Unauthorized: Connected wallet (${account.slice(0, 6)}…${account.slice(-4)}) does not match contract admin address. Only the authorized contract admin can register properties.`;
    const wallet = formData.ownerWalletAddress.trim() || account;
    if (!isAddress(wallet)) return 'A valid initial owner Ethereum wallet address is required.';
    if (!documentHash || !isHexString(documentHash, 32) || documentHash === ZeroHash) {
      return 'A valid 32-byte SHA-256 document hash is required. Please upload a property document to calculate its cryptographic hash.';
    }
    return null;
  };

  // Mandatory Blockchain Registration Execution
  const handleRegisterOnChain = async (e) => {
    e.preventDefault();
    setFormError('');
    setStatusMessage('');
    setSavedResult(null);

    const valErr = validateForm();
    if (valErr) {
      setFormError(valErr);
      return;
    }

    const duplicate = checkDuplicateRegistration(formData.propertyRef);
    if (duplicate) {
      setFormError(
        `Duplicate registration blocked: Reference "${formData.propertyRef.trim()}" is already registered on-chain with Blockchain ID #${duplicate.blockchainPropertyId} (Registry Record ID: ${duplicate.id}).`
      );
      return;
    }

    try {
      setProgressState('awaiting_wallet');
      setStatusMessage('Waiting for MetaMask signature and transaction authorization...');

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (!isSepoliaNetwork(network.chainId)) {
        throw new Error('Please ensure MetaMask is connected to Sepolia testnet (Chain ID 11155111).');
      }

      const signer = await provider.getSigner();
      const writeContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);

      const targetOwner = formData.ownerWalletAddress.trim() || account;
      const targetRef = formData.propertyRef.trim();
      const targetHash = documentHash;

      // Submit on-chain registration transaction
      const tx = await writeContract.registerProperty(targetOwner, targetRef, targetHash);

      setProgressState('registering');
      setStatusMessage(`Transaction submitted (${tx.hash.slice(0, 10)}…). Waiting for Sepolia block confirmation…`);

      const receipt = await tx.wait();
      console.log('[RegisterProperty] Tx confirmed:', receipt);

      if (!receipt || receipt.status !== 1) {
        throw new Error('On-chain transaction reverted or failed on Sepolia.');
      }

      // Extract assigned property ID from event
      let assignedBlockchainId = '';
      const readContract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
      const iface = readContract.interface;

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'PropertyRegistered') {
            assignedBlockchainId = parsed.args.propertyId.toString();
            break;
          }
        } catch {
          // ignore unrelated logs
        }
      }

      if (!assignedBlockchainId) {
        const count = await readContract.getPropertyCount();
        assignedBlockchainId = count.toString();
      }

      // Save confirmed record to store
      setProgressState('saving');
      setStatusMessage('On-chain registration confirmed! Creating property registry record...');

      const websiteRegistryId = `REG-${Date.now().toString().slice(-6)}`;
      const fullAddress = `${formData.streetAddress.trim()}${formData.city ? ', ' + formData.city.trim() : ''}${formData.state ? ', ' + formData.state.trim() : ''}`;

      const recordPayload = {
        id: websiteRegistryId,
        blockchainPropertyId: assignedBlockchainId,
        blockchainTxHash: receipt.hash,
        name: formData.title.trim(),
        propertyRef: targetRef,
        surveyNumber: formData.surveyNumber.trim() || (formData.plotNumber ? `Plot ${formData.plotNumber.trim()}` : 'N/A'),
        plotNumber: formData.plotNumber.trim() || '',
        type: formData.propertyType,
        area: formData.area.trim() || 'N/A',
        location: fullAddress,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        description: formData.description.trim(),
        additionalNotes: formData.additionalNotes.trim(),
        src: '/brutalist_exterior.png',
        status: 'Registered',
        registryStatus: 'Registered',
        ownerName: formData.ownerFullName.trim(),
        ownerWallet: targetOwner,
        initialOwner: targetOwner,
        documentHash: targetHash,
        documentFileName: documentFile?.name || null,
        badge: 'Blockchain Registered',
        ownershipHistory: [
          {
            owner: formData.ownerFullName.trim(),
            wallet: targetOwner,
            txHash: receipt.hash,
            date: new Date().toISOString(),
            type: 'Initial Blockchain Registration',
          },
        ],
      };

      const saved = saveListing(recordPayload);
      setProgressState('published');
      setStatusMessage('Property record immutably registered on Ethereum Sepolia and recorded in registry!');
      setSavedResult({
        websiteListingId: saved.id,
        blockchainPropertyId: assignedBlockchainId,
        txHash: receipt.hash,
      });
    } catch (err) {
      console.error('[RegisterProperty] Registration error:', err);
      setProgressState('error');
      setFormError(`Registration failed: ${readableError(err)}`);
    }
  };

  const isSubmitting =
    progressState === 'validating' ||
    progressState === 'awaiting_wallet' ||
    progressState === 'registering' ||
    progressState === 'saving';

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-28">
      {/* Page Header */}
      <div className="border-b border-stone-200/40 px-8 pt-10 pb-8 max-w-4xl mx-auto">
        <Link
          to="/records"
          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 mb-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Property Records
        </Link>
        <h1
          className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Register Property
        </h1>
        <p className="text-base font-serif italic text-stone-500 mt-2">
          Blockchain-mandated property registration. Every property record is authenticated and registered on the Ethereum Sepolia smart contract.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-8 pt-10">
        {/* Success Banner */}
        {savedResult && (
          <div className="mb-10 p-6 bg-white border border-emerald-300 rounded-sm shadow-sm space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-3xl text-emerald-600">verified</span>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-black tracking-widest uppercase text-stone-900">
                  Property Successfully Registered on Blockchain
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  The property record has been immutably registered on the Sepolia smart contract registry and assigned sequential on-chain Blockchain Property ID #{savedResult.blockchainPropertyId}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs font-mono">
                  <div>
                    <span className="text-stone-400 uppercase font-sans text-[10px] font-bold block">Registry Record ID</span>
                    <span className="font-bold text-stone-900">{savedResult.websiteListingId}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 uppercase font-sans text-[10px] font-bold block">Blockchain Property ID</span>
                    <span className="font-bold text-emerald-700">#{savedResult.blockchainPropertyId}</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-stone-200">
                    <span className="text-stone-400 uppercase font-sans text-[10px] font-bold block">Sepolia Transaction Hash</span>
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${savedResult.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-stone-800 break-all hover:text-stone-900"
                    >
                      {savedResult.txHash} ↗
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    to={`/records/${savedResult.websiteListingId}`}
                    className="px-5 py-2.5 bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-stone-800 transition-colors"
                  >
                    View Property Record
                  </Link>
                  <Link
                    to="/records"
                    className="px-5 py-2.5 border border-stone-300 text-stone-800 text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-[#fbf9f4] transition-colors"
                  >
                    All Property Records
                  </Link>
                  <Link
                    to="/verify"
                    className="px-5 py-2.5 border border-stone-300 text-stone-800 text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-[#fbf9f4] transition-colors"
                  >
                    Verify Document
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Banner */}
        {isSubmitting && (
          <div className="mb-8 p-4 bg-[#f5f4ed] border border-stone-300 rounded-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-stone-700 animate-spin">sync</span>
            <span className="text-xs uppercase font-bold tracking-widest text-stone-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              {statusMessage}
            </span>
          </div>
        )}

        {/* Error Banner */}
        {formError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3 text-red-800 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="material-symbols-outlined text-lg text-red-600 shrink-0">error</span>
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{formError}</p>
              <p className="text-[11px] text-red-700">No unregistered or off-chain record was created. Resolve the error and retry blockchain submission.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegisterOnChain} className="space-y-10" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Section A: Property Identification */}
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
                A. Property Identification
              </h2>
              <p className="text-xs font-serif italic text-stone-500 mt-1">
                Essential metadata to identify the physical land parcel or built structure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Title / Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 text-sm"
                  placeholder="e.g. Lumina Heights Plot 12"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Reference Code *</label>
                <input
                  type="text"
                  value={formData.propertyRef}
                  onChange={(e) => setFormData((prev) => ({ ...prev, propertyRef: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. HYD-012 or LUM-742"
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-stone-400 italic font-serif">Used on-chain as the locationReference parameter.</span>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Type *</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, propertyType: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400 appearance-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="residential">Residential Land / Plot</option>
                  <option value="commercial">Commercial Property</option>
                  <option value="villa">Villa / Independent House</option>
                  <option value="apartment">Apartment / Flat</option>
                  <option value="agricultural">Agricultural Land</option>
                  <option value="industrial">Industrial Plot</option>
                </select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Survey Number</label>
                <input
                  type="text"
                  value={formData.surveyNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, surveyNumber: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Survey No. 45/A"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Plot Number</label>
                <input
                  type="text"
                  value={formData.plotNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, plotNumber: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Plot 12"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Land or Built-up Area</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. 2,400 sq ft or 0.25 Acres"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">City / District *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Hyderabad"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Street / Locality Address *</label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, streetAddress: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Plot 12, Financial District, Gachibowli"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Section B: Ownership Information */}
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
                B. Registered Ownership Information
              </h2>
              <p className="text-xs font-serif italic text-stone-500 mt-1">
                Designate the legal individual and Ethereum wallet address to be recorded as the initial owner.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Current Owner's Full Name *</label>
                <input
                  type="text"
                  value={formData.ownerFullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ownerFullName: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Seshagiri Rao"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                  Owner Ethereum Wallet Address *
                </label>
                <input
                  type="text"
                  value={formData.ownerWalletAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ownerWalletAddress: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 font-mono text-xs focus:outline-none focus:border-stone-400"
                  placeholder="0x..."
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-stone-400 italic font-serif">
                  Ethereum address associated with the on-chain registry deed record.
                </span>
              </div>
            </div>
          </div>

          {/* Section C: Supporting Documents & SHA-256 Hash */}
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
                C. Supporting Documents & Cryptographic Integrity
              </h2>
              <p className="text-xs font-serif italic text-stone-500 mt-1">
                Upload deed title, survey blueprint, or agreement. The SHA-256 hash is calculated locally in browser memory and immutably written to the blockchain. The document itself is never published publicly.
              </p>
            </div>

            <label className="border-2 border-dashed border-stone-300 rounded-sm p-8 flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#f5f4ed] cursor-pointer transition-colors group">
              <input type="file" onChange={handleDocumentUpload} className="hidden" disabled={isSubmitting} />
              <span className="material-symbols-outlined text-3xl text-stone-400 mb-2 group-hover:text-stone-900 transition-colors">
                fingerprint
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                {documentFile ? 'Choose Different Document' : 'Upload Property Document for Hashing *'}
              </p>
              <p className="text-[11px] font-serif italic text-stone-500">
                PDF, JPG, PNG, DOCX · Computed locally via W3C Web Cryptography API
              </p>
            </label>

            {isHashing && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-sm text-stone-600 animate-spin">sync</span>
                <span className="font-bold uppercase tracking-widest text-stone-700">Computing SHA-256 Digest…</span>
              </div>
            )}

            {documentFile && !isHashing && (
              <div className="p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm space-y-2 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900">{documentFile.name}</span>
                  <span className="text-stone-500">{documentFile.size}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">
                    Calculated Document SHA-256 Hash (bytes32)
                  </span>
                  <span className="font-mono text-[11px] text-stone-900 font-semibold break-all block select-all">
                    {documentHash}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section D: Blockchain Registration & Network Status */}
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
                D. Blockchain Authorization & Sepolia Contract
              </h2>
              <p className="text-xs font-serif italic text-stone-500 mt-1">
                Blockchain registration is mandatory. Execution requires the contract administrator wallet on Ethereum Sepolia.
              </p>
            </div>

            <div className="p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900 block">
                    Sepolia Smart Contract
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">
                    Address: {REGISTRY_ADDRESS}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => syncWallet(true)}
                  disabled={isWalletConnecting || isSubmitting}
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-900 border border-stone-300 px-3 py-2 rounded-sm hover:bg-stone-100 transition-colors"
                >
                  {isWalletConnecting ? 'Connecting…' : account ? 'Reconnect Wallet' : 'Connect MetaMask'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-200 text-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Connected Wallet</span>
                  <span className="font-mono text-stone-800 break-all">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not Connected'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Network Status</span>
                  <span className={isSepolia ? 'font-bold text-emerald-700' : 'font-bold text-red-700'}>
                    {isSepolia ? 'Sepolia (11155111)' : 'Not on Sepolia'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Contract Authorization</span>
                  <span className={isAdminMatch ? 'font-bold text-emerald-700' : 'font-bold text-stone-500'}>
                    {isAdminMatch ? 'Authorized Administrator' : account ? 'Non-Admin Account' : 'Wallet Required'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submission Action */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link
                to="/records"
                className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || !isAdminMatch || !isSepolia || !documentHash}
                className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-stone-900 hover:bg-stone-800 rounded-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {progressState === 'awaiting_wallet'
                  ? 'Confirm in MetaMask…'
                  : progressState === 'registering'
                  ? 'Confirming on Sepolia…'
                  : 'Register on Blockchain'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
