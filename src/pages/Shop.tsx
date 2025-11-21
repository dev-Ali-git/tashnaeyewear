import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  images: string[];
  category_id: string;
  product_variants?: Array<{
    id: string;
    stock: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const Shop = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [category, selectedCategories, priceRange, selectedColors, selectedSizes, sortBy]);

  useEffect(() => {
    if (categories.length > 0 || !category) {
      fetchProducts();
    }
  }, [category, categories, selectedCategories, priceRange, selectedColors, selectedSizes, sortBy, currentPage]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    
    // Build base query for filtering
    let baseQuery = supabase
      .from("products")
      .select("*, product_variants(id, stock)", { count: 'exact' })
      .eq("is_active", true);

    // Category filter from URL param takes priority
    if (category) {
      const categoryData = categories.find(c => c.slug === category);
      if (categoryData) {
        baseQuery = baseQuery.eq("category_id", categoryData.id);
      }
    } else if (selectedCategories.length > 0) {
      // Category filter from checkboxes only if no URL category
      baseQuery = baseQuery.in("category_id", selectedCategories);
    }

    // Price range filter
    baseQuery = baseQuery.gte("base_price", priceRange[0]).lte("base_price", priceRange[1]);

    // Sorting
    if (sortBy === "price-asc") {
      baseQuery = baseQuery.order("base_price", { ascending: true });
    } else if (sortBy === "price-desc") {
      baseQuery = baseQuery.order("base_price", { ascending: false });
    } else if (sortBy === "name") {
      baseQuery = baseQuery.order("title", { ascending: true });
    } else {
      baseQuery = baseQuery.order("created_at", { ascending: false });
    }

    // Pagination
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    baseQuery = baseQuery.range(from, to);

    const { data, count } = await baseQuery;
    
    if (count !== null) {
      setTotalProducts(count);
    }
    
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
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis-1" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis-2" />);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const currentCategory = categories.find(c => c.slug === category);
  const isCategoryView = !!currentCategory;
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
      {!isCategoryView && (
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
      {/* Category Hero Banner (only when viewing a specific category) */}
      {isCategoryView && currentCategory && (
        <div className="relative h-64 md:h-80 w-full mb-10 overflow-hidden">
          <img
            src={currentCategory.image_url || "/placeholder.svg"}
            alt={currentCategory.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-4">
              <Breadcrumb className="mb-4">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentCategory.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                {currentCategory.name}
              </h1>
              {currentCategory.description && (
                <p className="max-w-2xl text-muted-foreground mb-4 text-sm md:text-base leading-relaxed">
                  {currentCategory.description}
                </p>
              )}
              
              {/* Category Navigation */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Link
                  to="/shop"
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-background/60 hover:bg-background/80 border border-border"
                >
                  All Products
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop/${cat.slug}`}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      cat.id === currentCategory.id
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "bg-background/60 hover:bg-background/80 border border-border"
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-accent/15 text-accent px-4 py-1 text-sm font-medium">
                  {totalProducts} {totalProducts === 1 ? "Product" : "Products"}
                </span>
                {hasActiveFilters && (
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Default Header (only when viewing all products) */}
        {!isCategoryView && (
          <div className="relative h-64 md:h-80 w-full -mx-4 mb-10 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=2000&q=80"
              alt="All Products"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <Breadcrumb className="mb-4">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Shop</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  All Products
                </h1>
                <p className="max-w-2xl text-muted-foreground mb-4 text-sm md:text-base leading-relaxed">
                  Explore our complete collection of premium eyewear
                </p>
                
                {/* Category Navigation */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Link
                    to="/shop"
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-accent text-accent-foreground shadow-md"
                  >
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/shop/${cat.slug}`}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-background/60 hover:bg-background/80 border border-border"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-accent/15 text-accent px-4 py-1 text-sm font-medium">
                    {totalProducts} {totalProducts === 1 ? "Product" : "Products"}
                  </span>
                  {hasActiveFilters && (
                    <Button size="sm" variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          {/* Filter Button (for all views) */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
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
        <div className="grid grid-cols-1 gap-8">
          {/* Products Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products.map((product) => {
                    const totalStock = product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        title={product.title}
                        price={product.base_price}
                        image={product.images?.[0] || "/placeholder.svg"}
                        slug={product.slug}
                        stock={totalStock}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {renderPaginationItems()}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
