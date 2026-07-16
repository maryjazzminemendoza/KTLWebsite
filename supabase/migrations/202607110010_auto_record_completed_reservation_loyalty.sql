create or replace function public.record_completed_reservation_loyalty_visit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  visit_count bigint;
  visit_number integer;
begin
  if new.status <> 'completed' or old.status = 'completed' or new.user_id is null then
    return new;
  end if;

  -- Serialize loyalty updates for this customer so simultaneous visits cannot
  -- receive the same position in a five-visit cycle.
  perform 1 from public.profiles where id = new.user_id for update;

  if not exists (
    select 1 from public.loyalty_visits where reservation_id = new.id
  ) then
    select count(*) into visit_count
    from public.loyalty_visits
    where customer_id = new.user_id;

    visit_number := (visit_count % 5) + 1;

    insert into public.loyalty_visits (
      customer_id,
      recorded_by,
      visit_type,
      reservation_id,
      cycle_visit_number,
      reward_applied,
      discount_amount
    ) values (
      new.user_id,
      coalesce(auth.uid(), new.user_id),
      'reservation',
      new.id,
      visit_number,
      visit_number = 5,
      0
    )
    on conflict (reservation_id) where reservation_id is not null do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists record_completed_reservation_loyalty on public.reservations;

create trigger record_completed_reservation_loyalty
  after update of status on public.reservations
  for each row
  execute function public.record_completed_reservation_loyalty_visit();

-- Backfill completed reservations that predate this automation. Existing
-- loyalty entries are retained and reservations already recorded are skipped.
do $$
declare
  reservation_record record;
  visit_count bigint;
  visit_number integer;
begin
  for reservation_record in
    select r.id, r.user_id
    from public.reservations r
    where r.status = 'completed'
      and r.user_id is not null
      and not exists (
        select 1 from public.loyalty_visits v where v.reservation_id = r.id
      )
    order by r.reservation_date, r.reservation_time, r.id
  loop
    select count(*) into visit_count
    from public.loyalty_visits
    where customer_id = reservation_record.user_id;

    visit_number := (visit_count % 5) + 1;

    insert into public.loyalty_visits (
      customer_id, recorded_by, visit_type, reservation_id,
      cycle_visit_number, reward_applied, discount_amount
    ) values (
      reservation_record.user_id, reservation_record.user_id, 'reservation',
      reservation_record.id, visit_number, visit_number = 5, 0
    )
    on conflict (reservation_id) where reservation_id is not null do nothing;
  end loop;
end;
$$;
