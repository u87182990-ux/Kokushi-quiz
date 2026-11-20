-- 国試ドリル：ニックネーム＋4ケタ数字で記録を保存するしくみ
-- Supabase の「SQL Editor」にこのファイルの中身を全部貼って「Run」を押してください（1回だけでOK）。

create extension if not exists pgcrypto with schema extensions;

-- 利用者（ニックネームと、数字のカギ＝ハッシュ化して保存）
create table if not exists public.kq_users (
  nick_key   text primary key,              -- 小文字にそろえたニックネーム（重複チェック用）
  nick       text not null,                 -- 表示用ニックネーム
  pin_hash   text not null,
  fails      int  not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

-- 記録（アプリごとに1行）
create table if not exists public.kq_progress (
  nick_key   text not null references public.kq_users(nick_key) on delete cascade,
  app        text not null check (app in ('kakomon','prep','chiryo','chiryoq')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (nick_key, app)
);

-- テーブルは直接さわれないようにする（下の関数からだけ使う）
alter table public.kq_users    enable row level security;
alter table public.kq_progress enable row level security;
revoke all on public.kq_users, public.kq_progress from anon, authenticated;

-- 数字のカギを確かめる。5回まちがえると10分ロック
create or replace function public.kq_check(p_nick text, p_pin text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare u public.kq_users; k text := lower(btrim(p_nick));
begin
  select * into u from public.kq_users where nick_key = k for update;
  if not found then return 'none'; end if;
  if u.locked_until is not null and u.locked_until > now() then return 'locked'; end if;
  if crypt(p_pin, u.pin_hash) = u.pin_hash then
    update public.kq_users set fails = 0, locked_until = null where nick_key = k;
    return 'ok';
  end if;
  if u.fails + 1 >= 5 then
    update public.kq_users set fails = 0, locked_until = now() + interval '10 minutes' where nick_key = k;
    return 'locked';
  end if;
  update public.kq_users set fails = u.fails + 1 where nick_key = k;
  return 'wrong';
end $$;
revoke all on function public.kq_check(text, text) from public, anon, authenticated;

-- 新しく登録
create or replace function public.kq_register(p_nick text, p_pin text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare n text := btrim(p_nick);
begin
  if char_length(n) < 1 or char_length(n) > 20 then return 'bad_nick'; end if;
  if p_pin !~ '^[0-9]{4}$' then return 'bad_pin'; end if;
  insert into public.kq_users(nick_key, nick, pin_hash) values (lower(n), n, crypt(p_pin, gen_salt('bf')))
  on conflict (nick_key) do nothing;
  if not found then return 'taken'; end if;
  return 'ok';
end $$;

-- ログイン（確認だけ）。表示用ニックネームも返す
create or replace function public.kq_login(p_nick text, p_pin text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r text := public.kq_check(p_nick, p_pin);
begin
  if r <> 'ok' then return json_build_object('status', r); end if;
  return json_build_object('status', 'ok', 'nick', (select nick from public.kq_users where nick_key = lower(btrim(p_nick))));
end $$;

-- 記録を読む
create or replace function public.kq_load(p_nick text, p_pin text, p_app text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r text := public.kq_check(p_nick, p_pin);
begin
  if r <> 'ok' then return json_build_object('status', r); end if;
  return json_build_object('status', 'ok', 'data',
    (select data from public.kq_progress where nick_key = lower(btrim(p_nick)) and app = p_app));
end $$;

-- 記録を保存（上書き）
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

grant usage on schema public to anon;
grant execute on function public.kq_register(text, text) to anon;
grant execute on function public.kq_login(text, text) to anon;
grant execute on function public.kq_load(text, text, text) to anon;
grant execute on function public.kq_save(text, text, text, jsonb) to anon;
