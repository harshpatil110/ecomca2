import { Link } from 'react-router-dom';

export default function SavedProperties() {
  const savedListings = [
    {
      id: "1",
      title: "THE MONOLITH HOUSE",
      location: "Silver Lake, Los Angeles",
      price: "₹4,850,000",
      img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "2",
      title: "THE GLASS PAVILION",
      location: "Hollywood Hills, Los Angeles",
      price: "₹6,200,000",
      img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="pt-8 pb-24 px-8 max-w-screen-2xl mx-auto min-h-screen">
      <div className="mb-12 border-b border-stone-200/60 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] text-[#31332c] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            PRIVATE COLLECTION
          </h1>
          <p className="text-xl font-serif italic text-stone-500">
            Curated properties explicitly saved for your review.
          </p>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-[#31332c]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {savedListings.length} Saved Properties
        </p>
      </div>

      {savedListings.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-2xl font-serif italic text-stone-400">Your collection is currently empty.</p>
          <Link to="/explore">
            <button className="mt-8 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs px-8 py-3 rounded-sm hover:bg-stone-800 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              Explore Properties
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedListings.map((property) => (
            <div key={property.id} className="group flex flex-col">
              <Link to={`/property/${property.id}`} className="block w-full h-[450px] overflow-hidden rounded-sm mb-4 bg-stone-200">
                <img
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={property.img}
                />
              </Link>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {property.location}
                  </p>
                  <Link to={`/property/${property.id}`}>
                    <h3 className="text-xl font-black tracking-tight text-[#31332c] hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {property.title}
                    </h3>
                  </Link>
                  <p className="text-lg font-serif italic text-stone-600 mt-1">
                    {property.price}
                  </p>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-800 transition-colors pt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Unsave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
