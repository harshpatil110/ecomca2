export default function HelpSupportAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
          Help & Support
        </h1>
        <p className="text-lg font-serif italic text-stone-500 mt-2">
          Documentation and guides for administrative users.
        </p>
      </div>

      <div className="mb-16 relative shadow-sm">
        <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">search</span>
        <input 
          type="text" 
          placeholder="Search Documentation..." 
          className="w-full pl-16 pr-6 py-5 bg-white border border-stone-200 rounded-sm text-sm font-bold placeholder:font-normal focus:outline-none focus:border-stone-400 transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      <div className="space-y-4 mb-20">
        <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Frequently Asked Questions</h2>
        
        {[
          { q: 'How to add a new listing to the portfolio', a: 'Navigate to the Listings Manager via the sidebar and click "+ Draft New Listing". Ensure you have high-resolution photography ready.' },
          { q: 'Understanding the CRM Lead Score', a: 'The Lead Score ranges from 0-100 and aggregates buying intent based on newsletter interactions, tour completions, and logged phone calls.' },
          { q: 'Generating monthly revenue reports', a: 'Go to the Revenue tab and select "Export CSV" from the top action menu. The file will include aggregate splits and transaction histories.' },
        ].map((faq, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 group cursor-pointer hover:border-stone-300 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>{faq.q}</h3>
              <span className="material-symbols-outlined text-stone-400 transition-transform group-hover:translate-x-1">arrow_forward</span>
            </div>
            <p className="text-sm font-serif italic text-stone-500 leading-relaxed max-w-2xl">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center border-t border-stone-200 pt-12">
        <button className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors border-b-2 border-transparent hover:border-stone-900 pb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Contact IT Support
        </button>
      </div>
    </div>
  );
}
