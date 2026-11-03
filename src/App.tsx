import { useState } from 'react'
import { Users, FileText } from 'lucide-react'
import ClientsTab from './components/ClientsTab'
import InvoicesTab from './components/InvoicesTab'
import type { Client } from './lib/supabase'

type Tab = 'invoices' | 'clients'

export default function App() {
  const [tab, setTab] = useState<Tab>('invoices')
  const [filterClient, setFilterClient] = useState<Client | undefined>()

  function handleClientInvoices(client: Client) {
    setFilterClient(client)
    setTab('invoices')
  }
  function go(t: Tab) {
    setTab(t)
    if (t !== 'invoices') setFilterClient(undefined)
  }

  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
  ] as const

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar (laptop) */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-white border-r border-slate-200">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black">PE</div>
          <div>
            <p className="font-extrabold text-sm leading-tight">Pankti Engineering</p>
            <p className="text-xs text-orange-500 font-semibold">Invoice Manager</p>
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => go(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <t.icon size={18} /> {t.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm">PE</div>
        <div>
          <p className="font-extrabold text-sm text-slate-900 leading-none">Pankti Engineering</p>
          <p className="text-xs text-orange-500 font-semibold">Invoice Manager</p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        {tab === 'invoices' && (
          <InvoicesTab filterClient={filterClient} onClearFilter={() => setFilterClient(undefined)} />
        )}
        {tab === 'clients' && <ClientsTab onClientInvoices={handleClientInvoices} />}
      </main>

      {/* Bottom tabs (mobile) */}
      <nav className="md:hidden flex-shrink-0 bg-white border-t border-slate-200 flex pb-[env(safe-area-inset-bottom)]">
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => go(t.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 ${active ? 'text-orange-500' : 'text-slate-400'}`}>
              <t.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
