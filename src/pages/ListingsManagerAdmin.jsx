import { Link } from 'react-router-dom';

export default function ListingsManagerAdmin() {
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
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#46617f] hover:underline transition-all">View</button>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:underline transition-all">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
