# Logo Management Setup Instructions

## Step 1: Run Database Migrations

You need to run the Supabase migrations to create the required tables and storage bucket.

### Option A: Using Supabase CLI (Recommended)
```bash
# If you have Supabase CLI installed
supabase db reset

# Or apply specific migrations
supabase migration up
```

### Option B: Manual SQL Execution
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run the following SQL scripts in order:

#### Migration 1: Create site_settings table
```sql
-- Create site_settings table for storing site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to site_settings"
  ON site_settings FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users with admin role to update
CREATE POLICY "Allow admin to update site_settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default logo settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('header_logo', '{"type": "text", "text": "Tashna Eyewear"}'),
  ('footer_logo', '{"type": "text", "text": "Tashna Eyewear"}'),
  ('seo_logo', '{"url": "/tashna-logo.png"}')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);
```

#### Migration 2: Create storage bucket for logos
```sql
-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to logos bucket
CREATE POLICY IF NOT EXISTS "Public Access for Logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Allow authenticated users to upload to logos bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update logos
CREATE POLICY IF NOT EXISTS "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- Allow authenticated users to delete logos
CREATE POLICY IF NOT EXISTS "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');
```

## Step 2: Verify Setup

1. Check if the `site_settings` table exists in your database
2. Check if the `logos` storage bucket exists in Storage section
3. Try accessing the Settings page in admin dashboard

## Step 3: Using the Logo Management

1. Login as admin
2. Go to `/admin` and click on the "Settings" tab
3. Upload logos for:
   - **Header Logo**: Visible in the navigation bar
   - **Footer Logo**: Visible in the footer
   - **SEO Logo**: Used for social sharing (Facebook, Twitter, etc.)

## Troubleshooting

### "Failed to load settings" Error
- The `site_settings` table doesn't exist yet
- Run Migration 1 from above

### "Failed to upload logo" Error
- The `logos` storage bucket doesn't exist
- Run Migration 2 from above
- OR: The system will fall back to base64 encoding (works but not recommended for production)

### Logos not showing
- Clear browser cache
- Check if the migration was run successfully
- Check browser console for errors
