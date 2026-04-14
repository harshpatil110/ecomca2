export default function CrmStrategyAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 space-y-12">
      {/* Automated Flagging System Banner */}
      <section className="bg-stone-900 text-white p-8 rounded-sm shadow-xl flex flex-col md:flex-row items-center gap-8 border-l-8 border-[#9e422c]">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-[#fe8b70] animate-pulse">crisis_alert</span>
            <h2 className="text-xl font-black tracking-tighter uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Automated System Insights</h2>
          </div>
          <p className="text-xl leading-relaxed text-stone-300">
            <span className="text-white font-bold">CRITICAL INSIGHT:</span> Natural Language Processing of 1,240 recent user feedback forms indicates 72% of users are experiencing <span className="underline decoration-[#fe8b70] decoration-2 underline-offset-4 text-white italic">'Map Loading Errors on Mobile Safari'</span>. Flagged for Dev Team.
          </p>
        </div>
        <button className="bg-white text-stone-900 px-6 py-3 font-black tracking-tighter hover:bg-stone-200 transition-colors rounded-sm uppercase text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          Acknowledge & Route
        </button>
      </section>

      {/* ── Client Profiling & Lead Scoring ── */}
      <section className="mb-16">
        <h3 className="text-5xl font-black tracking-tighter text-stone-900 uppercase mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>Client Profiling Engine</h3>
        
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Profile Card Left */}
          <div className="md:w-1/3 bg-[#f5f4ed] p-10 border-r border-stone-200 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Active Buyer Profile</p>
              <h4 className="text-3xl italic text-stone-900 mb-8 font-serif leading-tight">Alexander Pierce</h4>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-5xl font-black tracking-tighter text-[#1d3a56]" style={{ fontFamily: 'Inter, sans-serif' }}>88</span>
                    <span className="text-xl font-black text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>/100</span>
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-[#1d3a56]" style={{ fontFamily: 'Inter, sans-serif' }}>High Intent</p>
                </div>
                
                <div className="p-4 bg-white/60 border border-stone-200/50 rounded-sm">
                  <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Scoring Methodology</p>
                  <p className="text-sm italic text-stone-600 leading-snug font-serif">
                    Calculated via engagement metrics: 4 return visits this week, 12+ minutes spent on premium listings.
                  </p>
                </div>
              </div>
            </div>
            
            <button className="mt-10 w-full py-4 border border-stone-900 text-stone-900 font-bold text-xs uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              View Full Dossier
            </button>
          </div>

          {/* Behavioral Insights Right */}
          <div className="md:w-2/3 p-10 flex flex-col justify-center">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>Behavioral Insights & Automated Actions</h5>
            
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <span className="material-symbols-outlined text-stone-300 text-3xl mt-1">visibility</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Observed Behavior</p>
                  <p className="text-lg text-stone-700 italic font-serif leading-relaxed">
                    Client frequently views Brutalist architecture and concrete homes in prime locations, specifically abandoning searches if the lot size is under 0.5 acres.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <span className="material-symbols-outlined text-[#46617f] text-3xl mt-1">auto_awesome</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#46617f] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Automated CRM Action (Triggered)</p>
                  <p className="text-lg text-stone-700 italic font-serif leading-relaxed">
                    System automatically dispatched an invite-only preview email for an unlisted concrete villa in Silver Lake, bypassing the standard waitlist.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-stone-200/60 pt-16 mt-8">
        {/* Customer Feedback Table */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-xl font-black tracking-widest text-stone-400 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Customer Feedback Engine</h4>
          <div className="bg-[#f5f4ed] rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-200/50">
                <tr style={{ fontFamily: 'Inter, sans-serif' }}>
                  <th className="px-6 py-4 font-black tracking-tighter text-stone-600 text-xs uppercase">User Name</th>
                  <th className="px-6 py-4 font-black tracking-tighter text-stone-600 text-xs uppercase">Issue Category</th>
                  <th className="px-6 py-4 font-black tracking-tighter text-stone-600 text-xs uppercase">Sentiment</th>
                  <th className="px-6 py-4 font-black tracking-tighter text-stone-600 text-xs uppercase text-right">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/40">
                {[
                  { name: 'Julian Vane', category: 'Mobile Map Rendering', sentiment: 'Negative', action: 'View Ticket', actionColor: 'text-[#625d5b]', sentimentClass: 'bg-[#fe8b70]/10 text-[#9e422c] border-[#9e422c]/20' },
                  { name: 'Eleanor Thorne', category: 'Listing Accuracy', sentiment: 'Positive', action: 'Resolved', actionColor: 'text-stone-400', sentimentClass: 'bg-[#bedafd]/20 text-[#46617f] border-[#46617f]/20' },
                  { name: 'Marcus Sterling', category: 'Mobile Safari Layout', sentiment: 'Negative', action: 'Re-assign', actionColor: 'text-[#625d5b]', sentimentClass: 'bg-[#fe8b70]/10 text-[#9e422c] border-[#9e422c]/20' },
                  { name: 'Sofia Ricci', category: 'Agent Response Time', sentiment: 'Positive', action: 'Send Survey', actionColor: 'text-[#625d5b]', sentimentClass: 'bg-[#bedafd]/20 text-[#46617f] border-[#46617f]/20' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white transition-colors">
                    <td className="px-6 py-5 font-serif text-lg">{row.name}</td>
                    <td className="px-6 py-5 font-medium text-stone-600" style={{ fontFamily: 'Inter, sans-serif' }}>{row.category}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-block px-2 py-0.5 font-bold text-[10px] uppercase rounded-sm border ${row.sentimentClass}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {row.sentiment}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className={`${row.actionColor} font-black text-xs uppercase hover:underline`} style={{ fontFamily: 'Inter, sans-serif' }}>{row.action}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Methodology Text Block */}
          <div className="bg-white border-l-2 border-stone-900 p-8 shadow-sm">
            <h4 className="font-black tracking-tighter text-sm uppercase mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Core Methodology</h4>
            <p className="text-lg italic leading-relaxed text-stone-600">
              Our system utilizes an ensemble of BERT-based models for high-fidelity text ingestion. By processing raw feedback strings, the algorithm identifies semantic clusters and emotional valence in real-time. This allows for the immediate conversion of qualitative "frustrations" into quantitative "flags," bridging the gap between user sentiment and technical prioritisation.
            </p>
          </div>
        </div>

        {/* Review Management Side Section */}
        <div className="space-y-8">
          <div className="flex justify-between items-baseline">
            <h4 className="text-xl font-black tracking-widest text-stone-400 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>REVIEWS</h4>
            <span className="text-stone-400 font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>PENDING ACTION</span>
          </div>

          {/* Review Cards */}
          <div className="space-y-6">
            {[
              { rating: 2, text: "The mobile app kept freezing when I tried to look at the floor plans. Very frustrating experience for a luxury service." },
              { rating: 1, text: "Map is completely broken. Why can't I see where the property is located on my phone? Total mess." },
              { rating: 4, text: "Great properties, but navigation feels clunky compared to competitors. Hard to manage multiple saved listings." }
            ].map((review, i) => (
              <div key={i} className="bg-[#f5f4ed] p-6 space-y-4 group transition-all">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, starI) => (
                    <span key={starI} className={`material-symbols-outlined text-xs ${starI < review.rating ? 'text-amber-500' : 'text-stone-300'}`} style={starI < review.rating ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                  ))}
                </div>
                <p className="text-lg italic text-stone-800 leading-snug">"{review.text}"</p>
                <div className="flex flex-col gap-2 pt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <button className="w-full py-2 px-4 border border-stone-900 text-stone-900 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">Send automated apology email</button>
                  <button className="w-full py-2 px-4 border border-stone-300 text-stone-500 font-bold text-[10px] uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-all">Reward with loyalty discount</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-[#f5f4ed] p-8">
          <p className="font-black text-4xl tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>72%</p>
          <p className="font-serif italic text-stone-500 text-sm">Mobile Error Correlation</p>
        </div>
        <div className="md:col-span-2 bg-stone-900 text-white p-8 relative overflow-hidden">
          <p className="font-black text-4xl tracking-tighter relative z-10" style={{ fontFamily: 'Inter, sans-serif' }}>1.2k+</p>
          <p className="font-serif italic text-stone-400 text-sm relative z-10">Total Feedbacks Ingested (24h)</p>
          <div className="absolute bottom-0 right-0 p-4 opacity-20">
            <span className="material-symbols-outlined text-9xl">analytics</span>
          </div>
        </div>
        <div className="md:col-span-1 bg-[#bedafd] p-8">
          <p className="font-black text-4xl tracking-tighter text-[#1d3a56]" style={{ fontFamily: 'Inter, sans-serif' }}>4.2s</p>
          <p className="font-serif italic text-[#314d6a] text-sm">Avg. Response Time</p>
        </div>
      </section>
    </div>
  );
}
