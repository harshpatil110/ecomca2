export default function HomeTheArchive() {
  return (
    <div className="font-body text-on-surface">
      {/* ── Hero Section ── */}
      <section className="relative h-[870px] w-full overflow-hidden flex flex-col justify-end">
        <div className="absolute inset-0 bg-stone-900/10 z-10" />
        <img
          alt="Luxury Property"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAgEUdnRMZIUVGdATV8F_pYX41MfRd8StomlZTnMAesHxj-Fh8tJ2BE4oZigBND86aHreLRNm-OqN0g29ERFUG7of-qr5CPFrAI-XU070GgpGmhYviqDrhiyRO_Q2cWZThrU-I-Kq7TaKlB_0fSHBy4bsnnuy9Hnla59Py40X_q44UdT3xanPMSTL9jYxVGJD3ChaOILNOnOPCIOVMw0jBwg4hPcGf5rcmI_xo9lJPsWda7XNjazYWhOS8Mv33Uhy246AijgSAkWMz"
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
            <button className="bg-[#31332c] text-white px-12 py-6 font-bold uppercase tracking-[0.2em] text-xs hover:bg-stone-800 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="py-32 px-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Volume 04</span>
          <h2 className="text-7xl md:text-8xl font-black tracking-[-0.04em] text-[#31332c] uppercase leading-[0.9]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Curated<br />Listings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { price: '$4,250,000', location: '214 Silverlake Terrace, Los Angeles CA', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH1Ce-vUPMPBlpIw-_k35Rad2xp1V6cPc710d_XjNUkG4Y7lPrQ-ty4QRV_ac5QRibmPo1NCTqBg8wR36URtEmm6nhAbprQnP2punhtIL39L9NzUcCTBpyhILukqdzst1uZeWEo-p-fCOqmnJMu04JI-LYkaZZM5iPQbAB3_trQZuw31-pTHW7yOyeyVVWJysDAQcHnq-1OW4LAJRqczNnUFW2WkUdO47BaCJ2ZCPigkwRHR7hYImUmcJ4fpqUa3tL9BoqAfitd4aI', offset: '' },
            { price: '$2,890,000', location: 'The Glass Pavilion, Joshua Tree', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4luGE_VHpI4zIztVRJ4LY6rL9zsVXFvhP7ZCKI2_Yp2vjBhzeQaxx9zeD1DPjB0x8R3OarJjEuFPMmN1jQ8ClNoRnTJuygWyOkrKcmX74qVJIUgavQ9jF0Wmzq8mtJpU9-wO29nsGwOsB6v23HdYynT8epD4lhdeVMieDUwfn1zyYJdWdaUNJr-mbsDQ5M8OV1jB8znFBZnsEsvDg93xKBYtFPb9W8MeuDAsKnkHNH6Bph0hEXUwd4ixgrfp3X1RbJM0qcb-0vEG', offset: 'md:translate-y-12' },
            { price: '$6,100,000', location: '88 Brutalist Row, Greenwich CT', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYI2L1b40yohImGyx7WTuXlF4jA2xw4gRhJMYeHdv8kdNNxQsLWMxy95GtbQqVhSdNl2f192LI8RiMAVeRp0skZ4qKmk_zMQgfu759XbQELJQpNcdOPwUr60cbJVsFyOzQ-bpGtDTkiKXYqU7UaqFSmEacA0clhL9om_EdhI9pvlTwTL3LpDQ7_J_oFeDcEgoCbssPCpPcTheVxfPTF0daCJMcC65bEcqAMykn5enW3qoyWzwPaQ_ELZ9MSjL5Ri-sdmyUJY9f-Mc_', offset: '' },
          ].map(({ price, location, src, offset }, i) => (
            <div key={i} className={`group cursor-pointer ${offset}`}>
              <div className="aspect-[4/5] overflow-hidden mb-6 relative bg-stone-100">
                <img alt="Property" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={src} />
                {i === 0 && <div className="absolute top-4 right-4 bg-white py-1 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>Available</div>}
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{price}</h3>
                <p className="text-lg text-stone-500 italic">{location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Value Prop ── */}
      <section className="bg-[#f5f4ed] py-32 mt-32">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="max-w-3xl mb-24">
            <h2 className="text-5xl md:text-6xl italic text-[#31332c] leading-tight mb-8">
              A New Standard in <br />Real Estate
            </h2>
            <p className="text-xl text-stone-500 leading-relaxed max-w-xl">
              We don't just sell property; we curate environments. Our approach combines architectural historical context with modern investment strategy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { icon: 'verified_user', title: 'Trust', body: 'A lineage of discretion and fiduciary excellence that spans decades of high-value transactions.' },
              { icon: 'stars', title: 'Exclusivity', body: "Access to the off-market 'quiet listings' that never reach the public portals or databases." },
              { icon: 'support_agent', title: 'Support', body: 'Comprehensive concierge service from initial appraisal to final interior staging and move-in.' },
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
            alt="Architectural Abstract"
            className="w-full aspect-[3/4] object-cover grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2UXxDYHXBFLzlsMb2dRU5-wP0PAstcPPURqRpl7A3DOn-7BClyrLtjswEk0K-LtwI4sy_09gIi_THi45uxbMRzH5657j9LcMtnlX2jNZO8oh0-U2n5ENVIQIbrGV1JKWHtzMLhdjLa9hTCQBhgJvoDMeXU1AeOgZTHeYu2eVM8y-LcZ5Ix6y1PcoXQMwwNlSkkbHVl3j_9gdkozCy9XWFeSuuwYuWLaGoWX-Ku1E56icM3RN42yQ3tZaMNn3TeT4rO1aBVnq89410"
          />
        </div>
        <div className="space-y-12">
          <span className="text-xs uppercase tracking-[0.5em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>The Journal</span>
          <h3 className="text-6xl font-black tracking-[-0.04em] leading-none uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            The Silent <br />Architect
          </h3>
          <p className="text-2xl text-stone-600 italic leading-relaxed">
            "Luxury is not the presence of noise, but the absence of friction. We look for homes that speak in whispers, yet command the entire room."
          </p>
          <div className="pt-8">
            <button className="text-stone-900 font-bold uppercase tracking-widest text-xs border-b-2 border-stone-900 pb-2 hover:opacity-50 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
              Read the Journal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
