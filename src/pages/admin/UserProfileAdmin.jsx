export default function UserProfileAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
          User Profile
        </h1>
        <p className="text-lg font-serif italic text-stone-500 mt-2">
          Manage your personal administrative credentials.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-10 mb-8">
        <div className="flex items-center gap-6 mb-12 border-b border-stone-100 pb-8">
          <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center text-white text-2xl font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
            EA
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Eleanor Agent</h2>
            <div className="bg-[#bedafd]/20 text-[#1d3a56] px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest inline-block" style={{ fontFamily: 'Inter, sans-serif' }}>
              Super Admin
            </div>
          </div>
        </div>

        <form className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">First Name</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" defaultValue="Eleanor" />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Last Name</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" defaultValue="Agent" />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Email Address</label>
            <input type="email" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" defaultValue="executive@luminarealty.com" />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Phone Number</label>
            <input type="tel" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" defaultValue="+1 (310) 555-0199" />
          </div>
          
          <div className="flex flex-col space-y-2 pt-4 border-t border-stone-100">
            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Reset Password</label>
            <input type="password" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm placeholder:text-stone-300" placeholder="Enter new password" />
          </div>

          <div className="pt-6">
            <button type="button" className="bg-stone-900 text-white font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-sm hover:bg-stone-800 transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9e422c] hover:opacity-70 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
