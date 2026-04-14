export default function NotificationsAdmin() {
  return (
    <div className="pt-8 pb-20 px-12 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-stone-200 pb-6 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            Notifications
          </h1>
          <p className="text-lg font-serif italic text-stone-500 mt-2">
            System alerts, operational flags, and firm updates.
          </p>
        </div>
        <button className="text-[10px] font-bold uppercase tracking-widest text-[#46617f] hover:text-[#1d3a56] transition-colors bg-[#bedafd]/20 px-4 py-2 rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {[
          { type: 'crm', time: '12 minutes ago', title: 'New CRM Insight Flagged', desc: 'A high-intent buyer matched with The Glass Pavilion.', unread: true },
          { type: 'sales', time: '2 hours ago', title: 'Property #1042 Sold', desc: 'Contract finalized for the Brutalist Villa.', unread: true },
          { type: 'sys', time: 'Yesterday', title: 'New User Registration', desc: 'Alexander Pierce has requested broker verification.', unread: false },
          { type: 'marketing', time: 'Oct 12, 10:00 AM', title: 'Ad Campaign Completed', desc: 'The Fall Collection campaign has exhausted its allocated budget.', unread: false },
        ].map((notif, i) => (
          <div key={i} className={`p-6 border rounded-sm shadow-sm flex gap-6 ${notif.unread ? 'bg-white border-stone-300' : 'bg-[#fbf9f4] border-stone-200/50 opacity-70'}`}>
            <div className={`mt-1 material-symbols-outlined ${notif.unread ? 'text-stone-900' : 'text-stone-400'}`}>
              {notif.type === 'crm' ? 'group' : notif.type === 'sales' ? 'payments' : notif.type === 'sys' ? 'person' : 'campaign'}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className={`text-sm font-bold tracking-tight ${notif.unread ? 'text-stone-900' : 'text-stone-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{notif.title}</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>{notif.time}</span>
              </div>
              <p className="text-sm font-serif italic text-stone-600">{notif.desc}</p>
            </div>
            {notif.unread && (
              <div className="w-2 h-2 rounded-full bg-[#1d3a56] mt-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
