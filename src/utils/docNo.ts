import type { Invoice } from '../lib/supabase'

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const docNo = (inv: Pick<Invoice, 'invoice_no' | 'is_estimate'>) =>
  inv.is_estimate ? `EST-${pad2(inv.invoice_no)}` : pad2(inv.invoice_no)

export function validTill(date: string, days?: number | null) {
  const d = new Date(date)
  d.setDate(d.getDate() + (days || 15))
  return d.toLocaleDateString('en-IN')
}
