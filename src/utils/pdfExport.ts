import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Invoice } from '../lib/supabase'

export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
  const el = document.getElementById('invoice-print')
  if (!el) throw new Error('Invoice element not found')

  // Force full size for capture regardless of screen
  const originalTransform = el.style.transform
  const originalWidth = el.style.width
  el.style.transform = 'none'
  el.style.width = '210mm'

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: 900,
  })

  el.style.transform = originalTransform
  el.style.width = originalWidth

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdfWidth = 210
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297))

  return pdf.output('blob')
}

export async function downloadInvoicePDF(invoice: Invoice) {
  const blob = await generateInvoicePDF(invoice)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Invoice_${String(invoice.invoice_no).padStart(2, '0')}_${invoice.clients?.name?.replace(/[^\w]/g, '_') || 'client'}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function shareInvoicePDF(invoice: Invoice) {
  const blob = await generateInvoicePDF(invoice)
  const fileName = `Invoice_${String(invoice.invoice_no).padStart(2, '0')}.pdf`
  const file = new File([blob], fileName, { type: 'application/pdf' })

  const text = `Invoice No: ${String(invoice.invoice_no).padStart(2, '0')}
Client: ${invoice.clients?.name}
Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}
Total: ₹${invoice.total.toLocaleString('en-IN')}

Pankti Engineering
Dhamdachi, Valsad | 9879523937`

  // Try native share with file first (Android/Chrome supports this)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName, text })
      return
    } catch (e) {
      // User cancelled or error - fall through to fallback
      if ((e as Error).name === 'AbortError') return
    }
  }

  // Fallback: download the PDF and open WhatsApp Web with the text
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  setTimeout(() => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n(PDF downloaded — attach it in WhatsApp)')}`
    window.open(waUrl, '_blank')
  }, 500)
}
