drop policy if exists "Public can view approved testimonials" on public.testimonials;
create policy "Public can view approved testimonials"
on public.testimonials
for select
to anon, authenticated
using (is_approved = true);
