export default function Contact() {
  return (
    <div className="pt-24 pb-32 px-8 max-w-screen-xl mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        
        {/* Left Column: Details */}
        <div className="space-y-16">
          <div>
            <h1 className="text-5xl md:text-7xl font-serif italic text-stone-900 mb-6">Get in Touch</h1>
            <p className="text-xl text-stone-500 font-serif leading-relaxed max-w-md">
              We operate globally, connecting discerning clients with unparalleled architectural significance.
            </p>
          </div>

          <div className="space-y-10">
            <div>
              <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Headquarters</h2>
              <p className="text-lg text-stone-800 font-serif leading-relaxed">
                8820 Wilshire Boulevard<br/>
                Suite 400<br/>
                Beverly Hills, CA 90211
              </p>
            </div>
            
            <div>
              <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Direct Inquiries</h2>
              <div className="space-y-2 text-lg text-stone-800 font-serif">
                <p>Private Client: <span className="text-stone-500">inquiries@thearchive.realty</span></p>
                <p>Press & Media: <span className="text-stone-500">press@thearchive.realty</span></p>
                <p className="pt-2">Reception: <span className="text-stone-500">+1 (310) 555-0198</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white border border-stone-200 p-10 rounded-sm shadow-[0_4px_40px_rgba(0,0,0,0.02)]">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>Send an Inquiry</h2>
          <form className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">First Name</label>
                <input type="text" className="bg-transparent border-b border-stone-200 py-3 text-stone-900 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-300" placeholder="Alexander" />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Last Name</label>
                <input type="text" className="bg-transparent border-b border-stone-200 py-3 text-stone-900 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-300" placeholder="Pierce" />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Email Address</label>
              <input type="email" className="bg-transparent border-b border-stone-200 py-3 text-stone-900 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-300" placeholder="alexander@example.com" />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Subject</label>
              <input type="text" className="bg-transparent border-b border-stone-200 py-3 text-stone-900 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-300" placeholder="Private Tour Request" />
            </div>

            <div className="flex flex-col space-y-2 pt-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Message</label>
              <textarea rows="4" className="bg-transparent border-b border-stone-200 py-3 text-stone-900 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-300 resize-none" placeholder="I am interested in acquiring..."></textarea>
            </div>

            <div className="pt-6">
              <button type="submit" className="w-full bg-[#31332c] text-white font-bold text-[10px] uppercase tracking-[0.2em] py-5 rounded-sm hover:bg-stone-800 transition-colors text-center shadow-sm">
                Send Inquiry
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
