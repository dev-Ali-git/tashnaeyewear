import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LensSelector, { LensConfiguration } from "@/components/LensSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Heart, Truck, Shield, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

interface Product {
  id: string;
  title: string;
  description: string | null;
  base_price: number;
  images: string[] | null;
  has_lens_options: boolean;
  category_id: string | null;
}

interface ProductVariant {
  id: string;
  color: string | null;
  size: string | null;
  material: string | null;
  price_adjustment: number | null;
  stock: number | null;
  sku: string;
}

interface LensType {
  id: string;
  name: string;
  description: string | null;
  price_adjustment: number | null;
}

interface Category {
  id: string;
  name: string;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lensConfig, setLensConfig] = useState<LensConfiguration>({
    hasEyesight: false
  });

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProductData();
    }
  }, [slug]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (productError) throw productError;
      
      if (!productData) {
        toast({
          title: "Product not found",
          description: "The product you're looking for doesn't exist.",
          variant: "destructive"
        });
        navigate("/shop");
        return;
      }

      setProduct(productData);

      // Fetch category if exists
      if (productData.category_id) {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", productData.category_id)
          .single();
        
        if (categoryData) setCategory(categoryData);
      }

      // Fetch variants
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productData.id);
      
      if (variantsData) {
        setVariants(variantsData);
        if (variantsData.length > 0) {
          setSelectedVariant(variantsData[0].id);
        }
      }

      // Fetch lens types if product has lens options
      if (productData.has_lens_options) {
        const { data: lensTypesData } = await supabase
          .from("lens_types")
          .select("*")
          .eq("product_id", productData.id)
          .eq("is_enabled", true)
          .order("display_order");
        
        if (lensTypesData) setLensTypes(lensTypesData);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let total = product.base_price;
    
    // Add variant price adjustment
    if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant);
      if (variant && variant.price_adjustment) total += variant.price_adjustment;
    }
    
    // Add lens type price adjustment
    if (lensConfig.hasEyesight && lensConfig.lensTypeId) {
      const lensType = lensTypes.find(l => l.id === lensConfig.lensTypeId);
      if (lensType && lensType.price_adjustment) total += lensType.price_adjustment;
    }
    
    return total * quantity;
  };

  const getProductImages = () => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    return ["/placeholder.svg"];
  };

  const inStock = variants.some(v => (v.stock || 0) > 0);

  const handleAddToCart = async () => {
    if (!product) return;
    
    await addToCart(
      product.id,
      selectedVariant || undefined,
      lensConfig.hasEyesight && lensConfig.lensTypeId ? lensConfig.lensTypeId : undefined,
      quantity
    );
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">Loading product details...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const productImages = getProductImages();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-secondary rounded-lg overflow-hidden mb-4">
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <Badge variant="outline" className="mb-2">{category?.name || "Uncategorized"}</Badge>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold">Rs. {calculateTotalPrice().toLocaleString()}</span>
                {inStock ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">In Stock</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600">Out of Stock</Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              <Separator className="my-6" />

              {/* Variants Selection */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <label className="font-semibold mb-3 block">Select Color & Material</label>
                  <div className="grid grid-cols-3 gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                          selectedVariant === variant.id
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div>{variant.color}</div>
                        <div className="text-xs text-muted-foreground">{variant.material}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-secondary"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-secondary"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={!inStock}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-accent" />
                  <span>Free shipping on orders over Rs. 5,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>1 year warranty included</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-accent" />
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lens Selector - Only show for products with lens options */}
          {product.has_lens_options && lensTypes.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl font-bold mb-6">Customize Your Lenses</h2>
              <LensSelector
                lensTypes={lensTypes.map(lt => ({
                  id: lt.id,
                  name: lt.name,
                  description: lt.description || "",
                  priceAdjustment: lt.price_adjustment || 0
                }))}
                onLensConfigChange={setLensConfig}
              />
            </div>
          )}

          {/* Sticky Add to Cart for Mobile */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Total Price</div>
                <div className="font-bold text-lg">Rs. {calculateTotalPrice().toLocaleString()}</div>
              </div>
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={!inStock}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
