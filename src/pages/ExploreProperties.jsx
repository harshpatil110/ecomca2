import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings, subscribeToListings } from '../services/listingsStore';

const PAGE_SIZE = 12;

export default function ExploreProperties() {
  const navigate = useNavigate();
  const [allListings, setAllListings] = useState(() => getListings());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState('all');
  const [searchCity, setSearchCity] = useState('');
  const [selectedRegistryFilter, setSelectedRegistryFilter] = useState('all'); // 'all' | 'onchain' | 'offchain'

  useEffect(() => {
    return subscribeToListings((updated) => setAllListings(updated));
  }, []);

  // Filter out Draft and Sold listings from active explore catalogue
  const filteredListings = useMemo(() => {
    return allListings.filter((l) => {
      if (l.status === 'Draft' || l.status === 'Sold') return false;
      if (selectedType !== 'all' && (l.type || '').toLowerCase() !== selectedType.toLowerCase()) return false;
      if (searchCity && !(l.city || '').toLowerCase().includes(searchCity.toLowerCase()) && !(l.location || '').toLowerCase().includes(searchCity.toLowerCase())) {
        return false;
      }
      if (selectedRegistryFilter === 'onchain' && !l.blockchainPropertyId) return false;
      if (selectedRegistryFilter === 'offchain' && l.blockchainPropertyId) return false;
      return true;
    });
  }, [allListings, selectedType, searchCity, selectedRegistryFilter]);

  const handleTypeSelect = (t) => {
    setSelectedType(t);
    setCurrentPage(1);
  };

  const handleCitySearch = (val) => {
    setSearchCity(val);
    setCurrentPage(1);
  };

  const handleRegistryFilterSelect = (filterId) => {
    setSelectedRegistryFilter(filterId);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchCity('');
    setSelectedType('all');
    setSelectedRegistryFilter('all');
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedListings = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, validPage]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Generate pagination numbers
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    if (validPage > 3) pages.push('...');
    const start = Math.max(2, validPage - 1);
    const end = Math.min(totalPages - 1, validPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (validPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [totalPages, validPage]);

  return (
    <div className="bg-[#fbf9f4] text-[#31332c] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* Editorial Header */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-none mb-4 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            The Search
          </h1>
          <p className="text-xl italic text-stone-500 max-w-xl">
            Curated architectural masterworks across prime Indian and global locales, verifiable on Ethereum Sepolia.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* ── Sidebar Filters ── */}
          <aside className="md:w-1/4">
            <div className="sticky top-24 p-8 bg-[#F7F5F0] rounded-sm border border-stone-200/60 shadow-xs space-y-8">
              <div>
                <h3 className="text-[10px] font-black tracking-widest text-stone-900 uppercase mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Search Locality</h3>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  placeholder="City, locality or name..."
                  className="w-full bg-white border border-stone-200 px-3 py-2 text-xs font-serif placeholder:italic focus:outline-none focus:border-stone-800 rounded-sm"
                />
              </div>

              <div>
                <h3 className="text-[10px] font-black tracking-widest text-stone-900 uppercase mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Property Typology</h3>
                <div className="space-y-1.5">
                  {['all', 'villa', 'estate', 'penthouse', 'residence'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTypeSelect(t)}
                      className={`w-full text-left px-3 py-2 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-colors ${
                        selectedType === t
                          ? 'bg-stone-900 text-white'
                          : 'bg-transparent text-stone-600 hover:bg-stone-200/50'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {t === 'all' ? 'All Typologies' : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black tracking-widest text-stone-900 uppercase mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Registry Verification</h3>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: 'All Listings' },
                    { id: 'onchain', label: 'Blockchain Registered' },
                    { id: 'offchain', label: 'Off-Chain Only' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleRegistryFilterSelect(f.id)}
                      className={`w-full text-left px-3 py-2 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-colors ${
                        selectedRegistryFilter === f.id
                          ? 'bg-stone-900 text-white'
                          : 'bg-transparent text-stone-600 hover:bg-stone-200/50'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {(searchCity || selectedType !== 'all' || selectedRegistryFilter !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="w-full py-3 bg-stone-200 text-stone-800 text-[10px] font-black tracking-widest uppercase rounded-sm hover:bg-stone-300 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </aside>

          {/* ── Listings Grid ── */}
          <div className="md:w-3/4">
            {/* Results count & page info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-stone-200/70 gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Showing {filteredListings.length > 0 ? (validPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(validPage * PAGE_SIZE, filteredListings.length)} of {filteredListings.length} Active Residences
              </p>
              <p className="text-xs font-serif italic text-stone-400">
                Page {validPage} of {totalPages}
              </p>
            </div>

            {filteredListings.length === 0 ? (
              <div className="p-16 text-center bg-white border border-stone-200 rounded-sm">
                <p className="text-2xl font-serif italic text-stone-400 mb-2">No active residences match your filters</p>
                <p className="text-xs font-sans text-stone-500">Try clearing your search terms or expanding property typologies.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
                {paginatedListings.map((item) => (
                  <div key={item.id} onClick={() => navigate(`/property/${item.id}`)} className="group flex flex-col cursor-pointer">
                    <div className="aspect-[4/5] overflow-hidden bg-[#f5f4ed] rounded-sm mb-6 relative">
                      <img
                        className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-700"
                        src={item.src || '/brutalist_exterior.png'}
                        alt={item.name}
                        loading="lazy"
                      />
                      {item.registrationPending ? (
                        <div className="absolute top-4 left-4 bg-amber-500 text-white py-1 px-3 text-[8px] font-black tracking-[0.2em] uppercase rounded-sm flex items-center gap-1.5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Registration pending
                        </div>
                      ) : item.blockchainPropertyId ? (
                        <div className="absolute top-4 left-4 bg-stone-900 text-white py-1 px-3 text-[8px] font-black tracking-[0.2em] uppercase rounded-sm flex items-center gap-1.5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Blockchain registered #{item.blockchainPropertyId}
                        </div>
                      ) : (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-stone-600 py-1 px-3 text-[8px] font-black tracking-[0.2em] uppercase rounded-sm flex items-center gap-1.5 shadow-sm border border-stone-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                          Off-chain
                        </div>
                      )}
                      {(item.badge || item.status) && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[8px] font-black tracking-[0.2em] uppercase rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {item.badge || item.status}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{item.price}</p>
                      <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{item.name}</h2>
                      <p className="italic text-stone-500 text-sm mb-4">{item.location}</p>
                      <Link
                        to={`/property/${item.id}`}
                        className="inline-block text-[10px] font-black uppercase tracking-widest border border-stone-300 px-6 py-2.5 rounded-sm hover:bg-stone-900 hover:text-white transition-all duration-300"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-20 flex flex-wrap items-center justify-between pt-8 border-t border-stone-200/70 gap-4">
                <button
                  disabled={validPage <= 1}
                  onClick={() => handlePageChange(validPage - 1)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    validPage <= 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-stone-600 cursor-pointer'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  ← Previous
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {pageNumbers.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="text-xs text-stone-400 px-1">…</span>
                      );
                    }
                    const isCurrent = p === validPage;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`min-w-8 h-8 px-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-colors ${
                          isCurrent
                            ? 'bg-stone-900 text-white'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {String(p).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={validPage >= totalPages}
                  onClick={() => handlePageChange(validPage + 1)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    validPage >= totalPages ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-stone-600 cursor-pointer'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

