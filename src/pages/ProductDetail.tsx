import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LensSelector, { LensConfiguration } from "@/components/LensSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Heart, Truck, Shield, RotateCcw } from "lucide-react";
import categoryFrames from "@/assets/category-frames.jpg";

const ProductDetail = () => {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lensConfig, setLensConfig] = useState<LensConfiguration>({
    hasEyesight: false
  });

  // Sample product data - will be replaced with real data from database
  const product = {
    id: "1",
    title: "Classic Aviator Metal Frame",
    description: "Premium metal frames with adjustable nose pads and spring hinges for maximum comfort. Perfect for everyday wear with a timeless design that suits all face shapes.",
    basePrice: 4500,
    images: [categoryFrames, categoryFrames, categoryFrames],
    hasLensOptions: true,
    category: "Frames",
    inStock: true,
    variants: [
      { id: "1", color: "Gold", size: "Medium", material: "Metal", priceAdjustment: 0, stock: 10, sku: "AVG-M-G" },
      { id: "2", color: "Silver", size: "Medium", material: "Metal", priceAdjustment: 0, stock: 8, sku: "AVG-M-S" },
      { id: "3", color: "Black", size: "Medium", material: "Metal", priceAdjustment: 200, stock: 5, sku: "AVG-M-B" }
    ],
    lensTypes: [
      { id: "1", name: "Simple Lenses", description: "Basic prescription lenses", priceAdjustment: 1500 },
      { id: "2", name: "Protection Lenses", description: "Anti-glare coating", priceAdjustment: 2500 },
      { id: "3", name: "Transition Lenses", description: "Auto-darkening lenses", priceAdjustment: 4500 },
      { id: "4", name: "Blue-Cut Lenses", description: "Screen protection", priceAdjustment: 2000 }
    ]
  };

  const calculateTotalPrice = () => {
    let total = product.basePrice;
    
    // Add variant price adjustment
    if (selectedVariant) {
      const variant = product.variants.find(v => v.id === selectedVariant);
      if (variant) total += variant.priceAdjustment;
    }
    
    // Add lens type price adjustment
    if (lensConfig.hasEyesight && lensConfig.lensTypeId) {
      const lensType = product.lensTypes.find(l => l.id === lensConfig.lensTypeId);
      if (lensType) total += lensType.priceAdjustment;
    }
    
    return total * quantity;
  };

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
              <Badge className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold">Rs. {calculateTotalPrice().toLocaleString()}</span>
                {product.inStock ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">In Stock</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600">Out of Stock</Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              <Separator className="my-6" />

              {/* Variants Selection */}
              <div className="mb-6">
                <label className="font-semibold mb-3 block">Select Color & Material</label>
                <div className="grid grid-cols-3 gap-3">
                  {product.variants.map((variant) => (
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
                <Button size="lg" className="flex-1">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="h-5 w-5" />
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
          {product.hasLensOptions && (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl font-bold mb-6">Customize Your Lenses</h2>
              <LensSelector
                lensTypes={product.lensTypes}
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
              <Button size="lg" className="flex-1">
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
