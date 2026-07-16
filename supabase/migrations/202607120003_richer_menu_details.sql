alter table public.menu_items
  add column if not exists serving_note text,
  add column if not exists inclusions text,
  add column if not exists price_options jsonb not null default '[]'::jsonb;

comment on column public.menu_items.serving_note is
  'Portion or pricing context such as Per order, Serves 5–7 pax, or Price varies by size.';
comment on column public.menu_items.inclusions is
  'Line-separated inclusions for platters, bilao meals, and packages.';
comment on column public.menu_items.price_options is
  'Orderable variants as a JSON array of objects with label and price fields.';
