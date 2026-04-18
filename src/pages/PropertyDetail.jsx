import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PropertyDetail() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [wireSubmitted, setWireSubmitted] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [tourRequested, setTourRequested] = useState(false);

  const handleTourSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !date) return;
    const leads = JSON.parse(localStorage.getItem('crm_tour_requests') || '[]');
    leads.push({
      id: Date.now(),
      propertyId: '1042',
      client: name,
      email: email,
      date: date,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('crm_tour_requests', JSON.stringify(leads));
    setTourRequested(true);
  };

  const handleRazorpayPayment = async () => {
    setIsPaymentLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.');
      setIsPaymentLoading(false);
      return;
    }

    // REMINDER: Ensure VITE_RAZORPAY_KEY_ID is added to your root .env file.
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      amount: 83030000, // ₹10,000 USD converted roughly to INR in paise for processing
      currency: 'INR',
      name: 'Lumina Realty',
      description: 'Booking Deposit - The Monolith House',
      prefill: {
        name: name,
        email: email,
        contact: ''
      },
      theme: {
        color: '#1C1917' // Matching our Warm Editorial Charcoal
      },
      handler: function (response) {
        console.log('Payment Successful. ID:', response.razorpay_payment_id);
        setIsPaymentLoading(false);
        setPaymentFailed(false);
        setIsModalOpen(false);
        navigate('/payment-success');
      },
      modal: {
        ondismiss: function() {
          setPaymentFailed(true);
          setIsPaymentLoading(false);
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    
    paymentObject.on('payment.failed', function (response) {
      console.error(response.error);
      setIsPaymentLoading(false);
      setPaymentFailed(true);
    });
    
    paymentObject.open();
  };
  
  return (
    <div className="max-w-screen-2xl mx-auto px-8 pt-8 pb-24">
      {/* Masonry Gallery */}
      <div className="grid grid-cols-12 gap-1 mb-16 h-[716px]">
        <div className="col-span-8 h-full relative overflow-hidden rounded-sm group">
          <img
            alt="Exterior view of a brutalist concrete home"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFIn_NWb7FobIOQ93W_cM54Ywj8gREhKloRCe-eBvNzDKfA9Zgo3uRx1Bk0lusQEVLeYm_YArHCmdwtIg6UKHsJmaGISbJBiO3W7YQT0EwYwfu5hNZRFamkUJqa7wZzy1jg-CQR0nYhgfOrqeVi8WYguVqsMkhN6Punylp8URlu_vHvGjJ5xlYkvhFUjVXJeFlMIOp-CqXmrphTaqsVF9bZW2xx7ymrXKRCw1yIM7qH91MXAInAT9WZ3F-e9M_pLN8j-gD0BsKt9m3"
          />
          <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors"></div>
        </div>
        <div className="col-span-4 grid grid-rows-2 gap-1 h-full">
          <div className="relative overflow-hidden rounded-sm group">
            <img
              alt="High-end minimalist living room"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCetlhiHlIVMdbzVOXO8TUqpSpSjuoMPWOspsVlR2_omTaiPuZY6nRGBkjeq3KZRXycJTXNmb1vnT1O_-Bn4q5VIvPvo9WCBVV1XqtUETOBPTRzhrHkCd3qjTlMMB3Ot0Lag1FHznnqhfkIwBvXTHEIrYOI4a5Gj3zABmwnSgIXYFtzL390QfvY2Dh_chQ7UnaXjoJPcsGmwcrDGrorklUwzAwBrOY2w8AoBxgmMJ1T2MiBR4lDeSZW_e224CkhFW6LKXWW3PgtLrAR"
            />
          </div>
          <div className="relative overflow-hidden rounded-sm group">
            <img
              alt="Close-up of architectural detail"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuASZby2BFZiVR90ys7lubMwH9bLnwRYfdwi-80RJSyBacnmm0ejaVu4Fq21iWVURclq9vqFCl1-f_Nx9kqIG0JdHTb2IXLAFJZTzT0IZ9G7rYx91gp6PAPakrR4XTiHXjfZacjHTC1O272wkYcnPBNAszU8dPtL5LO3du_gfLRLWzqK-SaTPL0cc-nNsBF0sveZHY7ILpRuDpFvwpjdDH8CbRCnrlAApnK2OhG0mJ77MnUuz8oHxKujjgIfssqNm_X0h9U0XgH5-eY2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Main Content (70%) */}
        <div className="lg:w-[70%]">
          <div className="mb-12 mt-8 md:mt-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-[#bedafd] text-[#1d3a56] text-[10px] font-black tracking-widest px-2 py-1 uppercase rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Featured Listing
              </span>
              <span className="text-stone-400 text-[11px] uppercase tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Silver Lake, Los Angeles
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-2" style={{ fontFamily: 'Newsreader, serif' }}>
              THE MONOLITH HOUSE
            </h1>
            <p className="text-2xl md:text-3xl font-serif text-gray-600 mb-6 italic" style={{ fontFamily: 'Newsreader, serif' }}>
              ₹4,850,000
            </p>
          </div>
          <div className="max-w-2xl">
            <p className="text-xl leading-[1.8] text-[#5e6058] font-serif mb-12 italic">
              A rigorous exploration of volume and light, The Monolith House stands as a definitive statement in contemporary California modernism. Designed in 2022, the residence utilizes cast-in-place concrete and reclaimed white oak to create a sanctuary that is both imposing and deeply serene.
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="mt-16 border-t border-stone-200/60 pt-12">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-400 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>Key Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12">
              {[
                { label: 'Bedrooms', value: '04' },
                { label: 'Bathrooms', value: '3.5' },
                { label: 'Square Feet', value: '3,420' },
                { label: 'Lot Size', value: '0.24 AC' },
                { label: 'Built', value: '2022' },
                { label: 'Parking', value: '2 Car Port' },
                { label: 'Heating', value: 'Radiant' },
                { label: 'Views', value: 'Reservoir' },
              ].map(({ label, value }) => (
                <div key={label} className="border-t border-stone-200/30 pt-6">
                  <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
                  <p className="text-2xl font-serif italic">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar (30%) */}
        <div className="lg:w-[30%]">
          <div className="sticky top-32">
            <div className="bg-white p-8 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200/20">
              <h3 className="text-lg font-black tracking-tighter uppercase mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Schedule a Tour</h3>
              {!tourRequested ? (
                <form className="space-y-6" onSubmit={handleTourSubmit}>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Full Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#f5f4ed] border-b border-transparent focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif text-sm" placeholder="e.g. Julianne Moore" type="text" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Email Address</label>
                    <input required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#f5f4ed] border-b border-transparent focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif text-sm" placeholder="hello@domain.com" type="email" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Preferred Date</label>
                    <div className="relative">
                      <input required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#f5f4ed] border-b border-transparent focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif appearance-none text-sm" type="date" />
                      <span className="material-symbols-outlined absolute right-4 top-3 text-stone-400 pointer-events-none">calendar_today</span>
                    </div>
                  </div>
                  <button className="w-full bg-stone-900 text-white font-bold tracking-[0.2em] uppercase text-[11px] py-4 rounded-sm hover:bg-stone-800 transition-colors mt-2 shadow-sm" type="submit" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Request Free Tour
                  </button>
                  <p className="text-[10px] text-center text-stone-400 leading-relaxed italic font-serif mt-2">A member of our team will respond within 2 hours to confirm your private viewing.</p>
                </form>
              ) : (
                <div className="text-center py-6 border border-stone-200 rounded-sm bg-[#fbf9f4]">
                  <span className="material-symbols-outlined text-3xl text-stone-400 mb-2">event_available</span>
                  <p className="text-sm font-serif italic text-stone-600 px-6 leading-relaxed">
                    Tour requested successfully. An executive will contact you shortly to confirm your viewing.
                  </p>
                </div>
              )}

              <hr className="my-8 border-t border-stone-200/60" />
              
              <div className="text-center">
                <h4 className="text-sm font-black tracking-tighter uppercase mb-4 text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>Ready to Commit?</h4>
                <button onClick={() => { setIsModalOpen(true); setPaymentMethod(''); setWireSubmitted(false); }} className="w-full border-2 border-stone-900 text-stone-900 font-bold tracking-[0.2em] uppercase text-[11px] py-4 rounded-sm hover:bg-stone-900 hover:text-white transition-colors" type="button" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Secure Property (Deposit)
                </button>
              </div>
            </div>
            
            {/* In-House Concierge Card */}
            <div className="mt-8 flex items-center gap-4 px-2">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-stone-500">architecture</span>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>Lumina Concierge</p>
                <p className="text-[11px] text-stone-400 font-serif italic">Exclusive Direct Purchase Team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-sm shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-3xl font-serif italic text-stone-900 mb-8 border-b border-stone-200 pb-4">Secure This Property</h2>
            
            {paymentFailed && (
              <div className="mb-8 border-y border-[#9e422c]/20 bg-[#fe8b70]/5 py-4 px-6 flex justify-between items-center animate-[fade-in_0.3s_ease-out] rounded-sm">
                <p className="text-sm font-serif italic text-[#9e422c]">
                  Payment processing failed or was cancelled. Please try again.
                </p>
                <button onClick={() => setPaymentFailed(false)} className="text-[10px] uppercase tracking-widest font-bold text-[#9e422c]/70 hover:text-[#9e422c] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Dismiss
                </button>
              </div>
            )}

            {!paymentMethod ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setPaymentMethod('stripe')}
                  className="w-full text-left p-6 border border-stone-200 hover:border-stone-900 rounded-sm transition-colors group"
                >
                  <h3 className="text-lg font-bold text-stone-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Booking Deposit (Instant)</h3>
                  <p className="text-sm font-serif italic text-stone-500">Secure this property immediately with a refundable ₹10,000 deposit via Razorpay (Cards, Netbanking, UPI).</p>
                </button>
                <button 
                  onClick={() => setPaymentMethod('wire')}
                  className="w-full text-left p-6 border border-stone-200 hover:border-stone-900 rounded-sm transition-colors group"
                >
                  <h3 className="text-lg font-bold text-stone-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Wire Transfer / NEFT (Full Amount)</h3>
                  <p className="text-sm font-serif italic text-stone-500">Initiate a direct bank-to-bank transfer for the full property value.</p>
                </button>
              </div>
            ) : paymentMethod === 'stripe' ? (
              <div className="space-y-6">
                <button onClick={() => setPaymentMethod('')} className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1 mb-8">
                   <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back
                </button>
                <div className="bg-[#fbf9f4] p-8 border border-stone-200 text-center rounded-sm">
                  <span className="material-symbols-outlined text-4xl text-stone-800 mb-4">credit_card</span>
                  <h3 className="text-xl font-serif italic text-stone-900 mb-2">Instant Booking Deposit</h3>
                  <p className="text-sm text-stone-600 mb-8 max-w-sm mx-auto">You will be redirected securely to complete your ₹10,000 deposit.</p>
                  <button 
                    disabled={isPaymentLoading}
                    onClick={handleRazorpayPayment} 
                    className="inline-flex justify-center items-center gap-2 bg-stone-900 text-white font-bold tracking-[0.2em] uppercase text-[11px] py-4 px-12 rounded-sm hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {isPaymentLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span> Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </button>
                </div>
              </div>
            ) : paymentMethod === 'wire' && !wireSubmitted ? (
              <div className="space-y-6">
                <button onClick={() => setPaymentMethod('')} className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1 mb-4">
                   <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back
                </button>
                <div className="bg-[#fbf9f4] p-6 border border-stone-200 rounded-sm">
                  <h3 className="text-xs font-black tracking-widest uppercase text-stone-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Escrow Ledger Details</h3>
                  <div className="space-y-3 text-sm font-serif text-stone-700">
                    <p><span className="font-semibold text-stone-900 font-sans tracking-wide">Beneficiary:</span> Lumina Realty Escrow</p>
                    <p><span className="font-semibold text-stone-900 font-sans tracking-wide">Bank Name:</span> First Republic / Standard Chartered (Placeholder)</p>
                    <p><span className="font-semibold text-stone-900 font-sans tracking-wide">Account Number:</span> 0001992847563</p>
                    <p><span className="font-semibold text-stone-900 font-sans tracking-wide">IFSC / Routing:</span> ARCH0001042</p>
                    <p className="pt-2 text-stone-500 italic">Reference Note: Please include the Property ID in your transfer remarks.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Transaction Reference Number (UTR/IMPS Ref)</label>
                  <div className="flex gap-4">
                    <input className="flex-1 bg-[#f5f4ed] border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 transition-all font-serif text-sm" placeholder="e.g. TRN912837482" type="text" />
                    <button onClick={() => setWireSubmitted(true)} className="bg-stone-900 text-white font-bold tracking-[0.2em] uppercase text-[11px] px-8 rounded-sm hover:bg-stone-800 transition-colors" type="button" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-stone-800 mb-4">check_circle</span>
                <p className="text-xl font-serif italic text-stone-900 leading-relaxed mb-8 max-w-md mx-auto">
                  Transfer details submitted. Our concierge team will verify the ledger and contact you within 2-4 hours.
                </p>
                <button onClick={() => setIsModalOpen(false)} className="text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-stone-900 border-b border-stone-500 pb-1">
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
