alter table invoices add column if not exists invoice_type text default 'gst';
alter table invoices add column if not exists company_name text;
alter table invoices add column if not exists company_address text;
alter table invoices add column if not exists company_phone text;
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  phone text default '',
  created_at timestamptz default now()
);
alter table companies enable row level security;
drop policy if exists "Allow all" on companies;
create policy "Allow all" on companies for all using (true) with check (true);
