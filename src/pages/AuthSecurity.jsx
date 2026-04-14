import { Link } from 'react-router-dom';

export default function AuthSecurity() {
  return (
    <div className="min-h-[calc(100vh-88px)] flex flex-col md:flex-row bg-[#fbf9f4] text-[#31332c]">
      {/* Left: Login/Registration Form */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h1 className="font-headline font-black text-5xl md:text-6xl tracking-[-0.06em] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Entry.
            </h1>
            <p className="font-body text-xl italic text-[#5e6058]">
              Access the curated collection of architectural landmarks.
            </p>
          </div>
          
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-[#5e6058] uppercase mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Email Address</label>
              <input className="w-full bg-white border-b-1.5 border-transparent focus:border-[#625d5b] focus:ring-0 rounded-sm p-4 text-lg transition-all" placeholder="name@archive.com" type="email" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-[#5e6058] uppercase mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Password</label>
              <input className="w-full bg-white border-b-1.5 border-transparent focus:border-[#625d5b] focus:ring-0 rounded-sm p-4 text-lg transition-all" placeholder="••••••••" type="password" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-[#5e6058] uppercase mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Account Type</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer group">
                  <input defaultChecked className="hidden peer" name="role" type="radio" value="buyer" />
                  <div className="p-4 bg-white border-none peer-checked:bg-[#e9e1dd] text-center rounded-sm transition-colors group-hover:bg-[#e8e9e0]">
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Buyer</span>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer group">
                  <input className="hidden peer" name="role" type="radio" value="agent" />
                  <div className="p-4 bg-white border-none peer-checked:bg-[#e9e1dd] text-center rounded-sm transition-colors group-hover:bg-[#e8e9e0]">
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Agent</span>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <Link to="#" className="text-[10px] font-bold tracking-widest uppercase text-[#5e6058] hover:text-[#31332c] border-b border-transparent hover:border-[#31332c] transition-all" style={{ fontFamily: 'Inter, sans-serif' }}>
                Forgot Password?
              </Link>
              <Link to="/admin/crm">
                <button className="bg-[#625d5b] text-[#fef6f2] px-10 py-4 rounded-sm text-xs font-black tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all" type="button" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Authenticate
                </button>
              </Link>
            </div>
          </form>
          
          <div className="mt-16 pt-8 border-t border-[#b1b3a9]/20">
            <p className="text-[#5e6058] italic">
              New to THE ARCHIVE? <Link to="#" className="text-[#31332c] not-italic font-bold hover:underline">Apply for membership.</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right: Editorial Security Panel */}
      <section className="w-full md:w-1/2 relative overflow-hidden bg-[#efeee6] flex items-center justify-center p-8 md:p-24">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img
            className="w-full h-full object-cover grayscale"
            alt="Security Architecture"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6x26luKCj8IX6z-BbA5R0opGxPeT30ubae5KzjXk_YIf0HQTlerI3Nzeerg87-WfFRgPmvoS5IUaw6VfcFT9Xi-Sih4kz1k-ZletdkqtUU6nXHjsEIxNAXpeNxcY7LB-uvlQuK2rzWDKsNCQsRzx0TWYXQw9SojPdmK571SOwUtJdyCKyDS1PljOercN160cOhqqcr4GA0NMRakppeosMghFPeIcLby8qM_i_9J24zo-HjyMuX_IgsZBj4m5DpF2-3oliw_5Hn_yB"
          />
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl md:text-5xl italic mb-12 leading-tight">Our Security Commitment</h2>
          <div className="space-y-12">
            {[
              { num: '01', title: 'bcrypt', desc: 'Advanced salted hashing protocols ensure your private access credentials remain mathematically inaccessible.' },
              { num: '02', title: 'JWT', desc: 'Stateless JSON Web Tokens facilitate secure, encrypted session management across our global infrastructure.' },
              { num: '03', title: 'Data Validation', desc: 'Rigorous server-side sanitization layers protect the integrity of our architectural data and user privacy.' }
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex items-start gap-6">
                <span className="font-black text-4xl text-[#797c73]/30" style={{ fontFamily: 'Inter, sans-serif' }}>{num}</span>
                <div>
                  <h3 className="text-sm font-black tracking-widest uppercase mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</h3>
                  <p className="text-lg text-[#5e6058] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-20 flex gap-8">
            <Link to="#" className="text-[10px] font-bold tracking-widest uppercase hover:opacity-70 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>Security Whitepaper</Link>
            <Link to="#" className="text-[10px] font-bold tracking-widest uppercase hover:opacity-70 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>Infrastructure Status</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
