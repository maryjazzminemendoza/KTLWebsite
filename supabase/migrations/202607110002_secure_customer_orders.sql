alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke insert on table public.orders from anon;
revoke insert on table public.order_items from anon;

drop policy if exists "Customers can create own orders" on public.orders;
create policy "Customers can create own orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Customers can view own orders" on public.orders;
create policy "Customers can view own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Customers can add items to own orders" on public.order_items;
create policy "Customers can add items to own orders"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "Customers can view items from own orders" on public.order_items;
create policy "Customers can view items from own orders"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);
