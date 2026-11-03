import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, User, ChevronRight, X, Loader, Trash2 } from 'lucide-react'
import type { Client } from '../lib/supabase'
import { useBackClose } from '../utils/useBackClose'

const empty = { name: '', address: '', gstin: '', state: 'Gujarat', phone: '' }

export default function ClientsTab({ onClientInvoices }: { onClientInvoices: (c: Client) => void }) {
  const [clients, setClients] = useState<(Client & { invoice_count?: number })[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [delClient, setDelClient] = useState<(Client & { invoice_count?: number }) | null>(null)
  const [deleting, setDeleting] = useState(false)

  useBackClose(showForm, () => setShowForm(false))
  useBackClose(!!delClient, () => setDelClient(null))
  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*, invoices(count)')
      .order('created_at', { ascending: false })
    if (data) setClients(data.map((c: any) => ({ ...c, invoice_count: c.invoices?.[0]?.count ?? 0 })))
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('clients').insert([form])
    setSaving(false)
    setForm(empty)
    setShowForm(false)
    fetchClients()
  }

  async function doDelete() {
    if (!delClient) return
    setDeleting(true)
    const { error } = await supabase.from('clients').delete().eq('id', delClient.id)
    setDeleting(false)
    if (error) { alert('Could not delete client'); return }
    setDelClient(null)
    fetchClients()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.gstin.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search + Add */}
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center">
        <h1 className="hidden md:block text-2xl font-extrabold mr-auto">Clients</h1>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="sm:w-72 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
        />
        <button onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl">
          <Plus size={18} /> Add Client
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader className="animate-spin text-orange-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No clients yet</div>
        ) : filtered.map(c => (
          <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <button onClick={() => onClientInvoices(c)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-400 truncate">{c.gstin || c.phone || '—'}</p>
              </div>
              <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-1 rounded-full flex-shrink-0">{c.invoice_count} inv</span>
              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
            </button>
            <button onClick={() => setDelClient(c)} title="Delete client" className="p-2 rounded-xl bg-red-50 hover:bg-red-100 flex-shrink-0">
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        ))}
        </div>
      </div>

      {delClient && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            {(delClient.invoice_count ?? 0) > 0 ? (
              <>
                <h3 className="font-bold text-lg">Can't delete yet</h3>
                <p className="text-sm text-slate-500">{delClient.name} still has {delClient.invoice_count} invoice(s). Delete those invoices first, then delete the client.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDelClient(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600">OK</button>
                  <button onClick={() => { const c = delClient; setDelClient(null); onClientInvoices(c) }} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold">View invoices</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg">Delete {delClient.name}?</h3>
                <p className="text-sm text-slate-500">This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDelClient(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600">Cancel</button>
                  <button onClick={doDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold flex items-center justify-center">
                    {deleting ? <Loader size={18} className="animate-spin" /> : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Add Client</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {[
              { label: 'Client Name (M/s)*', key: 'name', placeholder: 'M/s ABC Enterprises' },
              { label: 'Address', key: 'address', placeholder: '203, 2nd Floor, ABC Road...' },
              { label: 'GSTIN', key: 'gstin', placeholder: '24ABCDE1234F1Z5' },
              { label: 'State', key: 'state', placeholder: 'Gujarat' },
              { label: 'Phone', key: 'phone', placeholder: '9879523937' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </div>
            ))}
            <button onClick={save} disabled={saving}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
              {saving ? <Loader size={18} className="animate-spin" /> : 'Save Client'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
