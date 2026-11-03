import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Invoice } from '../lib/supabase'

// Renders the hidden full-size invoice (#invoice-pdf-source) into an A4 PDF blob.
export async function generateInvoicePDF(): Promise<Blob> {
  const el = document.getElementById('invoice-pdf-source')
  if (!el) throw new Error('Invoice element not found')

  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = 210
  const pageH = 297
  const imgH = (canvas.height * pageW) / canvas.width
  const img = canvas.toDataURL('image/jpeg', 0.95)
  let y = 0
  pdf.addImage(img, 'JPEG', 0, y, pageW, imgH)
  let left = imgH - pageH
  while (left > 1) {
    y -= pageH
    pdf.addPage()
    pdf.addImage(img, 'JPEG', 0, y, pageW, imgH)
    left -= pageH
  }
  return pdf.output('blob')
}

function fileNameFor(invoice: Invoice) {
  const client = (invoice.clients?.name || 'client').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '')
  return `Invoice_${String(invoice.invoice_no).padStart(2, '0')}_${client}.pdf`
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function downloadInvoicePDF(invoice: Invoice) {
  saveBlob(await generateInvoicePDF(), fileNameFor(invoice))
}

export async function shareInvoicePDF(invoice: Invoice) {
  const blob = await generateInvoicePDF()
  const name = fileNameFor(invoice)
  const file = new File([blob], name, { type: 'application/pdf' })
  const gst = invoice.invoice_type !== 'nongst'
  const co = gst ? 'Pankti Engineering' : (invoice.company_name || 'Invoice')
  const text = `Invoice No: ${String(invoice.invoice_no).padStart(2, '0')}\nDate: ${new Date(invoice.date).toLocaleDateString('en-IN')}\nTotal: ₹${invoice.total.toLocaleString('en-IN')}\n\n${co}`

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name, text })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  // Fallback (desktop): download and open WhatsApp with text
  saveBlob(blob, name)
  setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n(PDF downloaded — attach it here)')}`, '_blank'), 600)
}
