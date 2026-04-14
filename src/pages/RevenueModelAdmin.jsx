export default function RevenueModelAdmin() {
  return (
    <div className="pt-8 px-12 pb-20 max-w-7xl">
      {/* Page Header */}
      <div className="mb-12">
        <h2 className="text-5xl font-black tracking-tighter text-stone-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Revenue Model</h2>
        <p className="text-xl italic text-stone-500">A detailed analysis of estate fiscal streams and seasonal growth.</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: 'Total Monthly Revenue', value: '$142,000', icon: 'payments' },
          { label: 'Active Premium Agents', value: '450', icon: 'badge' },
          { label: 'YTD Growth', value: '+14%', icon: 'trending_up', valClass: 'text-[#46617f]' },
        ].map(({ label, value, icon, valClass }, i) => (
          <div key={i} className="bg-white p-8 rounded-sm shadow-sm relative overflow-hidden group">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
            <h3 className={`text-4xl font-black tracking-tight ${valClass || 'text-stone-900'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{value}</h3>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-9xl">{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Streams Breakdown */}
      <div className="grid grid-cols-12 gap-8 mb-16">
        {/* Stream 1: Transaction Fees */}
        <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-sm">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="font-bold text-[10px] uppercase tracking-widest text-stone-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Stream 01</p>
              <h4 className="text-3xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>Transaction Fees</h4>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black tracking-tighter block" style={{ fontFamily: 'Inter, sans-serif' }}>$84,200</span>
              <span className="font-bold text-xs text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Current Month</span>
            </div>
          </div>
          {/* Minimalist Bar Chart Placeholder */}
          <div className="flex items-end space-x-3 h-48">
            <div className="bg-stone-200 w-full h-[40%] rounded-t-sm"></div>
            <div className="bg-stone-200 w-full h-[60%] rounded-t-sm"></div>
            <div className="bg-[#bedafd] w-full h-[85%] rounded-t-sm"></div>
            <div className="bg-stone-200 w-full h-[55%] rounded-t-sm"></div>
            <div className="bg-stone-200 w-full h-[70%] rounded-t-sm"></div>
            <div className="bg-stone-200 w-full h-[45%] rounded-t-sm"></div>
            <div className="bg-[#bedafd] w-full h-[95%] rounded-t-sm"></div>
            <div className="bg-stone-200 w-full h-[30%] rounded-t-sm"></div>
            <div className="bg-stone-200 w-full h-[50%] rounded-t-sm"></div>
            <div className="bg-[#bedafd] w-full h-[75%] rounded-t-sm"></div>
          </div>
          <div className="flex justify-between mt-4 font-bold text-[10px] text-stone-400 uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>

        {/* Small Card: Website Advertising */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#f5f4ed] p-8 rounded-sm flex flex-col justify-between">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-widest text-stone-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Stream 03</p>
            <h4 className="text-xl font-black tracking-tighter text-stone-900 mb-2 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Website Advertising Space</h4>
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>$12,400</span>
            <div className="flex items-center text-[#46617f] text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-sm mr-1">arrow_upward</span>
              +4.2%
            </div>
          </div>
        </div>

        {/* Stream 2: Agent Subscriptions */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-8 rounded-sm flex flex-col justify-between">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-widest text-stone-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Stream 02</p>
            <h4 className="text-2xl font-black tracking-tighter text-stone-900 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Agent Subscriptions</h4>
            <div className="relative h-24 w-full">
              <svg className="w-full h-full preserve-3d" viewBox="0 0 100 40">
                <path d="M0 35 Q 25 35, 35 25 T 70 15 T 100 5" fill="none" stroke="#625d5b" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                <circle cx="100" cy="5" fill="#625d5b" r="2"></circle>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black tracking-tighter block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>$35,800</span>
            <span className="font-bold text-[10px] text-stone-400 uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>Steady growth trajectory</span>
          </div>
        </div>

        {/* Small Card: Mortgage Affiliates */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#f5f4ed] p-8 rounded-sm flex flex-col justify-between">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-widest text-stone-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Stream 04</p>
            <h4 className="text-xl font-black tracking-tighter text-stone-900 mb-2 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Affiliate Income from Mortgages</h4>
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>$6,100</span>
            <div className="flex items-center text-[#46617f] text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-sm mr-1">arrow_upward</span>
              +4.2%
            </div>
          </div>
        </div>

        {/* Small Card: Virtual Tour Sales */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#f5f4ed] p-8 rounded-sm flex flex-col justify-between border-l-4 border-[#bedafd]">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-widest text-stone-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Stream 05</p>
            <h4 className="text-xl font-black tracking-tighter text-stone-900 mb-2 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Premium Virtual Tour Sales</h4>
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>$3,500</span>
            <div className="flex items-center text-[#46617f] text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-sm mr-1">arrow_upward</span>
              +4.2%
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Panel */}
      <section className="grid grid-cols-12 gap-12 mt-20 pt-20 border-t border-stone-200/60">
        <div className="col-span-12 lg:col-span-4">
          <h5 className="text-4xl font-black tracking-tighter text-stone-900 leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>Revenue Mapping</h5>
          <p className="mt-4 text-xl italic text-stone-400">Strategies for generating High Revenue.</p>
        </div>
        <div className="col-span-12 lg:col-span-7 lg:col-start-6">
          <div className="space-y-6 text-stone-700 leading-relaxed max-w-2xl">
            <p className="text-lg">
              <span className="text-5xl font-black float-left mr-4 mt-1 leading-none text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>O</span>
              ur current fiscal architecture is leaning heavily into high-volume transaction fees, accounting for over 59% of the total monthly intake. This editorial overview aims to highlight the nascent potential within secondary streams—specifically the 4.2% growth observed in mortgage affiliates and premium digital tours.
            </p>
            <p className="text-lg">
              The shift towards a more diversified model ensures stability during market volatility. By pairing our aggressive <strong>Power Sans</strong> growth targets with the literary grace of a refined service model, we aim to convert 15% more standard agents to the premium tier by year-end.
            </p>
            <div className="py-8 my-8 px-10 border-l-2 border-stone-200 bg-[#f5f4ed] italic text-xl text-stone-600 relative">
              "The modern estate isn't just about the physical space; it's about the financial ecosystem that sustains the dream of ownership."
              <span className="block mt-4 not-italic text-[10px] uppercase tracking-widest font-bold text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>— Chief Financial Officer</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
