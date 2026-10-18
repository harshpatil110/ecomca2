import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getListings,
  subscribeToListings,
  updateListing,
  markListingAsSold,
  relistListing,
  importDemoProperties,
  clearDemoProperties,
} from '../services/listingsStore';
import { SEPOLIA_EXPLORER } from '../blockchain/registryConfig';

const ADMIN_PAGE_SIZE = 15;

export default function ListingsManagerAdmin() {
  const [listings, setListings] = useState(() => getListings());
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mark as Sold Modal State
  const [propertyToSell, setPropertyToSell] = useState(null);
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);

  // Relist Modal State
  const [propertyToRelist, setPropertyToRelist] = useState(null);
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false);

  // Demo Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Filter Tabs: 'all' | 'active' | 'sold' | 'draft'
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  useEffect(() => {
    return subscribeToListings((updated) => setListings(updated));
  }, []);

  // Categorize listings
  const counts = useMemo(() => {
    const total = listings.length;
    const sold = listings.filter((p) => p.status === 'Sold').length;
    const draft = listings.filter((p) => p.status === 'Draft').length;
    const active = total - sold - draft;
    const demo = listings.filter((p) => p.isDemo).length;
    const onchain = listings.filter((p) => p.blockchainPropertyId).length;
    return { total, sold, draft, active, demo, onchain };
  }, [listings]);

  // Filtered listings based on active tab and search query
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Tab filter
      if (activeTab === 'active' && (item.status === 'Sold' || item.status === 'Draft')) return false;
      if (activeTab === 'sold' && item.status !== 'Sold') return false;
      if (activeTab === 'draft' && item.status !== 'Draft') return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchCity = (item.city || '').toLowerCase().includes(q);
        const matchId = String(item.id || '').toLowerCase().includes(q);
        const matchChainId = String(item.blockchainPropertyId || '').toLowerCase().includes(q);
        const matchRef = (item.propertyRef || '').toLowerCase().includes(q);
        return matchName || matchCity || matchId || matchChainId || matchRef;
      }
      return true;
    });
  }, [listings, activeTab, searchQuery]);

  // Pagination for admin table
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ADMIN_PAGE_SIZE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedListings = useMemo(() => {
    const start = (validPage - 1) * ADMIN_PAGE_SIZE;
    return filteredListings.slice(start, start + ADMIN_PAGE_SIZE);
  }, [filteredListings, validPage]);

  // Handlers
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedProperty) return;
    const form = e.target;
    const updatedName = form.elements.name.value;
    const updatedCity = form.elements.city.value;
    const updatedPrice = form.elements.price.value;
    const updatedStatus = form.elements.status.value;

    updateListing(selectedProperty.id, {
      name: updatedName,
      city: updatedCity,
      price: updatedPrice,
      status: updatedStatus,
    });

    setIsEditModalOpen(false);
    triggerToast('Listing details updated successfully.');
  };

  const handleConfirmSold = () => {
    if (!propertyToSell) return;
    try {
      markListingAsSold(propertyToSell.id);
      setIsSoldModalOpen(false);
      triggerToast(`Property "${propertyToSell.name}" marked as Sold and archived.`);
      setPropertyToSell(null);
    } catch (err) {
      alert(`Failed to mark listing as sold: ${err.message}`);
    }
  };

  const handleConfirmRelist = () => {
    if (!propertyToRelist) return;
    try {
      relistListing(propertyToRelist.id);
      setIsRelistModalOpen(false);
      triggerToast(`Property "${propertyToRelist.name}" restored to Active Exclusive status.`);
      setPropertyToRelist(null);
    } catch (err) {
      alert(`Failed to relist property: ${err.message}`);
    }
  };

  // Demo Import Handler with Dry Run
  const handlePrepareDemoImport = async (dryRun = true) => {
    setIsImporting(true);
    try {
      let demoData = null;
      try {
        const res = await fetch('/demoProperties.json');
        if (res.ok) {
          demoData = await res.json();
        }
      } catch {
        // Fallback to static import if public fetch fails
      }

      if (!demoData || !Array.isArray(demoData)) {
        // Dynamic import fallback
        const mod = await import('../data/demoProperties.json');
        demoData = mod.default || mod;
      }

      if (!demoData || !Array.isArray(demoData)) {
        throw new Error('Demo properties dataset could not be loaded. Please run "node scripts/generate-demo-properties.js" first.');
      }

      const report = importDemoProperties(demoData, { dryRun });
      setImportReport(report);
      setIsImportModalOpen(true);

      if (!dryRun) {
        triggerToast(`Successfully imported ${report.willCreate} demo properties into portfolio.`);
      }
    } catch (err) {
      alert(`Error loading demo properties: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearDemos = () => {
    if (window.confirm('Are you sure you want to remove all synthetic demo records? User-created and baseline listings will be preserved.')) {
      const res = clearDemoProperties();
      triggerToast(`Cleared ${res.removed} demo properties.`);
    }
  };

  return (
    <div className="pt-8 pb-20 px-8 md:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            Listings Management
          </h1>
          <p className="text-lg font-serif italic text-stone-500 mt-2">
            Curate architectural properties across website catalogs, sales lifecycles, and Ethereum Sepolia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handlePrepareDemoImport(true)}
            className="bg-white border border-stone-300 text-stone-800 font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-sm hover:bg-stone-100 transition-colors shadow-xs flex items-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className="material-symbols-outlined text-sm">dataset</span>
            Bulk Demo Data
          </button>
          <Link
            to="/admin/listings/new"
            className="bg-stone-900 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-sm hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className="material-symbols-outlined text-sm pt-[1px]">add</span>
            Draft New Listing
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-6 gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-stone-200 gap-2">
          {[
            { id: 'all', label: 'All Listings', count: counts.total },
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'sold', label: 'Sold / Archived', count: counts.sold },
            { id: 'draft', label: 'Drafts', count: counts.draft },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id
                  ? 'text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 text-[9px] rounded-full font-mono ${
                activeTab === tab.id ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name, ID, ref..."
            className="w-full bg-white border border-stone-200 rounded-sm pl-9 pr-3 py-2 text-xs font-serif text-stone-800 placeholder:italic focus:outline-none focus:border-stone-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Listings Table */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-xs overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead className="bg-[#f5f4ed]">
              <tr className="border-b border-stone-200">
                <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">Property</th>
                <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">Lifecycle Status</th>
                <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">Registry Status</th>
                <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">List Price</th>
                <th className="py-4 px-6 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-stone-600 divide-y divide-stone-200/60">
              {paginatedListings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center font-serif italic text-stone-400">
                    No properties match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedListings.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fbf9f4] transition-colors">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-stone-900 font-bold text-sm">{item.name}</p>
                            {item.isDemo && (
                              <span className="bg-stone-100 text-stone-500 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-xs border border-stone-200">
                                Demo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 italic font-serif">
                            {item.city} · ID: <span className="font-mono">{item.id}</span>
                            {item.propertyRef && (
                              <span className="ml-2 font-mono text-stone-400">({item.propertyRef})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 px-6">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                        item.status === 'Exclusive' ? 'bg-[#bedafd]/30 text-[#1d3a56]' :
                        item.status === 'Sold' ? 'bg-stone-900 text-white' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-5 px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.registrationPending ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-sm text-[9px] font-sans font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Registration pending
                          </span>
                        ) : item.blockchainPropertyId ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            On-Chain #{item.blockchainPropertyId}
                          </span>
                        ) : (
                          <span className="bg-stone-50 text-stone-500 border border-stone-200 px-2 py-0.5 rounded-sm text-[9px] font-sans font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
                            Off-chain
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-5 px-6">
                      <p className="font-serif italic text-stone-900 font-medium">{item.price}</p>
                    </td>

                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setSelectedProperty(item); setIsViewModalOpen(true); }}
                          className="text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => { setSelectedProperty(item); setIsEditModalOpen(true); }}
                          className="text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 hover:underline"
                        >
                          Edit
                        </button>

                        {/* Mark as Sold or Relist Action */}
                        {item.status !== 'Sold' ? (
                          <button
                            onClick={() => { setPropertyToSell(item); setIsSoldModalOpen(true); }}
                            className="bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider border border-stone-300 transition-colors"
                          >
                            Mark as Sold
                          </button>
                        ) : (
                          <button
                            onClick={() => { setPropertyToRelist(item); setIsRelistModalOpen(true); }}
                            className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider border border-emerald-300 transition-colors"
                          >
                            Relist
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Admin Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#fbf9f4] border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <span className="text-stone-500 font-sans">
              Showing {(validPage - 1) * ADMIN_PAGE_SIZE + 1}–{Math.min(validPage * ADMIN_PAGE_SIZE, filteredListings.length)} of {filteredListings.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${
                  validPage <= 1 ? 'text-stone-300 cursor-not-allowed' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                Prev
              </button>
              <span className="font-mono text-xs px-2 text-stone-600">
                {validPage} / {totalPages}
              </span>
              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${
                  validPage >= totalPages ? 'text-stone-300 cursor-not-allowed' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo Properties Bulk Management Panel */}
      <div className="bg-[#f5f4ed] border border-stone-200 rounded-sm p-6 mb-12 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-serif italic text-stone-900 font-bold">Bulk Demo Data & Sepolia Testing Tools</h3>
            <p className="text-xs text-stone-600 font-sans mt-1">
              Synthetic luxury property catalog for performance testing (1,000 items) and Sepolia testnet registrations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handlePrepareDemoImport(true)}
              className="bg-white border border-stone-300 text-stone-800 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm hover:bg-stone-100 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Dry Run Review
            </button>
            <button
              onClick={() => handlePrepareDemoImport(false)}
              disabled={isImporting}
              className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm hover:bg-stone-800 transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {isImporting ? 'Importing…' : 'Import 1,000 Properties'}
            </button>
            {counts.demo > 0 && (
              <button
                onClick={handleClearDemos}
                className="text-stone-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Clear Demo Data ({counts.demo})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-stone-900 text-white px-6 py-4 rounded-sm shadow-xl z-50 flex items-center gap-3 animate-[fade-in_0.3s_ease-out]">
          <span className="material-symbols-outlined text-[18px] text-[#bedafd]">check_circle</span>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
            {toastMessage}
          </p>
        </div>
      )}

      {/* ── Modal: Mark as Sold Confirmation ── */}
      {isSoldModalOpen && propertyToSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => setIsSoldModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-300 w-full max-w-lg rounded-sm shadow-2xl p-8">
            <div className="flex items-center gap-2 text-stone-900 mb-2">
              <span className="material-symbols-outlined text-2xl">verified</span>
              <h2 className="text-2xl font-serif italic font-bold">Mark Property as Sold</h2>
            </div>
            <p className="text-xs text-stone-500 font-sans mb-6">
              Confirm closing this transaction and archiving the listing from public catalogues.
            </p>

            <div className="bg-white border border-stone-200 rounded-sm p-4 space-y-3 mb-6 text-xs font-sans">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">Property Name</span>
                <span className="font-bold text-stone-900 text-right">{propertyToSell.name}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">Website Listing ID</span>
                <span className="font-mono text-stone-800">{propertyToSell.id}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">Blockchain Status</span>
                {propertyToSell.blockchainPropertyId ? (
                  <span className="font-mono text-emerald-800 font-bold">
                    Registered On-Chain #{propertyToSell.blockchainPropertyId}
                  </span>
                ) : (
                  <span className="text-stone-500">Off-chain listing</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">List Price</span>
                <span className="font-serif italic text-stone-900">{propertyToSell.price}</span>
              </div>
            </div>

            {/* Crucial lifecycle & blockchain distinction notice */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-sm text-[11px] text-amber-900 font-sans space-y-2 mb-6">
              <p className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-700">info</span>
                Listing Lifecycle & Blockchain Provenance Notice:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-amber-800 leading-relaxed text-[11px]">
                <li>This property will be immediately removed from the active Homepage and Explore Properties listings.</li>
                <li>The property record and document integrity verification remain permanently preserved in the Sold / Archived section.</li>
                <li>
                  <strong>Blockchain Integrity:</strong> This action will NOT alter or invalidate the smart contract registration. Title deed ownership and document hash provenance remain immutable on Sepolia. (To record a new on-chain owner, use the separate Ownership Transfer workflow).
                </li>
              </ul>
            </div>

            <div className="flex justify-end items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsSoldModalOpen(false)}
                className="px-5 py-2.5 text-stone-500 text-[10px] font-bold uppercase tracking-widest hover:text-stone-900 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm hover:bg-stone-800 transition-colors shadow-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Confirm Mark as Sold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Relist Property Confirmation ── */}
      {isRelistModalOpen && propertyToRelist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => setIsRelistModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-300 w-full max-w-md rounded-sm shadow-2xl p-8">
            <h2 className="text-2xl font-serif italic font-bold text-stone-900 mb-2">Relist Property</h2>
            <p className="text-xs text-stone-500 font-sans mb-6">
              Restore this archived property back to the active public catalog.
            </p>
            <p className="text-sm font-sans text-stone-700 mb-6">
              Are you sure you want to relist <strong className="font-bold text-stone-900">"{propertyToRelist.name}"</strong> (ID: {propertyToRelist.id}) as an active Exclusive property?
            </p>
            <div className="flex justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => setIsRelistModalOpen(false)}
                className="px-4 py-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRelist}
                className="bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm hover:bg-emerald-800 transition-colors"
              >
                Confirm Relisting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Demo Data Import & Dry Run Report ── */}
      {isImportModalOpen && importReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-300 w-full max-w-lg rounded-sm shadow-2xl p-8">
            <h2 className="text-2xl font-serif italic font-bold text-stone-900 mb-2">
              {importReport.dryRun ? 'Demo Data Dry-Run Report' : 'Demo Data Import Summary'}
            </h2>
            <p className="text-xs text-stone-500 font-sans mb-6">
              Safe, non-destructive import review using existing schema and duplicate prevention.
            </p>

            <div className="bg-white border border-stone-200 rounded-sm p-5 space-y-3 mb-6 font-sans text-xs">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Candidate Records Evaluated</span>
                <span className="font-mono font-bold text-stone-900">{importReport.totalCandidate}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">New Records to Import</span>
                <span className="font-mono font-bold text-emerald-700">+{importReport.willCreate}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Duplicate IDs / References Skipped</span>
                <span className="font-mono font-bold text-stone-500">{importReport.duplicatesSkipped}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Current Total Listings</span>
                <span className="font-mono text-stone-700">{importReport.currentTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Projected Portfolio Total</span>
                <span className="font-mono font-bold text-stone-900">{importReport.projectedTotal}</span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest hover:text-stone-900"
              >
                Close
              </button>
              {importReport.dryRun && importReport.willCreate > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    handlePrepareDemoImport(false);
                  }}
                  className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Proceed with Safe Import ({importReport.willCreate} listings)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: View Listing ── */}
      {isViewModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-200 w-full max-w-md rounded-sm shadow-xl p-8">
            <h2 className="text-3xl font-serif italic text-stone-900 mb-2">{selectedProperty.name}</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedProperty.city} · Website ID: {selectedProperty.id}
            </p>
            <div className="space-y-4 mb-8">
              <div className="py-3 border-b border-stone-200 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>Status</span>
                <span className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                  selectedProperty.status === 'Exclusive' ? 'bg-[#bedafd]/30 text-[#1d3a56]' :
                  selectedProperty.status === 'Sold' ? 'bg-stone-900 text-white' :
                  'bg-stone-100 text-stone-500'
                }`}>
                  {selectedProperty.status}
                </span>
              </div>
              <div className="py-3 border-b border-stone-200 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>List Price</span>
                <span className="font-serif italic text-stone-900">{selectedProperty.price}</span>
              </div>
              {selectedProperty.blockchainPropertyId ? (
                <>
                  <div className="py-3 border-b border-stone-200 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>On-Chain Property ID</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                      #{selectedProperty.blockchainPropertyId}
                    </span>
                  </div>
                  {selectedProperty.blockchainTxHash && (
                    <div className="py-3 border-b border-stone-200">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Transaction Hash</span>
                      <a
                        href={`${SEPOLIA_EXPLORER}/tx/${selectedProperty.blockchainTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono underline text-stone-700 break-all hover:text-stone-900 block"
                      >
                        {selectedProperty.blockchainTxHash} ↗
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-3 border-b border-stone-200 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>Registry Status</span>
                  <span className="font-sans text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-sm">
                    Off-chain
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2">
              <Link
                to={`/property/${selectedProperty.id}`}
                className="text-[10px] uppercase font-bold tracking-widest text-stone-900 underline"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Open Property Page ↗
              </Link>
              <button onClick={() => setIsViewModalOpen(false)} className="text-[10px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Listing ── */}
      {isEditModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-200 w-full max-w-lg rounded-sm shadow-xl p-8">
            <h2 className="text-2xl font-serif italic text-stone-900 mb-6 border-b border-stone-200 pb-4">Edit Listing Details</h2>
            
            <form className="space-y-5" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Property Name</label>
                <input name="name" defaultValue={selectedProperty.name} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900" type="text" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Location</label>
                <input name="city" defaultValue={selectedProperty.city} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900" type="text" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>List Price</label>
                  <input name="price" defaultValue={selectedProperty.price} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900" type="text" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Status</label>
                  <select name="status" defaultValue={selectedProperty.status} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900 appearance-none">
                    <option value="Draft">Draft</option>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-stone-200 flex justify-end gap-6 items-center">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-[10px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Cancel
                </button>
                <button type="submit" className="bg-stone-900 text-white font-bold text-[10px] uppercase tracking-widest py-3 px-8 rounded-sm hover:bg-stone-800 transition-colors shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick link banner to Dedicated Blockchain Console */}
      <div className="bg-[#f5f4ed] border border-stone-200 rounded-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-serif italic text-base text-stone-900 font-bold">Ethereum Sepolia Blockchain Console</h4>
          <p className="text-xs text-stone-600 font-sans mt-0.5">
            Looking to verify document hashes, manage registry statuses, check faucet balances, or register title deeds?
          </p>
        </div>
        <Link
          to="/admin/blockchain"
          className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-sm hover:bg-stone-800 transition-colors shadow-xs flex items-center gap-2 whitespace-nowrap"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <span className="material-symbols-outlined text-sm">token</span>
          Open Blockchain Console ↗
        </Link>
      </div>
    </div>
  );
}
