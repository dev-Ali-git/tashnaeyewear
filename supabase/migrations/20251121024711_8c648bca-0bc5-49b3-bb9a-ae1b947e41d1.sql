-- Drop existing policies on cart_items
DROP POLICY IF EXISTS "Users can view own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;

-- Create new policies that handle both authenticated and guest users
-- For authenticated users: match user_id with auth.uid()
-- For guest users: allow if user_id is NULL (session_id will be set in app logic)

-- Allow anyone to insert cart items (user_id or session_id will be set by app)
CREATE POLICY "Anyone can add to cart"
ON public.cart_items
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL)
);

-- Allow viewing cart items if user_id matches or if it's a guest cart (user_id is NULL)
CREATE POLICY "Users can view own cart items"
ON public.cart_items
FOR SELECT
USING (
  (auth.uid() = user_id) OR (user_id IS NULL)
);

-- Allow updating cart items if user_id matches or if it's a guest cart
CREATE POLICY "Users can update own cart items"
ON public.cart_items
FOR UPDATE
USING (
  (auth.uid() = user_id) OR (user_id IS NULL)
);

-- Allow deleting cart items if user_id matches or if it's a guest cart
CREATE POLICY "Users can delete own cart items"
ON public.cart_items
FOR DELETE
USING (
  (auth.uid() = user_id) OR (user_id IS NULL)
);