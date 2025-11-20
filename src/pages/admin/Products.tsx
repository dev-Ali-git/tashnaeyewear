import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  base_price: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  has_lens_options: boolean;
  category_id: string | null;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const ProductsManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*, category:categories(name)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*")
    ]);

    if (productsRes.data) setProducts(productsRes.data as Product[]);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const categoryId = formData.get("category_id") as string;
    const productData = {
      title: formData.get("title") as string,
      slug: (formData.get("title") as string).toLowerCase().replace(/\s+/g, "-"),
      description: formData.get("description") as string,
      base_price: Number(formData.get("base_price")),
      category_id: categoryId === "none" ? null : categoryId,
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
      has_lens_options: formData.get("has_lens_options") === "on",
      images: (formData.get("images") as string).split(",").map(url => url.trim()).filter(Boolean)
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);
      if (error) {
        toast.error("Failed to update product");
      } else {
        toast.success("Product updated");
        setIsDialogOpen(false);
        setEditingProduct(null);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert(productData);
      if (error) {
        toast.error("Failed to create product");
      } else {
        toast.success("Product created");
        setIsDialogOpen(false);
        fetchData();
      }
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Products Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveProduct} className="space-y-4">
              <div>
                <Label htmlFor="title">Product Title</Label>
                <Input id="title" name="title" defaultValue={editingProduct?.title} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProduct?.description || ""}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="base_price">Base Price (Rs.)</Label>
                <Input
                  id="base_price"
                  name="base_price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.base_price}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="images">Image URLs (comma-separated)</Label>
                <Textarea
                  id="images"
                  name="images"
                  defaultValue={editingProduct?.images.join(", ")}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={editingProduct?.is_active ?? true}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  name="is_featured"
                  defaultChecked={editingProduct?.is_featured}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="has_lens_options"
                  name="has_lens_options"
                  defaultChecked={editingProduct?.has_lens_options}
                />
                <Label htmlFor="has_lens_options">Has Lens Options</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <div className="space-y-2">
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-lg font-bold">Rs. {product.base_price.toLocaleString()}</p>
                {product.category && (
                  <Badge variant="secondary">{product.category.name}</Badge>
                )}
                <div className="flex gap-2">
                  {product.is_active && <Badge>Active</Badge>}
                  {product.is_featured && <Badge variant="outline">Featured</Badge>}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/admin/products/${product.id}/variants`)}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Manage Variants & Stock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductsManagement;