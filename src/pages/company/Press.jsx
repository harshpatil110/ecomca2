export default function Press() {
  return (
    <div className="pt-24 pb-32 px-8 max-w-screen-xl mx-auto min-h-screen">
      <div className="mb-24 text-center">
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-stone-400 mb-4 block" style={{ fontFamily: 'Inter, sans-serif' }}>Media Relations</span>
        <h1 className="text-5xl md:text-7xl font-serif italic text-stone-900">Press & Media</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        {/* Press Releases */}
        <div>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-10 border-b border-stone-200 pb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Recent Releases</h2>
          <div className="space-y-8">
            {[
              { date: 'Oct 14, 2025', title: 'Lumina Realty Announces Record-Breaking Sale of "The Monolith House"' },
              { date: 'Sep 02, 2025', title: 'Expanding Operations: New Presence in Greenwich and The Hamptons' },
              { date: 'Jul 18, 2025', title: 'The Architectural Digest Feature: Brutalism in Modern Luxury' },
              { date: 'May 04, 2025', title: 'Annual Market Report: Assessing the Shift Toward Sanctuary Architecture' },
            ].map((release, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{release.date}</p>
                <h3 className="text-xl font-serif text-stone-800 group-hover:text-stone-500 transition-colors">{release.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Media Assets */}
        <div>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-10 border-b border-stone-200 pb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Media Assets</h2>
          <div className="bg-[#f5f4ed] p-10 rounded-sm">
            <h3 className="text-2xl font-serif italic text-stone-900 mb-4">Brand Guidelines</h3>
            <p className="text-stone-600 font-serif mb-8 leading-relaxed">
              For journalists and editorial partners. Download our official brand kit, including high-resolution logomarks, typography guidelines, and approved executive portraiture.
            </p>
            <button className="bg-stone-900 text-white font-bold text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-sm hover:bg-stone-800 transition-colors flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Download Brand Kit 
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </div>
          
          <div className="mt-12 text-sm text-stone-500 font-serif leading-relaxed">
            <p>For all press inquiries, secure interviews, or to request high-resolution property photography, please contact:</p>
            <p className="mt-4 font-bold text-stone-900 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>press@luminarealty.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
