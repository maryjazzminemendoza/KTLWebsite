-- Loyalty lookup belongs to counter staff; the visit is recorded by POS checkout.
create or replace function public.get_loyalty_customer(scan_code uuid)
returns table (customer_id uuid, full_name text, completed_visits bigint, next_visit_number integer, reward_due boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  return query
  select p.id, p.full_name, count(v.id), ((count(v.id) % 5) + 1)::integer,
    ((count(v.id) % 5) + 1) = 5
  from public.profiles p left join public.loyalty_visits v on v.customer_id = p.id
  where p.loyalty_code = scan_code and p.role = 'customer'
  group by p.id, p.full_name;
end;
$$;
grant execute on function public.get_loyalty_customer(uuid) to authenticated;
