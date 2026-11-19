# Favorite Clothing

A responsive storefront and admin dashboard built with React, Vite, and plain CSS. Supabase provides admin authentication, a shared product catalog, and product-image storage. The cart remains in the visitor's browser.

## Set up Supabase

1. Create a Supabase project. In **Authentication → Users**, add the store owner's email and password. Disable public sign-ups in the Auth provider settings.
2. Open **SQL Editor**, paste the contents of [`supabase/setup.sql`](./supabase/setup.sql), and run it. This creates the products table, public catalog read access, admin-only write policies, the image bucket, and the eight starter products.
   If the project is already set up, run this script again to add the back-photo column and raise the product image bucket limit to 10 MB per image. Existing products will need a back photo added from Admin Studio before they can be saved with the new form.
3. In **Authentication → Users**, copy the owner account's UUID. In SQL Editor, replace the placeholder and run:

   ```sql
   insert into public.store_admins (user_id)
   values ('PASTE_OWNER_USER_UUID_HERE')
   on conflict do nothing;
   ```

4. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project's URL and public anon/publishable key from **Project Settings → API**.
5. Run the app locally:

   ```bash
   npm install
   npm run dev
   ```

   Use **Admin Login** with the owner email and password you created.

The public anon/publishable key is intended for browser use; Row Level Security in `setup.sql` protects writes. **Never put a Supabase service-role/secret key in `.env.local` or frontend code.** The `.env.local` file is git-ignored.

## Deploy

Deploy the generated `dist/` folder to a static host such as Netlify or Vercel. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to that host's environment variables and redeploy. Add your production domain to Supabase Auth's allowed site/redirect URLs.

```bash
npm run build
```

Products and uploaded images are shared through Supabase. Admin uploads accept JPG, PNG, WEBP, and GIF files up to 10 MB per photo; add front and back photos for each product. Customers can switch between those views and open either image larger. Cart contents stay local to each visitor's browser. Orders are prepared as WhatsApp messages to **+234 705 088 1599**.
