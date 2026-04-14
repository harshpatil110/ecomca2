export default function PropertyDetail() {
  return (
    <div className="max-w-screen-2xl mx-auto px-8 pt-8 pb-24">
      {/* Masonry Gallery */}
      <div className="grid grid-cols-12 gap-1 mb-16 h-[716px]">
        <div className="col-span-8 h-full relative overflow-hidden rounded-sm group">
          <img
            alt="Exterior view of a brutalist concrete home"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFIn_NWb7FobIOQ93W_cM54Ywj8gREhKloRCe-eBvNzDKfA9Zgo3uRx1Bk0lusQEVLeYm_YArHCmdwtIg6UKHsJmaGISbJBiO3W7YQT0EwYwfu5hNZRFamkUJqa7wZzy1jg-CQR0nYhgfOrqeVi8WYguVqsMkhN6Punylp8URlu_vHvGjJ5xlYkvhFUjVXJeFlMIOp-CqXmrphTaqsVF9bZW2xx7ymrXKRCw1yIM7qH91MXAInAT9WZ3F-e9M_pLN8j-gD0BsKt9m3"
          />
          <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors"></div>
        </div>
        <div className="col-span-4 grid grid-rows-2 gap-1 h-full">
          <div className="relative overflow-hidden rounded-sm group">
            <img
              alt="High-end minimalist living room"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCetlhiHlIVMdbzVOXO8TUqpSpSjuoMPWOspsVlR2_omTaiPuZY6nRGBkjeq3KZRXycJTXNmb1vnT1O_-Bn4q5VIvPvo9WCBVV1XqtUETOBPTRzhrHkCd3qjTlMMB3Ot0Lag1FHznnqhfkIwBvXTHEIrYOI4a5Gj3zABmwnSgIXYFtzL390QfvY2Dh_chQ7UnaXjoJPcsGmwcrDGrorklUwzAwBrOY2w8AoBxgmMJ1T2MiBR4lDeSZW_e224CkhFW6LKXWW3PgtLrAR"
            />
          </div>
          <div className="relative overflow-hidden rounded-sm group">
            <img
              alt="Close-up of architectural detail"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuASZby2BFZiVR90ys7lubMwH9bLnwRYfdwi-80RJSyBacnmm0ejaVu4Fq21iWVURclq9vqFCl1-f_Nx9kqIG0JdHTb2IXLAFJZTzT0IZ9G7rYx91gp6PAPakrR4XTiHXjfZacjHTC1O272wkYcnPBNAszU8dPtL5LO3du_gfLRLWzqK-SaTPL0cc-nNsBF0sveZHY7ILpRuDpFvwpjdDH8CbRCnrlAApnK2OhG0mJ77MnUuz8oHxKujjgIfssqNm_X0h9U0XgH5-eY2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Main Content (70%) */}
        <div className="lg:w-[70%]">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-[#bedafd] text-[#1d3a56] text-[10px] font-black tracking-widest px-2 py-1 uppercase rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Featured Listing
              </span>
              <span className="text-stone-400 text-[11px] uppercase tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Silver Lake, Los Angeles
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] text-[#31332c] mb-6 leading-[0.9]" style={{ fontFamily: 'Inter, sans-serif' }}>
              THE MONOLITH HOUSE
            </h1>
            <p className="text-4xl font-serif italic text-[#625d5b] leading-none">
              $4,850,000
            </p>
          </div>
          <div className="max-w-2xl">
            <p className="text-xl leading-[1.8] text-[#5e6058] font-serif mb-12 italic">
              A rigorous exploration of volume and light, The Monolith House stands as a definitive statement in contemporary California modernism. Designed in 2022, the residence utilizes cast-in-place concrete and reclaimed white oak to create a sanctuary that is both imposing and deeply serene.
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="mt-16 border-t border-stone-200/60 pt-12">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-400 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>Key Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12">
              {[
                { label: 'Bedrooms', value: '04' },
                { label: 'Bathrooms', value: '3.5' },
                { label: 'Square Feet', value: '3,420' },
                { label: 'Lot Size', value: '0.24 AC' },
                { label: 'Built', value: '2022' },
                { label: 'Parking', value: '2 Car Port' },
                { label: 'Heating', value: 'Radiant' },
                { label: 'Views', value: 'Reservoir' },
              ].map(({ label, value }) => (
                <div key={label} className="border-t border-stone-200/30 pt-6">
                  <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
                  <p className="text-2xl font-serif italic">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar (30%) */}
        <div className="lg:w-[30%]">
          <div className="sticky top-32">
            <div className="bg-white p-8 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200/20">
              <h3 className="text-lg font-black tracking-tighter uppercase mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Schedule a Tour</h3>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Full Name</label>
                  <input className="w-full bg-[#f5f4ed] border-b-1.5 border-transparent focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif" placeholder="e.g. Julianne Moore" type="text" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Email Address</label>
                  <input className="w-full bg-[#f5f4ed] border-b-1.5 border-transparent focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif" placeholder="hello@domain.com" type="email" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Preferred Date</label>
                  <div className="relative">
                    <input className="w-full bg-[#f5f4ed] border-b-1.5 border-transparent focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif appearance-none" type="date" />
                    <span className="material-symbols-outlined absolute right-4 top-3 text-stone-400 pointer-events-none">calendar_today</span>
                  </div>
                </div>
                <button className="w-full bg-stone-900 text-white font-bold tracking-[0.2em] uppercase text-[11px] py-4 rounded-sm hover:bg-stone-800 transition-colors mt-4" type="submit" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Request Tour
                </button>
                <p className="text-[10px] text-center text-stone-400 leading-relaxed italic font-serif">A member of our team will respond within 2 hours to confirm your private viewing.</p>
              </form>
            </div>
            
            {/* Agent Card */}
            <div className="mt-8 flex items-center gap-4 px-2">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 grayscale">
                <img alt="Real estate agent" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNF7q3MVLUyoZn2_QHgHSEQb2_yQyqzQqapiY4tbXR-olEm1oBfx_8lj9wSE1t9Ww02ShuEC2EpMF0Ux44gkdKhpsO5020Z0k4mBPCYUjM27rZh0KOHLDSkGPX0mqVQFy5G77HqAAGi0UVA-J148bcPof8Yf6b0wpz15opORFkxVnc_mRV-BqCsBtWwOxfcVDAh3bHel-lWNwQh8WzPL9d6PjflpuJq9odDaE7rT3QDAvKj9WdNzD_egBM7Uv3WE77e9T4crvPPmCZ" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>Elias Sterling</p>
                <p className="text-[11px] text-stone-400 font-serif italic">Principal Architect & Broker</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
