import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ogbqxqrmtezezrcmkzkp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYnF4cXJtdGV6ZXpyY21remtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODQ1ODcsImV4cCI6MjA2MTE2MDU4N30.qM6UF2DLf0GsaelXW-6-1u3cQsADjROXB7NLzSceX1w'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Client = {
  id: string
  name: string
  address: string
  gstin: string
  state: string
  phone: string
  created_at: string
}

export type InvoiceItem = {
  id?: string
  invoice_id?: string
  particulars: string
  hsn_code: string
  qty: number
  rate: number
  amount: number
}

export type Invoice = {
  id: string
  client_id: string
  invoice_no: number
  date: string
  mode_of_delivery: string
  vehicle_no: string
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  subtotal: number
  tax_amount: number
  total: number
  created_at: string
  clients?: Client
  invoice_items?: InvoiceItem[]
}
