alter table invoices add column if not exists is_estimate boolean default false;
alter table invoices add column if not exists valid_days int;
alter table invoices add column if not exists terms text;
alter table invoices add column if not exists status text;
update invoices set is_estimate = false where is_estimate is null;
