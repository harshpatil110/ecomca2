import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BrowserProvider, Contract, getAddress, isAddress, isHexString, ZeroHash } from 'ethers';
import registryAbi from '../../blockchain/registryAbi.json';
import { REGISTRY_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_EXPLORER, isSepoliaNetwork } from '../../blockchain/registryConfig';
import { getListings, saveListing } from '../../services/listingsStore';

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

export default function CreateListingAdmin() {
  // ── Listing Publication Mode: 'offchain' | 'onchain' ──
  const [listingType, setListingType] = useState('offchain');

  // ── Form State ──
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    propertyType: 'villa',
    bedrooms: '4',
    bathrooms: '3.5',
    sqft: '4,200',
    yearBuilt: '2023',
    description: '',
    streetAddress: '',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    imageUrl: '',
  });

  // ── Blockchain Form State ──
  const [initialOwner, setInitialOwner] = useState('');
  const [propertyRef, setPropertyRef] = useState('');
  const [documentHash, setDocumentHash] = useState(ZeroHash);

  // ── Wallet & Contract Status ──
  const [account, setAccount] = useState('');
  const [contractAdmin, setContractAdmin] = useState('');
  const [chainId, setChainId] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // ── Workflow / Submission Progress State ──
  // Progress states: 'idle' | 'validating' | 'awaiting_wallet' | 'registering' | 'saving' | 'published' | 'error'
  const [progressState, setProgressState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [savedResult, setSavedResult] = useState(null);
  const [partialSuccessData, setPartialSuccessData] = useState(null); // for retrying persistence if tx confirmed

  const isSepolia = Boolean(chainId && isSepoliaNetwork(chainId));
  const isAdminMatch = Boolean(
    account && contractAdmin && normalizeAddress(account) === normalizeAddress(contractAdmin)
  );

  // ── Sync Wallet & Admin Status ──
  const syncWallet = useCallback(async (requestPrompt = false) => {
    if (!window.ethereum) {
      if (requestPrompt) setFormError('MetaMask was not detected. Please install or enable MetaMask.');
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
        return;
      }

      const readContract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
      try {
        const adminAddr = await readContract.admin();
        const adminStr = String(adminAddr);
        setContractAdmin(adminStr);

        // Pre-fill initialOwner with active account or admin if not manually touched
        setInitialOwner((prev) => (prev ? prev : activeAccount || adminStr));
      } catch (err) {
        console.error('[CreateListingAdmin] Error fetching contract.admin():', err);
      }
    } catch (err) {
      console.error('[CreateListingAdmin] Wallet sync error:', err);
      if (requestPrompt) setFormError(readableError(err));
    } finally {
      setIsWalletConnecting(false);
    }
  }, []);

  useEffect(() => {
    syncWallet(false);

    if (!window.ethereum) return undefined;
    const handleAccounts = (accounts) => {
      console.log('[CreateListingAdmin] accountsChanged:', accounts);
      syncWallet(false);
    };
    const handleChain = (newChainId) => {
      console.log('[CreateListingAdmin] chainChanged:', newChainId);
      syncWallet(false);
    };

    window.ethereum.on?.('accountsChanged', handleAccounts);
    window.ethereum.on?.('chainChanged', handleChain);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum.removeListener?.('chainChanged', handleChain);
    };
  }, [syncWallet]);

  // Auto-generate suggested propertyRef when title changes (if user hasn't explicitly set one)
  const handleTitleChange = (val) => {
    setFormData((prev) => ({ ...prev, title: val }));
    if (!propertyRef || propertyRef.startsWith('LUM-')) {
      const slug = val ? val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() : 'LUM';
      const randNum = Math.floor(100 + Math.random() * 900);
      setPropertyRef(`${slug || 'LUM'}-${randNum}`);
    }
  };

  // ── Image Handling ──
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFormData((prev) => ({ ...prev, imageUrl: loadEvent.target?.result || '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Validation ──
  const validateExistingFields = () => {
    if (!formData.title.trim()) return 'Property Title is required.';
    if (!formData.price.trim()) return 'List Price is required.';
    if (!formData.city.trim()) return 'City is required.';
    if (!formData.streetAddress.trim()) return 'Street Address is required.';
    if (!formData.description.trim()) return 'Editorial Description is required.';
    return null;
  };

  const validateBlockchainFields = () => {
    if (!account) return 'Please connect your MetaMask wallet before publishing.';
    if (!isSepolia) return 'MetaMask must be connected to the Sepolia testnet (Chain ID 11155111).';
    if (!isAdminMatch) return 'Connected wallet is not authorized as the contract admin. Only the contract admin can register properties.';
    if (!initialOwner.trim() || !isAddress(initialOwner.trim())) return 'Initial owner must be a valid Ethereum wallet address.';
    if (!propertyRef.trim()) return 'Property reference code is required (e.g. LUM-742).';
    if (!isHexString(documentHash, 32)) return 'Document hash must be a valid 32-byte hex string (0x followed by 64 hex characters).';
    return null;
  };

  // ── Duplicate Registration Check ──
  const checkDuplicateRegistration = (ref) => {
    if (!ref || !ref.trim()) return null;
    const all = getListings();
    return all.find(
      (item) => item.propertyRef &&
                item.propertyRef.trim().toLowerCase() === ref.trim().toLowerCase() &&
                item.blockchainPropertyId
    ) || null;
  };

  // ── Save Draft Workflow (No blockchain transaction) ──
  const handleSaveDraft = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title.trim()) {
      setFormError('Please enter at least a Property Title to save a draft.');
      return;
    }

    const websiteListingId = `DRAFT-${Date.now().toString().slice(-4)}`;
    const saved = saveListing({
      id: websiteListingId,
      blockchainPropertyId: null,
      blockchainTxHash: null,
      name: formData.title.trim(),
      price: formData.price.trim().startsWith('₹') ? formData.price.trim() : `₹${formData.price.trim()}`,
      numericPrice: Number(formData.price.replace(/[^0-9]/g, '')) || 0,
      city: formData.city.trim(),
      location: `${formData.streetAddress.trim() || formData.city.trim()}, ${formData.city.trim()}`,
      type: formData.propertyType,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      sqft: formData.sqft.trim(),
      yearBuilt: formData.yearBuilt.trim(),
      description: formData.description.trim(),
      src: formData.imageUrl || '/brutalist_exterior.png',
      status: 'Draft',
      propertyRef: propertyRef.trim() || 'DRAFT',
      initialOwner: initialOwner.trim() || null,
      documentHash: documentHash.trim() || null,
      badge: 'Draft',
    });

    setSavedResult({
      websiteListingId: saved.id,
      blockchainPropertyId: null,
      txHash: null,
      status: 'Draft',
      isOffChain: true,
    });
    setStatusMessage('Draft saved successfully to local listings.');
  };

  // ── Off-Chain Publish Workflow (No MetaMask or Blockchain Required) ──
  const handlePublishOffChain = (e) => {
    e.preventDefault();
    if (progressState !== 'idle' && progressState !== 'error') return;

    setFormError('');
    setStatusMessage('');
    setSavedResult(null);
    setPartialSuccessData(null);

    const basicError = validateExistingFields();
    if (basicError) {
      setFormError(basicError);
      return;
    }

    setProgressState('saving');
    setStatusMessage('Publishing off-chain property to website catalog...');

    const websiteListingId = `LUM-${Date.now().toString().slice(-4)}`;
    const listingPayload = {
      id: websiteListingId,
      blockchainPropertyId: null,
      blockchainTxHash: null,
      name: formData.title.trim(),
      price: formData.price.trim().startsWith('₹') ? formData.price.trim() : `₹${formData.price.trim()}`,
      numericPrice: Number(formData.price.replace(/[^0-9]/g, '')) || 0,
      city: formData.city.trim(),
      location: `${formData.streetAddress.trim()}, ${formData.city.trim()}`,
      type: formData.propertyType,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      sqft: formData.sqft.trim(),
      yearBuilt: formData.yearBuilt.trim(),
      description: formData.description.trim(),
      src: formData.imageUrl || '/brutalist_exterior.png',
      status: 'Exclusive',
      propertyRef: propertyRef.trim() || websiteListingId,
      initialOwner: null,
      documentHash: null,
      badge: 'Off-chain',
    };

    try {
      const saved = saveListing(listingPayload);
      setProgressState('published');
      setStatusMessage('Off-chain property successfully published to the website!');
      setSavedResult({
        websiteListingId: saved.id,
        blockchainPropertyId: null,
        txHash: null,
        status: 'Exclusive',
        isOffChain: true,
      });
    } catch (saveError) {
      console.error('[CreateListingAdmin] Error saving off-chain listing:', saveError);
      setProgressState('error');
      setFormError(`Failed to save listing: ${readableError(saveError)}`);
    }
  };

  // ── Retry Persistence if on-chain transaction succeeded but save failed ──
  const handleRetrySave = () => {
    if (!partialSuccessData) return;
    try {
      setProgressState('saving');
      setStatusMessage('Saving listing to website database...');
      const saved = saveListing(partialSuccessData.listingPayload);
      setSavedResult({
        websiteListingId: saved.id,
        blockchainPropertyId: partialSuccessData.blockchainPropertyId,
        txHash: partialSuccessData.txHash,
        status: 'Exclusive',
        isOffChain: false,
      });
      setProgressState('published');
      setStatusMessage('Listing successfully registered on blockchain and published to the website!');
      setPartialSuccessData(null);
    } catch (saveErr) {
      console.error('[CreateListingAdmin] Retry save error:', saveErr);
      setFormError(`Failed to save listing: ${readableError(saveErr)}`);
      setProgressState('error');
    }
  };

  // ── On-Chain Publish Workflow (Sepolia Smart Contract) ──
  const handlePublishOnChain = async (e) => {
    e.preventDefault();
    if (progressState !== 'idle' && progressState !== 'error') return;

    setFormError('');
    setStatusMessage('');
    setSavedResult(null);
    setPartialSuccessData(null);

    // 1. Validation
    setProgressState('validating');
    setStatusMessage('Validating listing details...');

    const basicError = validateExistingFields();
    if (basicError) {
      setFormError(basicError);
      setProgressState('idle');
      return;
    }

    const chainError = validateBlockchainFields();
    if (chainError) {
      setFormError(chainError);
      setProgressState('idle');
      return;
    }

    // Duplicate registration guard
    const duplicate = checkDuplicateRegistration(propertyRef);
    if (duplicate) {
      setFormError(
        `Duplicate registration prevented: Property reference "${propertyRef.trim()}" is already registered on-chain with Blockchain ID #${duplicate.blockchainPropertyId} (Website Listing ID ${duplicate.id}).`
      );
      setProgressState('idle');
      return;
    }

    // 2. Prepare Web3 Call
    try {
      setProgressState('awaiting_wallet');
      setStatusMessage('Waiting for MetaMask signature & transaction approval...');

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (!isSepoliaNetwork(network.chainId)) {
        throw new Error('Please ensure MetaMask is on Sepolia testnet.');
      }

      const signer = await provider.getSigner();
      const writeContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);

      console.log('[CreateListingAdmin] Submitting registerProperty transaction:', {
        initialOwner: initialOwner.trim(),
        propertyRef: propertyRef.trim(),
        documentHash: documentHash.trim(),
      });

      const tx = await writeContract.registerProperty(
        initialOwner.trim(),
        propertyRef.trim(),
        documentHash.trim()
      );

      // 3. Confirm on Sepolia
      setProgressState('registering');
      setStatusMessage(`Transaction submitted (${tx.hash.slice(0, 10)}…). Awaiting Sepolia block confirmation…`);

      const receipt = await tx.wait();
      console.log('[CreateListingAdmin] Transaction confirmed in block', receipt.blockNumber, receipt);

      // 4. Extract assigned on-chain Property ID from PropertyRegistered event
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
          // ignore non-matching logs
        }
      }

      if (!assignedBlockchainId) {
        // Fallback: query current property count if event parsing missed
        const count = await readContract.getPropertyCount();
        assignedBlockchainId = count.toString();
      }

      // 5. Save Complete Listing to Persistence Store
      setProgressState('saving');
      setStatusMessage('On-chain registration confirmed! Publishing listing to website...');

      const websiteListingId = `LUM-${Date.now().toString().slice(-4)}`;
      const listingPayload = {
        id: websiteListingId,
        blockchainPropertyId: assignedBlockchainId,
        blockchainTxHash: receipt.hash,
        name: formData.title.trim(),
        price: formData.price.trim().startsWith('₹') ? formData.price.trim() : `₹${formData.price.trim()}`,
        numericPrice: Number(formData.price.replace(/[^0-9]/g, '')) || 0,
        city: formData.city.trim(),
        location: `${formData.streetAddress.trim()}, ${formData.city.trim()}`,
        type: formData.propertyType,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        sqft: formData.sqft.trim(),
        yearBuilt: formData.yearBuilt.trim(),
        description: formData.description.trim(),
        src: formData.imageUrl || '/brutalist_exterior.png',
        status: 'Exclusive',
        propertyRef: propertyRef.trim(),
        initialOwner: initialOwner.trim(),
        documentHash: documentHash.trim(),
        badge: 'Blockchain registered',
      };

      try {
        const saved = saveListing(listingPayload);
        setProgressState('published');
        setStatusMessage('Listing successfully registered on blockchain and published to the website!');
        setSavedResult({
          websiteListingId: saved.id,
          blockchainPropertyId: assignedBlockchainId,
          txHash: receipt.hash,
          status: 'Exclusive',
          isOffChain: false,
        });
      } catch (saveError) {
        console.error('[CreateListingAdmin] Error persisting published listing:', saveError);
        // Transaction is already confirmed on blockchain! Do not re-register!
        setPartialSuccessData({
          blockchainPropertyId: assignedBlockchainId,
          txHash: receipt.hash,
          listingPayload,
        });
        setProgressState('error');
        setFormError('On-chain registration succeeded, but website local storage failed. Click "Retry Saving Listing" to complete publication without re-registering on-chain.');
      }
    } catch (err) {
      console.error('[CreateListingAdmin] Publish failed:', err);
      setProgressState('idle');
      setFormError(`Publishing failed: ${readableError(err)}`);
    }
  };

  const isPublishDisabled =
    progressState === 'validating' ||
    progressState === 'awaiting_wallet' ||
    progressState === 'registering' ||
    progressState === 'saving';

  const getOnChainDisabledReason = () => {
    if (!account) return 'Connect MetaMask wallet to enable blockchain publication.';
    if (!isSepolia) return 'Switch MetaMask network to Sepolia (Chain ID 11155111) to enable publication.';
    if (!isAdminMatch) return 'Connected wallet does not match the contract admin address. Registration is admin-only.';
    return '';
  };

  return (
    <div className="pt-8 pb-32 px-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-6 gap-6">
        <div>
          <Link
            to="/admin/listings"
            className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Listings
          </Link>
          <h1
            className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Draft New Listing
          </h1>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedResult && (
        <div className="mb-10 p-6 bg-white border border-emerald-300 rounded-sm shadow-sm animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
            <div className="space-y-3 flex-1">
              <h3 className="text-sm font-black tracking-widest uppercase text-stone-900">
                {savedResult.status === 'Draft'
                  ? 'Draft Saved Successfully'
                  : savedResult.isOffChain
                  ? 'Off-Chain Property Published!'
                  : 'Listing Published & Blockchain Registered!'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {savedResult.status === 'Draft'
                  ? `Your property draft has been saved locally with Website ID ${savedResult.websiteListingId}.`
                  : savedResult.isOffChain
                  ? `Your property is now live across the homepage and explore portfolio as an Off-chain listing with Website ID ${savedResult.websiteListingId}.`
                  : 'Your property is now live on the homepage portfolio and immutably recorded on the Sepolia smart contract registry.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#fbf9f4] p-4 rounded-sm border border-stone-200 font-mono">
                <div>
                  <span className="text-stone-400 font-sans uppercase font-bold text-[10px] block">Website Listing ID</span>
                  <span className="font-bold text-stone-900">{savedResult.websiteListingId}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-sans uppercase font-bold text-[10px] block">Registry Status</span>
                  {savedResult.blockchainPropertyId ? (
                    <span className="font-bold text-emerald-700">On-Chain #{savedResult.blockchainPropertyId}</span>
                  ) : (
                    <span className="font-bold text-stone-600">Off-Chain</span>
                  )}
                </div>
                {savedResult.txHash && (
                  <div className="sm:col-span-2 pt-2 border-t border-stone-200">
                    <span className="text-stone-400 font-sans uppercase font-bold text-[10px] block">Sepolia Transaction Hash</span>
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${savedResult.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-stone-800 break-all hover:text-stone-900"
                    >
                      {savedResult.txHash} ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/"
                  className="px-5 py-2.5 bg-stone-900 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-stone-800 transition-colors"
                >
                  View on Front Page
                </Link>
                <Link
                  to={`/property/${savedResult.websiteListingId}`}
                  className="px-5 py-2.5 border border-stone-300 text-stone-800 text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-[#fbf9f4] transition-colors"
                >
                  View Property Detail
                </Link>
                <Link
                  to="/admin/listings"
                  className="px-5 py-2.5 border border-stone-300 text-stone-800 text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-[#fbf9f4] transition-colors"
                >
                  Listings Manager
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Error Banners */}
      {progressState !== 'idle' && progressState !== 'published' && (
        <div className="mb-8 p-4 bg-[#f5f4ed] border border-stone-300 rounded-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-lg text-stone-700 animate-spin">sync</span>
          <span className="text-xs uppercase font-bold tracking-widest text-stone-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            {statusMessage}
          </span>
        </div>
      )}

      {formError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3 text-red-800 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="material-symbols-outlined text-lg text-red-600 shrink-0">error</span>
          <div className="flex-1 space-y-2">
            <p className="font-semibold">{formError}</p>
            {partialSuccessData && (
              <button
                type="button"
                onClick={handleRetrySave}
                className="mt-2 px-4 py-2 bg-red-800 text-white text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-red-900"
              >
                Retry Saving Listing
              </button>
            )}
          </div>
        </div>
      )}

      <form className="space-y-16" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Section 1 - Basic Info */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="e.g. The Monolith House"
              />
            </div>
            <div className="flex flex-col space-y-2 relative">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">List Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">₹</span>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-[#fbf9f4] border border-stone-200 rounded-sm pl-8 pr-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                  placeholder="4,850,000"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData((prev) => ({ ...prev, propertyType: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
                <option value="estate">Estate</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 - Media */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">
            Property Media
          </h2>
          <label className="border-2 border-dashed border-stone-300 rounded-sm p-12 flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#f5f4ed] cursor-pointer transition-colors group relative overflow-hidden">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <span className="material-symbols-outlined text-4xl text-stone-400 mb-4 group-hover:text-stone-900 transition-colors">
              cloud_upload
            </span>
            <p className="text-sm font-bold text-stone-900 mb-1">Upload High-Resolution Imagery</p>
            <p className="text-xs font-serif italic text-stone-500">Drag and drop or click to browse (Max 50MB per file)</p>
          </label>
          {formData.imageUrl && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-[#fbf9f4] border border-stone-200 rounded-sm">
              <img src={formData.imageUrl} alt="Listing preview" className="w-16 h-16 object-cover rounded-sm border border-stone-200" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-stone-900 block">Uploaded Image Preview</span>
                <span className="text-stone-500 font-serif italic">Will be showcased on homepage and detail page</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                className="text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-wider"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Section 3 - Key Details */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">
            Key Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Bedrooms</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="4"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Bathrooms</label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="3.5"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Square Footage</label>
              <input
                type="text"
                value={formData.sqft}
                onChange={(e) => setFormData((prev) => ({ ...prev, sqft: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="4,200"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Year Built</label>
              <input
                type="text"
                value={formData.yearBuilt}
                onChange={(e) => setFormData((prev) => ({ ...prev, yearBuilt: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="2022"
              />
            </div>
          </div>
        </div>

        {/* Section 4 - Description & Location */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">
            Description & Location
          </h2>
          <div className="flex flex-col space-y-2 pt-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Editorial Description</label>
            <textarea
              rows="6"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm resize-none"
              placeholder="Weave the narrative of this property's architectural significance..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="flex flex-col space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Street Address</label>
              <input
                type="text"
                value={formData.streetAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, streetAddress: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="123 Architectural Way"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                placeholder="Los Angeles"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                  placeholder="CA"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Zip Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                  className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                  placeholder="90001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5 - Listing Mode & Blockchain Registration */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4 mb-6">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900">
              Listing Mode & Blockchain Title Registry
            </h2>
            <p className="text-xs font-serif italic text-stone-500 mt-1">
              Select whether this listing is published as a standard website catalog property or tokenized on the Sepolia smart contract registry.
            </p>
          </div>

          {/* Mode Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setListingType('offchain'); setFormError(''); }}
              className={`p-5 rounded-sm border text-left transition-all ${
                listingType === 'offchain'
                  ? 'border-stone-900 bg-[#f5f4ed] shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">cloud_off</span>
                  Off-Chain Listing
                </span>
                {listingType === 'offchain' && (
                  <span className="text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Standard publication. No MetaMask connection or blockchain gas fees required. Assigned a unique website property ID and published immediately.
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setListingType('onchain'); setFormError(''); }}
              className={`p-5 rounded-sm border text-left transition-all ${
                listingType === 'onchain'
                  ? 'border-stone-900 bg-[#f5f4ed] shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">token</span>
                  Blockchain Registered
                </span>
                {listingType === 'onchain' && (
                  <span className="text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Sepolia smart contract registry. Requires contract admin wallet. Mints an on-chain deed identifier upon confirmed transaction.
              </p>
            </button>
          </div>

          {/* Off-Chain Selected Information Note */}
          {listingType === 'offchain' && (
            <div className="p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-stone-800 text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-base text-stone-600">info</span>
                Off-Chain Publication Ready
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                This property will be published immediately to Lumina Realty's digital portfolio and labelled <strong>Off-chain</strong>. It will be indexed on the Homepage, Explore Properties, and Listings Manager without interacting with Ethereum Sepolia.
              </p>
            </div>
          )}

          {/* On-Chain Selected Panel: Wallet Status & Form Fields */}
          {listingType === 'onchain' && (
            <div className="space-y-6 pt-2 border-t border-stone-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900">
                    Sepolia Contract Admin Verification
                  </h3>
                  <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                    Contract: {REGISTRY_ADDRESS}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => syncWallet(true)}
                  disabled={isWalletConnecting}
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-900 border border-stone-300 px-3 py-2 rounded-sm hover:bg-[#fbf9f4] transition-colors self-start sm:self-auto"
                >
                  {isWalletConnecting ? 'Connecting…' : account ? 'Reconnect Wallet' : 'Connect MetaMask'}
                </button>
              </div>

              {/* Compact Network & Authorization Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm text-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">MetaMask Wallet</span>
                  <span className="font-mono text-stone-800 break-all">
                    {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Disconnected'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Network</span>
                  <span className={isSepolia ? 'font-bold text-emerald-700' : 'font-bold text-red-700'}>
                    {isSepolia ? 'Sepolia (11155111)' : 'Not on Sepolia'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Admin Rights</span>
                  <span className={isAdminMatch ? 'font-bold text-emerald-700' : 'font-bold text-stone-500'}>
                    {isAdminMatch ? 'Authorized Contract Admin' : account ? 'Unauthorized (Mismatch)' : 'Wallet Required'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex flex-col space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                    Initial Owner Wallet Address
                  </label>
                  <input
                    type="text"
                    value={initialOwner}
                    onChange={(e) => setInitialOwner(e.target.value)}
                    placeholder="0x..."
                    className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 font-mono text-xs focus:outline-none focus:border-stone-400 transition-colors"
                  />
                  <span className="text-[10px] text-stone-400 italic font-serif">
                    Defaults to your connected wallet, or input another initial deed owner wallet address.
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                    Property Reference Code
                  </label>
                  <input
                    type="text"
                    value={propertyRef}
                    onChange={(e) => setPropertyRef(e.target.value)}
                    placeholder="e.g. LUM-742 or MUM-001"
                    className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm"
                  />
                  <span className="text-[10px] text-stone-400 italic font-serif">
                    Immutable identifier stored on-chain inside registerProperty.
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                    Document Hash (bytes32)
                  </label>
                  <input
                    type="text"
                    value={documentHash}
                    onChange={(e) => setDocumentHash(e.target.value)}
                    className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 font-mono text-xs focus:outline-none focus:border-stone-400 transition-colors"
                  />
                  <span className="text-[10px] text-amber-700 italic font-serif">
                    Test placeholder (Zero hash). Does not prove legal title or document authenticity.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="space-y-4 pt-8 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row justify-end items-center gap-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isPublishDisabled}
              className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-900 border border-stone-900 rounded-sm hover:bg-[#fbf9f4]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Draft
            </button>

            {listingType === 'offchain' ? (
              <button
                type="button"
                onClick={handlePublishOffChain}
                disabled={isPublishDisabled}
                className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-[#31332c] hover:bg-stone-800 rounded-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {progressState === 'saving' && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {progressState === 'saving' ? 'Publishing Off-Chain…' : 'Publish Off-Chain Listing'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublishOnChain}
                disabled={isPublishDisabled || !isAdminMatch || !isSepolia}
                className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-[#31332c] hover:bg-stone-800 rounded-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishDisabled && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {progressState === 'validating'
                  ? 'Validating…'
                  : progressState === 'awaiting_wallet'
                  ? 'Confirm in MetaMask…'
                  : progressState === 'registering'
                  ? 'Registering on Sepolia…'
                  : progressState === 'saving'
                  ? 'Publishing Listing…'
                  : 'Register On-Chain & Publish'}
              </button>
            )}
          </div>

          {listingType === 'onchain' && getOnChainDisabledReason() && (
            <p className="text-right text-xs text-stone-500 font-sans">
              {getOnChainDisabledReason()}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

