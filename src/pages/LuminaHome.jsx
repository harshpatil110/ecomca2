import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroVideo from '../assets/landing video.mp4';
import { getListings, subscribeToListings } from '../services/listingsStore';

export default function LuminaHome() {
  const navigate = useNavigate();
  const [listings, setListings] = useState(() => getListings());

  const [visibleLimit, setVisibleLimit] = useState(6);

  useEffect(() => {
    const unsubscribe = subscribeToListings((updated) => setListings(updated));
    return unsubscribe;
  }, []);

  // Filter out drafts and sold listings from public active homepage display
  const displayListings = listings.filter((l) => l.status !== 'Draft' && l.status !== 'Sold');
  const pagedListings = displayListings.slice(0, visibleLimit);

  return (
    <div className="font-body text-on-surface">
      {/* ── Hero Section ── */}
      <section className="relative h-[870px] w-full overflow-hidden flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10"
          src={heroVideo}
        />
        {/* Hero Search Overlay */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-8 mb-16">
          <div className="bg-white/95 backdrop-blur-sm p-2 flex flex-col md:flex-row items-stretch gap-2 shadow-sm rounded-sm">
            <div className="flex-1 flex flex-col px-6 py-4 justify-center">
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Location</label>
              <input className="bg-transparent border-none p-0 focus:ring-0 text-stone-900 placeholder:text-stone-300 text-lg" placeholder="Where would you like to live?" type="text" />
            </div>
            <div className="md:w-px bg-stone-100 hidden md:block my-4" />
            <div className="flex-1 flex flex-col px-6 py-4 justify-center">
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Type</label>
              <select className="bg-transparent border-none p-0 focus:ring-0 text-stone-900 appearance-none cursor-pointer text-lg">
                <option>Residential</option>
                <option>Commercial</option>
                <option>Historical</option>
              </select>
            </div>
            <div className="md:w-px bg-stone-100 hidden md:block my-4" />
            <div className="flex-1 flex flex-col px-6 py-4 justify-center">
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Price Range</label>
              <input className="bg-transparent border-none p-0 focus:ring-0 text-stone-900 placeholder:text-stone-300 text-lg" placeholder="Any Price" type="text" />
            </div>
            <button onClick={() => navigate('/explore')} className="bg-[#31332c] text-white px-12 py-6 font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-800 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="py-32 px-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-4 block" style={{ fontFamily: 'Inter, sans-serif' }}>Volume 04</span>
            <h2 className="text-7xl md:text-8xl font-black tracking-[-0.04em] text-[#31332c] uppercase leading-[0.9]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Lumina<br />Portfolio
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-serif italic text-stone-500 mb-2">
              {displayListings.length} Curated Architectural Masterpieces
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-600 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Explore Full Collection ↗
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pagedListings.map((item, i) => (
            <div
              key={item.id}
              onClick={() => navigate(`/property/${item.id}`)}
              className={`group cursor-pointer ${i % 3 === 1 ? 'md:translate-y-12' : ''}`}
            >
              <div className="aspect-[4/5] overflow-hidden mb-6 relative bg-stone-100 border border-stone-200">
                <img
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={item.src || '/brutalist_exterior.png'}
                  loading="lazy"
                />
                {item.registrationPending ? (
                  <div className="absolute top-4 left-4 bg-amber-500 text-white py-1 px-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Registration pending
                  </div>
                ) : item.blockchainPropertyId ? (
                  <div className="absolute top-4 left-4 bg-stone-900 text-white py-1 px-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Blockchain registered #{item.blockchainPropertyId}
                  </div>
                ) : (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-stone-600 py-1 px-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-stone-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                    Off-chain
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white py-1 px-3 text-[10px] font-bold uppercase tracking-widest shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.badge || item.status || 'Available'}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tight text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.price}
                </h3>
                <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.name}
                </h4>
                <p className="text-lg text-stone-500 italic">{item.location}</p>
              </div>
            </div>
          ))}
        </div>

        {displayListings.length > visibleLimit && (
          <div className="mt-24 text-center">
            <button
              onClick={() => setVisibleLimit((prev) => Math.min(prev + 6, displayListings.length))}
              className="bg-stone-900 text-white px-10 py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-800 transition-colors shadow-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Load More Residences ({pagedListings.length} of {displayListings.length} shown)
            </button>
          </div>
        )}
      </section>

      {/* ── Value Prop ── */}
      <section className="bg-[#f5f4ed] py-32 mt-32">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="max-w-3xl mb-24">
            <h2 className="text-5xl md:text-6xl italic text-[#31332c] leading-tight mb-8">
              A New Standard in <br />Direct Real Estate
            </h2>
            <p className="text-xl text-stone-500 leading-relaxed max-w-xl">
              We don't just sell property; we curate environments. Lumina Realty combines architectural historical context with modern investment strategy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { icon: 'verified_user', title: 'Trust', body: 'A lineage of discretion and fiduciary excellence that defines our direct-to-consumer model.' },
              { icon: 'stars', title: 'Exclusivity', body: "Direct access to our owned architectural portfolio that never reaches public portals." },
              { icon: 'support_agent', title: 'Concierge', body: 'Comprehensive in-house service from initial inquiry to final interior staging and move-in.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="space-y-6 border-l border-stone-200 pl-10">
                <span className="material-symbols-outlined text-4xl text-stone-900">{icon}</span>
                <h4 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</h4>
                <p className="text-lg text-stone-500 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journal Section ── */}
      <section className="py-40 px-8 max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
        <div className="relative">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#bedafd]/20 -z-10" />
          <img
            alt="Editorial architectural abstract focusing on brutalist geometry"
            className="w-full aspect-[3/4] object-cover grayscale border border-stone-200"
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
          />
        </div>
        <div className="space-y-12">
          <span className="text-xs uppercase tracking-[0.5em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>The Journal</span>
          <h3 className="text-6xl font-black tracking-[-0.04em] leading-none uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            Lumina <br />Perspectives
          </h3>
          <p className="text-2xl text-stone-600 italic leading-relaxed">
            "Luxury is not the presence of noise, but the absence of friction. Lumina Reality looks for homes that speak in whispers."
          </p>
          <div className="pt-8">
            <button onClick={() => navigate('/explore')} className="text-stone-900 font-bold uppercase tracking-widest text-xs border-b-2 border-stone-900 pb-2 hover:opacity-50 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
              Read the Journal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
