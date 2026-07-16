alter table public.reservations
add column if not exists ai_request_analysis jsonb,
add column if not exists ai_analyzed_at timestamptz,
add column if not exists ai_analysis_model text;

comment on column public.reservations.ai_request_analysis is
  'Staff-facing structured analysis of the customer special request. AI output is advisory only.';

