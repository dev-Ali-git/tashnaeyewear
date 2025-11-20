-- Enable storage for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Enable storage for prescription images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescriptions
CREATE POLICY "Users can view their own prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions' AND 
  has_role(auth.uid(), 'admin'::app_role)
);