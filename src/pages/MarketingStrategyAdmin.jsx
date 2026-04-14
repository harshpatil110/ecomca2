export default function MarketingStrategyAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 max-w-7xl">
      {/* Header Section */}
      <section className="mb-16">
        <h2 className="text-6xl font-black tracking-tightest text-stone-900 uppercase mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Marketing Strategy</h2>
        <div className="flex gap-12 items-baseline" style={{ fontFamily: 'Inter, sans-serif' }}>
          <p className="text-stone-500 tracking-wide uppercase text-xs font-bold">Q3 Performance Analysis</p>
          <div className="h-px flex-1 bg-stone-200"></div>
          <p className="text-stone-900 font-black text-xl">2024</p>
        </div>
      </section>

      {/* Strategy Explanation Panel */}
      <section className="grid grid-cols-12 gap-12 mb-24">
        <div className="col-span-12 lg:col-span-8">
          <h3 className="text-4xl italic mb-8 leading-tight text-stone-800">
            "Our digital resonance is built on the intersection of architectural heritage and algorithmic precision."
          </h3>
          <div className="max-w-[65ch] text-stone-600 leading-relaxed text-lg space-y-6">
            <p style={{ fontFamily: 'Inter, sans-serif' }}>
              The current strategy prioritizes high-intent acquisition through <span className="text-stone-900 font-bold">Search and Content</span>, while leveraging social platforms as editorial lookbooks. We have moved away from generic lead-gen tactics in favor of narrative-driven storytelling that resonates with luxury demographics.
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif' }}>
              By focusing on the <span className="italic font-serif">character of the space</span> rather than just the square footage, we have seen a significant qualitative shift in our CRM pipeline. Our referral program acts as the social proof anchor, grounding our digital efforts in real-world community trust.
            </p>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-end">
          {/* Referral Program Widget */}
          <div className="bg-[#f5f4ed] p-8 border-l-4 border-stone-800 relative overflow-hidden">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4 text-stone-400">diversity_3</span>
              <p className="font-black text-5xl tracking-tightest text-stone-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>120</p>
              <p className="italic text-lg leading-snug text-stone-700">New Signups this month via referral links.</p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>loyalty</span>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Overview Table */}
      <section className="mb-24">
        <div className="flex items-center justify-between mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Campaign Performance Overview</h4>
          <button className="text-xs font-bold text-stone-900 border-b-2 border-stone-800 pb-0.5">EXPORT PDF</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr className="border-b border-stone-200">
                <th className="py-6 font-black text-sm uppercase tracking-tighter text-stone-900 w-1/4">Channel</th>
                <th className="py-6 font-black text-sm uppercase tracking-tighter text-stone-900">Reach / Subs</th>
                <th className="py-6 font-black text-sm uppercase tracking-tighter text-stone-900">Engagement</th>
                <th className="py-6 font-black text-sm uppercase tracking-tighter text-stone-900">Growth / Conversion</th>
              </tr>
            </thead>
            <tbody className="text-stone-600">
              {[
                { channel: 'Google Ads', strategy: 'PPC Strategy', reach: '120k', reachLabel: 'impressions', eng: '$5k Spend', isEngBadge: true, conv: '340', convLabel: 'conversions' },
                { channel: 'Social Media/TikTok', strategy: 'Vertical Video', reach: '500k', reachLabel: 'views', eng: '4.2%', engLabel: 'CTR', convText: '+18% Viral Lift', convTextClass: 'text-[#46617f] font-bold' },
                { channel: 'Email Newsletter', strategy: 'Retention', reach: '15k', reachLabel: 'subs', eng: '28%', engLabel: 'open rate', convText: 'Direct Response', convTextClass: 'text-stone-900 font-bold' },
                { channel: 'SEO/Content Marketing', strategy: 'Organic Growth', reach: '8.4k', reachLabel: 'unique visits', eng: '04:12', engLabel: 'avg time', convNode: (
                  <div className="flex items-center gap-1 text-stone-900">
                    <span className="material-symbols-outlined text-sm font-bold">north_east</span>
                    <span className="text-xl font-black">+22%</span>
                    <span className="text-xs ml-1 opacity-60">MoM</span>
                  </div>
                ) }
              ].map((row, i) => (
                <tr key={i} className="border-b border-stone-200 hover:bg-stone-50 transition-colors group">
                  <td className="py-8">
                    <p className="text-stone-900 font-black tracking-tight">{row.channel}</p>
                    <p className="text-[10px] uppercase font-bold text-stone-400">{row.strategy}</p>
                  </td>
                  <td className="py-8">
                    <span className="text-xl font-black text-stone-800">{row.reach}</span>
                    <span className="text-xs ml-1 opacity-60">{row.reachLabel}</span>
                  </td>
                  <td className="py-8">
                    {row.isEngBadge ? (
                      <span className="px-2 py-1 bg-stone-100 text-[10px] font-bold rounded-sm text-stone-600">{row.eng}</span>
                    ) : (
                      <>
                        <span className="text-xl font-black text-stone-800">{row.eng}</span>
                        <span className="text-xs ml-1 opacity-60 text-stone-400">{row.engLabel}</span>
                      </>
                    )}
                  </td>
                  <td className="py-8">
                    {row.convNode ? row.convNode : row.convText ? (
                      <span className={row.convTextClass}>{row.convText}</span>
                    ) : (
                      <>
                        <span className="text-xl font-black text-stone-900">{row.conv}</span>
                        <span className="text-xs ml-1 opacity-60">{row.convLabel}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Visual Insights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-stone-900 text-stone-50 p-12 rounded-sm flex flex-col justify-between h-[400px] relative overflow-hidden group">
          <div className="relative z-10">
            <h5 className="font-black text-4xl tracking-tightest mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>AESTHETIC <br />CONVERSION</h5>
            <p className="italic text-stone-400 max-w-sm">Properties featuring editorial-grade photography see a 40% higher engagement rate across all channels.</p>
          </div>
          <div className="relative z-10 flex gap-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <button className="bg-stone-50 text-stone-900 px-6 py-2 text-xs font-black uppercase tracking-widest rounded-sm">View Insights</button>
            <button className="border border-stone-700 text-stone-400 px-6 py-2 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-stone-800">Media Library</button>
          </div>
          {/* Abstract Deco Image */}
          <div className="absolute right-0 top-0 w-1/2 h-full">
            <img alt="Interior Design" className="w-full h-full object-cover opacity-40 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsDB8QtWr3Wt-Q5us7DDAH1UPGvPRiweWHvQugWpR5RWTFSfV8EGVyJqkeADxAEK3RbYKudRdPdFQxBqGYt4izD_OSKvaIK0tLA7djGwFglKQj6jgKl_C4WzTpjYz7dBoHXvmMr4xWsZLKzWT1a061iD9H_yd1E_iKEHeFH2ZRPsCbPmRJtysRNZycXxkfrfkErEU6dwOt1t4tcDPN0jEbQjCObmHlftYvNR2LsgjhFmBbMVVqzpsNNQabbxeL0V4DGoOMI2g4UiLt" />
          </div>
        </div>
        <div className="bg-[#f5f4ed] p-12 rounded-sm flex flex-col justify-center text-center">
          <span className="material-symbols-outlined text-stone-300 text-6xl mb-6">architecture</span>
          <p className="font-black text-xl text-stone-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Portfolio Growth</p>
          <p className="text-stone-500 italic">Expanding to 12 new regions by the end of Q4.</p>
        </div>
      </section>
    </div>
  );
}
