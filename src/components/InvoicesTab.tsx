import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Invoice, Client } from '../lib/supabase'
import { Plus, Search, ChevronRight, Loader, Download, Share2, ArrowLeft, X, Pencil } from 'lucide-react'
import NewInvoiceForm from './NewInvoiceForm'
import InvoicePrint from './InvoicePrint'

const COLORS = [
  { label: 'Orange',  bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  { label: 'Blue',    bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  { label: 'Green',   bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-400' },
  { label: 'Purple',  bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-400' },
  { label: 'Red',     bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400' },
  { label: 'Yellow',  bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-400' },
]

export default function InvoicesTab({ filterClient, onClearFilter }: { filterClient?: Client, onClearFilter?: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [colorPicker, setColorPicker] = useState<string | null>(null)
  const [invColors, setInvColors] = useState<Record<string, number>>({})
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => { fetchInvoices() }, [filterClient])
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

  async function handleDownload(inv: Invoice) {
    setPdfLoading(true)
    try {
      const { downloadInvoicePDF } = await import('../utils/pdfExport')
      await downloadInvoicePDF(inv)
    } catch(e) { alert('Could not generate PDF') }
    setPdfLoading(false)
  }

  async function handleShare(inv: Invoice) {
    setPdfLoading(true)
    try {
      const { shareInvoicePDF } = await import('../utils/pdfExport')
      await shareInvoicePDF(inv)
    } catch(e) { alert('Could not share PDF') }
    setPdfLoading(false)
  }

  // Detail view
  if (selected) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-gray-50">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <h2 className="font-bold flex-1 text-sm">Invoice #{String(selected.invoice_no).padStart(2,'0')}</h2>
          <button onClick={() => { setEditInvoice(selected); setSelected(null) }}
            className="p-2 bg-blue-50 rounded-xl"><Pencil size={16} className="text-blue-500" /></button>
          <button onClick={() => handleShare(selected)} disabled={pdfLoading}
            className="p-2 bg-green-50 rounded-xl">
            {pdfLoading ? <Loader size={16} className="text-green-600 animate-spin" /> : <Share2 size={16} className="text-green-600" />}
          </button>
          <button onClick={() => handleDownload(selected)} disabled={pdfLoading}
            className="p-2 bg-orange-50 rounded-xl">
            {pdfLoading ? <Loader size={16} className="text-orange-500 animate-spin" /> : <Download size={16} className="text-orange-500" />}
          </button>
        </div>

        {/* Invoice scaled to fit screen */}
        <div className="flex-1 overflow-auto bg-gray-100 p-3">
          <div style={{ transform: 'scale(0.42)', transformOrigin: 'top left', width: '238%' }}>
            <InvoicePrint invoice={selected} />
          </div>
        </div>
      </div>
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
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3 rounded-xl">
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
                className="w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${color.bg} ${color.text}`}>
                      #{String(inv.invoice_no).padStart(2,'0')}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{inv.clients?.name}</p>
                      <p className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString('en-IN')} · {inv.invoice_items?.length || 0} item(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <span className="font-bold text-orange-600 text-sm">₹{inv.total.toLocaleString('en-IN')}</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>

                {/* Bottom row: color + edit */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  {/* Color swatches */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 mr-1">Label:</span>
                    {COLORS.map((c, idx) => (
                      <button key={idx}
                        onClick={e => { e.stopPropagation(); saveColor(inv.id, idx) }}
                        className={`w-5 h-5 rounded-full transition-all ${c.dot} ${colorIdx === idx ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : 'opacity-60'}`}
                      />
                    ))}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setEditInvoice(inv) }}
                    className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              </button>
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
