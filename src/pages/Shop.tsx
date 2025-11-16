import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Product {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  images: string[];
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Shop = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  const availableColors = ["Black", "Brown", "Gold", "Silver", "Tortoise", "Transparent", "Blue", "Green"];
  const availableSizes = ["Small", "Medium", "Large", "Extra Large"];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [category, selectedCategories, priceRange, selectedColors, selectedSizes, sortBy]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    // Category filter from URL param
    if (category) {
      const categoryData = categories.find(c => c.slug === category);
      if (categoryData) {
        query = query.eq("category_id", categoryData.id);
      }
    }

    // Category filter from checkboxes
    if (selectedCategories.length > 0) {
      query = query.in("category_id", selectedCategories);
    }

    // Price range filter
    query = query.gte("base_price", priceRange[0]).lte("base_price", priceRange[1]);

    // Sorting
    if (sortBy === "price-asc") {
      query = query.order("base_price", { ascending: true });
    } else if (sortBy === "price-desc") {
      query = query.order("base_price", { ascending: false });
    } else if (sortBy === "name") {
      query = query.order("title", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    
    let filteredProducts = data || [];

    // Color/Size filtering (from variants)
    if (selectedColors.length > 0 || selectedSizes.length > 0) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id, color, size");

      if (variants) {
        const productIds = new Set<string>();
        variants.forEach(variant => {
          const matchesColor = selectedColors.length === 0 || (variant.color && selectedColors.includes(variant.color));
          const matchesSize = selectedSizes.length === 0 || (variant.size && selectedSizes.includes(variant.size));
          
          if (matchesColor && matchesSize) {
            productIds.add(variant.product_id);
          }
        });

        filteredProducts = filteredProducts.filter(p => productIds.has(p.id));
      }
    }

    setProducts(filteredProducts);
    setLoading(false);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 50000]);
    setSortBy("newest");
  };

  const currentCategory = categories.find(c => c.slug === category);
  const hasActiveFilters = selectedCategories.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 50000;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="w-full justify-between"
        >
          Clear All Filters
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Categories */}
      {!category && (
        <div>
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedCategories.includes(cat.id)}
                  onCheckedChange={() => handleCategoryToggle(cat.id)}
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <Slider
          min={0}
          max={50000}
          step={500}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Rs. {priceRange[0].toLocaleString()}</span>
          <span>Rs. {priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="font-semibold mb-3">Color</h3>
        <div className="space-y-2">
          {availableColors.map((color) => (
            <label key={color} className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedColors.includes(color)}
                onCheckedChange={() => handleColorToggle(color)}
              />
              <span className="text-sm">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="font-semibold mb-3">Size</h3>
        <div className="space-y-2">
          {availableSizes.map((size) => (
            <label key={size} className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedSizes.includes(size)}
                onCheckedChange={() => handleSizeToggle(size)}
              />
              <span className="text-sm">{size}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
            </BreadcrumbItem>
            {currentCategory && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentCategory.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {currentCategory ? currentCategory.name : "All Products"}
          </h1>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {/* Mobile Filter Button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">No products found</p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.base_price}
                    image={product.images?.[0] || "/placeholder.svg"}
                    slug={product.slug}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
