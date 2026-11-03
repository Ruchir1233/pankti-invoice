alter table invoices add column if not exists file_url text;
alter table invoices add column if not exists file_name text;
alter table invoices add column if not exists file_type text;

insert into storage.buckets (id, name, public) values ('invoice-files', 'invoice-files', true)
on conflict (id) do nothing;

drop policy if exists "invoice files all" on storage.objects;
create policy "invoice files all" on storage.objects for all
  using (bucket_id = 'invoice-files') with check (bucket_id = 'invoice-files');
