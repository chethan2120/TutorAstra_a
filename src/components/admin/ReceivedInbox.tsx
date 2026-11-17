'use client';

import React, { useEffect, useState } from 'react';

export default function ReceivedInbox() {
  const [rows, setRows] = useState<any[]>([]);

  const load = () => {
    fetch('/api/admin/enquiries').then((response) => response.json()).then((body) => setRows(body.enquiries || []));
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="text-base font-black text-slate-900">Information received</h2>
      <p className="mt-1 text-xs text-slate-500">Consultation and contact messages stay here until you delete one.</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <article key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#E8E2ED] p-3 text-sm">
            <div>
              <p className="font-bold">{row.name} · {row.type}</p>
              <p className="text-slate-600">{row.email} · {row.phone}</p>
              <p className="mt-1">{row.message || row.subject || 'No message text'}</p>
            </div>
            <button type="button" className="text-xs font-bold text-rose-700" onClick={async () => { await fetch(`/api/admin/enquiries/${row.id}`, { method: 'DELETE' }); load(); }}>Delete</button>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">No message has been sent yet.</p>}
      </div>
    </section>
  );
}
