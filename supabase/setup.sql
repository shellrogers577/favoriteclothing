create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(12, 2) not null check (price > 0),
  category text not null check (category in ('Tee', 'Trousers', 'Bag', 'Short', 'Top')),
  badge text not null default 'Standard' check (badge in ('New Arrival', 'Standard', 'Sold Out')),
  rating numeric(2, 1) not null default 5 check (rating >= 1 and rating <= 5),
  sizes text[] not null default array['S', 'M', 'L', 'XL'],
  description text not null default '',
  image text not null,
  back_image text,
  stock integer not null default 10 check (stock >= 0),
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists back_image text;
alter table public.products drop constraint if exists products_category_check;
update public.products
set category = case category
  when 'Tees' then 'Tee'
  when 'Caps & Beanies' then 'Tee'
  when 'Track Pants' then 'Trousers'
  when 'Accessories' then 'Bag'
  when 'Tanks' then 'Top'
  else category
end
where category in ('Tees', 'Caps & Beanies', 'Track Pants', 'Accessories', 'Tanks');
alter table public.products
  add constraint products_category_check
  check (category in ('Tee', 'Trousers', 'Bag', 'Short', 'Top'));

create table if not exists public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.products enable row level security;
alter table public.store_admins enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
revoke all on public.store_admins from anon, authenticated;
grant select on public.store_admins to authenticated;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can view their own admin record" on public.store_admins;
create policy "Admins can view their own admin record"
  on public.store_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
  on public.products for insert
  to authenticated
  with check ((select public.is_store_admin()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using ((select public.is_store_admin()));

insert into public.products (name, price, category, badge, rating, sizes, description, image, stock)
values
  ('FG DONT FOLLOW ME TEE', 28999, 'Tee', 'New Arrival', 5, array['S','M','L','XL'], 'A reminder to walk your own path, made for everyday wear.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', 12),
  ('FG TRACK PANT', 42999, 'Trousers', 'Standard', 5, array['S','M','L','XL'], 'Relaxed fit track pants with a clean, considered finish.', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=900&q=85', 8),
  ('BRIGHT RED TRUCKER', 18999, 'Tee', 'Standard', 4.5, array['S','M','L','XL'], 'A bold everyday cap with an adjustable snapback fit.', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85', 0),
  ('EVERYDAY RIBBED TANK', 21999, 'Top', 'Standard', 4.5, array['S','M','L','XL'], 'Soft, breathable cotton for layering or wearing solo.', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85', 10),
  ('FIELD NOTES CAMO CAP', 19999, 'Tee', 'Standard', 5, array['S','M','L','XL'], 'A classic camo print for days spent out and about.', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85', 7),
  ('STAY GROUNDED BEANIE', 16999, 'Tee', 'Standard', 4, array['S','M','L','XL'], 'A soft knit staple with a comfortable, close fit.', 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=900&q=85', 9),
  ('BUILT ON FAITH TEE', 26999, 'Tee', 'Standard', 5, array['S','M','L','XL'], 'Everyday cotton, easy shape, and a message that matters.', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85', 6),
  ('DAILY CARRY CROSSBODY', 24999, 'Bag', 'Standard', 4.5, array['S','M','L','XL'], 'A compact carry-all designed for your daily essentials.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 5)
on conflict (name) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_store_admin()));

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_store_admin()))
  with check (bucket_id = 'product-images' and (select public.is_store_admin()));

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_store_admin()));
