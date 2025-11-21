# Supabase Database Migration Guide

## ✅ Step 1: Apply Database Schema

1. **Open your new Supabase SQL Editor**:
   https://supabase.com/dashboard/project/qqzjchefturjrqmdxoid/sql/new

2. **Run ALL migration files in order** (copy-paste each one and click RUN):

### Migration 1: Base Schema
Copy the entire content from:
`supabase/migrations/20251116051826_345e6d13-0d9a-4753-a5c0-f0fa421f1285.sql`

### Migration 2-6: Additional Migrations
Run each of these files in order:
- `20251118091843_464f7d6d-b22e-46a0-8f9c-c9ae571717d2.sql`
- `20251118091911_025255c7-de58-4181-9fcd-43f2e803084f.sql`
- `20251118092018_feee8b43-923b-4111-a97e-32905bdb148f.sql`
- `20251120101905_b8d8b45c-d3d5-42ff-b9cc-717e51ff9968.sql`
- `20251121024711_8c648bca-0bc5-49b3-bb9a-ae1b947e41d1.sql`

---

## ✅ Step 2: Create Storage Bucket

1. **Go to Storage in new Supabase**: 
   https://supabase.com/dashboard/project/qqzjchefturjrqmdxoid/storage/buckets

2. **Click "New bucket"**
   - Name: `product-images`
   - Public bucket: ✅ **YES** (check this box)
   - Click "Create bucket"

3. **Set bucket to public**:
   - Click on `product-images` bucket
   - Click "Policies" tab
   - Add policy: "Allow public read access"
   ```sql
   CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
   ```

---

## ✅ Step 3: Run Data Migration

After schema is applied, run the migration script again:

```powershell
node migrate-data.js
```

This will transfer:
- ✅ 4 categories
- ✅ 6 products
- ✅ 3 product variants
- ✅ 15 lens types
- ✅ Product images

---

## ✅ Step 4: Test Locally

```powershell
npm run dev
```

**Test these features:**
- [ ] Browse products on homepage
- [ ] Click on categories - products filter correctly
- [ ] View product details
- [ ] Add products to cart
- [ ] Add products to wishlist
- [ ] View cart and wishlist
- [ ] Images load correctly
- [ ] Admin dashboard accessible
- [ ] Can add/edit products in admin

---

## ✅ Step 5: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**: https://vercel.com/
2. **Select your project** → Settings → Environment Variables
3. **Add these variables**:
   ```
   VITE_SUPABASE_URL=https://qqzjchefturjrqmdxoid.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxempjaGVmdHVyanJxbWR4b2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDQ1NTMsImV4cCI6MjA3OTI4MDU1M30.-PJrThNBSmXJuiiJ2zRdiN9jywtSMAB3OMbUBWM0BA4
   ```
4. **Remove old Lovable variables** (if any)
5. **Click "Save"**

---

## ✅ Step 6: Configure Auth Redirect URLs

1. **In Supabase Dashboard**: https://supabase.com/dashboard/project/qqzjchefturjrqmdxoid/auth/url-configuration

2. **Add these URLs**:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: 
     - `https://your-project.vercel.app/**`
     - `http://localhost:8080/**` (for local development)

---

## ✅ Step 7: Deploy to Vercel

```powershell
git add .
git commit -m "Migrate to new Supabase database"
git push origin main
```

Or deploy manually:
- Go to Vercel Dashboard
- Click "Redeploy" on your project

---

## ✅ Step 8: Verify Production

After deployment:
1. Visit your Vercel URL
2. Test all functionality
3. Check if images load
4. Try adding products to cart
5. Test authentication

---

## ✅ Step 9: Clean Up

Once everything works:

1. **Remove old credentials from `.env`**:
   ```powershell
   # Delete these lines:
   OLD_VITE_SUPABASE_URL=...
   OLD_VITE_SUPABASE_KEY=...
   ```

2. **Delete migration script**:
   ```powershell
   rm migrate-data.js
   ```

3. **(Optional) Delete Lovable project** if you no longer need it

---

## 🆘 Troubleshooting

### Images not loading?
- Check storage bucket is public
- Verify images migrated: https://supabase.com/dashboard/project/qqzjchefturjrqmdxoid/storage/buckets/product-images

### Authentication not working?
- Check redirect URLs in Supabase Auth settings
- Verify environment variables in Vercel

### Data not showing?
- Check RLS policies in Supabase
- Verify data migrated in Table Editor

### Need to re-run migration?
- Delete all data from tables first
- Run `node migrate-data.js` again

---

## 📝 Quick Commands

```powershell
# Test locally
npm run dev

# Commit and push
git add .
git commit -m "Update to new database"
git push origin main

# Re-run migration (if needed)
node migrate-data.js
```

---

**Your new database credentials:**
- URL: `https://qqzjchefturjrqmdxoid.supabase.co`
- Key: `eyJhbGci...0BA4` (in .env file)
- Dashboard: https://supabase.com/dashboard/project/qqzjchefturjrqmdxoid
