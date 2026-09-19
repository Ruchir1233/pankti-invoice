import type { Invoice } from '../lib/supabase'
import { numberToWords } from '../utils/numberToWords'

export default function InvoicePrint({ invoice }: { invoice: Invoice }) {
  const client = invoice.clients!
  const items = invoice.invoice_items || []

  const emptyRows = Math.max(0, 8 - items.length)

  return (
    <div id="invoice-print" className="bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm', padding: '10mm', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <p className="text-xs font-bold tracking-widest">TAX INVOICE</p>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px' }}>PANKTI ENGINEERING</h1>
        <p className="text-xs">Opp Tiles Factory Dhamdachi, Valsad &nbsp;|&nbsp; Phone No.: 9879523937</p>
      </div>

      {/* Client + Invoice details */}
      <div className="flex gap-4 mb-3">
        <div className="flex-1 text-xs space-y-0.5">
          <p><span className="font-semibold">M/s </span>{client.name}</p>
          <p className="whitespace-pre-wrap">{client.address}</p>
          <p><span className="font-semibold">GSTIN : </span>{client.gstin || '—'}&nbsp;&nbsp;&nbsp;
            <span className="font-semibold">State : </span>{client.state || '—'}</p>
        </div>
        <div className="text-xs space-y-1 text-right min-w-[160px]">
          <p><span className="font-semibold">Invoice No.: </span>{String(invoice.invoice_no).padStart(2, '0')}</p>
          <p><span className="font-semibold">Date : </span>{new Date(invoice.date).toLocaleDateString('en-IN')}</p>
          <p><span className="font-semibold">Mode of Delivery: </span>{invoice.mode_of_delivery || '—'}</p>
          <p><span className="font-semibold">Vehical No.: </span>{invoice.vehicle_no || '—'}</p>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full border-collapse border border-black text-xs mb-0">
        <thead>
          <tr className="bg-gray-100">
            {['No.', 'Particulars', 'HSN Code', 'Qty', 'Rate', 'Amount'].map(h => (
              <th key={h} className="border border-black px-2 py-1.5 text-center font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border border-black px-2 py-1 text-center">{i + 1}.</td>
              <td className="border border-black px-2 py-1">{item.particulars}</td>
              <td className="border border-black px-2 py-1 text-center">{item.hsn_code}</td>
              <td className="border border-black px-2 py-1 text-center">{item.qty}</td>
              <td className="border border-black px-2 py-1 text-right">{item.rate.toLocaleString('en-IN')}/-</td>
              <td className="border border-black px-2 py-1 text-right">{item.amount.toLocaleString('en-IN')}/-</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`e${i}`}>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} className="border border-black px-2 py-3"></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom section */}
      <div className="flex border border-t-0 border-black">
        {/* Left: Rs in Words */}
        <div className="flex-1 border-r border-black p-2">
          <p className="font-bold text-xs mb-1">Rs. In Words</p>
          <p className="text-xs italic">{numberToWords(invoice.total)}</p>
        </div>
        {/* Right: Totals */}
        <div className="w-48 text-xs">
          <div className="flex border-b border-black">
            <span className="flex-1 font-bold p-1 border-r border-black">Sub Total</span>
            <span className="p-1 text-right w-24">{invoice.subtotal.toLocaleString('en-IN')}/-</span>
          </div>
          {invoice.cgst_rate > 0 && (
            <div className="flex border-b border-black">
              <span className="flex-1 p-1 border-r border-black">Add : CGST {invoice.cgst_rate}%</span>
              <span className="p-1 text-right w-24">{(invoice.subtotal * invoice.cgst_rate / 100).toLocaleString('en-IN')}/-</span>
            </div>
          )}
          {invoice.sgst_rate > 0 && (
            <div className="flex border-b border-black">
              <span className="flex-1 p-1 border-r border-black">Add : SGST {invoice.sgst_rate}%</span>
              <span className="p-1 text-right w-24">{(invoice.subtotal * invoice.sgst_rate / 100).toLocaleString('en-IN')}/-</span>
            </div>
          )}
          {invoice.igst_rate > 0 && (
            <div className="flex border-b border-black">
              <span className="flex-1 p-1 border-r border-black">Add : IGST {invoice.igst_rate}%</span>
              <span className="p-1 text-right w-24">{(invoice.subtotal * invoice.igst_rate / 100).toLocaleString('en-IN')}/-</span>
            </div>
          )}
          <div className="flex border-b border-black">
            <span className="flex-1 font-bold p-1 border-r border-black">Tax Amount : GST</span>
            <span className="p-1 text-right w-24">{invoice.tax_amount.toLocaleString('en-IN')}/-</span>
          </div>
          <div className="flex">
            <span className="flex-1 font-bold p-1 border-r border-black">Total Amount</span>
            <span className="p-1 text-right font-bold w-24">{invoice.total.toLocaleString('en-IN')}/-</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end mt-4 pt-2 border-t border-black">
        <p className="text-xs font-bold">GSTIN : 24AIFPP7184F1Z3</p>
        <div className="text-center">
          <p className="text-xs font-bold">For PANKTI ENGINEERING</p>
          <div className="h-12 mt-2 mb-1"></div>
          <p className="text-xs font-bold">PROPRIETOR</p>
        </div>
      </div>
    </div>
  )
}
