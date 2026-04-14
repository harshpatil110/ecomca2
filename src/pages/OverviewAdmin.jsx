import { Link } from 'react-router-dom';

export default function OverviewAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
          Overview Dashboard
        </h1>
        <p className="text-lg font-serif italic text-stone-500 mt-2">
          High-level executive summary of firm operations.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Total Revenue (Mtd)', value: '$12.4M', change: '+14%' },
          { label: 'Active Exclusive Listings', value: '42', change: '+2' },
          { label: 'New Client Inquiries', value: '128', change: '+22%' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm flex flex-col">
            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{kpi.label}</p>
            <div className="mt-auto flex items-end justify-between">
              <span className="text-4xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{kpi.value}</span>
              <span className="text-xs font-bold text-[#46617f] bg-[#bedafd]/20 px-2 py-1 rounded-sm">{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-stone-200 pt-12">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Recent Activity Feed</h2>
          <div className="space-y-4">
            {[
              { time: '10:42 AM', title: 'New tour requested for The Monolith House', initials: 'TF' },
              { time: '09:15 AM', title: 'Listing contract finalized for Hollywood Hills Estate', initials: 'ES' },
              { time: 'Yesterday', title: 'Client dossier updated for Alexander Pierce', initials: 'SYS' },
            ].map((feed, i) => (
              <div key={i} className="bg-white p-6 border border-stone-200 rounded-sm shadow-sm flex items-center gap-6">
                <div className="w-10 h-10 bg-[#f5f4ed] rounded-full flex items-center justify-center text-[10px] font-bold text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {feed.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{feed.title}</p>
                  <p className="text-xs italic text-stone-400 font-serif">{feed.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link to="/admin/listings/new" className="bg-stone-900 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-sm hover:bg-stone-800 transition-colors w-full text-left px-6 shadow-sm flex justify-between items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Draft New Listing</span>
              <span className="material-symbols-outlined text-sm">add</span>
            </Link>
            <button className="bg-white text-stone-900 border border-stone-200 font-bold text-xs uppercase tracking-widest py-4 rounded-sm hover:bg-[#f5f4ed] transition-colors w-full text-left px-6 shadow-sm flex justify-between items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Generate Market Report</span>
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
            <button className="bg-white text-stone-900 border border-stone-200 font-bold text-xs uppercase tracking-widest py-4 rounded-sm hover:bg-[#f5f4ed] transition-colors w-full text-left px-6 shadow-sm flex justify-between items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Review Urgent Flags</span>
              <span className="material-symbols-outlined text-sm text-[#9e422c]">flag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
