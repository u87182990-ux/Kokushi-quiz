-- 「治療クイズ」（chiryoq）の記録もクラウドに保存できるようにする追加SQL
-- Supabase の SQL Editor に貼って1回だけ実行してください（何度実行しても大丈夫）。
alter table public.kq_progress drop constraint if exists kq_progress_app_check;
alter table public.kq_progress add constraint kq_progress_app_check check (app in ('kakomon','prep','chiryo','chiryoq'));

create or replace function public.kq_save(p_nick text, p_pin text, p_app text, p_data jsonb)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r text := public.kq_check(p_nick, p_pin);
begin
  if r <> 'ok' then return json_build_object('status', r); end if;
  if p_app not in ('kakomon','prep','chiryo','chiryoq') then return json_build_object('status', 'bad_app'); end if;
  if octet_length(p_data::text) > 3000000 then return json_build_object('status', 'too_big'); end if;
  insert into public.kq_progress(nick_key, app, data, updated_at) values (lower(btrim(p_nick)), p_app, p_data, now())
  on conflict (nick_key, app) do update set data = excluded.data, updated_at = now();
  return json_build_object('status', 'ok');
end $$;
