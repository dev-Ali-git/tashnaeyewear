import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WishlistContextType {
  wishlistItems: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setWishlistItems(data.map(item => item.product_id));
    }
  };

  const addToWishlist = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to wishlist",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("wishlist_items")
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add to wishlist",
        variant: "destructive",
      });
    } else {
      setWishlistItems([...wishlistItems, productId]);
      toast({
        title: "Added to wishlist",
        description: "Product added to your wishlist",
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    } else {
      setWishlistItems(wishlistItems.filter(id => id !== productId));
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist",
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
