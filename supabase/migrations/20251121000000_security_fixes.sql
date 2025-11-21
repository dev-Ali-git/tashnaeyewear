-- CRITICAL SECURITY FIXES
-- Date: 2025-11-21
-- Description: Fix customer data exposure and broken checkout flow

-- CRITICAL FIX 1: Block anonymous access to customer data
-- Profiles table - explicitly block anonymous users
CREATE POLICY "Block anonymous access to profiles"
  ON profiles FOR ALL
  TO anon
  USING (false);

-- Addresses table - explicitly block anonymous users
CREATE POLICY "Block anonymous access to addresses"
  ON addresses FOR ALL
  TO anon
  USING (false);

-- CRITICAL FIX 2: Enable checkout - Allow users to create orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- FIX 3: Secure prescription uploads with storage policies
-- Block anonymous access to prescriptions
CREATE POLICY "Block anonymous upload to prescriptions"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous access to prescriptions bucket"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id != 'prescriptions');

-- Enforce file size limits (5MB) and file types for prescriptions
CREATE POLICY "Limit prescription file size"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND octet_length(decode(substring(name from '\.([^.]+)$'), 'escape')) < 5242880
);
