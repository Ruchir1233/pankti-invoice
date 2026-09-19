import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Invoice, Client } from '../lib/supabase'
import { Plus, Search, ChevronRight, Loader, Download, Share2, ArrowLeft, X, Pencil } from 'lucide-react'
import NewInvoiceForm from './NewInvoiceForm'
import InvoicePrint from './InvoicePrint'

const COLORS = [
  { label: 'Orange',  bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  { label: 'Blue',    bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  { label: 'Green',   bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-500' },
  { label: 'Purple',  bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  { label: 'Red',     bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  { label: 'Yellow',  bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
]

export default function InvoicesTab({ filterClient, onClearFilter }: { filterClient?: Client, onClearFilter?: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [colorPicker, setColorPicker] = useState<string | null>(null) // invoice id
  const [invColors, setInvColors] = useState<Record<string, number>>({}) // invoice id -> color index

  useEffect(() => { fetchInvoices() }, [filterClient])

  // Load colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('inv_colors')
    if (saved) setInvColors(JSON.parse(saved))
  }, [])

  function saveColor(invId: string, idx: number) {
    const next = { ...invColors, [invId]: idx }
    setInvColors(next)
    localStorage.setItem('inv_colors', JSON.stringify(next))
    setColorPicker(null)
  }

  async function fetchInvoices() {
    setLoading(true)
    let q = supabase
      .from('invoices')
      .select('*, clients(*), invoice_items(*)')
      .order('invoice_no', { ascending: false })
    if (filterClient) q = q.eq('client_id', filterClient.id)
    const { data } = await q
    if (data) setInvoices(data as Invoice[])
    setLoading(false)
  }

  const filtered = invoices.filter(inv => {
    const s = search.toLowerCase()
    return (
      inv.clients?.name?.toLowerCase().includes(s) ||
      String(inv.invoice_no).includes(s) ||
      inv.date.includes(s)
    )
  })

  function handlePrint() { setTimeout(() => window.print(), 200) }

  function handleShare(inv: Invoice) {
    const text = `Invoice No: ${String(inv.invoice_no).padStart(2,'0')}\nClient: ${inv.clients?.name}\nDate: ${new Date(inv.date).toLocaleDateString('en-IN')}\nTotal: ₹${inv.total.toLocaleString('en-IN')}\n\nPankti Engineering\nDhamdachi, Valsad | 9879523937`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // Invoice detail view
  if (selected) {
    return (
      <>
        <div className="flex flex-col h-full print:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button onClick={() => setSelected(null)}><ArrowLeft size={20} className="text-gray-500" /></button>
            <h2 className="font-bold flex-1">Invoice #{String(selected.invoice_no).padStart(2,'0')}</h2>
            <button onClick={() => { setEditInvoice(selected); setSelected(null) }}
              className="p-2 bg-blue-50 rounded-xl"><Pencil size={18} className="text-blue-500" /></button>
            <button onClick={() => handleShare(selected)} className="p-2 bg-green-50 rounded-xl">
              <Share2 size={18} className="text-green-600" /></button>
            <button onClick={handlePrint} className="p-2 bg-orange-50 rounded-xl">
              <Download size={18} className="text-orange-500" /></button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <div className="overflow-x-auto"><InvoicePrint invoice={selected} /></div>
          </div>
        </div>
        <div className="hidden print:block"><InvoicePrint invoice={selected} /></div>
      </>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {filterClient && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-100">
          <span className="text-sm font-medium text-orange-700 flex-1">Invoices: {filterClient.name}</span>
          <button onClick={onClearFilter}><X size={16} className="text-orange-500" /></button>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client, invoice no..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-orange-400" />
        </div>
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-2.5 rounded-xl">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader className="animate-spin text-orange-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No invoices yet</div>
        ) : filtered.map(inv => {
          const colorIdx = invColors[inv.id] ?? 0
          const color = COLORS[colorIdx]
          return (
            <div key={inv.id} className="relative">
              <button onClick={() => setSelected(inv)}
                className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-left">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                        #{String(inv.invoice_no).padStart(2,'0')}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{inv.clients?.name}</p>
                    <p className="text-xs text-gray-400">{inv.invoice_items?.length || 0} item(s)</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="font-bold text-orange-600">₹{inv.total.toLocaleString('en-IN')}</span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              </button>

              {/* Action buttons on card */}
              <div className="absolute top-3 right-10 flex gap-1">
                {/* Color dot button */}
                <button onClick={e => { e.stopPropagation(); setColorPicker(colorPicker === inv.id ? null : inv.id) }}
                  className={`w-5 h-5 rounded-full border-2 border-white shadow ${color.dot}`} />
              </div>

              {/* Edit button */}
              <button onClick={() => setEditInvoice(inv)}
                className="absolute bottom-3 right-4 p-1 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                <Pencil size={13} className="text-gray-400 hover:text-blue-500" />
              </button>

              {/* Color picker popup */}
              {colorPicker === inv.id && (
                <div className="absolute top-10 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-20 flex gap-2">
                  {COLORS.map((c, idx) => (
                    <button key={idx} onClick={() => saveColor(inv.id, idx)}
                      className={`w-7 h-7 rounded-full ${c.dot} ${colorIdx === idx ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {(showForm || editInvoice) && (
        <NewInvoiceForm
          preClient={filterClient}
          editInvoice={editInvoice || undefined}
          onDone={() => { setShowForm(false); setEditInvoice(null); fetchInvoices() }}
        />
      )}
    </div>
  )
}
