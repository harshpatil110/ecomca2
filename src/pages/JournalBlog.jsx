export default function JournalBlog() {
  return (
    <div className="pt-8 pb-24 px-8 max-w-screen-2xl mx-auto min-h-screen">
      <div className="mb-12">
        <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] text-[#31332c] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          JOURNAL.
        </h1>
        <p className="text-2xl font-serif italic text-stone-500">
          Editorial perspectives on architecture and design.
        </p>
      </div>

      {/* Hero Article */}
      <div className="mb-20 group cursor-pointer">
        <div className="w-full h-[600px] overflow-hidden rounded-sm mb-6 relative bg-stone-200">
          <img
            alt="Monolithic Architecture"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1600"
          />
        </div>
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Design Architecture • Oct 12, 2024
          </p>
          <h2 className="text-4xl md:text-5xl italic font-serif text-[#31332c] mb-4 leading-tight group-hover:text-stone-600 transition-colors">
            The Rise of Monolithic Architecture
          </h2>
          <p className="text-lg text-stone-600 leading-relaxed font-serif flex-1">
            A deep dive into why high-net-worth individuals are moving away from glass boxes and seeking sanctuary in poured concrete, rough-hewn stone, and brutalist privacy.
          </p>
        </div>
      </div>

      <div className="h-px bg-stone-200/60 mb-20"></div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          {
            title: "Reimagining the Mid-Century Modern",
            category: "Heritage",
            date: "Sep 28, 2024",
            img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800"
          },
          {
            title: "The Art of Curated Scarcity in Real Estate",
            category: "Market Trends",
            date: "Sep 15, 2024",
            img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800"
          },
          {
            title: "Integrating the Environment into the Home",
            category: "Sustainability",
            date: "Aug 30, 2024",
            img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
          }
        ].map((article, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="w-full h-80 overflow-hidden rounded-sm mb-6 bg-stone-200">
              <img
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={article.img}
              />
            </div>
            <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {article.category} • {article.date}
            </p>
            <h3 className="text-2xl italic font-serif text-[#31332c] leading-snug group-hover:text-stone-600 transition-colors">
              {article.title}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}
