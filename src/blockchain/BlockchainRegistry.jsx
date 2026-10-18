import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract, getAddress, isAddress, isHexString, ZeroHash } from 'ethers';
import registryAbi from './registryAbi.json';
import { REGISTRY_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_EXPLORER, isSepoliaNetwork } from './registryConfig';
import DocumentIntegrityVerification from './DocumentIntegrityVerification';

const STATUS_LABELS = ['Registered', 'Disputed', 'Suspended'];
const inputClass = 'w-full rounded-sm border border-stone-200 bg-[#fbf9f4] px-3 py-2.5 text-sm text-stone-900 focus:border-stone-500 focus:outline-none';
const buttonClass = 'rounded-sm bg-stone-900 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50';

function readableError(error) {
  return error?.shortMessage || error?.reason || error?.info?.error?.message || error?.message || 'An unexpected error occurred.';
}

function normalizeAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  try {
    return getAddress(addr.trim()).toLowerCase();
  } catch {
    return addr.trim().toLowerCase();
  }
}

export default function BlockchainRegistry({ initialPropertyId = '' }) {
  const [account, setAccount] = useState('');
  const [contractAdmin, setContractAdmin] = useState('');
  const [chainId, setChainId] = useState(null);
  const [propertyCount, setPropertyCount] = useState('');
  const [propertyId, setPropertyId] = useState(String(initialPropertyId || ''));
  const [property, setProperty] = useState(null);
  const [verified, setVerified] = useState(null);
  const [history, setHistory] = useState([]);
  const [ownerInput, setOwnerInput] = useState('');
  const [locationReference, setLocationReference] = useState('');
  const [documentHash, setDocumentHash] = useState(ZeroHash);
  const [newOwner, setNewOwner] = useState('');
  const [newStatus, setNewStatus] = useState('1');
  const [statusReason, setStatusReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastTx, setLastTx] = useState('');

  const isSepolia = Boolean(chainId && isSepoliaNetwork(chainId));
  const isAdminMatch = Boolean(
    account && contractAdmin && normalizeAddress(account) === normalizeAddress(contractAdmin)
  );
  const canRegister = Boolean(account && isSepolia && isAdminMatch && !busy);
  const canUpdateStatus = Boolean(account && isSepolia && isAdminMatch && !busy);
  const isCurrentOwner = Boolean(
    account && property?.currentOwner && normalizeAddress(account) === normalizeAddress(property.currentOwner)
  );
  const canTransfer = Boolean(account && isSepolia && property && isCurrentOwner && property.status === 0 && !busy);

  const getRegistrationDisabledReason = () => {
    if (!account) return 'Connect MetaMask wallet to enable registration.';
    if (!isSepolia) return 'Switch MetaMask network to Sepolia (chain ID 11155111) to enable registration.';
    if (!isAdminMatch) return 'Connected account does not match the contract admin address. Registration is admin-only.';
    if (busy) return 'A blockchain transaction is currently in progress.';
    return '';
  };

  const getUpdateStatusDisabledReason = () => {
    if (!account) return 'Connect MetaMask wallet to update status.';
    if (!isSepolia) return 'Switch MetaMask network to Sepolia (chain ID 11155111) to update status.';
    if (!isAdminMatch) return 'Connected account does not match the contract admin address. Status updates are admin-only.';
    if (busy) return 'A blockchain transaction is currently in progress.';
    return '';
  };

  const getTransferDisabledReason = () => {
    if (!account) return 'Connect MetaMask wallet to enable transfer.';
    if (!isSepolia) return 'Switch MetaMask network to Sepolia (chain ID 11155111) to enable transfer.';
    if (!property) return 'Look up a property first to identify the current owner.';
    if (property.status !== 0) return `Property is currently ${STATUS_LABELS[property.status]}. Disputed or suspended properties cannot be transferred on-chain.`;
    if (!isCurrentOwner) return "Connected wallet does not match the property's current owner address.";
    if (busy) return 'A blockchain transaction is currently in progress.';
    return '';
  };

  const syncState = useCallback(async (requestAccounts = false) => {
    setError('');
    if (!window.ethereum) {
      if (requestAccounts) {
        setError('MetaMask was not detected. Install or enable the MetaMask browser extension.');
      }
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);

      let accounts = [];
      if (requestAccounts) {
        accounts = await provider.send('eth_requestAccounts', []);
      } else {
        accounts = await provider.send('eth_accounts', []);
      }

      const network = await provider.getNetwork();
      setChainId(network.chainId);
      const onSepolia = isSepoliaNetwork(network.chainId);

      const activeAccount = accounts && accounts.length > 0 ? accounts[0] : '';
      setAccount(activeAccount);

      if (!onSepolia) {
        setContractAdmin('');
        console.warn(`[BlockchainRegistry] Connected chain ${network.chainId.toString()}, expected Sepolia (${SEPOLIA_CHAIN_ID.toString()}).`);
        if (requestAccounts) {
          setError('Switch MetaMask network to Sepolia (chain ID 11155111).');
        }
        return;
      }

      // Read-only contract instance connected to provider
      const readContract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);

      try {
        const [adminAddr, count] = await Promise.all([
          readContract.admin(),
          readContract.getPropertyCount(),
        ]);

        const adminStr = String(adminAddr);
        setContractAdmin(adminStr);
        setPropertyCount(count.toString());

        const isMatch = Boolean(
          activeAccount &&
          adminStr &&
          normalizeAddress(activeAccount) === normalizeAddress(adminStr)
        );

        console.log('[BlockchainRegistry] State synced successfully:', {
          activeAccount,
          contractAdmin: adminStr,
          isAdminMatch: isMatch,
          propertyCount: count.toString(),
          chainId: network.chainId.toString(),
        });

        if (requestAccounts) {
          setMessage('Wallet connected to Sepolia.');
        }
      } catch (contractErr) {
        console.error('[BlockchainRegistry] Error calling contract.admin() or getPropertyCount():', contractErr);
        setError(`Failed to read contract on Sepolia: ${readableError(contractErr)}`);
      }
    } catch (err) {
      console.error('[BlockchainRegistry] Error during wallet sync:', err);
      if (requestAccounts) {
        setError(readableError(err));
      }
    }
  }, []);

  useEffect(() => {
    syncState(false);

    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts) => {
      console.log('[BlockchainRegistry] accountsChanged event:', accounts);
      syncState(false);
    };

    const handleChainChanged = (newChainId) => {
      console.log('[BlockchainRegistry] chainChanged event:', newChainId);
      syncState(false);
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [syncState]);

  const getProviderAndContracts = async (needSigner = false) => {
    if (!window.ethereum) throw new Error('MetaMask was not detected.');
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (!isSepoliaNetwork(network.chainId)) {
      throw new Error('Switch MetaMask to Sepolia (chain ID 11155111).');
    }
    const readContract = new Contract(REGISTRY_ADDRESS, registryAbi, provider);
    if (needSigner) {
      const signer = await provider.getSigner();
      const writeContract = new Contract(REGISTRY_ADDRESS, registryAbi, signer);
      return { provider, readContract, writeContract, signer };
    }
    return { provider, readContract };
  };

  const lookupProperty = async (id = propertyId) => {
    setError('');
    setMessage('');
    setProperty(null);
    setVerified(null);
    setHistory([]);
    if (!/^[1-9]\d*$/.test(String(id).trim())) {
      setError('Enter a valid on-chain property ID (a positive integer).');
      return;
    }
    setBusy(true);
    try {
      const { readContract } = await getProviderAndContracts(false);
      console.log(`[BlockchainRegistry] Querying property #${id}...`);
      const [p, isVerified, owners] = await Promise.all([
        readContract.getProperty(id),
        readContract.verifyProperty(id),
        readContract.getOwnershipHistory(id),
      ]);
      setProperty({
        propertyId: p.propertyId.toString(),
        currentOwner: p.currentOwner,
        registeredBy: p.registeredBy,
        locationReference: p.locationReference,
        documentHash: p.documentHash,
        registrationTimestamp: p.registrationTimestamp.toString(),
        status: Number(p.status),
      });
      setVerified(isVerified);
      setHistory(owners);
      setPropertyId(String(id));
      setMessage(`Loaded on-chain property #${id}.`);
      console.log(`[BlockchainRegistry] Property #${id} loaded successfully:`, p);
    } catch (e) {
      console.error(`[BlockchainRegistry] Lookup failed for property #${id}:`, e);
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const runTransaction = async (action, successText) => {
    setError('');
    setMessage('');
    setLastTx('');
    setBusy(true);
    try {
      const { writeContract } = await getProviderAndContracts(true);
      console.log(`[BlockchainRegistry] Executing transaction: ${successText}...`);
      const tx = await action(writeContract);
      setMessage('Transaction submitted. Waiting for Sepolia confirmation…');
      console.log(`[BlockchainRegistry] Tx submitted. Hash:`, tx.hash);
      const receipt = await tx.wait();
      console.log(`[BlockchainRegistry] Tx confirmed in block ${receipt.blockNumber}:`, receipt);
      setLastTx(receipt.hash);

      let registeredId = '';
      if (successText === 'Property registration') {
        const { readContract } = await getProviderAndContracts(false);
        const iface = readContract.interface;
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'PropertyRegistered') {
              registeredId = parsed.args.propertyId.toString();
              setPropertyId(registeredId);
              break;
            }
          } catch { /* Ignore logs emitted by other contracts. */ }
        }
      }
      setMessage(`${successText} transaction confirmed.${registeredId ? ` New on-chain property ID: ${registeredId}.` : ''}`);
      const { readContract } = await getProviderAndContracts(false);
      const updatedCount = await readContract.getPropertyCount();
      setPropertyCount(updatedCount.toString());
      const idToRefresh = registeredId || propertyId;
      if (idToRefresh && /^[1-9]\d*$/.test(idToRefresh)) {
        try { await lookupProperty(idToRefresh); } catch { /* lookup reports its own error */ }
      }
    } catch (e) {
      console.error(`[BlockchainRegistry] Transaction error (${successText}):`, e);
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    if (!isAddress(ownerInput)) return setError('Enter a valid initial owner wallet address.');
    if (!locationReference.trim()) return setError('Enter a property reference, for example MUM-001.');
    if (!isHexString(documentHash, 32)) return setError('Document hash must be a 32-byte hex value (0x followed by 64 hex characters).');
    await runTransaction(
      (contract) => contract.registerProperty(ownerInput, locationReference.trim(), documentHash),
      'Property registration'
    );
  };

  const transfer = async (e) => {
    e.preventDefault();
    if (!propertyId || !isAddress(newOwner)) return setError('Enter a property ID and a valid new-owner address.');
    if (property && property.status !== 0) {
      return setError(`Cannot transfer: Property #${propertyId} is currently ${STATUS_LABELS[property.status]}. Disputed or suspended properties cannot be transferred on-chain.`);
    }
    if (property && account && normalizeAddress(account) !== normalizeAddress(property.currentOwner)) {
      return setError(`Only the current registered owner (${property.currentOwner.slice(0, 6)}…${property.currentOwner.slice(-4)}) can transfer this property title.`);
    }
    if (property && normalizeAddress(newOwner) === normalizeAddress(property.currentOwner)) {
      return setError('Recipient address is already the current owner.');
    }
    await runTransaction(
      (contract) => contract.transferProperty(propertyId, newOwner),
      'Ownership transfer'
    );
  };

  const updateStatus = async (e) => {
    e.preventDefault();
    if (!propertyId) return setError('Look up a property first.');
    if (!statusReason.trim()) return setError('Provide a reason for the status change.');
    await runTransaction(
      (contract) => contract.updatePropertyStatus(propertyId, Number(newStatus), statusReason.trim()),
      'Property status update'
    );
  };

  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value); setMessage('Copied to clipboard.'); }
    catch { setError('Clipboard access failed. Select and copy the value manually.'); }
  };

  return (
    <section className="my-10 rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Sepolia testnet · Chain ID 11155111</p>
          <h2 className="text-2xl font-serif text-stone-900">On-Chain Property Registry</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Register and inspect property records, verify registry status, update status as admin, and transfer ownership from the current owner's wallet.</p>
        </div>
        <button type="button" className={buttonClass} onClick={() => syncState(true)} disabled={busy}>
          {account ? 'Reconnect wallet' : 'Connect MetaMask'}
        </button>
      </div>

      <div className="mt-4 break-all rounded-sm bg-[#fbf9f4] p-3 text-xs text-stone-600 space-y-1">
        <div><strong>Contract:</strong> <a className="underline underline-offset-2" href={`${SEPOLIA_EXPLORER}/address/${REGISTRY_ADDRESS}`} target="_blank" rel="noreferrer">{REGISTRY_ADDRESS}</a></div>
        <div><strong>Connected wallet:</strong> {account ? account : 'Not connected'}</div>
        <div><strong>Contract admin:</strong> {contractAdmin ? contractAdmin : 'Loading…'}</div>
        <div>
          <strong>Admin match:</strong>{' '}
          {account && contractAdmin ? (
            isAdminMatch ? (
              <span className="font-semibold text-emerald-700">Yes (Connected wallet matches contract admin)</span>
            ) : (
              <span className="font-semibold text-red-700">No (Address mismatch)</span>
            )
          ) : (
            <span className="text-stone-400">Connect wallet to verify match</span>
          )}
        </div>
        {propertyCount !== '' && <div><strong>Registered property count:</strong> {propertyCount}</div>}
        {chainId && !isSepolia && <p className="mt-2 font-semibold text-red-700">Wrong network. Select Sepolia in MetaMask (Chain ID 11155111).</p>}
      </div>

      {message && <div role="status" className="mt-4 break-words rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
      {error && <div role="alert" className="mt-4 break-words rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {lastTx && <p className="mt-3 break-all text-sm">Latest transaction: <a className="font-semibold underline" href={`${SEPOLIA_EXPLORER}/tx/${lastTx}`} target="_blank" rel="noreferrer">View on Sepolia Etherscan ↗</a></p>}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <form onSubmit={register} className="space-y-3 rounded-sm border border-stone-200 p-4 md:p-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-900">Register property</h3>
          <p className="text-xs leading-relaxed text-stone-500">Admin only. This writes a new on-chain property record; it does not save the rest of the listing form or upload documents.</p>
          <label className="block text-xs font-semibold text-stone-600">Initial owner address</label>
          <input className={inputClass} value={ownerInput} onChange={e => setOwnerInput(e.target.value)} placeholder="0x..." />
          <label className="block text-xs font-semibold text-stone-600">Property reference</label>
          <input className={inputClass} value={locationReference} onChange={e => setLocationReference(e.target.value)} placeholder="e.g. MUM-001 or LUM-742" />
          <label className="block text-xs font-semibold text-stone-600">Document hash (bytes32)</label>
          <input className={inputClass} value={documentHash} onChange={e => setDocumentHash(e.target.value)} />
          <p className="text-xs text-amber-700">Zero hash is a placeholder, not proof of document authenticity. Do not store private deeds or personal information on-chain.</p>
          <button className={buttonClass} type="submit" disabled={!canRegister}>
            {busy ? 'Processing…' : 'Register on blockchain'}
          </button>
          {!canRegister && getRegistrationDisabledReason() && (
            <p className="text-xs text-stone-500">{getRegistrationDisabledReason()}</p>
          )}
        </form>

        <div className="space-y-4 rounded-sm border border-stone-200 p-4 md:p-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-900">Lookup & verify</h3>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); lookupProperty(); }}>
            <input className={inputClass} value={propertyId} onChange={e => setPropertyId(e.target.value)} placeholder="On-chain property ID (e.g. 1)" inputMode="numeric" />
            <button className={buttonClass} type="submit" disabled={busy}>Lookup</button>
          </form>
          {property && <>
            <div className={`rounded-sm border p-3 ${verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className="font-bold">{verified ? '✓ Registered status confirmed' : '⚠ Not currently verified by registry status'}</p>
              <p className="mt-1 text-xs leading-relaxed">{verified ? 'The contract reports that this record exists and has Registered status. This does not independently prove legal title or deed authenticity.' : 'The record may be disputed, suspended, or otherwise not in Registered status.'}</p>
            </div>
            <dl className="grid gap-3 text-sm">
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">On-chain property ID</dt><dd className="font-semibold">{property.propertyId}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">Website reference</dt><dd className="font-semibold">{property.locationReference}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">Current owner</dt><dd className="break-all">{property.currentOwner}</dd><button type="button" onClick={() => copy(property.currentOwner)} className="mt-1 text-xs underline">Copy owner address</button></div>
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">Registered by</dt><dd className="break-all">{property.registeredBy}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">Status</dt><dd className="font-semibold">{STATUS_LABELS[property.status] || 'Unknown'}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">Registration time</dt><dd>{new Date(Number(property.registrationTimestamp) * 1000).toLocaleString()}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-stone-400">Document hash</dt><dd className="break-all text-xs">{property.documentHash}</dd></div>
            </dl>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-600">Ownership history</h4>
              <ol className="space-y-2">{history.map((address, i) => <li key={`${address}-${i}`} className="break-all rounded-sm bg-[#fbf9f4] p-2 text-xs"><strong>{i + 1}.</strong> {address}</li>)}</ol>
            </div>
            <div className="pt-3 border-t border-stone-200">
              <DocumentIntegrityVerification
                onChainDocumentHash={property.documentHash}
                blockchainPropertyId={property.propertyId}
                verificationState={verified ? 'verified' : 'unverified'}
              />
            </div>
          </>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={updateStatus} className="space-y-3 rounded-sm border border-stone-200 p-4 md:p-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-900">Update property status</h3>
          <p className="text-xs text-stone-500">Admin only. Use the property ID entered above.</p>
          <label className="block text-xs font-semibold text-stone-600">New status</label>
          <select className={inputClass} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="0">Registered</option><option value="1">Disputed</option><option value="2">Suspended</option>
          </select>
          <label className="block text-xs font-semibold text-stone-600">Reason (required)</label>
          <input className={inputClass} value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="Reason for status change" />
          <button className={buttonClass} type="submit" disabled={!canUpdateStatus}>Update status</button>
          {!canUpdateStatus && getUpdateStatusDisabledReason() && (
            <p className="text-xs text-stone-500">{getUpdateStatusDisabledReason()}</p>
          )}
        </form>

        <form onSubmit={transfer} className="space-y-3 rounded-sm border border-stone-200 p-4 md:p-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-900">Transfer ownership</h3>
          <p className="text-xs leading-relaxed text-stone-500">Must be submitted from the current owner's wallet. Transfers are blocked unless the property status is Registered.</p>
          <label className="block text-xs font-semibold text-stone-600">New owner's address</label>
          <input className={inputClass} value={newOwner} onChange={e => setNewOwner(e.target.value)} placeholder="0x..." />
          <button className={buttonClass} type="submit" disabled={!canTransfer}>Transfer property</button>
          {!canTransfer && getTransferDisabledReason() && (
            <p className="text-xs text-stone-500">{getTransferDisabledReason()}</p>
          )}
        </form>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-stone-400">Prototype notice: this interface interacts with a Sepolia testnet contract. Do not use it as proof of legal ownership or with real funds.</p>
    </section>
  );
}
