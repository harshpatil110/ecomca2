import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRegistryData } from '../services/registryDataService';
import { useMetaMask } from '../context/MetaMaskContext';
import { SEPOLIA_EXPLORER } from '../blockchain/registryConfig';
import RegistrySystemBanner from '../components/RegistrySystemBanner';
import StatusModerationModal from '../components/StatusModerationModal';

const PAGE_SIZE = 20;

const STATUS_COLORS = {
  Registered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Disputed: 'bg-red-50 text-red-800 border-red-200',
  Suspended: 'bg-stone-100 text-stone-600 border-stone-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  'Registration Required': 'bg-amber-50 text-amber-900 border-amber-300',
  Unregistered: 'bg-amber-50 text-amber-900 border-amber-300',
};

export default function PropertyRecords() {
  const [searchParams] = useSearchParams();
  const { records, metrics, loading, isRpcUnavailable, contractAdmin, events, refresh } = useRegistryData();
  const { account } = useMetaMask();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState(() => searchParams.get('tab') || 'all'); // 'all' | 'registered' | 'disputed' | 'unregistered'
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Status moderation modal state
  const [moderationTarget, setModerationTarget] = useState(null);

  const isAdmin = useMemo(() => {
    if (!account || !contractAdmin) return false;
    return account.toLowerCase() === contractAdmin.toLowerCase();
  }, [account, contractAdmin]);

  const propertyTypes = useMemo(() => {
    const types = new Set(records.map((p) => (p.type || 'other').toLowerCase()));
    return ['all', ...Array.from(types)];
  }, [records]);

  const filtered = useMemo(() => {
    let items = [...records];

    // Tab filter
    if (filterTab === 'registered') {
      items = items.filter((p) => p.isOnChain && p.status === 'Registered');
    } else if (filterTab === 'disputed') {
      items = items.filter((p) => p.isOnChain && (p.status === 'Disputed' || p.status === 'Suspended'));
    } else if (filterTab === 'unregistered') {
      items = items.filter((p) => !p.isOnChain);
    }

    // Type filter
    if (filterType !== 'all') {
      items = items.filter((p) => (p.type || '').toLowerCase() === filterType.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.city || '').toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q) ||
          String(p.id || '').toLowerCase().includes(q) ||
          String(p.blockchainPropertyId || '').toLowerCase().includes(q) ||
          (p.propertyRef || '').toLowerCase().includes(q) ||
          (p.ownerName || '').toLowerCase().includes(q) ||
          (p.currentOwner || '').toLowerCase().includes(q) ||
          (p.surveyNumber || '').toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const timeB = b.registrationTimestamp ? b.registrationTimestamp * 1000 : new Date(b.publishedAt || 0).getTime();
        const timeA = a.registrationTimestamp ? a.registrationTimestamp * 1000 : new Date(a.publishedAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'date_asc') {
        const timeB = b.registrationTimestamp ? b.registrationTimestamp * 1000 : new Date(b.publishedAt || 0).getTime();
        const timeA = a.registrationTimestamp ? a.registrationTimestamp * 1000 : new Date(a.publishedAt || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'id_asc') {
        const idA = a.blockchainPropertyId ? Number(a.blockchainPropertyId) : 999999;
        const idB = b.blockchainPropertyId ? Number(b.blockchainPropertyId) : 999999;
        return idA - idB;
      }
      return 0;
    });

    return items;
  }, [records, filterTab, filterType, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice((validPage - 1) * PAGE_SIZE, validPage * PAGE_SIZE);

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="bg-[#fbf9f4] min-h-screen pb-24">
      {/* Header */}
      <div className="border-b border-stone-200/40 px-8 pt-10 pb-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Registry Database · {records.length} total records ({metrics.totalBlockchainRecords ?? '…'} on-chain)
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Property Records
            </h1>
            <p className="text-base font-serif italic text-stone-500 mt-2">
              Immutable digital property records registered on Ethereum Sepolia.
            </p>
          </div>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="text-[11px] font-bold uppercase tracking-widest text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-sm shadow-sm transition flex items-center gap-1.5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
            {loading ? 'Refreshing...' : 'Refresh Registry Data'}
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 pt-8 space-y-6">
        {/* Integrated Registry System Information Banner */}
        <RegistrySystemBanner
          contractAdmin={contractAdmin}
          events={events}
          onRefresh={refresh}
          isRpcUnavailable={isRpcUnavailable}
        />

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Navigation Tabs with Reconciled Numbers */}
          <div className="flex flex-wrap border-b border-stone-200 gap-1">
            {[
              { id: 'all', label: `All Records (${records.length})` },
              { id: 'registered', label: `Registered On-Chain (${metrics.registeredProperties})` },
              { id: 'disputed', label: `Disputed / Suspended (${metrics.disputedProperties + metrics.suspendedProperties})` },
              { id: 'unregistered', label: `Registration Required (${metrics.registrationRequired})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setFilterTab(tab.id); resetPage(); }}
                className={`pb-3 px-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filterTab === tab.id ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-700'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
              placeholder="Search ID, title, location, owner..."
              className="w-full bg-white border border-stone-200 rounded-sm pl-9 pr-8 py-2 text-xs font-serif text-stone-800 placeholder:italic focus:outline-none focus:border-stone-800"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Secondary Filter & Sort Controls */}
        <div className="flex flex-wrap gap-3 items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); resetPage(); }}
            className="bg-white border border-stone-200 rounded-sm px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-700 focus:outline-none focus:border-stone-800 appearance-none"
          >
            {propertyTypes.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Property Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
            className="bg-white border border-stone-200 rounded-sm px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-700 focus:outline-none focus:border-stone-800 appearance-none"
          >
            <option value="date_desc">Newest Registration First</option>
            <option value="date_asc">Oldest Registration First</option>
            <option value="name_asc">Title A–Z</option>
            <option value="name_desc">Title Z–A</option>
            <option value="id_asc">Property Registry ID</option>
          </select>

          <Link
            to="/register"
            className="ml-auto bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-sm hover:bg-stone-800 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Register Property
          </Link>
        </div>

        {/* Registry Records Table */}
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              <thead className="bg-[#f5f4ed] border-b border-stone-200">
                <tr>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Registry ID</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Property Location / Ref</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Survey / Plot No.</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Current Registered Owner</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Property Type</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Blockchain Status</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Registration Status</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px]">Registration Date</th>
                  <th className="py-4 px-5 font-black tracking-[0.15em] uppercase text-stone-400 text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center font-serif italic text-stone-400">
                      No property records match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const status = item.status || 'Registered';
                    const isChain = Boolean(item.isOnChain || item.blockchainPropertyId);
                    const displayOwner = item.ownerName || (item.currentOwner ? `${item.currentOwner.slice(0, 6)}…${item.currentOwner.slice(-4)}` : '—');
                    const ownerAddr = item.currentOwner || item.ownerWallet;
                    const dateFormatted = item.registrationTimestamp
                      ? new Date(item.registrationTimestamp * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                      : item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';

                    return (
                      <tr key={item.id || item.blockchainPropertyId} className="hover:bg-[#fbf9f4] transition-colors">
                        <td className="py-4 px-5 font-mono text-stone-600 text-[11px] font-semibold">
                          #{item.blockchainPropertyId || item.id}
                        </td>

                        <td className="py-4 px-5">
                          <Link to={`/records/${item.id || item.blockchainPropertyId}`} className="font-bold text-stone-900 text-sm hover:underline block">
                            {item.name || `On-Chain Property #${item.blockchainPropertyId}`}
                          </Link>
                          <p className="text-stone-400 text-[10px] italic font-serif mt-0.5">
                            {item.location || item.city || item.locationReference || 'Ethereum Sepolia'}
                          </p>
                        </td>

                        <td className="py-4 px-5 font-mono text-stone-600 text-[11px]">
                          {item.surveyNumber || item.plotNumber || item.locationReference || '—'}
                        </td>

                        <td className="py-4 px-5">
                          <p className="font-medium text-stone-800">{displayOwner}</p>
                          {ownerAddr && (
                            <p className="text-stone-400 text-[9px] font-mono mt-0.5">{ownerAddr.slice(0, 8)}…{ownerAddr.slice(-4)}</p>
                          )}
                        </td>

                        <td className="py-4 px-5 capitalize text-stone-600">{item.type || 'Residential'}</td>

                        <td className="py-4 px-5">
                          {isChain ? (
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              On-Chain #{item.blockchainPropertyId}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-sm">
                              Registration Required
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <span className={`border px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                            {status}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-stone-400 italic font-serif text-[10px]">
                          {dateFormatted}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2.5 flex-wrap">
                            <Link
                              to={`/records/${item.id || item.blockchainPropertyId}`}
                              className="text-[10px] font-bold uppercase tracking-wider text-stone-700 hover:text-stone-900 hover:underline"
                            >
                              View Record
                            </Link>

                            {isAdmin && isChain && (
                              <button
                                onClick={() => setModerationTarget(item)}
                                className="text-[9px] font-bold uppercase tracking-wider text-stone-900 bg-stone-100 border border-stone-300 hover:bg-stone-200 px-2 py-1 rounded-sm"
                                title="Administrator Status Governance"
                              >
                                Moderate
                              </button>
                            )}

                            {isChain && (
                              <Link
                                to={`/transfers?property=${item.blockchainPropertyId || item.id}`}
                                className="text-[10px] font-bold uppercase tracking-wider text-stone-700 hover:text-stone-900 hover:underline"
                              >
                                Transfer
                              </Link>
                            )}

                            {!isChain && (
                              <Link
                                to={`/register?ref=${encodeURIComponent(item.propertyRef || item.id)}&title=${encodeURIComponent(item.name || '')}`}
                                className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 px-2 py-1 rounded-sm hover:bg-amber-100"
                              >
                                Register on Blockchain
                              </Link>
                            )}

                            {isChain && item.blockchainTxHash && (
                              <a
                                href={`${SEPOLIA_EXPLORER}/tx/${item.blockchainTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 hover:underline"
                              >
                                Etherscan ↗
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#fbf9f4] border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="text-stone-500">
                Showing {(validPage - 1) * PAGE_SIZE + 1}–{Math.min(validPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm ${validPage <= 1 ? 'text-stone-300 cursor-not-allowed' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                >
                  Prev
                </button>
                <span className="font-mono text-stone-600 px-2">{validPage} / {totalPages}</span>
                <button
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm ${validPage >= totalPages ? 'text-stone-300 cursor-not-allowed' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Status Moderation Modal */}
      {moderationTarget && (
        <StatusModerationModal
          property={moderationTarget}
          contractAdmin={contractAdmin}
          isOpen={Boolean(moderationTarget)}
          onClose={() => setModerationTarget(null)}
          onStatusUpdated={() => {
            setModerationTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}