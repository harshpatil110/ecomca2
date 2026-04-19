import { useState, useMemo } from 'react';
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

  // Payment State
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [isWireModalOpen, setIsWireModalOpen] = useState(false);
  const [wireSubmitted, setWireSubmitted] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handleRazorpayPayment = async () => {
    setIsPaymentLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.');
      setIsPaymentLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      amount: 1000000,
      currency: 'INR',
      name: 'Lumina Realty',
      description: 'Booking Deposit - The Lumina Heights',
      theme: { color: '#1C1917' },
      handler: function (response) {
        console.log('Payment Successful. ID:', response.razorpay_payment_id);
        setIsPaymentLoading(false);
        setPaymentFailed(false);
        navigate('/');
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

  // EMI Calculator State
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  
  const basePrice = 28500000; // ₹2.85 Cr
  const downPayment = (basePrice * downPaymentPct) / 100;
  const loanPrincipal = basePrice - downPayment;
  
  const estimatedEMI = useMemo(() => {
    const r = interestRate / (12 * 100);
    const n = loanTenure * 12;
    if (r === 0) return loanPrincipal / n;
    return (loanPrincipal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [loanPrincipal, interestRate, loanTenure]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24 font-sans text-stone-800">
      
      {/* 1. Hero & Overview Section */}
      <div className="max-w-screen-xl mx-auto px-6 pt-12">
        <div className="relative w-full h-[500px] md:h-[600px] mb-8 overflow-hidden rounded-xl shadow-sm border border-gray-200">
          <img src="/brutalist_exterior.png" alt="Property Exterior" className="w-full h-full object-cover" />
          <div className="absolute top-6 right-6">
            <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-sm border border-gray-100 text-stone-800">
              <span className="material-symbols-outlined text-emerald-600 text-base">explore</span>
              North-East Facing Entrance
            </span>
          </div>
        </div>
        
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif text-stone-900 mb-4 leading-tight">The Lumina Heights</h1>
          <p className="text-lg text-stone-500 font-sans tracking-wide uppercase font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">location_on</span>
            Plot 12, Financial District, Hyderabad
          </p>
        </div>

        {/* 2. Spatial Details & Floor Plans */}
        <section className="mb-20 pb-20 border-b border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-serif text-stone-900 mb-6">Spatial Integrity</h2>
              <p className="text-stone-500 mb-8 leading-relaxed text-lg">
                Transparent, RERA-compliant measurements ensuring you get exactly the space you invest in.
              </p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-2 p-6 border-b border-gray-100 items-center">
                  <span className="text-sm font-semibold uppercase tracking-widest text-stone-400">RERA Carpet Area</span>
                  <span className="text-xl font-medium text-right font-sans text-stone-900">1,450 sq.ft.</span>
                </div>
                <div className="grid grid-cols-2 p-6 border-b border-gray-100 items-center bg-gray-50/50">
                  <span className="text-sm font-semibold uppercase tracking-widest text-stone-400">Built-Up Area</span>
                  <span className="text-xl font-medium text-right font-sans text-stone-900">1,720 sq.ft.</span>
                </div>
                <div className="grid grid-cols-2 p-6 items-center">
                  <span className="text-sm font-semibold uppercase tracking-widest text-stone-400">Super Built-Up Area</span>
                  <span className="text-xl font-medium text-right font-sans text-stone-900">2,100 sq.ft.</span>
                </div>
              </div>
            </div>
            <div className="relative group rounded-xl overflow-hidden shadow-sm h-full hidden lg:block border border-gray-200">
              <img src="/luxury_living_room.png" alt="Floor Plan Placeholder" className="w-full h-full object-cover min-h-[350px] opacity-90 blur-[2px] transition-all duration-500 group-hover:blur-0" />
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/10 hover:bg-transparent transition-colors">
                <button className="bg-white/95 backdrop-blur text-stone-900 px-6 py-3 rounded-full flex items-center gap-3 font-semibold text-sm hover:scale-105 transition-transform shadow-xl border border-gray-100">
                  <span className="material-symbols-outlined">download</span>
                  Download Blueprint (PDF)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Transparent Financials & EMI Calculator */}
        <section className="mb-20 pb-20 border-b border-gray-200">
          <h2 className="text-3xl font-serif text-stone-900 mb-10 text-center">Financial Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Breakdown Card */}
            <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-stone-800 rounded-full blur-[100px] -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
              <h3 className="text-xl font-serif mb-8 text-stone-100">Pricing Breakdown</h3>
              
              <div className="space-y-4 font-sans text-sm tracking-wide">
                <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                  <span className="text-stone-400">Base Price (2,100 sqft)</span>
                  <span className="font-semibold text-lg text-white">₹2,85,00,000</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                  <span className="text-stone-400">Est. Stamp Duty & Reg (7%)</span>
                  <span className="font-medium text-stone-200">₹19,95,000</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                  <span className="text-stone-400">GST (5% under const.)</span>
                  <span className="font-medium text-stone-200">₹14,25,000</span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                  <span className="text-stone-400 leading-tight">Additional Charges <br/><span className="text-xs opacity-60 font-light tracking-normal">(Covered Parking, PLC, Club)</span></span>
                  <span className="font-medium text-stone-200">₹8,00,000</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-stone-400">Est. Monthly Maintenance</span>
                  <span className="font-medium text-stone-200">₹10,500/mo</span>
                </div>
              </div>
              
              <div className="mt-10 pt-6 border-t border-stone-700 flex justify-between items-end">
                <span className="text-stone-300 font-serif uppercase tracking-widest text-xs">Total Est. Cost</span>
                <span className="text-3xl font-bold font-sans text-white">₹3,27,20,000</span>
              </div>
            </div>

            {/* EMI Calculator */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col justify-between">
              <h3 className="text-xl font-serif text-stone-900 mb-8 border-b border-gray-100 pb-4">EMI Scenario Calculator</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
                <div className="space-y-8 flex-1">
                  {/* Sliders */}
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans">Down Payment</label>
                      <span className="font-sans font-semibold text-stone-900 text-sm">{downPaymentPct}% (₹{(downPayment/100000).toFixed(1)}L)</span>
                    </div>
                    <input type="range" min="10" max="80" step="5" value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} className="w-full accent-stone-900 cursor-pointer" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans">Interest Rate</label>
                      <span className="font-sans font-semibold text-stone-900 text-sm">{interestRate}%</span>
                    </div>
                    <input type="range" min="6.5" max="15" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full accent-stone-900 cursor-pointer" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 font-sans">Loan Tenure</label>
                      <span className="font-sans font-semibold text-stone-900 text-sm">{loanTenure} Years</span>
                    </div>
                    <input type="range" min="5" max="30" step="1" value={loanTenure} onChange={(e) => setLoanTenure(Number(e.target.value))} className="w-full accent-stone-900 cursor-pointer" />
                  </div>
                </div>
                
                <div className="bg-[#fbfcfa] border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">Est. Monthly EMI</span>
                  <div className="text-4xl lg:text-5xl font-black text-stone-900 font-sans mb-3 tracking-tight">
                    ₹{Math.round(estimatedEMI).toLocaleString('en-IN')}
                  </div>
                  <p className="text-stone-400 text-sm italic font-serif">Based on ₹{(loanPrincipal/10000000).toFixed(2)} Cr loan details</p>
                  <button onClick={handleRazorpayPayment} disabled={isPaymentLoading} className="mt-8 w-full border border-stone-900 bg-stone-900 text-white font-semibold uppercase tracking-wider py-4 rounded-lg text-[11px] hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                    {isPaymentLoading ? (
                      <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Processing...</>
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">lock</span> Secure with ₹10,000 Deposit</>
                    )}
                  </button>
                  <button onClick={() => setIsWireModalOpen(true)} className="mt-4 w-full border border-stone-200 bg-white text-stone-800 font-semibold uppercase tracking-wider py-4 rounded-lg text-[11px] hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span> Full Payment via IMPS/NEFT
                  </button>
                  {paymentFailed && <p className="text-[#9e422c] text-[10px] uppercase tracking-widest font-bold mt-4">Payment cancelled or failed.</p>}
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* 4. Amenities & Specifications */}
        <section className="mb-20 pb-20 border-b border-gray-200">
          <h2 className="text-3xl font-serif text-stone-900 mb-10 text-center">Lifestyle & Conveniences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-500">
                <span className="material-symbols-outlined">pool</span>
              </div>
              <h4 className="font-sans font-bold text-stone-900 mb-4 text-xs tracking-widest uppercase border-b border-gray-100 pb-2">Recreation</h4>
              <ul className="space-y-3 text-stone-600 text-sm font-sans">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Infinity Pool</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Grand Clubhouse</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> State-of-the-art Gym</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-500">
                <span className="material-symbols-outlined">park</span>
              </div>
              <h4 className="font-sans font-bold text-stone-900 mb-4 text-xs tracking-widest uppercase border-b border-gray-100 pb-2">Outdoor</h4>
              <ul className="space-y-3 text-stone-600 text-sm font-sans">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Jogging Track</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Kids' Play Area</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Zen Gardens</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-500">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h4 className="font-sans font-bold text-stone-900 mb-4 text-xs tracking-widest uppercase border-b border-gray-100 pb-2">Essentials</h4>
              <ul className="space-y-3 text-stone-600 text-sm font-sans">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> 24/7 Power Backup</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Piped Gas Network</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> High-speed Lifts</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-500">
                <span className="material-symbols-outlined">security</span>
              </div>
              <h4 className="font-sans font-bold text-stone-900 mb-4 text-xs tracking-widest uppercase border-b border-gray-100 pb-2">Security</h4>
              <ul className="space-y-3 text-stone-600 text-sm font-sans">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> 3-Tier Security</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> CCTV Monitoring</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-stone-300 rounded-full"></span> Video Door Phone</li>
              </ul>
            </div>
            
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
            <div className="shrink-0 text-center md:text-left">
               <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">construction</span>
               <h4 className="font-serif italic text-2xl text-stone-900">Interior Specs</h4>
            </div>
            <p className="text-stone-500 font-sans leading-relaxed text-sm md:border-l md:border-gray-100 md:pl-8">
              Residences feature imported large-format Vitrified tiles across living areas, premium anti-skid ceramic tiles in balconies. Bathrooms are outfitted with wall-mounted European water closets and CP fittings from Jaguar or equivalent brands. Kitchens include prime granite countertops with a stainless steel sink and comprehensive layout provision.
            </p>
          </div>
        </section>

        {/* 5. Neighborhood Insights & Proximity */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-serif text-stone-900 mb-2">Neighborhood Insights</h2>
              <p className="text-stone-500 font-sans text-sm">Strategic connectivity meeting everyday luxury convenience.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-full border border-gray-200 shadow-sm w-fit">
              <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-white font-black font-sans text-lg ring-4 ring-stone-100">
                8.5
              </div>
              <div className="pr-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Neighborhood Score</p>
                <p className="text-sm font-semibold text-stone-800">Excellent Livability</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 bg-gray-100 rounded-2xl overflow-hidden min-h-[450px] relative shadow-sm border border-gray-200">
              <img src="/architectural_detail.png" alt="Map Area Context" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000" />
              <div className="absolute inset-0 bg-stone-900/5 hover:bg-transparent transition-colors"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white/95 backdrop-blur-md px-8 py-5 rounded-2xl shadow-xl text-center border border-gray-100 cursor-pointer hover:scale-105 transition-transform">
                   <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-800">
                     <span className="material-symbols-outlined text-2xl">location_on</span>
                   </div>
                   <p className="font-serif font-medium text-stone-900 text-lg">Interactive Map</p>
                   <p className="text-xs text-stone-400 font-sans tracking-wide uppercase mt-1">Tap to explore</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm h-full flex flex-col justify-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-8 font-sans border-b border-gray-100 pb-4">Proximity Tracker</h3>
                
                <ul className="space-y-8">
                  <li className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-100">
                      <span className="material-symbols-outlined text-lg">school</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 font-sans text-sm">International Schools</p>
                      <p className="text-xs font-medium text-stone-500 mt-1.5 uppercase tracking-wide">1.2 km / 5 mins drive</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-full bg-stone-50 text-stone-600 flex items-center justify-center shrink-0 border border-stone-100">
                      <span className="material-symbols-outlined text-lg">storefront</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 font-sans text-sm">Commercial IT Park</p>
                      <p className="text-xs font-medium text-stone-500 mt-1.5 uppercase tracking-wide">4.0 km / 15 mins drive</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-full bg-zinc-50 text-zinc-600 flex items-center justify-center shrink-0 border border-zinc-100">
                      <span className="material-symbols-outlined text-lg">train</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 font-sans text-sm">Metro Transit Station</p>
                      <p className="text-xs font-medium text-stone-500 mt-1.5 uppercase tracking-wide">800 m / 10 mins walk</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-full bg-neutral-50 text-neutral-600 flex items-center justify-center shrink-0 border border-neutral-100">
                      <span className="material-symbols-outlined text-lg">local_hospital</span>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 font-sans text-sm">Multi-specialty Hospital</p>
                      <p className="text-xs font-medium text-stone-500 mt-1.5 uppercase tracking-wide">2.5 km / 8 mins drive</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Wire Transfer Modal */}
      {isWireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsWireModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
            <button onClick={() => setIsWireModalOpen(false)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-2xl font-serif text-stone-900 mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-stone-400">account_balance</span>
              Wire Transfer / NEFT
            </h2>
            
            {!wireSubmitted ? (
              <div className="space-y-6">
                <div className="bg-[#fbfcfa] p-6 border border-stone-200 rounded-xl shadow-sm">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-5 font-sans flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-stone-400">shield_lock</span> Escrow Ledger Details</h3>
                  <div className="space-y-4 text-sm font-sans text-stone-700">
                    <p className="flex flex-col sm:flex-row sm:justify-between border-b border-stone-100 pb-3"><span className="text-stone-500 text-xs uppercase tracking-widest font-semibold mb-1 sm:mb-0">Beneficiary</span> <span className="font-bold text-stone-900 text-base">Lumina Realty Escrow</span></p>
                    <p className="flex flex-col sm:flex-row sm:justify-between border-b border-stone-100 pb-3"><span className="text-stone-500 text-xs uppercase tracking-widest font-semibold mb-1 sm:mb-0">Bank Name</span> <span className="font-semibold text-stone-900">Standard Chartered Bank</span></p>
                    <p className="flex flex-col sm:flex-row sm:justify-between border-b border-stone-100 pb-3"><span className="text-stone-500 text-xs uppercase tracking-widest font-semibold mb-1 sm:mb-0">Account Number</span> <span className="font-mono font-bold text-stone-900 text-lg tracking-wider">0001992847563</span></p>
                    <p className="flex flex-col sm:flex-row sm:justify-between border-b border-stone-100 pb-3"><span className="text-stone-500 text-xs uppercase tracking-widest font-semibold mb-1 sm:mb-0">IFSC Code</span> <span className="font-mono font-bold text-stone-900 text-base tracking-widest">SCBL0036078</span></p>
                    <p className="pt-2 text-stone-500 italic text-xs leading-relaxed">Reference Note: Please transfer the full amount and include the Property ID <span className="font-bold">LUM-742</span> in your transfer remarks.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-600 mb-3 font-sans">Transaction Reference Number (UTR / IMPS Ref)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="flex-1 bg-white border border-gray-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 rounded-lg py-3 px-4 outline-none transition-all font-mono text-sm shadow-inner" placeholder="e.g. TRN912837482" type="text" />
                    <button onClick={() => { if(transactionId) setWireSubmitted(true); }} disabled={!transactionId} className="bg-stone-900 text-white font-bold tracking-wider uppercase text-[11px] px-8 py-3 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center shrink-0 flex items-center gap-2 justify-center shadow-md">
                      <span className="material-symbols-outlined text-[16px]">verified</span> Verify UTR
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-6xl text-emerald-600 mb-6 bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-sm">check_circle</span>
                <h3 className="text-2xl font-serif text-stone-900 mb-3">Details Submitted</h3>
                <p className="text-sm font-sans text-stone-500 leading-relaxed max-w-sm mx-auto mb-10">
                  We have received your UTR number (<span className="font-mono font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">{transactionId}</span>). Our concierge team will verify the ledger with the bank and email your receipt within 2-4 hours.
                </p>
                <button onClick={() => { setIsWireModalOpen(false); setWireSubmitted(false); setTransactionId(''); }} className="w-full border border-stone-200 bg-white text-stone-800 font-semibold uppercase tracking-wider py-4 rounded-lg text-[11px] hover:bg-stone-50 transition-colors shadow-sm">
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
