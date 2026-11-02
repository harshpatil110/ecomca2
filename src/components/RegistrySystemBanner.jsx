import { useState } from 'react';
import { REGISTRY_ADDRESS, SEPOLIA_CHAIN_ID, SEPOLIA_EXPLORER } from '../blockchain/registryConfig';
import { useMetaMask } from '../context/MetaMaskContext';
import { fetchSepoliaBalance, lookupOnChainProperty } from '../services/registryDataService';

const FAUCETS = [
  { name: 'Google Cloud Web3 Faucet', url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia' },
  { name: 'Alchemy Sepolia Faucet', url: 'https://www.alchemy.com/faucets/ethereum-sepolia' },
  { name: 'Infura Sepolia Faucet', url: 'https://www.infura.io/faucet/sepolia' },
];

export default function RegistrySystemBanner({ contractAdmin, events = [], onRefresh, isRpcUnavailable }) {
  const { account } = useMetaMask();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lookup state
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Balance state
  const [balanceAddress, setBalanceAddress] = useState('');
  const [balanceResult, setBalanceResult] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Events filter
  const [eventFilter, setEventFilter] = useState('ALL');

  const isAdmin = account && contractAdmin && account.toLowerCase() === contractAdmin.toLowerCase();

  const handleCopyContract = () => {
    navigator.clipboard?.writeText(REGISTRY_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const res = await lookupOnChainProperty(lookupId.trim());
      setLookupResult(res);
    } catch (err) {
      setLookupError(err.message || 'Lookup failed.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    const target = balanceAddress.trim() || account;
    if (!target) {
      setBalanceError('Please enter an address or connect your wallet.');
      return;
    }
    setBalanceLoading(true);
    setBalanceError('');
    setBalanceResult(null);
    try {
      const bal = await fetchSepoliaBalance(target);
      setBalanceResult({ address: target, balance: bal });
    } catch (err) {
      setBalanceError(err.message || 'Failed to check balance.');
    } finally {
      setBalanceLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (eventFilter === 'ALL') return true;
    return ev.type === eventFilter;
  });

  return (
    <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden text-stone-800" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Banner Top Strip */}
      <div className="bg-[#f5f4ed] border-b border-stone-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRpcUnavailable ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="font-bold uppercase tracking-wider text-stone-700 text-[10px]">
              Sepolia {isRpcUnavailable ? 'RPC Limited' : 'Contract Live'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white border border-stone-200 px-2.5 py-1 rounded-sm">
            <span className="text-stone-400 text-[9px] uppercase font-sans font-bold">Contract:</span>
            <span className="text-stone-700 font-semibold">{REGISTRY_ADDRESS.slice(0, 6)}…{REGISTRY_ADDRESS.slice(-4)}</span>
            <button
              onClick={handleCopyContract}
              title="Copy Contract Address"
              className="text-stone-400 hover:text-stone-900 ml-1 text-[10px]"
            >
              {copied ? '✓' : '⧉'}
            </button>
            <a
              href={`${SEPOLIA_EXPLORER}/address/${REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-stone-400 hover:text-stone-900 ml-0.5 text-[10px]"
              title="View on Etherscan"
            >
              ↗
            </a>
          </div>

          {contractAdmin && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-400 text-[9px] uppercase font-bold">Admin:</span>
              <span className="font-mono text-stone-700">{contractAdmin.slice(0, 6)}…{contractAdmin.slice(-4)}</span>
              {isAdmin ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                  Authorized Admin
                </span>
              ) : (
                <span className="bg-stone-100 text-stone-500 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                  Read Only
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">sync</span>
              Sync
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-bold uppercase tracking-widest text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1"
          >
            <span>{isExpanded ? 'Hide Tools & Events' : 'Registry Tools & Events'}</span>
            <span className="material-symbols-outlined text-xs">{isExpanded ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#fbf9f4] border-t border-stone-200 text-xs">
          {/* Column 1: On-Chain Lookup */}
          <div className="bg-white p-5 border border-stone-200 rounded-sm shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Query Smart Contract</p>
              <h3 className="text-sm font-bold uppercase text-stone-900 mt-0.5">Live Property Lookup</h3>
              <p className="text-stone-500 text-[11px] italic font-serif mt-1">
                Directly calls <code className="font-mono text-stone-700">getProperty(id)</code> on Sepolia.
              </p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Enter Property ID (e.g. 1)"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-sm text-xs font-mono text-stone-800 placeholder:italic focus:outline-none focus:border-stone-800"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-stone-800 transition disabled:opacity-50"
              >
                {lookupLoading ? '...' : 'Query'}
              </button>
            </form>

            {lookupError && (
              <p className="text-red-700 bg-red-50 border border-red-200 p-2 rounded-sm text-[11px]">
                {lookupError}
              </p>
            )}

            {lookupResult && (
              <div className="border border-stone-200 bg-stone-50 p-3 rounded-sm space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                  <span className="font-bold text-stone-900">Property #{lookupResult.propertyId}</span>
                  <span className="font-sans text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                    {lookupResult.statusName}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-sans">Owner:</span>{' '}
                  <span className="text-stone-700 break-all">{lookupResult.currentOwner}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-sans">Location Ref:</span>{' '}
                  <span className="text-stone-700">{lookupResult.locationReference || '—'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-sans">Doc Hash:</span>{' '}
                  <span className="text-stone-500 break-all text-[10px]">{lookupResult.documentHash}</span>
                </div>
                <div className="pt-2 text-right">
                  <a
                    href={`/records/${lookupResult.propertyId}`}
                    className="font-sans text-[10px] font-bold uppercase text-stone-900 hover:underline"
                  >
                    View Details Page →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Sepolia ETH Balance & Faucets */}
          <div className="bg-white p-5 border border-stone-200 rounded-sm shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Gas & Network Utility</p>
              <h3 className="text-sm font-bold uppercase text-stone-900 mt-0.5">Sepolia ETH Balance</h3>
              <p className="text-stone-500 text-[11px] italic font-serif mt-1">
                Check balance for contract execution and gas payments.
              </p>
            </div>

            <form onSubmit={handleCheckBalance} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={account ? `${account.slice(0, 10)}… (leave blank for connected)` : '0x... address'}
                  value={balanceAddress}
                  onChange={(e) => setBalanceAddress(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-sm text-xs font-mono text-stone-800 placeholder:italic focus:outline-none focus:border-stone-800"
                />
                <button
                  type="submit"
                  disabled={balanceLoading}
                  className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-stone-800 transition disabled:opacity-50"
                >
                  {balanceLoading ? '...' : 'Check'}
                </button>
              </div>
            </form>

            {balanceError && (
              <p className="text-red-700 bg-red-50 border border-red-200 p-2 rounded-sm text-[11px]">
                {balanceError}
              </p>
            )}

            {balanceResult && (
              <div className="border border-stone-200 bg-stone-50 p-3 rounded-sm space-y-1 font-mono text-[11px]">
                <div className="text-stone-500 text-[10px]">
                  Address: {balanceResult.address.slice(0, 10)}…{balanceResult.address.slice(-6)}
                </div>
                <div className="text-base font-bold text-stone-900">
                  {balanceResult.balance} <span className="text-xs font-sans text-stone-500">SEP ETH</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-stone-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Testnet Faucets</p>
              <div className="space-y-1">
                {FAUCETS.map((f) => (
                  <a
                    key={f.name}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[10px] text-stone-600 hover:text-stone-900 hover:underline flex items-center justify-between"
                  >
                    <span>{f.name}</span>
                    <span>↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Contract Events Feed */}
          <div className="bg-white p-5 border border-stone-200 rounded-sm shadow-sm space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">On-Chain Audit Trail</p>
                <h3 className="text-sm font-bold uppercase text-stone-900 mt-0.5">Contract Event Logs</h3>
              </div>
              <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm">
                {filteredEvents.length} events
              </span>
            </div>

            <div className="flex gap-1 border-b border-stone-100 pb-2">
              {['ALL', 'PropertyRegistered', 'PropertyStatusUpdated', 'PropertyTransferred'].map((t) => (
                <button
                  key={t}
                  onClick={() => setEventFilter(t)}
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm transition ${
                    eventFilter === t ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t.replace('Property', '')}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-stone-100 pr-1">
              {filteredEvents.length === 0 ? (
                <p className="text-stone-400 italic font-serif py-6 text-center text-xs">
                  No contract events match the selected criteria.
                </p>
              ) : (
                filteredEvents.slice(0, 20).map((ev, idx) => (
                  <div key={ev.id || idx} className="py-2 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-900">{ev.type}</span>
                      <span className="font-mono text-stone-400 text-[10px]">Block #{ev.blockNumber}</span>
                    </div>
                    <div className="text-stone-600 font-mono text-[10px]">
                      {ev.type === 'PropertyRegistered' && (
                        <span>Property #{ev.propertyId} registered by {ev.registeredBy?.slice(0, 6)}…</span>
                      )}
                      {ev.type === 'PropertyStatusUpdated' && (
                        <span>Property #{ev.propertyId} status changed to {ev.newStatusName} (reason: &quot;{ev.reason}&quot;)</span>
                      )}
                      {ev.type === 'PropertyTransferred' && (
                        <span>Property #{ev.propertyId} transferred: {ev.previousOwner?.slice(0, 6)}… → {ev.newOwner?.slice(0, 6)}…</span>
                      )}
                    </div>
                    {ev.transactionHash && (
                      <div className="text-right">
                        <a
                          href={`${SEPOLIA_EXPLORER}/tx/${ev.transactionHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] text-emerald-700 hover:underline uppercase font-bold"
                        >
                          View Tx ↗
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}