-- ============================================================================
-- GÓC THỢ QUANH TA — SQL Schema & Migration không làm mất dữ liệu cũ
-- Chạy đoạn SQL này trong Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Bảng cô chú thợ (bao gồm cả đã duyệt 'approved' và chờ duyệt 'pending')
create table if not exists public.artisans (
  id text primary key,
  name text not null,
  short_title text not null default '',
  categories jsonb not null default '[]'::jsonb,
  district text not null default 'Bình Thạnh',
  lat double precision not null default 10.788,
  lng double precision not null default 106.705,
  address_landmark text not null default '',
  problems jsonb not null default '[]'::jsonb,
  hours text not null default '08:00 – 17:30',
  min_price_label text not null default 'Từ 15k',
  prices jsonb not null default '[]'::jsonb,
  story text not null default '',
  status text not null default 'working',
  approval_status text not null default 'approved',
  verified_date text not null default '',
  last_verified_date text,
  payment_method text not null default 'Chỉ tiền mặt',
  parking_info text not null default 'Dễ đậu xe',
  has_consent boolean not null default true,
  hide_portrait boolean not null default true,
  is_hidden boolean not null default false,
  illustration_variant text not null default 'cobbler',
  custom_image_url text,
  kudos jsonb not null default '{"sturdy":0,"studentPrice":0,"fast":0,"friendly":0}'::jsonb,
  praises jsonb not null default '[]'::jsonb,
  revived_count integer not null default 0,
  pic text,
  internal_notes text,
  submitted_by text,
  submitted_at text,
  created_at timestamptz not null default now()
);

-- 2. Bảng báo cáo tình trạng từ người dùng
create table if not exists public.status_reports (
  id text primary key,
  artisan_id text not null,
  artisan_name text not null default '',
  reported_status text not null default 'working',
  note text not null default '',
  is_resolved boolean not null default false,
  created_at text not null default ''
);

-- 3. Bảng tài khoản hợp nhất (Super Admin, Cộng tác viên, Người dùng)
-- Giữ nguyên toàn bộ tài khoản cũ, chỉ bổ sung các cột mới nếu chưa có
create table if not exists public.admin_accounts (
  id text primary key,
  name text not null default '',
  email text unique,
  username text unique,
  display_name text not null default '',
  password text not null,
  role text not null default 'user',
  active boolean not null default true,
  revived_count integer not null default 0,
  badges jsonb not null default '[]'::jsonb,
  favorite_artisan_ids jsonb not null default '[]'::jsonb,
  created_at text not null default ''
);

-- Migration an toàn cho bảng admin_accounts đã tồn tại trước đó (KHÔNG xóa hay ghi đè tài khoản cũ)
alter table public.admin_accounts add column if not exists username text;
alter table public.admin_accounts add column if not exists display_name text;
alter table public.admin_accounts add column if not exists revived_count integer not null default 0;
alter table public.admin_accounts add column if not exists badges jsonb not null default '[]'::jsonb;
alter table public.admin_accounts add column if not exists favorite_artisan_ids jsonb not null default '[]'::jsonb;

-- Điền username & display_name mặc định cho các tài khoản cũ nếu đang null (giữ nguyên mật khẩu & vai trò cũ)
update public.admin_accounts
set
  username = coalesce(nullif(username, ''), email),
  display_name = coalesce(nullif(display_name, ''), name, email)
where username is null or username = '' or display_name is null or display_name = '';

-- Tạo chỉ mục duy nhất cho username (bỏ qua giá trị rỗng)
create unique index if not exists idx_admin_accounts_username_unique
  on public.admin_accounts (lower(username))
  where username is not null and username <> '';

-- Chỉ thêm tài khoản mặc định nếu chưa tồn tại (KHÔNG ghi đè tài khoản cũ)
insert into public.admin_accounts (id, name, display_name, email, username, password, role, active, revived_count, badges, favorite_artisan_ids, created_at)
values
  ('admin-super-1', 'William Gia Minh (Điều phối dự án)', 'William Gia Minh (Điều phối dự án)', 'admin@goctho.vn', 'admin@goctho.vn', 'admin123', 'super_admin', true, 0, '[]'::jsonb, '[]'::jsonb, '01/11/2026'),
  ('admin-ctv-1', 'Quang Huy (Cộng tác viên Q.1)', 'Quang Huy (Cộng tác viên Q.1)', 'ctv@goctho.vn', 'ctv@goctho.vn', 'ctv123', 'collaborator', true, 0, '[]'::jsonb, '[]'::jsonb, '12/11/2026')
on conflict (email) do nothing;
