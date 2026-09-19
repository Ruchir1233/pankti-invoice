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

  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients',  label: 'Clients',  icon: Users },
  ] as const

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative overflow-hidden print:max-w-none print:h-auto print:overflow-visible">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 print:hidden">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">PE</div>
        <div>
          <p className="font-extrabold text-sm text-gray-900 leading-none">Pankti Engineering</p>
          <p className="text-xs text-orange-500 font-semibold">Invoice Manager</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto print:overflow-visible">
        {tab === 'invoices' && (
          <InvoicesTab
            filterClient={filterClient}
            onClearFilter={() => setFilterClient(undefined)}
          />
        )}
        {tab === 'clients' && <ClientsTab onClientInvoices={handleClientInvoices} />}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 flex print:hidden">
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== 'invoices') setFilterClient(undefined) }}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${active ? 'text-orange-500' : 'text-gray-400'}`}>
              <t.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-semibold">{t.label}</span>
              {active && <div className="w-1 h-1 bg-orange-500 rounded-full" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
