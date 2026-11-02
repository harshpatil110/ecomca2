import { useMemo } from 'react';
import { useRegistryData } from '../services/registryDataService';
import { REGISTRY_ADDRESS } from '../blockchain/registryConfig';

export default function RegistryAnalytics() {
  const { records, metrics, isLoading, refresh } = useRegistryData();

  const analytics = useMemo(() => {
    const blockchainRecords = records.filter((p) => p.isOnChain);
    const totalBlockchain = metrics.totalBlockchainRecords ?? blockchainRecords.length;

    const docIntegrityRate = totalBlockchain > 0
      ? Math.round((metrics.verifiedDocuments / totalBlockchain) * 100)
      : 0;

    // Category distribution for blockchain records
    const typesMap = {};
    blockchainRecords.forEach((p) => {
      const t = (p.type || 'Residential').toLowerCase();
      typesMap[t] = (typesMap[t] || 0) + 1;
    });

    // Geographic distribution for blockchain records
    const citiesMap = {};
    blockchainRecords.forEach((p) => {
      const c = p.city || p.location || 'Sepolia Registry';
      citiesMap[c] = (citiesMap[c] || 0) + 1;
    });

    return {
      totalBlockchain,
      registered: metrics.registeredProperties,
      disputed: metrics.disputedProperties,
      suspended: metrics.suspendedProperties,
      registrationRequired: metrics.registrationRequired,
      verifiedDocs: metrics.verifiedDocuments,
      docIntegrityRate,
      transferCount: metrics.ownershipTransfers,
      types: Object.entries(typesMap).sort((a, b) => b[1] - a[1]),
      cities: Object.entries(citiesMap).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [records, metrics]);

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-28">
      {/* Header */}
      <div className="border-b border-stone-200/40 px-8 pt-10 pb-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Registry Administration & Intelligence
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Registry Analytics
            </h1>
            <p className="text-base font-serif italic text-stone-500 mt-2">
              Statistical audit of confirmed smart contract registrations, document verification integrity, dispute ratios, and ownership conveyance.
            </p>
          </div>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="text-[11px] font-bold uppercase tracking-widest text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-sm shadow-sm transition flex items-center gap-1.5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>sync</span>
            {isLoading ? 'Syncing...' : 'Sync Registry State'}
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 pt-10 space-y-10">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Total Blockchain Records</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-stone-900">{analytics.totalBlockchain}</span>
              <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm font-bold">On-Chain</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Document Integrity Rate</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-blue-700">{analytics.docIntegrityRate}%</span>
              <span className="text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-sm font-bold">SHA-256</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Disputed / Suspended</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-red-700">{analytics.disputed + analytics.suspended}</span>
              <span className="text-xs font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-sm font-bold">
                {analytics.totalBlockchain > 0 ? Math.round(((analytics.disputed + analytics.suspended) / analytics.totalBlockchain) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Ownership Transfers</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-stone-900">{analytics.transferCount}</span>
              <span className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded-sm font-bold">Events</span>
            </div>
          </div>
        </div>

        {/* Detailed Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Breakdown */}
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-3">
              On-Chain Registration Status Breakdown
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Registered (Clear On-Chain Title)', count: analytics.registered, color: 'bg-emerald-600', badgeColor: 'text-emerald-800 bg-emerald-50' },
                { label: 'Disputed Properties (Enum 1)', count: analytics.disputed, color: 'bg-red-600', badgeColor: 'text-red-800 bg-red-50' },
                { label: 'Suspended Records (Enum 2)', count: analytics.suspended, color: 'bg-stone-500', badgeColor: 'text-stone-700 bg-stone-100' },
              ].map(({ label, count, color, badgeColor }) => {
                const pct = analytics.totalBlockchain > 0 ? Math.round((count / analytics.totalBlockchain) * 100) : 0;
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-800">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${badgeColor}`}>{count}</span>
                        <span className="text-stone-400 font-mono text-[11px]">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Contract Architecture Verification */}
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-3">
              Smart Contract Infrastructure
            </h2>

            <div className="p-4 bg-[#fbf9f4] border border-stone-200 rounded-sm space-y-2 text-xs">
              <span className="font-bold text-stone-800 uppercase text-[10px] tracking-wider block">Sepolia Deployment Parameters</span>
              <div className="flex justify-between text-stone-600">
                <span>Contract Address:</span>
                <span className="font-mono text-stone-900 font-bold break-all">{REGISTRY_ADDRESS}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Network Chain ID:</span>
                <span className="font-mono text-stone-900 font-bold">11155111 (Sepolia)</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Cryptographic Digest:</span>
                <span className="font-mono text-stone-900 font-bold">SHA-256 (32 bytes)</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Status Mutability:</span>
                <span className="font-mono text-stone-900 font-bold">Admin-Authorized updatePropertyStatus()</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm text-xs space-y-1">
              <span className="font-bold text-amber-900 block">Registration Required: {analytics.registrationRequired}</span>
              <p className="text-amber-800 text-[11px] font-serif italic">
                Local records pending on-chain registration are isolated and excluded from confirmed smart contract metrics until registered.
              </p>
            </div>
          </div>
        </div>

        {/* Categories & Regional Hubs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-3">
              On-Chain Property Categories
            </h2>
            <div className="space-y-3">
              {analytics.types.length === 0 ? (
                <p className="text-xs text-stone-400 font-serif italic">No on-chain records categorized.</p>
              ) : (
                analytics.types.map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center py-2 border-b border-stone-100 text-xs">
                    <span className="font-bold text-stone-800 capitalize">{type}</span>
                    <span className="font-mono text-stone-600">{count} properties</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-3">
              Regional Registry Hubs
            </h2>
            <div className="space-y-3">
              {analytics.cities.length === 0 ? (
                <p className="text-xs text-stone-400 font-serif italic">No regional records recorded.</p>
              ) : (
                analytics.cities.map(([city, count]) => (
                  <div key={city} className="flex justify-between items-center py-2 border-b border-stone-100 text-xs">
                    <span className="font-bold text-stone-800">{city}</span>
                    <span className="font-mono text-stone-600">{count} properties</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}