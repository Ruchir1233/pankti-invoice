import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Invoice, Client } from '../lib/supabase'
import { Plus, Search, ChevronRight, Loader, Download, Share2, ArrowLeft, X } from 'lucide-react'
import NewInvoiceForm from './NewInvoiceForm'
import InvoicePrint from './InvoicePrint'

export default function InvoicesTab({ filterClient, onClearFilter }: { filterClient?: Client, onClearFilter?: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)

  useEffect(() => { fetchInvoices() }, [filterClient])

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

  function handlePrint(inv: Invoice) {
    setSelected(inv)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  function handleShare(inv: Invoice) {
    const text = `Invoice No: ${String(inv.invoice_no).padStart(2,'0')}\nClient: ${inv.clients?.name}\nDate: ${new Date(inv.date).toLocaleDateString('en-IN')}\nTotal: ₹${inv.total.toLocaleString('en-IN')}\n\nPankti Engineering\nDhamdachi, Valsad | 9879523937`
    if (navigator.share) {
      navigator.share({ title: `Invoice #${inv.invoice_no} - Pankti Engineering`, text })
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')
    }
  }

  if (selected) {
    return (
      <>
        {/* Screen view */}
        <div className="flex flex-col h-full print:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button onClick={() => setSelected(null)}><ArrowLeft size={20} className="text-gray-500" /></button>
            <h2 className="font-bold flex-1">Invoice #{String(selected.invoice_no).padStart(2,'0')}</h2>
            <button onClick={() => handleShare(selected)} className="p-2 bg-green-50 rounded-xl">
              <Share2 size={18} className="text-green-600" />
            </button>
            <button onClick={() => handlePrint(selected)} className="p-2 bg-orange-50 rounded-xl">
              <Download size={18} className="text-orange-500" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="overflow-x-auto">
              <InvoicePrint invoice={selected} />
            </div>
          </div>
        </div>
        {/* Print view */}
        <div className="hidden print:block">
          <InvoicePrint invoice={selected} />
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter banner */}
      {filterClient && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-100">
          <span className="text-sm font-medium text-orange-700 flex-1">Invoices for: {filterClient.name}</span>
          <button onClick={onClearFilter}><X size={16} className="text-orange-500" /></button>
        </div>
      )}

      {/* Search + New */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-orange-400" />
        </div>
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-2.5 rounded-xl">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader className="animate-spin text-orange-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No invoices yet</div>
        ) : filtered.map(inv => (
          <button key={inv.id} onClick={() => setSelected(inv)}
            className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-left">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    #{String(inv.invoice_no).padStart(2,'0')}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="font-semibold text-gray-900 truncate">{inv.clients?.name}</p>
                <p className="text-xs text-gray-400">{inv.invoice_items?.length || 0} item(s)</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="font-bold text-orange-600">₹{inv.total.toLocaleString('en-IN')}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {showForm && (
        <NewInvoiceForm
          preClient={filterClient}
          onDone={() => { setShowForm(false); fetchInvoices() }}
        />
      )}
    </div>
  )
}
