import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  lens_type_id: string | null;
  quantity: number;
  has_eyesight: boolean | null;
  prescription_data: any;
  product: {
    title: string;
    base_price: number;
    images: string[];
    slug: string;
  };
  variant?: {
    color: string | null;
    size: string | null;
    price_adjustment: number | null;
    images: string[] | null;
  };
  lens_type?: {
    name: string;
    price_adjustment: number | null;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (
    productId: string, 
    variantId?: string, 
    lensTypeId?: string, 
    quantity?: number,
    hasEyesight?: boolean,
    prescriptionData?: any,
    prescriptionImageUrl?: string
  ) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('cart_items')
        .select(`
          *,
          product:products(title, base_price, images, slug),
          variant:product_variants(color, size, price_adjustment, images),
          lens_type:lens_types(name, price_adjustment)
        `);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      const { data, error } = await query;

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: string,
    variantId?: string,
    lensTypeId?: string,
    quantity: number = 1,
    hasEyesight?: boolean,
    prescriptionData?: any,
    prescriptionImageUrl?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const cartData: any = {
        product_id: productId,
        variant_id: variantId || null,
        lens_type_id: lensTypeId || null,
        quantity,
        has_eyesight: hasEyesight || false,
        prescription_data: prescriptionData || null,
        prescription_image_url: prescriptionImageUrl || null,
      };

      if (user) {
        cartData.user_id = user.id;
      } else {
        cartData.session_id = getSessionId();
      }

      const { error } = await supabase
        .from('cart_items')
        .insert([cartData]);

      if (error) throw error;

      await fetchCart();
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      await fetchCart();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      await fetchCart();
      toast({
        title: "Removed from cart",
        description: "Product has been removed from your cart",
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove product from cart",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCart();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart: fetchCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
