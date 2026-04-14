export default function SettingsAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
          Platform Settings
        </h1>
        <p className="text-lg font-serif italic text-stone-500 mt-2">
          Manage integrations, security, and administrative preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Security Settings */}
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-8">
          <div className="mb-8 border-b border-stone-200/60 pb-4">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-stone-400">shield</span>
              Security & Access
            </h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-stone-900 text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Two-Factor Authentication (2FA)</p>
              <p className="text-sm italic text-stone-500 font-serif">Force all administrative accounts to use a multi-factor authenticator app.</p>
            </div>
            <div className="w-12 h-6 bg-[#625d5b] rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-8">
          <div className="mb-8 border-b border-stone-200/60 pb-4">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-stone-400">api</span>
              Payment Integrations
            </h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-stone-900 text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Stripe API Ecosystem</p>
              <p className="text-sm italic text-stone-500 font-serif">Enable global fiat processing, automated splits, and premium virtual tour subscriptions.</p>
            </div>
            <div className="w-12 h-6 bg-[#625d5b] rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-200/30 flex items-center justify-between">
            <div>
              <p className="font-bold text-stone-400 text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Crypto Wallet Integration (Web3)</p>
              <p className="text-sm italic text-stone-400 font-serif opacity-70">Accept stablecoin settlements directly to company hard wallets.</p>
            </div>
            <div className="w-12 h-6 bg-stone-200 rounded-full relative cursor-not-allowed shadow-inner opacity-50">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-8">
          <div className="mb-8 border-b border-stone-200/60 pb-4">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-stone-400">notifications</span>
              Notifications
            </h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-stone-900 text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Urgent Email Alerts</p>
              <p className="text-sm italic text-stone-500 font-serif">Receive immediate reports for CRM flags or dropped high-value conversion funnels.</p>
            </div>
            <div className="w-12 h-6 bg-stone-200 rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
        </div>
        
        <div className="pt-6 flex justify-end">
          <button className="bg-stone-900 text-white font-bold text-xs uppercase tracking-widest py-4 px-12 rounded-sm hover:bg-stone-800 transition-colors shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
