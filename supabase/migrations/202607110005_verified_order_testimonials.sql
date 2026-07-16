alter table public.testimonials
add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.testimonials
add column if not exists order_id bigint references public.orders(id) on delete set null;

create unique index if not exists testimonials_one_per_order
on public.testimonials(order_id)
where order_id is not null;

alter table public.testimonials enable row level security;

drop policy if exists "Customers can submit testimonials for completed orders" on public.testimonials;
create policy "Customers can submit testimonials for completed orders"
on public.testimonials
for insert
to authenticated
with check (
  auth.uid() = user_id
  and is_approved = false
  and is_featured = false
  and rating between 1 and 5
  and exists (
    select 1 from public.orders
    where orders.id = testimonials.order_id
      and orders.user_id = auth.uid()
      and orders.status = 'completed'
  )
);

drop policy if exists "Customers can view own testimonials" on public.testimonials;
create policy "Customers can view own testimonials"
on public.testimonials
for select
to authenticated
using (auth.uid() = user_id);
