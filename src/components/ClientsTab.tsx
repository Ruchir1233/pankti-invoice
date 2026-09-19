import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, User, ChevronRight, X, Loader } from 'lucide-react'
import type { Client } from '../lib/supabase'

const empty = { name: '', address: '', gstin: '', state: 'Gujarat', phone: '' }

export default function ClientsTab({ onClientInvoices }: { onClientInvoices: (c: Client) => void }) {
  const [clients, setClients] = useState<(Client & { invoice_count?: number })[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.gstin.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search + Add */}
      <div className="p-4 space-y-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
        />
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-2.5 rounded-xl">
          <Plus size={18} /> Add Client
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader className="animate-spin text-orange-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No clients yet</div>
        ) : filtered.map(c => (
          <button key={c.id} onClick={() => onClientInvoices(c)}
            className="w-full bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm text-left">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{c.name}</p>
              <p className="text-xs text-gray-400 truncate">{c.gstin || c.phone}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-1 rounded-full">
                {c.invoice_count} inv
              </span>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </button>
        ))}
      </div>

      {/* Add Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
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
