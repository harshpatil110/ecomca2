import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRegistryData } from '../services/registryDataService';
import { REGISTRY_ADDRESS } from '../blockchain/registryConfig';

function StatCard({ label, value, icon, accent, subtitle }) {
  return (
    <div className="bg-white border border-stone-200 rounded-sm p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          {label}
        </p>
        <span className={`material-symbols-outlined text-xl ${accent || 'text-stone-400'}`}>{icon}</span>
      </div>
      <div>
        <span className="text-3xl md:text-4xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
          {value}
        </span>
        {subtitle && (
          <p className="text-[11px] text-stone-500 font-serif italic mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function RegistryDashboard() {
  const { records, metrics, isLoading, isRpcUnavailable, rpcError, refresh, lastRefreshedAt } = useRegistryData();

  const recentRegistrations = useMemo(() => {
    return [...records]
      .filter((p) => p.isOnChain)
      .sort((a, b) => {
        const timeB = b.registrationTimestamp ? b.registrationTimestamp * 1000 : new Date(b.publishedAt || 0).getTime();
        const timeA = a.registrationTimestamp ? a.registrationTimestamp * 1000 : new Date(a.publishedAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [records]);

  const unregisteredItems = useMemo(() => {
    return records.filter((p) => !p.isOnChain);
  }, [records]);

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-24">
      {/* Header */}
      <div className="border-b border-stone-200/40 px-8 pt-10 pb-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ethereum Sepolia · Contract: {REGISTRY_ADDRESS.slice(0, 8)}…{REGISTRY_ADDRESS.slice(-6)}
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Property Registry Dashboard
            </h1>
            <p className="text-base font-serif italic text-stone-500">
              Decentralized property registration, cryptographic document verification, and ownership audit trail.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshedAt && (
              <span className="text-[10px] text-stone-400 font-mono">
                Synced {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="text-[11px] font-bold uppercase tracking-widest text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-sm shadow-sm transition flex items-center gap-1.5"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>sync</span>
              {isLoading ? 'Syncing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 pt-10 space-y-10">
        {/* RPC Alert banner if unavailable */}
        {isRpcUnavailable && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-3 text-xs text-amber-900">
            <span className="material-symbols-outlined text-amber-700 mt-0.5">cloud_off</span>
            <div className="flex-1">
              <p className="font-bold uppercase tracking-wider text-[11px]">Ethereum Sepolia Connection Limited</p>
              <p className="font-serif italic text-stone-600 mt-0.5">
                {rpcError || 'Sepolia RPC node is temporarily unreachable. Displaying cached records and local storage fallback.'}
              </p>
            </div>
            <button
              onClick={() => refresh()}
              className="text-[10px] font-bold uppercase tracking-widest bg-amber-900 text-white px-3 py-1 rounded-sm hover:bg-amber-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metric Grid — Perfectly Unified across Registry */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <StatCard
            label="Total Blockchain Records"
            value={isLoading && metrics.totalBlockchainRecords === null ? '…' : (metrics.totalBlockchainRecords ?? (isRpcUnavailable ? 'Unavailable' : 0))}
            icon="token"
            accent="text-emerald-700"
            subtitle="Confirmed on-chain"
          />
          <StatCard
            label="Registered Properties"
            value={metrics.registeredProperties}
            icon="verified"
            accent="text-emerald-700"
            subtitle="Status: Registered (0)"
          />
          <StatCard
            label="Disputed Properties"
            value={metrics.disputedProperties}
            icon="gavel"
            accent="text-red-700"
            subtitle="Status: Disputed (1)"
          />
          <StatCard
            label="Suspended Properties"
            value={metrics.suspendedProperties}
            icon="block"
            accent="text-stone-600"
            subtitle="Status: Suspended (2)"
          />
          <StatCard
            label="Verified Documents"
            value={metrics.verifiedDocuments}
            icon="fingerprint"
            accent="text-blue-700"
            subtitle="Cryptographic SHA-256 registered"
          />
          <StatCard
            label="Ownership Transfers"
            value={metrics.ownershipTransfers}
            icon="swap_horiz"
            accent="text-stone-700"
            subtitle="Historical conveyance events"
          />
          <StatCard
            label="Registration Required"
            value={metrics.registrationRequired}
            icon="warning"
            accent="text-amber-700"
            subtitle="Local records awaiting blockchain"
          />
          <StatCard
            label="Smart Contract"
            value={isRpcUnavailable ? 'Limited' : 'Active'}
            icon="link"
            accent={isRpcUnavailable ? 'text-amber-600' : 'text-emerald-700'}
            subtitle="Chain ID 11155111"
          />
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Link
            to="/register"
            className="bg-stone-900 text-white p-6 rounded-sm hover:bg-stone-800 transition-colors flex items-center gap-4 group"
          >
            <span className="material-symbols-outlined text-3xl text-stone-400 group-hover:text-stone-200">add_circle</span>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Register Property</p>
              <p className="text-stone-400 text-xs mt-0.5 font-serif italic">Execute on-chain property deed</p>
            </div>
          </Link>

          <Link
            to="/verify"
            className="bg-white border border-stone-200 text-stone-900 p-6 rounded-sm hover:bg-[#f5f4ed] transition-colors flex items-center gap-4 group"
          >
            <span className="material-symbols-outlined text-3xl text-stone-400 group-hover:text-stone-600">fingerprint</span>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Document Verification</p>
              <p className="text-stone-500 text-xs mt-0.5 font-serif italic">SHA-256 deed integrity check</p>
            </div>
          </Link>

          <Link
            to="/transfers"
            className="bg-white border border-stone-200 text-stone-900 p-6 rounded-sm hover:bg-[#f5f4ed] transition-colors flex items-center gap-4 group"
          >
            <span className="material-symbols-outlined text-3xl text-stone-400 group-hover:text-stone-600">swap_horiz</span>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Ownership Transfers</p>
              <p className="text-stone-500 text-xs mt-0.5 font-serif italic">Manage and verify title conveyance</p>
            </div>
          </Link>
        </div>

        {/* Two-Column Section: Confirmed Blockchain Properties & Actionable Unregistered Records */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Confirmed Registrations Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                Confirmed Blockchain Properties ({metrics.totalBlockchainRecords ?? 0})
              </h2>
              <Link to="/records?tab=registered" className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                View All On-Chain →
              </Link>
            </div>

            <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead className="bg-[#f5f4ed] border-b border-stone-200 text-[10px] text-stone-400 uppercase tracking-widest font-black">
                  <tr>
                    <th className="py-3 px-5">Blockchain ID</th>
                    <th className="py-3 px-5">Property Title / Ref</th>
                    <th className="py-3 px-5">Registered Owner</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {recentRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400 font-serif italic">
                        {isLoading ? 'Loading blockchain property records…' : 'No blockchain properties found. Use Register Property to create one.'}
                      </td>
                    </tr>
                  ) : (
                    recentRegistrations.map((item) => {
                      const displayOwner = item.ownerName || (item.currentOwner ? `${item.currentOwner.slice(0, 6)}…${item.currentOwner.slice(-4)}` : '—');
                      const ownerAddr = item.currentOwner || item.ownerWallet;
                      return (
                        <tr key={item.id || item.blockchainPropertyId} className="hover:bg-[#fbf9f4] transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-emerald-800">
                            #{item.blockchainPropertyId}
                          </td>
                          <td className="py-3.5 px-5">
                            <Link to={`/records/${item.id || item.blockchainPropertyId}`} className="font-bold text-stone-900 hover:underline">
                              {item.name || `On-Chain Property #${item.blockchainPropertyId}`}
                            </Link>
                            <p className="text-stone-400 text-[10px] font-mono mt-0.5">{item.propertyRef || item.locationReference || 'Sepolia Deed'}</p>
                          </td>
                          <td className="py-3.5 px-5">
                            <p className="font-medium text-stone-800">{displayOwner}</p>
                            {ownerAddr && (
                              <p className="text-stone-400 text-[9px] font-mono">{ownerAddr.slice(0, 6)}…{ownerAddr.slice(-4)}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                              item.status === 'Registered'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : item.status === 'Disputed'
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <Link
                              to={`/records/${item.id || item.blockchainPropertyId}`}
                              className="text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:underline"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Unregistered Records Sidebar */}
          <div className="space-y-4">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pending Blockchain Registration
            </h2>

            <div className="bg-white border border-stone-200 rounded-sm p-5 space-y-4 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              <p className="text-xs text-stone-500 font-serif italic leading-relaxed">
                The following records are stored locally and must be registered on Ethereum Sepolia to establish immutable on-chain ownership.
              </p>

              {unregisteredItems.length === 0 ? (
                <p className="text-xs text-emerald-700 font-bold">✓ All local records have been registered on-chain.</p>
              ) : (
                <div className="space-y-3">
                  {unregisteredItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-sm text-xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-stone-900">{item.name}</span>
                        <span className="text-[9px] font-mono text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-sm font-bold">Registration Required</span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-mono">ID: {item.id} · Ref: {item.propertyRef || '—'}</p>
                      <Link
                        to={`/register?ref=${encodeURIComponent(item.propertyRef || item.id)}&title=${encodeURIComponent(item.name || '')}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 underline mt-1"
                      >
                        Register on Blockchain →
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <Link
                to="/records?tab=unregistered"
                className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 block text-right pt-2 border-t border-stone-100"
              >
                View all registration required ({unregisteredItems.length}) →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}