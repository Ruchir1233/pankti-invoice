import { docNo, validTill } from '../utils/docNo'
import type { Invoice } from '../lib/supabase'
import { numberToWords } from '../utils/numberToWords'

const ORANGE = '#f97316'
const DARK = '#1f2937'
const MUTED = '#6b7280'
const LINE = '#e5e7eb'
const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

export default function EstimatePrint({ invoice, id = 'invoice-print' }: { invoice: Invoice; id?: string }) {
  const client = invoice.clients!
  const gst = invoice.invoice_type !== 'nongst'
  const coName = gst ? 'PANKTI ENGINEERING' : (invoice.company_name || 'PANKTI ENGINEERING')
  const coAddress = gst ? 'Opp Tiles Factory Dhamdachi, Valsad' : (invoice.company_address || '')
  const coPhone = gst ? '9879523937' : (invoice.company_phone || '')
  const isPankti = /pankti/i.test(coName)
  const items = invoice.invoice_items || []
  const cgst = invoice.subtotal * (invoice.cgst_rate || 0) / 100
  const sgst = invoice.subtotal * (invoice.sgst_rate || 0) / 100
  const igst = invoice.subtotal * (invoice.igst_rate || 0) / 100

  return (
    <div id={id} style={{
      width: '210mm', minHeight: '297mm', boxSizing: 'border-box', backgroundColor: '#ffffff', color: DARK,
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', lineHeight: 1.4, position: 'relative',
    }}>
      <div style={{ height: '10px', backgroundColor: ORANGE }} />

      {/* Header */}
      <div style={{ padding: '22px 12mm 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, letterSpacing: '1px', color: DARK }}>{coName}</h1>
          {isPankti && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: ORANGE }}>Best Fabricator in Valsad</p>
          )}
          {isPankti && (
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: DARK }}>
              <span style={{ color: '#f59e0b', letterSpacing: '1px', fontSize: '14px' }}>★★★★★</span>
              <b style={{ marginLeft: '6px' }}>4.9/5</b>
              <span style={{ color: MUTED }}> on Google Reviews</span>
            </p>
          )}
          <div style={{ marginTop: '8px', fontSize: '11px', color: MUTED, whiteSpace: 'pre-wrap' }}>
            {coAddress && <div>{coAddress}</div>}
            {coPhone && <div>Phone: {coPhone}</div>}
            {isPankti && <div>Web: <b style={{ color: DARK }}>www.panktiengineering.com</b></div>}
            {gst && <div>GSTIN: <b style={{ color: DARK }}>24AIFPP7184F1Z3</b></div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', backgroundColor: ORANGE, color: '#fff', padding: '8px 18px', borderRadius: '6px', fontSize: '20px', fontWeight: 900, letterSpacing: '3px' }}>
            ESTIMATE
          </div>
          <table style={{ marginTop: '10px', marginLeft: 'auto', fontSize: '12px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '2px 10px 2px 0', color: MUTED, textAlign: 'right' }}>Estimate No.</td><td style={{ fontWeight: 700 }}>{docNo(invoice)}</td></tr>
              <tr><td style={{ padding: '2px 10px 2px 0', color: MUTED, textAlign: 'right' }}>Date</td><td style={{ fontWeight: 700 }}>{new Date(invoice.date).toLocaleDateString('en-IN')}</td></tr>
              <tr><td style={{ padding: '2px 10px 2px 0', color: MUTED, textAlign: 'right' }}>Valid till</td><td style={{ fontWeight: 700 }}>{validTill(invoice.date, invoice.valid_days)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Prepared for */}
      <div style={{ margin: '0 12mm 16px', padding: '12px 16px', backgroundColor: '#fff7ed', borderLeft: `4px solid ${ORANGE}`, borderRadius: '4px' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: ORANGE }}>PREPARED FOR</p>
        <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800 }}>{client.name}</p>
        {client.address && <p style={{ margin: '2px 0 0', color: MUTED, whiteSpace: 'pre-wrap' }}>{client.address}</p>}
        <p style={{ margin: '2px 0 0', color: MUTED }}>
          {gst && client.gstin ? <>GSTIN: <b style={{ color: DARK }}>{client.gstin}</b></> : null}
          {client.phone ? <>{gst && client.gstin ? '   |   ' : ''}Phone: <b style={{ color: DARK }}>{client.phone}</b></> : null}
        </p>
      </div>

      {/* Items */}
      <div style={{ margin: '0 12mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: DARK, color: '#fff' }}>
              {[['#', 'center', 30], ['Description', 'left', 0], ['HSN', 'center', 60], ['Qty', 'center', 45], ['Rate', 'right', 80], ['Amount', 'right', 90]].map(([h, a, w]) => (
                <th key={h as string} style={{ padding: '9px 8px', textAlign: a as 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', width: w ? `${w}px` : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 ? '#fafafa' : '#fff', borderBottom: `1px solid ${LINE}` }}>
                <td style={{ padding: '9px 8px', textAlign: 'center', color: MUTED, verticalAlign: 'top' }}>{i + 1}</td>
                <td style={{ padding: '9px 8px', whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>{it.particulars}</td>
                <td style={{ padding: '9px 8px', textAlign: 'center', verticalAlign: 'top' }}>{it.hsn_code}</td>
                <td style={{ padding: '9px 8px', textAlign: 'center', verticalAlign: 'top' }}>{it.qty}</td>
                <td style={{ padding: '9px 8px', textAlign: 'right', verticalAlign: 'top' }}>{inr(it.rate)}</td>
                <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>{inr(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: MUTED }}>AMOUNT IN WORDS</p>
            <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>{numberToWords(invoice.total)}</p>
          </div>
          <div style={{ width: '240px', fontSize: '12px' }}>
            <Row label="Sub Total" value={inr(invoice.subtotal)} />
            {gst && cgst > 0 && <Row label={`CGST ${invoice.cgst_rate}%`} value={inr(cgst)} />}
            {gst && sgst > 0 && <Row label={`SGST ${invoice.sgst_rate}%`} value={inr(sgst)} />}
            {gst && igst > 0 && <Row label={`IGST ${invoice.igst_rate}%`} value={inr(igst)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: ORANGE, color: '#fff', padding: '10px 12px', borderRadius: '6px', marginTop: '6px', fontSize: '14px', fontWeight: 800 }}>
              <span>Total</span><span>{inr(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div style={{ marginTop: '22px', padding: '12px 16px', border: `1px solid ${LINE}`, borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: MUTED }}>TERMS &amp; NOTES</p>
          <ul style={{ margin: '6px 0 0', paddingLeft: '16px', fontSize: '11px', color: DARK }}>
            <li>This estimate is valid for {invoice.valid_days || 15} days from the date above.</li>
            {invoice.terms?.trim() && invoice.terms.split('\n').filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
            <li>Final amount may change as per actual work and materials.</li>
            <li>This is an estimate / quotation, not a tax invoice.</li>
          </ul>
        </div>

        {/* Signature */}
        <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: ORANGE }}>Thank you for considering us!</p>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ height: '44px' }} />
            <div style={{ borderTop: `1px solid ${DARK}`, paddingTop: '4px', fontSize: '11px', fontWeight: 700 }}>For {coName}</div>
            <div style={{ fontSize: '10px', color: MUTED }}>{gst ? 'Proprietor' : 'Authorised Signatory'}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {isPankti && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: DARK, color: '#fff', textAlign: 'center', padding: '10px', fontSize: '11px' }}>
          <span style={{ color: '#f59e0b' }}>★ 4.9/5 Google Reviews</span>
          <span style={{ margin: '0 10px', color: '#6b7280' }}>|</span>
          www.panktiengineering.com
          <span style={{ margin: '0 10px', color: '#6b7280' }}>|</span>
          {coPhone}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 4px', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ color: MUTED }}>{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
