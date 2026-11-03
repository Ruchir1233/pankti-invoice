import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Invoice, Client } from '../lib/supabase'
import { Plus, Search, ChevronRight, Loader, Download, Share2, ArrowLeft, X, Pencil, Trash2, Receipt, FileText, Upload, ExternalLink } from 'lucide-react'
import NewInvoiceForm from './NewInvoiceForm'
import UploadInvoiceForm from './UploadInvoiceForm'
import InvoicePrint from './InvoicePrint'
import { useBackClose } from '../utils/useBackClose'

const TYPES = {
  gst: { label: 'GST', cls: 'bg-orange-100 text-orange-700', bar: 'border-l-orange-400' },
  nongst: { label: 'Non-GST', cls: 'bg-blue-100 text-blue-700', bar: 'border-l-blue-400' },
  upload: { label: 'Uploaded', cls: 'bg-purple-100 text-purple-700', bar: 'border-l-purple-400' },
} as const

const SHEET_PX = 793.7 // 210mm at 96dpi

function Preview({ invoice, capturing }: { invoice: Invoice; capturing: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.45)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / SHEET_PX))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="w-full max-w-[794px] mx-auto">
      <div style={{ height: 1123 * scale, overflow: 'hidden' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: SHEET_PX }}
          className="shadow-md bg-white">
          <InvoicePrint invoice={invoice} id="invoice-preview" />
        </div>
      </div>
      {/* Hidden full-size copy used for PDF capture */}
      {capturing && (
        <div style={{ position: 'fixed', left: 0, top: 0, zIndex: -1, pointerEvents: 'none', opacity: 0 }} aria-hidden>
          <InvoicePrint invoice={invoice} id="invoice-pdf-source" />
        </div>
      )}
    </div>
  )
}

