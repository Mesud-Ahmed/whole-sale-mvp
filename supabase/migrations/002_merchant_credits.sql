create table if not exists merchant_credits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  credit_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists merchant_credits_customer_id_idx
  on merchant_credits (customer_id, credit_date desc);

alter table merchant_credits enable row level security;

create policy "Owners can view merchant credits"
on merchant_credits for select
using (owner_id = auth.uid());

create policy "Owners can insert merchant credits"
on merchant_credits for insert
with check (owner_id = auth.uid());

create policy "Owners can update merchant credits"
on merchant_credits for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can delete merchant credits"
on merchant_credits for delete
using (owner_id = auth.uid());
