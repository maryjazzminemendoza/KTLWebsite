-- Staff POS foundation. Apply this migration before opening /pos.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'cashier', 'admin'));

alter table public.orders
  add column if not exists order_source text not null default 'website',
  add column if not exists receipt_number text,
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists total numeric(12,2),
  add column if not exists amount_received numeric(12,2),
  add column if not exists change_amount numeric(12,2),
  add column if not exists created_by uuid references public.profiles(id);

create unique index if not exists orders_receipt_number_key
  on public.orders (receipt_number) where receipt_number is not null;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'cashier'));
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

create or replace function public.create_pos_sale(
  cart_items jsonb,
  sale_order_type text,
  sale_payment_method text,
  cash_received numeric default null,
  sale_notes text default null,
  loyalty_scan_code uuid default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  item jsonb; menu record; qty integer; unit_price numeric(12,2); option_label text;
  computed_subtotal numeric(12,2) := 0; computed_discount numeric(12,2) := 0;
  computed_total numeric(12,2); computed_change numeric(12,2) := 0;
  new_order_id bigint; receipt text; customer uuid; visit_count bigint; visit_number integer;
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  if jsonb_typeof(cart_items) <> 'array' or jsonb_array_length(cart_items) = 0 then raise exception 'Cart is empty'; end if;
  if sale_order_type not in ('dine_in', 'pickup', 'delivery') then raise exception 'Invalid order type'; end if;
  if sale_payment_method not in ('cash', 'gcash', 'card') then raise exception 'Invalid payment method'; end if;
  if loyalty_scan_code is not null and sale_order_type <> 'dine_in' then
    raise exception 'Loyalty visits apply only to dine-in orders and completed reservations';
  end if;

  for item in select * from jsonb_array_elements(cart_items) loop
    qty := (item->>'quantity')::integer;
    if qty < 1 or qty > 99 then raise exception 'Invalid quantity'; end if;
    select id, name, category, price, price_options, is_available into menu
      from public.menu_items where id = (item->>'menu_item_id')::bigint;
    if menu.id is null or not menu.is_available then raise exception 'A menu item is unavailable'; end if;
    option_label := nullif(trim(item->>'variation'), '');
    if option_label is not null then
      select (o->>'price')::numeric into unit_price from jsonb_array_elements(menu.price_options) o
        where o->>'label' = option_label limit 1;
      if unit_price is null then raise exception 'Invalid menu variation'; end if;
    else
      unit_price := menu.price;
      if unit_price is null then raise exception 'Choose a menu variation'; end if;
    end if;
    computed_subtotal := computed_subtotal + (unit_price * qty);
  end loop;

  receipt := 'POS-' || to_char(clock_timestamp() at time zone 'Asia/Manila', 'YYYYMMDD-HH24MISS') || '-' || upper(substr(md5(random()::text), 1, 4));
  if loyalty_scan_code is not null then
    select id into customer from public.profiles where loyalty_code = loyalty_scan_code and role = 'customer' for update;
    if customer is null then raise exception 'Loyalty QR was not found'; end if;
    select count(*) into visit_count from public.loyalty_visits where customer_id = customer;
    visit_number := (visit_count % 5) + 1;
    if visit_number = 5 then computed_discount := round(computed_subtotal * 0.10, 2); end if;
  end if;
  computed_total := computed_subtotal - computed_discount;
  if sale_payment_method = 'cash' then
    if cash_received is null or cash_received < computed_total then raise exception 'Cash received is insufficient'; end if;
    computed_change := cash_received - computed_total;
  end if;

  insert into public.orders (customer_name, email, phone, order_type, status, subtotal, notes,
    order_source, receipt_number, payment_method, payment_status, discount_amount, total,
    amount_received, change_amount, created_by, user_id)
  values ('Walk-in customer', '', '', sale_order_type, 'confirmed', computed_subtotal, nullif(trim(sale_notes), ''),
    'pos', receipt, sale_payment_method, 'paid', computed_discount, computed_total,
    case when sale_payment_method = 'cash' then cash_received else computed_total end, computed_change, auth.uid(), customer)
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(cart_items) loop
    qty := (item->>'quantity')::integer; option_label := nullif(trim(item->>'variation'), '');
    select id, name, category, price, price_options into menu from public.menu_items where id = (item->>'menu_item_id')::bigint;
    if option_label is not null then
      select (o->>'price')::numeric into unit_price from jsonb_array_elements(menu.price_options) o where o->>'label' = option_label limit 1;
    else unit_price := menu.price; end if;
    insert into public.order_items (order_id, menu_item_id, name, category, price, quantity, line_total)
    values (new_order_id, menu.id, menu.name || case when option_label is null then '' else ' (' || option_label || ')' end,
      menu.category, unit_price, qty, unit_price * qty);
  end loop;

  if customer is not null then
    insert into public.loyalty_visits (customer_id, recorded_by, visit_type, receipt_reference,
      cycle_visit_number, reward_applied, eligible_amount, discount_amount)
    values (customer, auth.uid(), 'walk_in', receipt, visit_number, visit_number = 5,
      case when visit_number = 5 then computed_subtotal else null end, computed_discount);
  end if;

  return jsonb_build_object('order_id', new_order_id, 'receipt_number', receipt,
    'subtotal', computed_subtotal, 'discount', computed_discount, 'total', computed_total,
    'change', computed_change);
end;
$$;
grant execute on function public.create_pos_sale(jsonb, text, text, numeric, text, uuid) to authenticated;

create policy "Staff can view orders" on public.orders for select to authenticated using (public.is_staff());
create policy "Staff can view order items" on public.order_items for select to authenticated using (public.is_staff());
