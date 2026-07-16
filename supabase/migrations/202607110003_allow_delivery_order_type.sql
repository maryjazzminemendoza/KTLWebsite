alter table public.orders
drop constraint if exists orders_order_type_check;

alter table public.orders
add constraint orders_order_type_check
check (order_type in ('pickup', 'dine_in', 'delivery'));
