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
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
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
