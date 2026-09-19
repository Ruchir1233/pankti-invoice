-- Run this in Supabase SQL Editor

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  gstin text default '',
  state text default 'Gujarat',
  phone text default '',
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  invoice_no integer not null,
  date date not null,
  mode_of_delivery text default '',
  vehicle_no text default '',
  cgst_rate numeric default 9,
  sgst_rate numeric default 9,
  igst_rate numeric default 0,
  subtotal numeric default 0,
  tax_amount numeric default 0,
  total numeric default 0,
  created_at timestamptz default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  particulars text default '',
  hsn_code text default '',
  qty numeric default 1,
  rate numeric default 0,
  amount numeric default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security and allow all (since no auth)
alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "Allow all" on clients for all using (true) with check (true);
create policy "Allow all" on invoices for all using (true) with check (true);
create policy "Allow all" on invoice_items for all using (true) with check (true);
