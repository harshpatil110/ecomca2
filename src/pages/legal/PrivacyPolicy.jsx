export default function PrivacyPolicy() {
  return (
    <div className="pt-24 pb-32 px-8 max-w-3xl mx-auto min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900 mb-4">Privacy Policy</h1>
        <p className="text-[10px] font-black tracking-widest uppercase text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Last Updated: March 15, 2024</p>
      </div>

      <div className="space-y-12 text-lg text-stone-600 font-serif leading-relaxed">
        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>1. Data Collection</h2>
          <p>
            The Archive Architectural Realty ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. We collect information you provide directly to us when inquiring about properties or signing up for our editorial newsletter. This includes contact details and property preferences.
          </p>
        </section>
        
        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>2. Use of Information</h2>
          <p>
            Your information is utilized strictly to curate high-end property matches, improve our service offerings, and communicate securely with our brokers. We do not sell, rent, or lease our client lists to third parties under any circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>3. Data Security & Storage</h2>
          <p>
            We implement enterprise-grade security protocols to protect your personal information from unauthorized access or disclosure. All digital records are encrypted, and physical files are maintained under strict security compliance.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>4. Your Rights</h2>
          <p>
            Clients may request access to, correction of, or deletion of their personal data at any time. For concerns regarding our privacy practices, please contact our Data Protection Officer.
          </p>
        </section>
      </div>
    </div>
  );
}
