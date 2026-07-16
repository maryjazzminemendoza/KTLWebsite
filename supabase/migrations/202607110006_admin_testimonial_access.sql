drop policy if exists "Admins can view all testimonials" on public.testimonials;
create policy "Admins can view all testimonials"
on public.testimonials
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can create testimonials" on public.testimonials;
create policy "Admins can create testimonials"
on public.testimonials
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update testimonials" on public.testimonials;
create policy "Admins can update testimonials"
on public.testimonials
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete testimonials" on public.testimonials;
create policy "Admins can delete testimonials"
on public.testimonials
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
