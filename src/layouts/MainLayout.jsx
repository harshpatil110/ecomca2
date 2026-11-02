import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', to: '/' },
    { label: 'Register Property', to: '/register' },
    { label: 'Property Records', to: '/records' },
    { label: 'Document Verification', to: '/verify' },
    { label: 'Ownership Transfers', to: '/transfers' },
    { label: 'Registry Analytics', to: '/analytics' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f4]">
      {/* ── Top App Bar ── */}
      <header className="bg-[#fbf9f4] border-b border-stone-200/50 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-10 py-5 max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stone-900 text-xl">token</span>
            <span className="text-base md:text-lg font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              PROPERTY REGISTRY
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-7" style={{ fontFamily: 'Inter, sans-serif' }}>
            {navLinks.map(({ label, to }) => {
              const active = pathname === to || (to !== '/' && pathname.startsWith(to));
              return (
                <Link
                  key={label}
                  to={to}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 pb-1 ${
                    active
                      ? 'text-stone-900 border-b-2 border-stone-900'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-4">
            <Link
              to="/register"
              className="px-5 py-2 bg-stone-900 text-[#fef6f2] text-[10px] uppercase tracking-widest font-bold rounded-sm hover:bg-stone-800 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              + Register
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-stone-700 hover:text-stone-900"
              aria-label="Toggle Navigation"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-stone-200 bg-[#fbf9f4] px-6 py-4 space-y-3 font-sans">
            {navLinks.map(({ label, to }) => {
              const active = pathname === to || (to !== '/' && pathname.startsWith(to));
              return (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-xs font-bold uppercase tracking-wider py-2 ${
                    active ? 'text-stone-900 font-black' : 'text-stone-600'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#fbf9f4] border-t border-stone-200/50 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 md:px-12 gap-6 max-w-screen-2xl mx-auto">
          <div>
            <div className="text-sm font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              BLOCKCHAIN PROPERTY REGISTRY
            </div>
            <p className="text-[11px] text-stone-500 font-serif italic mt-1">
              Cryptographic property ownership records, document hash integrity, and title audit log on Sepolia testnet.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-stone-500 font-sans">
            <Link to="/records" className="hover:text-stone-900">Records</Link>
            <Link to="/verify" className="hover:text-stone-900">Document Verification</Link>
            <Link to="/transfers" className="hover:text-stone-900">Ownership Transfers</Link>
            <Link to="/blockchain" className="hover:text-stone-900">Smart Contract</Link>
            <Link to="/analytics" className="hover:text-stone-900">Analytics</Link>
          </div>

          <div className="text-[11px] font-serif italic text-stone-400 text-center md:text-right">
            Demonstration prototype. Not a government-recognized land records agency.
          </div>
        </div>
      </footer>

      {/* ── Bottom Nav (Mobile) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2.5 pb-5 px-4 bg-white/95 backdrop-blur-md border-t border-stone-200/60 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {[
          { icon: 'dashboard', label: 'Dashboard', to: '/' },
          { icon: 'table_view', label: 'Records', to: '/records' },
          { icon: 'add_circle', label: 'Register', to: '/register' },
          { icon: 'fingerprint', label: 'Verify', to: '/verify' },
          { icon: 'swap_horiz', label: 'Transfers', to: '/transfers' },
        ].map(({ icon, label, to }) => (
          <Link key={label} to={to} className="flex flex-col items-center justify-center text-stone-400 hover:text-stone-900 transition-colors">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
