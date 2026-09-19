import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Users, IndianRupee, TrendingUp, Loader } from 'lucide-react'

export default function DashboardTab() {
  const [stats, setStats] = useState({ clients: 0, invoices: 0, total: 0, thisMonth: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count: clients }, { count: invoices }, { data: invData }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('total, date, clients(name), invoice_no').order('created_at', { ascending: false }).limit(5),
      ])

      const total = invData?.reduce((s: number, i: any) => s + (i.total || 0), 0) || 0
      const now = new Date()
      const thisMonth = invData?.filter((i: any) => {
        const d = new Date(i.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).reduce((s: number, i: any) => s + (i.total || 0), 0) || 0

      setStats({ clients: clients || 0, invoices: invoices || 0, total, thisMonth })
      setRecent(invData || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-orange-400" /></div>

  const cards = [
    { label: 'Total Clients', value: stats.clients, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Invoices', value: stats.invoices, icon: FileText, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Revenue', value: `₹${stats.total.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-green-50 text-green-600' },
    { label: 'This Month', value: `₹${stats.thisMonth.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-extrabold text-gray-900">Pankti Engineering</h1>
        <p className="text-sm text-gray-400">Invoice Dashboard</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon size={18} />
            </div>
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p className="text-lg font-extrabold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Recent Invoices</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p>
        ) : (
          <div className="space-y-2">
            {recent.map((inv: any, i: number) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  #{String(inv.invoice_no).padStart(2,'0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{inv.clients?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="font-bold text-sm text-orange-600">₹{inv.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
