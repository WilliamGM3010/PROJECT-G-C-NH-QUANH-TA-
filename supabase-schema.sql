-- ============================================================================
-- GÓC THỢ QUANH TA — SQL Schema cho 3 bảng trên Supabase
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

-- 3. Bảng tài khoản Quản trị & Cộng tác viên
create table if not exists public.admin_accounts (
  id text primary key,
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'Cộng tác viên',
  active boolean not null default true,
  created_at text not null default ''
);

-- Thêm tài khoản Super Admin mặc định (nếu chưa tồn tại)
insert into public.admin_accounts (id, name, email, password, role, active, created_at)
values
  ('admin-super-1', 'William Gia Minh (Điều phối dự án)', 'admin@goctho.vn', 'admin123', 'Super Admin', true, '01/11/2026'),
  ('admin-ctv-1', 'Quang Huy (Cộng tác viên Q.1)', 'ctv@goctho.vn', 'ctv123', 'Cộng tác viên', true, '12/11/2026')
on conflict (email) do nothing;
