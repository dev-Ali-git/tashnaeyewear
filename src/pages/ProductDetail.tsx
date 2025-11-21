import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LensSelector, { LensConfiguration } from "@/components/LensSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Heart, Truck, Shield, RotateCcw, Loader2 } from "lucide-react";
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
  images: string[];
}

interface LensType {
  id: string;
  name: string;
  description: string | null;
  price_adjustment: number | null;
  image_url: string | null;
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const fetchProductData = useCallback(async () => {
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
          .select("id, name, description, price_adjustment, image_url")
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
  }, [slug, toast, navigate]);

  useEffect(() => {
    if (slug) {
      fetchProductData();
    }
  }, [slug, fetchProductData]);

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let total = product.base_price;
    
    // Add variant price adjustment
    if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant);
      if (variant && variant.price_adjustment) total += variant.price_adjustment;
    }
    
    // Add lens type price adjustment (whenever a lens type is selected)
    if (lensConfig.lensTypeId) {
      const lensType = lensTypes.find(l => l.id === lensConfig.lensTypeId);
      if (lensType && lensType.price_adjustment) total += lensType.price_adjustment;
    }
    
    return total * quantity;
  };

  const getProductImages = () => {
    if (!product) return [];
    
    let allImages: string[] = [];
    
    // Add base product images
    if (product.images && product.images.length > 0) {
      allImages = [...product.images];
    }
    
    // Add variant images if a variant is selected
    if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant);
      if (variant && variant.images && variant.images.length > 0) {
        allImages = [...variant.images, ...allImages];
      }
    }
    
    return allImages.length > 0 ? allImages : ["/placeholder.svg"];
  };

  // Calculate total and selected variant stock
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const variantStock = selectedVariantData?.stock || 0;
  const inStock = totalStock > 0;
  const isOutOfStock = variantStock === 0;
  const isLowStock = variantStock > 0 && variantStock <= 5;
  
  const getStockBadge = () => {
    if (isOutOfStock) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (isLowStock) {
      return <Badge className="bg-orange-500 text-white">Low Stock ({variantStock} left)</Badge>;
    }
    return <Badge className="bg-green-500 text-white">In Stock</Badge>;
  };

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(
        product.id,
        selectedVariant || undefined,
        lensConfig.lensTypeId || undefined,
        quantity
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Check if lens configuration is complete when product has lens options
  const isLensConfigurationValid = () => {
    // If product doesn't have lens options, no validation needed
    if (!product?.has_lens_options) return true;
    
    // Must select a lens type
    if (!lensConfig.lensTypeId) return false;
    
    // If eyesight lenses are selected, must choose upload or manual entry
    if (lensConfig.hasEyesight) {
      // Must have prescription type selected
      if (!lensConfig.prescriptionType) return false;
      
      // If upload is selected, must have a file
      if (lensConfig.prescriptionType === 'upload' && !lensConfig.prescriptionImage) {
        return false;
      }
      
      // If manual is selected, check if at least some data is entered
      if (lensConfig.prescriptionType === 'manual' && lensConfig.prescriptionData) {
        const { rightEye, leftEye } = lensConfig.prescriptionData;
        // At least one field should have data
        const hasRightEyeData = rightEye.sph || rightEye.cyl || rightEye.axis || rightEye.add || rightEye.pd;
        const hasLeftEyeData = leftEye.sph || leftEye.cyl || leftEye.axis || leftEye.add || leftEye.pd;
        if (!hasRightEyeData && !hasLeftEyeData) return false;
      }
    }
    
    return true;
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
                  src={productImages[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((img, idx) => (
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
                {getStockBadge()}
              </div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              <Separator className="my-6" />

              {/* Variants Selection */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <label className="font-semibold mb-3 block">Select Color & Material</label>
                  <div className="grid grid-cols-3 gap-3">
                    {variants.map((variant) => {
                      const variantStockCount = variant.stock || 0;
                      const isVariantOutOfStock = variantStockCount === 0;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant.id);
                            setSelectedImage(0);
                          }}
                          disabled={isVariantOutOfStock}
                          className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                            selectedVariant === variant.id
                              ? 'border-accent bg-accent/10'
                              : isVariantOutOfStock
                              ? 'border-border opacity-50 cursor-not-allowed'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <div>{variant.color}</div>
                          <div className="text-xs text-muted-foreground">{variant.material}</div>
                          <div className="text-xs mt-1">
                            {isVariantOutOfStock ? (
                              <span className="text-red-500">Out of stock</span>
                            ) : variantStockCount <= 5 ? (
                              <span className="text-orange-500">{variantStockCount} left</span>
                            ) : (
                              <span className="text-green-500">In stock</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lens Options - Using LensSelector component */}
              {product.has_lens_options && lensTypes.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="mb-6">
                    <LensSelector
                      lensTypes={lensTypes.map(l => ({
                        id: l.id,
                        name: l.name,
                        description: l.description || undefined,
                        imageUrl: l.image_url || undefined,
                        priceAdjustment: l.price_adjustment || 0
                      }))}
                      onLensConfigChange={(config) => setLensConfig(config)}
                    />
                  </div>
                </>
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
                <Button 
                  size="lg" 
                  className="flex-1" 
                  onClick={handleAddToCart} 
                  disabled={isOutOfStock || isAddingToCart || !isLensConfigurationValid()}
                >
                  {isAddingToCart ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-5 w-5" />
                  )}
                  {isOutOfStock ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
