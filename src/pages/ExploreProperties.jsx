import { Link } from 'react-router-dom';

const listings = [
  { price: '$8,450,000', name: 'The Obsidian Pavilion', location: 'Desert Palisades, Palm Springs', badge: 'Featured', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCqQtIg6x38npE2spSNAyEz9_RinQzDpvTvHGAS7BisN1y9XCu86GKpwaQJe3EnjavDkyly6dzDthkAePDHUjMVazfq3itbeWvHblsNsa3kt8XNhFdGyi8jl7kxcTcN2nziXBip5pjGgRiaoiBrTEWC-FDzSqnZKBF15dvJzsfAqKc2h8JhqvUWO16nGMuJ4yS9D1AmqiobYjTt4PjeYy6sDJk304CYDRxRwyj6jVjZ9F1YcQJ4h9e4FHYCiXaaiFjsHvQT5lPJERz' },
  { price: '$12,000,000', name: 'Azure Heights Residence', location: 'St. Jean Cap Ferrat, France', badge: null, src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSDWSZGLol_IXolb6tzkprtkxgCKvpqBX7F6ES1k1weqMgCkOjYP7XDtK_lL2VY111JchcMFr3Soh1cMVeJT_L_B8WqqqMgiXFoRdNrUthu-edtyL0Rs4cjdyHtH59kuNF4rpmRVnBcM0OdmNwYybvHVS1BfCkL88AliWtQ0o1rVWR-5_oM4ZF88eUVkClYS4etobu2QAD_HQWsFhlc5iazMJhAWkyxY-ln84QjI1TGTB8dGgOzxgAPBuNAk0JUo2Ohtz1pQptV656' },
  { price: '$4,200,000', name: 'The Nordic Silence', location: 'Stockholm Archipelago, Sweden', badge: null, src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhNaVP0QJX0_SlG9ZhLsVzLXYgWdAsLKxJNp1iFmhmV6TG3Clq_5JxDbhDwjp41OqGjoNZ4xK-SEuq42eD0oY8AXtL4yVHwxQpwUASsItK5sDWQ5wdaIeScPlIekMZGtOff6AlEhqZYjweQWszkdL982YX_WjxRt2t21urGAUCXAlUDRlvfApdj8pGRZq_4qqI7xQIHaJiQIG8fUppNLpvR1VJ4CtRKe8kPMlht_XB3MMjiSvY9SRJqN-rfXeIf1M3HPfWkMyLvnlR' },
  { price: '$6,800,000', name: 'Monolith House', location: 'Silver Lake, Los Angeles', badge: null, src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAelplPYJfIDyV1AmvwuK401zq7R0UEdf2PvpdaHW9ooulBq6fNCwhCH1FoY4JdfgFOc12_e7Ia5FvOnXGXa6bJ6kPb3YIqzHB7WL_PBlnoG1I6H5wlWS_RJ7ACZCZqJXHxT1DhbKW34fjtlHwINXOhXm4h6AWbGdkbSBfK57q6jhD7RzGi2hDPNBj2f0Ppp9jpwL7Uj-ArOW2UKyGzHbIxU_aNwVgqp7yk4iWOMm7EC8qAKQXdDdBURUWXZU8bJmA8-t4BSL9-7U' },
  { price: '$9,100,000', name: 'The Haussmann Loft', location: 'Le Marais, Paris', badge: null, src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGdQtEylZsq44D8qFzqBcvCpl3KV16CvG5buqkr3Ab1Dd1zH-afhMdz0qbhS-L1ILNBcxIKr1-YPtM2JWUeNvYKWne7UvtnChlU1CIyXZ0xdFc8x5fWvNQIAPEUvwIMbrCZBmt0F9YBrrHnflCyEry1KSfQ56brvPg3OMK4OZOcIU1Leajb7Z6qKZu91yWL-gLh3bnIk5IqgpN56JHIEk8m7_KwSUyy2FbGZyXsJtneTfGNCP_lWwlz4SaNO28soyl3QPQPGbuPe5U' },
  { price: '$5,500,000', name: 'Earthen Haven', location: 'Byron Bay, Australia', badge: null, src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB1581KlXSEeJJZ71IzrdIzf2VgmS7r8JNUZXf-wngB7AMSKS4sb0GfoRr1EhBQHWMX0gam7MUHzpFXV9HD24pjBNnTYGcIwQqSjuzV1diS1HMLYppU87JlzePawxxq5qkehUEybPf2SloPJjhB4waFXH7ruiFk0ZVeKIY-wKSvvHmSpCGBv3WghTLgFy-HW0hZkhtZl4xdOjsJ5L2raACnCN2jwKLmWthuQzbo79RacPTi3yTsxKUrNDAvJDxtlr4HVr0HkC-cWvX' },
];

export default function ExploreProperties() {
  return (
    <div className="bg-[#fbf9f4] text-[#31332c]">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
        {/* Editorial Header */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-none mb-4 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            The Search
          </h1>
          <p className="text-xl italic text-stone-500 max-w-xl">
            Curated residential masterworks across the globe's most storied architectural neighborhoods.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* ── Sidebar Filters ── */}
          <aside className="md:w-1/4">
            <div className="sticky top-24 p-8 bg-[#F7F5F0] rounded-sm">
              <div className="space-y-10">
                <div>
                  <h3 className="text-[10px] font-black tracking-widest text-stone-900 uppercase mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Availability</h3>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Sale</button>
                    <button className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-stone-300 text-stone-500 rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Rent</button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-4">
                    <h3 className="text-[10px] font-black tracking-widest text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Price Range</h3>
                    <span className="text-[10px] font-bold text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>$2.5M - $18M</span>
                  </div>
                  <input className="w-full h-1 bg-stone-300 appearance-none rounded-full accent-stone-900 cursor-pointer" type="range" />
                </div>

                <div>
                  <h3 className="text-[10px] font-black tracking-widest text-stone-900 uppercase mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Architectural Features</h3>
                  <div className="space-y-3">
                    {['Mid-Century', 'Brutalist Elements', 'Skylights', 'Courtyard'].map((f) => (
                      <label key={f} className="flex items-center gap-3 cursor-pointer group">
                        <input className="w-4 h-4 rounded-sm border-stone-300 accent-stone-900 focus:ring-0" type="checkbox" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-stone-900 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>{f}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button className="w-full py-4 bg-stone-900 text-white text-[10px] font-black tracking-widest uppercase rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </aside>

          {/* ── Listings Grid ── */}
          <div className="md:w-3/4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
              {listings.map(({ price, name, location, badge, src }) => (
                <div key={name} className="group flex flex-col">
                  <div className="aspect-[4/5] overflow-hidden bg-[#f5f4ed] rounded-sm mb-6 relative">
                    <img
                      className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-700"
                      src={src}
                      alt={name}
                    />
                    {badge && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[8px] font-black tracking-[0.2em] uppercase rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{badge}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{price}</p>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{name}</h2>
                    <p className="italic text-stone-500 text-sm mb-4">{location}</p>
                    <Link
                      to="/property"
                      className="inline-block text-[10px] font-black uppercase tracking-widest border border-stone-300 px-6 py-2.5 rounded-sm hover:bg-stone-900 hover:text-white transition-all duration-300"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-24 flex items-center justify-between pt-8 border-t border-stone-200/50">
              <button className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 cursor-not-allowed" style={{ fontFamily: 'Inter, sans-serif' }}>Previous</button>
              <div className="flex gap-8">
                {['01', '02', '03', '...', '12'].map((p) => (
                  <span key={p} className={`text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-colors ${p === '01' ? 'text-stone-900 border-b border-stone-900' : 'text-stone-400 hover:text-stone-900'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{p}</span>
                ))}
              </div>
              <button className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900 hover:translate-x-1 transition-transform" style={{ fontFamily: 'Inter, sans-serif' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