export default function InvoicesTab({ filterClient, onClearFilter }: { filterClient?: Client; onClearFilter?: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [busy, setBusy] = useState<'' | 'share' | 'download'>('')
  const [showType, setShowType] = useState(false)
  const [newType, setNewType] = useState<'gst' | 'nongst' | 'upload'>('gst')
  const [confirmDel, setConfirmDel] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  useBackClose(!!selected, () => setSelected(null))
  useBackClose(showType, () => setShowType(false))
  useBackClose(showForm || !!editInvoice, () => { setShowForm(false); setEditInvoice(null) })
  useBackClose(!!confirmDel, () => setConfirmDel(null))

  useEffect(() => { fetchInvoices() }, [filterClient])
  async function fetchInvoices() {
    setLoading(true)
    let q = supabase.from('invoices').select('*, clients(*), invoice_items(*)').order('invoice_no', { ascending: false })
    if (filterClient) q = q.eq('client_id', filterClient.id)
    const { data } = await q
    if (data) setInvoices(data as Invoice[])
    setLoading(false)
  }

  const filtered = invoices.filter(inv => {
    const s = search.toLowerCase()
    return inv.clients?.name?.toLowerCase().includes(s) || String(inv.invoice_no).includes(s) || inv.date.includes(s)
  })

  async function run(kind: 'share' | 'download', inv: Invoice) {
    setBusy(kind)
    await new Promise(r => setTimeout(r, 150))
    try {
      const m = await import('../utils/pdfExport')
      const up = inv.invoice_type === 'upload'
      if (kind === 'share') await (up ? m.shareUploaded(inv) : m.shareInvoicePDF(inv))
      else await (up ? m.downloadUploaded(inv) : m.downloadInvoicePDF(inv))
    } catch { alert('Could not create the PDF. Please try again.') }
    setBusy('')
  }

  async function doDelete() {
    if (!confirmDel) return
    setDeleting(true)
    if (confirmDel.file_url) {
      const path = confirmDel.file_url.split('/invoice-files/')[1]
      if (path) await supabase.storage.from('invoice-files').remove([path])
    }
    await supabase.from('invoice_items').delete().eq('invoice_id', confirmDel.id)
    const { error } = await supabase.from('invoices').delete().eq('id', confirmDel.id)
    setDeleting(false)
    if (error) { alert('Could not delete invoice'); return }
    setConfirmDel(null)
    setSelected(null)
    fetchInvoices()
  }

  const confirmModal = confirmDel && (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
        <div>
          <h3 className="font-bold text-lg">Delete invoice #{String(confirmDel.invoice_no).padStart(2, '0')}?</h3>
          <p className="text-sm text-slate-500 mt-1">{confirmDel.clients?.name} · ₹{confirmDel.total.toLocaleString('en-IN')}. This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600">Cancel</button>
          <button onClick={doDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold flex items-center justify-center">
            {deleting ? <Loader size={18} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 md:px-6 py-3 border-b border-slate-200 bg-white">
          <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm md:text-base truncate">Invoice #{String(selected.invoice_no).padStart(2, '0')}</h2>
            <p className="text-xs text-slate-400 truncate">{selected.clients?.name}</p>
          </div>
          <button onClick={() => setEditInvoice(selected)} title="Edit"
            className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl"><Pencil size={16} className="text-blue-600" /></button>
          <button onClick={() => setConfirmDel(selected)} title="Delete"
            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl"><Trash2 size={16} className="text-red-500" /></button>
          <button onClick={() => run('share', selected)} disabled={!!busy}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {busy === 'share' ? <Loader size={16} className="animate-spin" /> : <Share2 size={16} />}<span className="hidden sm:inline">Share</span>
          </button>
          <button onClick={() => run('download', selected)} disabled={!!busy}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {busy === 'download' ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}<span className="hidden sm:inline">Download</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-3 md:p-8">
          {selected.invoice_type === 'upload' ? (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{selected.clients?.name}</p>
                  <p className="text-xs text-slate-400">{new Date(selected.date).toLocaleDateString('en-IN')} · Uploaded invoice</p>
                </div>
                <p className="font-bold text-orange-600">₹{selected.total.toLocaleString('en-IN')}</p>
              </div>
              {selected.file_type?.startsWith('image/') ? (
                <img src={selected.file_url!} alt="Invoice" className="w-full rounded-xl border border-slate-100" />
              ) : (
                <div className="border border-slate-100 rounded-xl p-6 text-center space-y-3">
                  <FileText className="mx-auto text-orange-500" size={36} />
                  <p className="text-sm text-slate-600 break-all">{selected.file_name}</p>
                </div>
              )}
              <a href={selected.file_url!} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                <ExternalLink size={16} /> Open file
              </a>
            </div>
          ) : (
            <Preview invoice={selected} capturing={!!busy} />
          )}
        </div>
        {confirmModal}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {filterClient && (
        <div className="flex items-center gap-2 px-4 md:px-8 py-2 bg-orange-50 border-b border-orange-100">
          <span className="text-sm font-medium text-orange-700 flex-1 truncate">Invoices: {filterClient.name}</span>
          <button onClick={onClearFilter}><X size={16} className="text-orange-500" /></button>
        </div>
      )}

      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center">
        <h1 className="hidden md:block text-2xl font-extrabold mr-auto">Invoices</h1>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client, invoice no..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-orange-400" />
        </div>
        <button onClick={() => setShowType(true)}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader className="animate-spin text-orange-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <Receipt className="mx-auto mb-2 text-slate-300" size={36} />No invoices yet
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-[minmax(0,1fr)] md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(inv => {
              const ng = inv.invoice_type === 'nongst'
              const t = TYPES[(inv.invoice_type as keyof typeof TYPES) || 'gst'] || TYPES.gst
              return (
                <div key={inv.id} onClick={() => setSelected(inv)}
                  className={`min-w-0 bg-white border border-slate-100 border-l-4 ${t.bar} rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${t.cls}`}>
                        #{String(inv.invoice_no).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">{inv.clients?.name}</p>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${t.cls}`}>{t.label}</span>
                        <p className="text-xs text-slate-400 truncate">
                          {new Date(inv.date).toLocaleDateString('en-IN')} · {inv.invoice_type === 'upload' ? 'file' : `${inv.invoice_items?.length || 0} item(s)`}
                          {ng && inv.company_name && <span className="ml-1.5 text-slate-500 font-semibold">· {inv.company_name}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-bold text-orange-600 text-sm">₹{inv.total.toLocaleString('en-IN')}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setEditInvoice(inv)} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setConfirmDel(inv)} className="flex items-center gap-1 text-xs text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* GST / Non-GST chooser */}
      {showType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowType(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New invoice</h2>
              <button onClick={() => setShowType(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <button onClick={() => { setNewType('gst'); setShowType(false); setShowForm(true) }}
              className="w-full text-left border-2 border-slate-100 hover:border-orange-400 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center"><FileText className="text-orange-600" size={22} /></div>
              <div><p className="font-bold">GST Invoice</p><p className="text-xs text-slate-500">Tax invoice · Pankti Engineering · CGST/SGST/IGST</p></div>
            </button>
            <button onClick={() => { setNewType('nongst'); setShowType(false); setShowForm(true) }}
              className="w-full text-left border-2 border-slate-100 hover:border-orange-400 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center"><Receipt className="text-slate-600" size={22} /></div>
              <div><p className="font-bold">Non-GST Invoice</p><p className="text-xs text-slate-500">Simple invoice · choose or edit company name, address, phone</p></div>
            </button>
            <button onClick={() => { setNewType('upload'); setShowType(false); setShowForm(true) }}
              className="w-full text-left border-2 border-slate-100 hover:border-orange-400 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center"><Upload className="text-blue-600" size={22} /></div>
              <div><p className="font-bold">Upload Invoice</p><p className="text-xs text-slate-500">Add a PDF or photo made in another app</p></div>
            </button>
          </div>
        </div>
      )}

      {(showForm || editInvoice) && ((editInvoice ? editInvoice.invoice_type : newType) === 'upload') && (
        <UploadInvoiceForm
          preClient={filterClient}
          editInvoice={editInvoice || undefined}
          onDone={() => { setShowForm(false); setEditInvoice(null); setSelected(null); fetchInvoices() }}
        />
      )}
      {(showForm || editInvoice) && ((editInvoice ? editInvoice.invoice_type : newType) !== 'upload') && (
        <NewInvoiceForm
          preClient={filterClient}
          editInvoice={editInvoice || undefined}
          invoiceType={(editInvoice ? editInvoice.invoice_type === 'nongst' : newType === 'nongst') ? 'nongst' : 'gst'}
          onDone={() => { setShowForm(false); setEditInvoice(null); setSelected(null); fetchInvoices() }}
        />
      )}
      {confirmModal}
    </div>
  )
}
