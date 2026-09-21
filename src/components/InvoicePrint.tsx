import type { Invoice } from '../lib/supabase'
import { numberToWords } from '../utils/numberToWords'

export default function InvoicePrint({ invoice }: { invoice: Invoice }) {
  const client = invoice.clients!
  const items = invoice.invoice_items || []
  const emptyRows = Math.max(0, 8 - items.length)

  return (
    <div id="invoice-print" className="invoice-sheet bg-white text-black" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '10mm',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      boxSizing: 'border-box',
      lineHeight: 1.3,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '8px', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', margin: 0 }}>TAX INVOICE</p>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '2px', margin: '4px 0' }}>PANKTI ENGINEERING</h1>
        <p style={{ fontSize: '11px', margin: 0 }}>Opp Tiles Factory Dhamdachi, Valsad &nbsp;|&nbsp; Phone No.: 9879523937</p>
      </div>

      {/* Client + Invoice */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '2px 0' }}><b>M/s </b>{client.name}</p>
          <p style={{ margin: '2px 0', whiteSpace: 'pre-wrap' }}>{client.address}</p>
          <p style={{ margin: '2px 0' }}><b>GSTIN : </b>{client.gstin || '—'}&nbsp;&nbsp;&nbsp;<b>State : </b>{client.state || '—'}</p>
        </div>
        <div style={{ minWidth: '180px', textAlign: 'right' }}>
          <p style={{ margin: '2px 0' }}><b>Invoice No.: </b>{String(invoice.invoice_no).padStart(2, '0')}</p>
          <p style={{ margin: '2px 0' }}><b>Date : </b>{new Date(invoice.date).toLocaleDateString('en-IN')}</p>
          <p style={{ margin: '2px 0' }}><b>Mode of Delivery: </b>{invoice.mode_of_delivery || '—'}</p>
          <p style={{ margin: '2px 0' }}><b>Vehical No.: </b>{invoice.vehicle_no || '—'}</p>
        </div>
      </div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px', marginBottom: 0 }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            {['No.', 'Particulars', 'HSN Code', 'Qty', 'Rate', 'Amount'].map(h => (
              <th key={h} style={{ border: '1px solid black', padding: '5px 8px', fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center' }}>{i + 1}.</td>
              <td style={{ border: '1px solid black', padding: '4px 8px' }}>{item.particulars}</td>
              <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center' }}>{item.hsn_code}</td>
              <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center' }}>{item.qty}</td>
              <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right' }}>{item.rate.toLocaleString('en-IN')}/-</td>
              <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'right' }}>{item.amount.toLocaleString('en-IN')}/-</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`e${i}`}>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} style={{ border: '1px solid black', padding: '10px 8px' }}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom */}
      <div style={{ display: 'flex', border: '1px solid black', borderTop: 'none' }}>
        <div style={{ flex: 1, borderRight: '1px solid black', padding: '8px' }}>
          <p style={{ fontWeight: 700, fontSize: '11px', margin: '0 0 4px' }}>Rs. In Words</p>
          <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>{numberToWords(invoice.total)}</p>
        </div>
        <div style={{ width: '200px', fontSize: '11px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
            <span style={{ flex: 1, fontWeight: 700, padding: '4px 8px', borderRight: '1px solid black' }}>Sub Total</span>
            <span style={{ padding: '4px 8px', textAlign: 'right', width: '95px' }}>{invoice.subtotal.toLocaleString('en-IN')}/-</span>
          </div>
          {invoice.cgst_rate > 0 && (
            <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
              <span style={{ flex: 1, padding: '4px 8px', borderRight: '1px solid black' }}>Add : CGST {invoice.cgst_rate}%</span>
              <span style={{ padding: '4px 8px', textAlign: 'right', width: '95px' }}>{(invoice.subtotal * invoice.cgst_rate / 100).toLocaleString('en-IN')}/-</span>
            </div>
          )}
          {invoice.sgst_rate > 0 && (
            <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
              <span style={{ flex: 1, padding: '4px 8px', borderRight: '1px solid black' }}>Add : SGST {invoice.sgst_rate}%</span>
              <span style={{ padding: '4px 8px', textAlign: 'right', width: '95px' }}>{(invoice.subtotal * invoice.sgst_rate / 100).toLocaleString('en-IN')}/-</span>
            </div>
          )}
          {invoice.igst_rate > 0 && (
            <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
              <span style={{ flex: 1, padding: '4px 8px', borderRight: '1px solid black' }}>Add : IGST {invoice.igst_rate}%</span>
              <span style={{ padding: '4px 8px', textAlign: 'right', width: '95px' }}>{(invoice.subtotal * invoice.igst_rate / 100).toLocaleString('en-IN')}/-</span>
            </div>
          )}
          <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
            <span style={{ flex: 1, fontWeight: 700, padding: '4px 8px', borderRight: '1px solid black' }}>Tax Amount : GST</span>
            <span style={{ padding: '4px 8px', textAlign: 'right', width: '95px' }}>{invoice.tax_amount.toLocaleString('en-IN')}/-</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ flex: 1, fontWeight: 700, padding: '4px 8px', borderRight: '1px solid black' }}>Total Amount</span>
            <span style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, width: '95px' }}>{invoice.total.toLocaleString('en-IN')}/-</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', paddingTop: '8px', borderTop: '1px solid black' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>GSTIN : 24AIFPP7184F1Z3</p>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>For PANKTI ENGINEERING</p>
          <div style={{ height: '50px' }}></div>
          <p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>PROPRIETOR</p>
        </div>
      </div>
    </div>
  )
}
