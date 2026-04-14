import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ListingsManagerAdmin() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const listings = [
    { id: 1, name: 'The Monolith House', city: 'Los Angeles', price: '$4,850,000', status: 'Exclusive', views: '2.4k' },
    { id: 2, name: 'Glass Pavilion', city: 'Hollywood Hills', price: '$6,200,000', status: 'Draft', views: '-' },
    { id: 3, name: 'Brutalist Villa', city: 'Malibu', price: '$8,100,000', status: 'Sold', views: '14.2k' },
    { id: 4, name: 'Concrete Sanctuary', city: 'Joshua Tree', price: '$2,900,000', status: 'Exclusive', views: '1.1k' },
  ];

  return (
    <div className="pt-8 pb-20 px-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            Listings Management
          </h1>
          <p className="text-lg font-serif italic text-stone-500 mt-2">
            Organize and curate architectural properties.
          </p>
        </div>
        <Link to="/admin/listings/new" className="bg-stone-900 text-white font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-sm hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="material-symbols-outlined text-sm pt-[1px]">add</span>
          Draft New Listing
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead className="bg-[#f5f4ed]">
              <tr className="border-b border-stone-200">
                <th className="py-6 px-8 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">Property</th>
                <th className="py-6 px-8 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">Status</th>
                <th className="py-6 px-8 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400">List Price</th>
                <th className="py-6 px-8 font-black text-[10px] tracking-[0.2em] uppercase text-stone-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-stone-600 divide-y divide-stone-200/60">
              {listings.map((item) => (
                <tr key={item.id} className="hover:bg-[#fbf9f4] transition-colors">
                  <td className="py-6 px-8">
                    <p className="text-stone-900 font-bold">{item.name}</p>
                    <p className="text-xs text-stone-400 italic font-serif">{item.city}</p>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                      item.status === 'Exclusive' ? 'bg-[#bedafd]/30 text-[#1d3a56]' :
                      item.status === 'Sold' ? 'bg-[#e8e9e0] text-[#5e6058]' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <p className="font-serif italic text-stone-800">{item.price}</p>
                  </td>
                  <td className="py-6 px-8 text-right space-x-6">
                    <button onClick={() => { setSelectedProperty(item); setIsViewModalOpen(true); }} className="text-[10px] font-bold uppercase tracking-widest text-[#46617f] hover:underline transition-all">View</button>
                    <button onClick={() => { setSelectedProperty(item); setIsEditModalOpen(true); }} className="text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:underline transition-all">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-stone-900 text-white px-6 py-4 rounded-sm shadow-xl z-50 flex items-center gap-3 animate-[fade-in_0.3s_ease-out]">
          <span className="material-symbols-outlined text-[18px] text-[#bedafd]">check_circle</span>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Changes Saved</p>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-200 w-full max-w-md rounded-sm shadow-xl p-8">
            <h2 className="text-3xl font-serif italic text-stone-900 mb-2">{selectedProperty.name}</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedProperty.city}
            </p>
            <div className="space-y-4 mb-8">
               <div className="py-3 border-b border-stone-200 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>Status</span>
                 <span className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                      selectedProperty.status === 'Exclusive' ? 'bg-[#bedafd]/30 text-[#1d3a56]' :
                      selectedProperty.status === 'Sold' ? 'bg-[#e8e9e0] text-[#5e6058]' :
                      'bg-stone-100 text-stone-500'
                 }`}>
                   {selectedProperty.status}
                 </span>
               </div>
               <div className="py-3 border-b border-stone-200 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>List Price</span>
                 <span className="font-serif italic text-stone-900">{selectedProperty.price}</span>
               </div>
            </div>
            <div className="text-right">
              <button onClick={() => setIsViewModalOpen(false)} className="text-[10px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                 Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-[#fbf9f4] border border-stone-200 w-full max-w-lg rounded-sm shadow-xl p-8">
            <h2 className="text-2xl font-serif italic text-stone-900 mb-6 border-b border-stone-200 pb-4">Edit Listing Details</h2>
            
            <form className="space-y-5" onSubmit={(e) => {
               e.preventDefault();
               setIsEditModalOpen(false);
               setShowToast(true);
               setTimeout(() => setShowToast(false), 3000);
            }}>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Property Name</label>
                <input defaultValue={selectedProperty.name} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900" type="text" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Location</label>
                <input defaultValue={selectedProperty.city} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900" type="text" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>List Price</label>
                  <input defaultValue={selectedProperty.price} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900" type="text" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Status</label>
                  <select defaultValue={selectedProperty.status} className="w-full bg-white border border-stone-200 focus:border-stone-900 focus:ring-0 rounded-sm py-3 px-4 font-serif text-stone-900 appearance-none">
                    <option value="Draft">Draft</option>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-stone-200 flex justify-end gap-6 items-center">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-[10px] uppercase font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Cancel
                </button>
                <button type="submit" className="bg-stone-900 text-white font-bold text-[10px] uppercase tracking-widest py-3 px-8 rounded-sm hover:bg-stone-800 transition-colors shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
