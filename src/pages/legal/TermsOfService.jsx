export default function TermsOfService() {
  return (
    <div className="pt-24 pb-32 px-8 max-w-3xl mx-auto min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900 mb-4">Terms of Service</h1>
        <p className="text-[10px] font-black tracking-widest uppercase text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Last Updated: January 02, 2024</p>
      </div>

      <div className="space-y-12 text-lg text-stone-600 font-serif leading-relaxed">
        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>1. Agreement to Terms</h2>
          <p>
            By accessing our curated portfolio, you agree to be bound by these Terms of Service. The Archive reserves the right to modify these terms at our discretion to reflect changes in our firm's policy or legal environment.
          </p>
        </section>
        
        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>2. User Responsibilities</h2>
          <p>
            Users are expected to provide accurate information during the inquiry phase. Our exclusive listings require strict financial qualification; misrepresentation of intent or capacity is grounds for immediate termination of services.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>3. Intellectual Property</h2>
          <p>
            All architectural photography, editorial content, and brand assets displayed on this platform are the exclusive property of The Archive Architectural Realty. Unauthorized reproduction, distribution, or commercial use is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 mb-4 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>4. Limitation of Liability</h2>
          <p>
            We curate properties with the utmost diligence; however, we do not guarantee the structural or legal standing of any third-party property listed. Buyers are advised to conduct independent appraisals and inspections.
          </p>
        </section>
      </div>
    </div>
  );
}
