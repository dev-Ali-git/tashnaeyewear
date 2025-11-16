import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import categoryFrames from "@/assets/category-frames.jpg";
import categorySunglasses from "@/assets/category-sunglasses.jpg";
import categoryProtection from "@/assets/category-protection.jpg";
import categoryContacts from "@/assets/category-contacts.jpg";

const Index = () => {
  // Sample products - will be replaced with real data
  const featuredProducts = [
    {
      id: "1",
      title: "Classic Aviator Frames",
      price: 4500,
      image: categoryFrames,
      slug: "classic-aviator-frames"
    },
    {
      id: "2",
      title: "Premium Sunglasses",
      price: 6500,
      image: categorySunglasses,
      slug: "premium-sunglasses"
    },
    {
      id: "3",
      title: "Blue-Cut Protection",
      price: 3500,
      image: categoryProtection,
      slug: "blue-cut-protection"
    },
    {
      id: "4",
      title: "Contact Lenses Pack",
      price: 2500,
      image: categoryContacts,
      slug: "contact-lenses-pack"
    }
  ];

  const categories = [
    {
      name: "Frames",
      image: categoryFrames,
      link: "/shop/frames",
      description: "Premium optical frames"
    },
    {
      name: "Sunglasses",
      image: categorySunglasses,
      link: "/shop/sunglasses",
      description: "Stylish sun protection"
    },
    {
      name: "Protection",
      image: categoryProtection,
      link: "/shop/protection",
      description: "Blue-cut & anti-glare"
    },
    {
      name: "Contacts",
      image: categoryContacts,
      link: "/shop/contacts",
      description: "Quality contact lenses"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
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
                  <Link to="/shop/frames">
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
                  key={category.name}
                  to={category.link}
                  className="group"
                >
                  <div className="aspect-square overflow-hidden rounded-lg mb-3 bg-card">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-center group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {category.description}
                  </p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
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
