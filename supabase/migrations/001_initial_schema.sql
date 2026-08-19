create extension if not exists "pgcrypto";

create type payment_status as enum ('PAID', 'PARTIAL', 'CREDIT');
create type inventory_movement_type as enum ('SALE', 'ADJUSTMENT', 'INITIAL_STOCK');

create table products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  unit text not null default 'piece',
  purchase_price numeric(14,2) not null check (purchase_price >= 0),
  selling_price numeric(14,2) not null check (selling_price >= 0),
  current_quantity numeric(14,2) not null default 0 check (current_quantity >= 0),
  minimum_stock numeric(14,2) not null default 0 check (minimum_stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  active boolean not null default true
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  business_name text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  active boolean not null default true
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references customers(id) on delete restrict,
  sale_date date not null default current_date,
  subtotal numeric(14,2) not null check (subtotal >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  total_amount numeric(14,2) not null check (total_amount >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  payment_status payment_status not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total numeric(14,2) not null check (total >= 0)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  sale_id uuid references sales(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

create table payment_allocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  sale_id uuid not null references sales(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  type inventory_movement_type not null,
  quantity numeric(14,2) not null,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

create index products_owner_active_idx on products(owner_id, active);
create index products_owner_category_idx on products(owner_id, category);
create unique index products_owner_sku_unique on products(owner_id, sku) where sku is not null and sku <> '';
create index customers_owner_active_idx on customers(owner_id, active);
create index sales_owner_date_idx on sales(owner_id, sale_date desc);
create index sales_owner_customer_idx on sales(owner_id, customer_id);
create index sale_items_sale_idx on sale_items(sale_id);
create index payments_owner_customer_idx on payments(owner_id, customer_id);
create index allocations_sale_idx on payment_allocations(sale_id);
create index movements_owner_product_idx on inventory_movements(owner_id, product_id, created_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at before update on products
for each row execute function set_updated_at();

create trigger customers_updated_at before update on customers
for each row execute function set_updated_at();

create or replace view sale_balances
with (security_invoker = true) as
select
  s.id as sale_id,
  s.owner_id,
  s.customer_id,
  s.total_amount,
  coalesce(sum(pa.amount), s.amount_paid, 0)::numeric(14,2) as paid_amount,
  greatest(s.total_amount - coalesce(sum(pa.amount), s.amount_paid, 0), 0)::numeric(14,2) as balance
from sales s
left join payment_allocations pa on pa.sale_id = s.id
group by s.id;

create or replace view customer_balances
with (security_invoker = true) as
select
  c.id as customer_id,
  c.owner_id,
  c.name,
  c.business_name,
  c.phone,
  coalesce(sum(s.total_amount), 0)::numeric(14,2) as total_purchases,
  coalesce((
    select sum(p.amount)
    from payments p
    where p.customer_id = c.id and p.owner_id = c.owner_id
  ), 0)::numeric(14,2) as total_paid,
  greatest(
    coalesce(sum(s.total_amount), 0) -
    coalesce((
      select sum(p.amount)
      from payments p
      where p.customer_id = c.id and p.owner_id = c.owner_id
    ), 0),
    0
  )::numeric(14,2) as outstanding_balance,
  (
    select max(p.payment_date)
    from payments p
    where p.customer_id = c.id and p.owner_id = c.owner_id
  ) as last_payment_date
from customers c
left join sales s on s.customer_id = c.id and s.owner_id = c.owner_id
where c.active = true
group by c.id;

alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;
alter table payment_allocations enable row level security;
alter table inventory_movements enable row level security;

create policy "products owner access" on products for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "customers owner access" on customers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sales owner access" on sales for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sale items owner access" on sale_items for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "payments owner access" on payments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "payment allocations owner access" on payment_allocations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "inventory movements owner access" on inventory_movements for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function create_product_with_stock(
  p_name text,
  p_sku text,
  p_category text,
  p_unit text,
  p_purchase_price numeric,
  p_selling_price numeric,
  p_initial_quantity numeric,
  p_minimum_stock numeric,
  p_created_by uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_product_id uuid;
begin
  if v_owner is null or p_created_by <> v_owner then
    raise exception 'Not authenticated';
  end if;

  if p_initial_quantity < 0 or p_purchase_price < 0 or p_selling_price < 0 or p_minimum_stock < 0 then
    raise exception 'Invalid numeric value';
  end if;

  insert into products (
    owner_id, name, sku, category, unit, purchase_price, selling_price, current_quantity, minimum_stock
  ) values (
    v_owner, p_name, nullif(p_sku, ''), nullif(p_category, ''), coalesce(nullif(p_unit, ''), 'piece'),
    p_purchase_price, p_selling_price, p_initial_quantity, p_minimum_stock
  )
  returning id into v_product_id;

  if p_initial_quantity > 0 then
    insert into inventory_movements (owner_id, product_id, type, quantity, reference_id, note, created_by)
    values (v_owner, v_product_id, 'INITIAL_STOCK', p_initial_quantity, v_product_id, 'Initial stock', v_owner);
  end if;

  return v_product_id;
end;
$$;

create or replace function adjust_stock(
  p_product_id uuid,
  p_quantity numeric,
  p_note text,
  p_created_by uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_current numeric;
begin
  if v_owner is null or p_created_by <> v_owner then
    raise exception 'Not authenticated';
  end if;

  select current_quantity into v_current
  from products
  where id = p_product_id and owner_id = v_owner and active = true
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  if v_current + p_quantity < 0 then
    raise exception 'Insufficient stock';
  end if;

  update products
  set current_quantity = current_quantity + p_quantity
  where id = p_product_id and owner_id = v_owner;

  insert into inventory_movements (owner_id, product_id, type, quantity, reference_id, note, created_by)
  values (v_owner, p_product_id, 'ADJUSTMENT', p_quantity, null, p_note, v_owner);
end;
$$;

create or replace function complete_sale(
  p_customer_id uuid,
  p_sale_date date,
  p_discount numeric,
  p_amount_paid numeric,
  p_items jsonb,
  p_created_by uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_item jsonb;
  v_product products%rowtype;
  v_subtotal numeric := 0;
  v_total numeric;
  v_status payment_status;
  v_sale_id uuid;
  v_payment_id uuid;
begin
  if v_owner is null or p_created_by <> v_owner then
    raise exception 'Not authenticated';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one product';
  end if;

  if p_discount < 0 or p_amount_paid < 0 then
    raise exception 'Invalid payment amount';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if (v_item->>'quantity')::numeric <= 0 or (v_item->>'unit_price')::numeric < 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from products
    where id = (v_item->>'product_id')::uuid and owner_id = v_owner and active = true
    for update;

    if not found then
      raise exception 'Product not found';
    end if;

    if v_product.current_quantity < (v_item->>'quantity')::numeric then
      raise exception 'Only % % available.', v_product.current_quantity, v_product.unit;
    end if;

    v_subtotal := v_subtotal + ((v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric);
  end loop;

  if p_discount > v_subtotal then
    raise exception 'Discount cannot exceed subtotal';
  end if;

  v_total := v_subtotal - p_discount;

  if p_amount_paid > v_total then
    raise exception 'Payment cannot exceed sale total';
  end if;

  if p_amount_paid = v_total then
    v_status := 'PAID';
  elsif p_amount_paid > 0 then
    v_status := 'PARTIAL';
  else
    v_status := 'CREDIT';
  end if;

  if v_status <> 'PAID' and p_customer_id is null then
    raise exception 'Customer required for credit sale';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from customers where id = p_customer_id and owner_id = v_owner and active = true
  ) then
    raise exception 'Customer not found';
  end if;

  insert into sales (owner_id, customer_id, sale_date, subtotal, discount, total_amount, amount_paid, payment_status, created_by)
  values (v_owner, p_customer_id, p_sale_date, v_subtotal, p_discount, v_total, p_amount_paid, v_status, v_owner)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into sale_items (owner_id, sale_id, product_id, quantity, unit_price, total)
    values (
      v_owner,
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric
    );

    update products
    set current_quantity = current_quantity - (v_item->>'quantity')::numeric
    where id = (v_item->>'product_id')::uuid and owner_id = v_owner;

    insert into inventory_movements (owner_id, product_id, type, quantity, reference_id, note, created_by)
    values (
      v_owner,
      (v_item->>'product_id')::uuid,
      'SALE',
      -((v_item->>'quantity')::numeric),
      v_sale_id,
      'Sale completed',
      v_owner
    );
  end loop;

  if p_amount_paid > 0 and p_customer_id is not null then
    insert into payments (owner_id, customer_id, sale_id, amount, payment_date, note, created_by)
    values (v_owner, p_customer_id, v_sale_id, p_amount_paid, p_sale_date, 'Payment at sale', v_owner)
    returning id into v_payment_id;

    insert into payment_allocations (owner_id, payment_id, sale_id, amount)
    values (v_owner, v_payment_id, v_sale_id, p_amount_paid);
  end if;

  return v_sale_id;
end;
$$;

create or replace function record_customer_payment(
  p_customer_id uuid,
  p_sale_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_note text,
  p_created_by uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_outstanding numeric;
  v_payment_id uuid;
  v_remaining numeric;
  v_sale record;
  v_apply numeric;
begin
  if v_owner is null or p_created_by <> v_owner then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  if not exists (select 1 from customers where id = p_customer_id and owner_id = v_owner and active = true) then
    raise exception 'Customer not found';
  end if;

  select outstanding_balance into v_outstanding
  from customer_balances
  where customer_id = p_customer_id and owner_id = v_owner;

  if coalesce(v_outstanding, 0) <= 0 then
    raise exception 'No outstanding balance';
  end if;

  if p_amount > v_outstanding then
    raise exception 'Payment cannot exceed outstanding balance';
  end if;

  insert into payments (owner_id, customer_id, sale_id, amount, payment_date, note, created_by)
  values (v_owner, p_customer_id, p_sale_id, p_amount, p_payment_date, p_note, v_owner)
  returning id into v_payment_id;

  v_remaining := p_amount;

  if p_sale_id is not null then
    select * into v_sale
    from sale_balances
    where sale_id = p_sale_id and owner_id = v_owner and customer_id = p_customer_id;

    if not found then
      raise exception 'Sale not found';
    end if;

    if p_amount > v_sale.balance then
      raise exception 'Payment cannot exceed sale balance';
    end if;

    insert into payment_allocations (owner_id, payment_id, sale_id, amount)
    values (v_owner, v_payment_id, p_sale_id, p_amount);
  else
    for v_sale in
      select *
      from sale_balances
      where owner_id = v_owner and customer_id = p_customer_id and balance > 0
      order by (select sale_date from sales where id = sale_balances.sale_id), sale_id
    loop
      exit when v_remaining <= 0;
      v_apply := least(v_remaining, v_sale.balance);

      insert into payment_allocations (owner_id, payment_id, sale_id, amount)
      values (v_owner, v_payment_id, v_sale.sale_id, v_apply);

      v_remaining := v_remaining - v_apply;
    end loop;
  end if;

  update sales s
  set
    amount_paid = least(s.total_amount, coalesce((select sum(pa.amount) from payment_allocations pa where pa.sale_id = s.id), 0)),
    payment_status = case
      when coalesce((select sum(pa.amount) from payment_allocations pa where pa.sale_id = s.id), 0) >= s.total_amount then 'PAID'::payment_status
      when coalesce((select sum(pa.amount) from payment_allocations pa where pa.sale_id = s.id), 0) > 0 then 'PARTIAL'::payment_status
      else 'CREDIT'::payment_status
    end
  where s.owner_id = v_owner and s.customer_id = p_customer_id;

  return v_payment_id;
end;
$$;
