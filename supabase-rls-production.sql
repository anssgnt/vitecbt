-- Production RLS hardening for CBT Online.
-- Run this after the schema is created, then route admin-only operations through
-- Supabase Edge Functions with the service-role key.
--
-- Important:
-- The browser anon key cannot prove a student identity by itself. For strict
-- "own row only" writes, send x-cbt-user-id from a trusted Edge Function or
-- migrate students to Supabase Auth/custom JWT. Direct browser writes with the
-- anon key should be treated as untrusted.

begin;

alter table public.jadwal_ujian enable row level security;
alter table public.soal enable row level security;
alter table public.kunci enable row level security;
alter table public.peserta enable row level security;
alter table public.hasil enable row level security;
alter table public.sync_answers enable row level security;
alter table public.online_status enable row level security;
alter table public.reset_flags enable row level security;
alter table public.broadcasts enable row level security;
alter table public.status_sync enable row level security;
alter table public.pelanggaran enable row level security;

create or replace function public.cbt_request_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.headers', true)::json ->> 'x-cbt-user-id', '')
$$;

create or replace function public.cbt_request_admin()
returns boolean
language sql
stable
as $$
  select coalesce((current_setting('request.headers', true)::json ->> 'x-cbt-admin') = '1', false)
$$;

drop policy if exists "public_read_active_schedules" on public.jadwal_ujian;
create policy "public_read_active_schedules"
on public.jadwal_ujian for select
to anon
using (aktif is true);

drop policy if exists "public_read_questions" on public.soal;
create policy "public_read_questions"
on public.soal for select
to anon
using (
  exists (
    select 1 from public.jadwal_ujian j
    where j.nama_soal = soal.bank_id
      and j.aktif is true
  )
);

drop policy if exists "deny_anon_answer_keys" on public.kunci;
create policy "deny_anon_answer_keys"
on public.kunci for select
to anon
using (false);

drop policy if exists "public_read_student_list_minimal" on public.peserta;
create policy "public_read_student_list_minimal"
on public.peserta for select
to anon
using (true);

drop policy if exists "student_insert_own_result" on public.hasil;
create policy "student_insert_own_result"
on public.hasil for insert
to anon
with check (user_id = public.cbt_request_user_id());

drop policy if exists "student_read_own_result" on public.hasil;
create policy "student_read_own_result"
on public.hasil for select
to anon
using (user_id = public.cbt_request_user_id() or public.cbt_request_admin());

drop policy if exists "student_upsert_own_sync_answers" on public.sync_answers;
create policy "student_upsert_own_sync_answers"
on public.sync_answers for all
to anon
using (user_id = public.cbt_request_user_id() or public.cbt_request_admin())
with check (user_id = public.cbt_request_user_id());

drop policy if exists "student_upsert_own_online_status" on public.online_status;
create policy "student_upsert_own_online_status"
on public.online_status for all
to anon
using (user_id = public.cbt_request_user_id() or public.cbt_request_admin())
with check (user_id = public.cbt_request_user_id());

drop policy if exists "student_read_own_reset_flags" on public.reset_flags;
create policy "student_read_own_reset_flags"
on public.reset_flags for select
to anon
using (user_id = public.cbt_request_user_id() or public.cbt_request_admin());

drop policy if exists "public_read_broadcasts" on public.broadcasts;
create policy "public_read_broadcasts"
on public.broadcasts for select
to anon
using (true);

drop policy if exists "student_upsert_own_status_sync" on public.status_sync;
create policy "student_upsert_own_status_sync"
on public.status_sync for all
to anon
using (user_id = public.cbt_request_user_id() or public.cbt_request_admin())
with check (user_id = public.cbt_request_user_id());

commit;
