import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/hero-banner.jpg";
import categoryFrames from "@/assets/category-frames.jpg";
import categorySunglasses from "@/assets/category-sunglasses.jpg";
import categoryProtection from "@/assets/category-protection.jpg";
import categoryContacts from "@/assets/category-contacts.jpg";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface ProductVariant {
  stock: number;
}

interface Product {
  id: string;
  title: string;
  base_price: number;
  images: string[];
  slug: string;
  product_variants?: ProductVariant[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);
  const { seoLogo } = useSiteSettings();

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          title, 
          base_price, 
          images, 
          slug,
          product_variants(stock)
        `)
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(4);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNewArrivals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          title, 
          base_price, 
          images, 
          slug,
          product_variants(stock),
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNewArrivals(data || []);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
    } finally {
      setLoadingNewArrivals(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchFeaturedProducts(), fetchNewArrivals(), fetchCategories()]);
    };
    fetchData();
  }, [fetchFeaturedProducts, fetchNewArrivals, fetchCategories]);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tashna Eyewear",
    "url": "https://tashnaeyewear.com",
    "logo": seoLogo.startsWith('http') ? seoLogo : `https://tashnaeyewear.com${seoLogo}`,
    "sameAs": [
      "https://facebook.com/tashnaeyewear",
      "https://instagram.com/tashnaeyewear"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+92-300-1234567",
      "contactType": "customer service"
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Tashna Eyewear - Premium Frames, Sunglasses & Contact Lenses"
        description="Shop premium eyewear at Tashna. Discover stylish frames, sunglasses, blue-cut protection glasses, and contact lenses with expert lens customization. Fast delivery across Pakistan."
        schema={organizationSchema}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          <img
            src={heroBanner}
            alt="Tashna Eyewear Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-xl">
                <h1 className="text-4xl md:text-6xl font-bold text-ivory mb-4">
                  See the World
                  <br />
                  <span className="text-accent">Clearly</span>
                </h1>
                <p className="text-lg md:text-xl text-ivory/90 mb-8">
                  Premium eyewear designed for your unique vision and style
                </p>
                <Button size="lg" asChild className="bg-accent hover:bg-accent/90">
                  <Link to="/shop">
                    Shop Collection
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop/${category.slug}`}
                  className="group"
                >
                  <div className="aspect-square overflow-hidden rounded-lg mb-3 bg-card">
                    <img
                      src={category.image_url || categoryFrames}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-center group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground text-center">
                      {category.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <Button variant="outline" asChild>
                <Link to="/shop">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {loading ? (
                <p className="col-span-full text-center text-muted-foreground">Loading products...</p>
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map((product) => {
                  const totalStock = product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                  return (
                    <ProductCard 
                      key={product.id} 
                      id={product.id}
                      title={product.title}
                      price={product.base_price}
                      image={product.images[0] || categoryFrames}
                      slug={product.slug}
                      stock={totalStock}
                    />
                  );
                })
              ) : (
                <p className="col-span-full text-center text-muted-foreground">No featured products available</p>
              )}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">New Arrivals</h2>
              <Button variant="outline" asChild>
                <Link to="/shop">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {loadingNewArrivals ? (
                <p className="col-span-full text-center text-muted-foreground">Loading new arrivals...</p>
              ) : newArrivals.length > 0 ? (
                newArrivals.map((product) => {
                  const totalStock = product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                  return (
                    <ProductCard 
                      key={product.id} 
                      id={product.id}
                      title={product.title}
                      price={product.base_price}
                      image={product.images[0] || categoryFrames}
                      slug={product.slug}
                      stock={totalStock}
                    />
                  );
                })
              ) : (
                <p className="col-span-full text-center text-muted-foreground">No new arrivals available</p>
              )}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Tashna</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-accent/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👓</span>
                </div>
                <h3 className="font-semibold mb-2">Premium Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Handcrafted frames with the finest materials
                </p>
              </div>
              <div className="text-center">
                <div className="bg-accent/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔬</span>
                </div>
                <h3 className="font-semibold mb-2">Expert Care</h3>
                <p className="text-sm text-muted-foreground">
                  Professional lens customization for your prescription
                </p>
              </div>
              <div className="text-center">
                <div className="bg-accent/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="font-semibold mb-2">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Quick shipping across Pakistan
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
