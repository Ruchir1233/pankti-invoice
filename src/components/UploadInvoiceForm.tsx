import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, Invoice } from '../lib/supabase'
import { X, Loader, ChevronDown, Upload, FileText } from 'lucide-react'

export default function UploadInvoiceForm({ onDone, preClient, editInvoice }: {
  onDone: () => void; preClient?: Client; editInvoice?: Invoice
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState(editInvoice?.client_id || preClient?.id || '')
  const [invoiceNo, setInvoiceNo] = useState(editInvoice ? String(editInvoice.invoice_no) : '')
  const [date, setDate] = useState(editInvoice?.date || new Date().toISOString().split('T')[0])
  const [total, setTotal] = useState(editInvoice ? String(editInvoice.total) : '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => { if (data) setClients(data) })
    if (!editInvoice) {
      supabase.from('invoices').select('invoice_no').order('invoice_no', { ascending: false }).limit(1)
        .then(({ data }) => setInvoiceNo(String(((data?.[0]?.invoice_no) || 0) + 1)))
    }
  }, [])

  async function save() {
    if (!clientId) return alert('Please select a client')
    if (!invoiceNo) return alert('Invoice number is required')
    if (!total || Number(total) <= 0) return alert('Enter the invoice total')
    if (!file && !editInvoice?.file_url) return alert('Please choose a PDF or image')
    setSaving(true)
    let file_url = editInvoice?.file_url || null
    let file_name = editInvoice?.file_name || null
    let file_type = editInvoice?.file_type || null
    if (file) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('invoice-files').upload(path, file, { contentType: file.type || undefined })
      if (upErr) { alert('Upload failed: ' + upErr.message + '\n(Did you run the v4 SQL in Supabase?)'); setSaving(false); return }
      file_url = supabase.storage.from('invoice-files').getPublicUrl(path).data.publicUrl
      file_name = file.name
      file_type = file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg')
    }
    const payload = {
      client_id: clientId, invoice_no: Number(invoiceNo), date,
      mode_of_delivery: '', vehicle_no: '',
      invoice_type: 'upload', file_url, file_name, file_type,
      cgst_rate: 0, sgst_rate: 0, igst_rate: 0,
      subtotal: Number(total), tax_amount: 0, total: Number(total),
    }
    const { error } = editInvoice
      ? await supabase.from('invoices').update(payload).eq('id', editInvoice.id)
      : await supabase.from('invoices').insert([payload])
    setSaving(false)
    if (error) return alert('Could not save: ' + error.message + '\n(Did you run the v4 SQL in Supabase?)')
    onDone()
  }

  const input = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 bg-white'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[95dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 flex items-center justify-between px-5 py-4 z-10">
          <h2 className="text-lg font-bold">{editInvoice ? 'Edit' : 'Upload'} Invoice</h2>
          <button onClick={onDone}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Invoice file (PDF or image) *</span>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center cursor-pointer hover:border-orange-400">
              {file || editInvoice?.file_name ? (
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText size={18} className="text-orange-500" /><span className="truncate">{file?.name || editInvoice?.file_name}</span>
                </div>
              ) : (
                <div className="text-slate-400 text-sm"><Upload className="mx-auto mb-1" size={22} />Tap to choose PDF / photo</div>
              )}
              {(file || editInvoice?.file_name) && <p className="text-xs text-slate-400 mt-1">Tap to change</p>}
            </div>
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Client *</label>
            <div className="relative">
              <select value={clientId} onChange={e => setClientId(e.target.value)} className={input + ' appearance-none'}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Invoice No. *</label>
              <input type="number" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className={input} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={input} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Total amount (₹) *</label>
            <input type="number" inputMode="decimal" value={total} onChange={e => setTotal(e.target.value)} placeholder="0" className={input} />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader size={20} className="animate-spin" /> : (editInvoice ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>
      </div>
    </div>
  )
}
