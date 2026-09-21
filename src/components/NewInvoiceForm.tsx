import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, InvoiceItem, Invoice } from '../lib/supabase'
import { Plus, Trash2, X, Loader, ChevronDown } from 'lucide-react'

const emptyItem = (): InvoiceItem => ({ particulars: '', hsn_code: '', qty: 1, rate: 0, amount: 0 })

export default function NewInvoiceForm({
  onDone, preClient, editInvoice
}: {
  onDone: () => void
  preClient?: Client
  editInvoice?: Invoice
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState(editInvoice?.client_id || preClient?.id || '')
  const [invoiceNo, setInvoiceNo] = useState<string>('')
  const [date, setDate] = useState(editInvoice?.date || new Date().toISOString().split('T')[0])
  const [modeOfDelivery, setModeOfDelivery] = useState(editInvoice?.mode_of_delivery || '')
  const [vehicleNo, setVehicleNo] = useState(editInvoice?.vehicle_no || '')
  const [gstType, setGstType] = useState<'cgst_sgst' | 'igst'>(
    editInvoice ? (editInvoice.igst_rate > 0 ? 'igst' : 'cgst_sgst') : 'cgst_sgst'
  )
  const [cgstRate, setCgstRate] = useState(editInvoice?.cgst_rate ?? 9)
  const [sgstRate, setSgstRate] = useState(editInvoice?.sgst_rate ?? 9)
  const [igstRate, setIgstRate] = useState(editInvoice?.igst_rate ?? 18)
  const [items, setItems] = useState<InvoiceItem[]>(
    editInvoice?.invoice_items?.length ? editInvoice.invoice_items : [emptyItem()]
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      if (data) setClients(data)
    })
    // Set invoice number
    if (editInvoice) {
      setInvoiceNo(String(editInvoice.invoice_no))
    } else {
      supabase.from('invoices').select('invoice_no').order('invoice_no', { ascending: false }).limit(1)
        .then(({ data }) => setInvoiceNo(String(((data?.[0]?.invoice_no) || 0) + 1)))
    }
  }, [])

  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[i], [field]: val }
      item.amount = Number(item.qty) * Number(item.rate)
      next[i] = item
      return next
    })
  }

  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0)
  const taxAmount = gstType === 'cgst_sgst'
    ? subtotal * (cgstRate + sgstRate) / 100
    : subtotal * igstRate / 100
  const total = subtotal + taxAmount

  async function save() {
    if (!clientId) return alert('Please select a client')
    if (items.every(i => !i.particulars.trim())) return alert('Add at least one item')
    if (!invoiceNo) return alert('Invoice number is required')
    setSaving(true)

    const payload = {
      client_id: clientId,
      invoice_no: Number(invoiceNo),
      date,
      mode_of_delivery: modeOfDelivery,
      vehicle_no: vehicleNo,
      cgst_rate: gstType === 'cgst_sgst' ? cgstRate : 0,
      sgst_rate: gstType === 'cgst_sgst' ? sgstRate : 0,
      igst_rate: gstType === 'igst' ? igstRate : 0,
      subtotal,
      tax_amount: taxAmount,
      total,
    }

    let invId = editInvoice?.id

    if (editInvoice) {
      await supabase.from('invoices').update(payload).eq('id', editInvoice.id)
      await supabase.from('invoice_items').delete().eq('invoice_id', editInvoice.id)
    } else {
      const { data: inv, error } = await supabase.from('invoices').insert([payload]).select().single()
      if (error) { alert('Error saving invoice'); setSaving(false); return }
      invId = inv.id
    }

    const validItems = items.filter(i => i.particulars.trim())
    await supabase.from('invoice_items').insert(
      validItems.map(i => ({
        invoice_id: invId,
        particulars: i.particulars,
        hsn_code: i.hsn_code,
        qty: i.qty,
        rate: i.rate,
        amount: i.amount,
      }))
    )
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4 z-10">
          <h2 className="text-lg font-bold">{editInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
          <button onClick={onDone}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Client */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Client *</label>
            <div className="relative">
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 appearance-none bg-white">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Invoice No + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Invoice No. *</label>
              <input type="number" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)}
                placeholder="1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
          </div>

          {/* Mode + Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Mode of Delivery</label>
              <input value={modeOfDelivery} onChange={e => setModeOfDelivery(e.target.value)}
                placeholder="By Hand"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Vehicle No.</label>
              <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)}
                placeholder="GJ-01-AB-1234"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
          </div>

          {/* GST Type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2">GST Type</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button onClick={() => setGstType('cgst_sgst')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${gstType === 'cgst_sgst' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>
                CGST + SGST
              </button>
              <button onClick={() => setGstType('igst')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${gstType === 'igst' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>
                IGST
              </button>
            </div>
            {gstType === 'cgst_sgst' ? (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-gray-400">CGST %</label>
                  <input type="number" value={cgstRate} onChange={e => setCgstRate(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">SGST %</label>
                  <input type="number" value={sgstRate} onChange={e => setSgstRate(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-400" />
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <label className="text-xs text-gray-400">IGST %</label>
                <input type="number" value={igstRate} onChange={e => setIgstRate(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-400" />
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2">Line Items</label>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Item {i + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}>
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                  {/* Particulars — big textarea */}
                  <textarea value={item.particulars} onChange={e => updateItem(i, 'particulars', e.target.value)}
                    placeholder="Particulars / Description of work done..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-orange-400 resize-none leading-relaxed" />
                  {/* HSN (max 6) | Qty | Rate */}
                  <div className="grid grid-cols-8 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-medium">HSN</label>
                      <input value={item.hsn_code}
                        onChange={e => updateItem(i, 'hsn_code', e.target.value.slice(0, 6))}
                        maxLength={6}
                        placeholder="998719"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white outline-none focus:border-orange-400 text-center tracking-wider" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 font-medium">Qty</label>
                      <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white outline-none focus:border-orange-400 text-center" />
                    </div>
                    <div className="col-span-4">
                      <label className="text-xs text-gray-400 font-medium">Rate (₹)</label>
                      <input type="number" value={item.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white outline-none focus:border-orange-400" />
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-orange-600">
                    Amount: ₹{(item.amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setItems(p => [...p, emptyItem()])}
              className="mt-2 flex items-center gap-1 text-orange-500 text-sm font-semibold">
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Sub Total</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax (GST)</span><span>₹{taxAmount.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
              <span>Total</span><span className="text-orange-600">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base">
            {saving ? <Loader size={20} className="animate-spin" /> : (editInvoice ? 'Update Invoice' : 'Generate Invoice')}
          </button>
        </div>
      </div>
    </div>
  )
}
