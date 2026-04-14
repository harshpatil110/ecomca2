import { Link } from 'react-router-dom';

export default function CreateListingAdmin() {
  return (
    <div className="pt-8 pb-32 px-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-6 gap-6">
        <div>
          <Link to="/admin/listings" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Listings
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            Draft New Listing
          </h1>
        </div>
      </div>

      <form className="space-y-16" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Section 1 - Basic Info */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Title</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="e.g. The Monolith House" />
            </div>
            <div className="flex flex-col space-y-2 relative">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">List Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                <input type="text" className="w-full bg-[#fbf9f4] border border-stone-200 rounded-sm pl-8 pr-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="4,850,000" />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Property Type</label>
              <select className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm appearance-none cursor-pointer">
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
                <option value="estate">Estate</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 - Media */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">Property Media</h2>
          <div className="border-2 border-dashed border-stone-300 rounded-sm p-16 flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#f5f4ed] cursor-pointer transition-colors group">
            <span className="material-symbols-outlined text-4xl text-stone-400 mb-4 group-hover:text-stone-900 transition-colors">cloud_upload</span>
            <p className="text-sm font-bold text-stone-900 mb-1">Upload High-Resolution Imagery</p>
            <p className="text-xs font-serif italic text-stone-500">Drag and drop or click to browse (Max 50MB per file)</p>
          </div>
        </div>

        {/* Section 3 - Key Details */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">Key Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Bedrooms</label>
              <input type="number" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="4" />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Bathrooms</label>
              <input type="number" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="3.5" />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Square Footage</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="4,200" />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Year Built</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="2022" />
            </div>
          </div>
        </div>

        {/* Section 4 - Description & Location */}
        <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm space-y-6">
          <h2 className="text-sm font-black tracking-[0.2em] uppercase text-stone-900 border-b border-stone-100 pb-4 mb-6">Description & Location</h2>
          
          <div className="flex flex-col space-y-2 pt-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Editorial Description</label>
            <textarea rows="6" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm resize-none" placeholder="Weave the narrative of this property's architectural significance..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="flex flex-col space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Street Address</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="123 Architectural Way" />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">City</label>
              <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="Los Angeles" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">State</label>
                <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="CA" />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Zip Code</label>
                <input type="text" className="bg-[#fbf9f4] border border-stone-200 rounded-sm px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors text-sm" placeholder="90001" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-6 pt-8 border-t border-stone-200">
          <button type="button" className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-stone-900 border border-stone-900 rounded-sm hover:bg-[#fbf9f4]/50 transition-colors">
            Save Draft
          </button>
          <button type="button" className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-[#31332c] hover:bg-stone-800 rounded-sm transition-colors shadow-sm">
            Publish Listing
          </button>
        </div>
      </form>
    </div>
  );
}
