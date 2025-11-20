import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/contexts/WishlistContext";

interface Product {
  id: string;
  title: string;
  base_price: number;
  images: string[];
  slug: string;
  product_variants?: { stock: number }[];
}

const Wishlist = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlistItems, fetchWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    if (wishlistItems.length > 0) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [wishlistItems]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        title,
        base_price,
        images,
        slug,
        product_variants(stock)
      `)
      .in("id", wishlistItems);

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">Save your favorite eyewear here</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading wishlist...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding products you love to your wishlist
            </p>
            <Button asChild>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const totalStock = product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.base_price}
                  image={product.images[0]}
                  slug={product.slug}
                  stock={totalStock}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
