import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowLeft, Upload, X } from "lucide-react";

interface Variant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  material: string | null;
  stock: number;
  price_adjustment: number;
  images: string[];
}

const ProductVariants = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId!)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVariants(data);
    }
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(file => uploadImage(file))
      );
      setUploadedImages([...uploadedImages, ...urls]);
      toast.success("Images uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const saveVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const variantData = {
      product_id: productId!,
      sku: formData.get("sku") as string,
      color: formData.get("color") as string || null,
      size: formData.get("size") as string || null,
      material: formData.get("material") as string || null,
      stock: Number(formData.get("stock")),
      price_adjustment: Number(formData.get("price_adjustment")),
      images: uploadedImages
    };

    if (editingVariant) {
      const { error } = await supabase
        .from("product_variants")
        .update(variantData)
        .eq("id", editingVariant.id);

      if (error) {
        toast.error("Failed to update variant");
      } else {
        toast.success("Variant updated");
        setIsDialogOpen(false);
        setEditingVariant(null);
        setUploadedImages([]);
        fetchVariants();
      }
    } else {
      const { error } = await supabase
        .from("product_variants")
        .insert(variantData);

      if (error) {
        toast.error("Failed to create variant");
      } else {
        toast.success("Variant created");
        setIsDialogOpen(false);
        setUploadedImages([]);
        fetchVariants();
      }
    }
  };

  const deleteVariant = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete variant");
    } else {
      toast.success("Variant deleted");
      fetchVariants();
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold">Product Variants</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingVariant(null);
            setUploadedImages([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingVariant(null);
              setUploadedImages([]);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVariant ? "Edit Variant" : "Add Variant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveVariant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" name="sku" defaultValue={editingVariant?.sku} required />
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input id="stock" name="stock" type="number" defaultValue={editingVariant?.stock} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" name="color" defaultValue={editingVariant?.color || ""} />
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input id="size" name="size" defaultValue={editingVariant?.size || ""} />
                </div>
                <div>
                  <Label htmlFor="material">Material</Label>
                  <Input id="material" name="material" defaultValue={editingVariant?.material || ""} />
                </div>
              </div>
              <div>
                <Label htmlFor="price_adjustment">Price Adjustment (Rs.)</Label>
                <Input
                  id="price_adjustment"
                  name="price_adjustment"
                  type="number"
                  step="0.01"
                  defaultValue={editingVariant?.price_adjustment || 0}
                />
              </div>
              <div>
                <Label htmlFor="images">Product Images</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingVariant ? "Update Variant" : "Create Variant"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="p-4">
              {variant.images[0] && (
                <img src={variant.images[0]} alt={variant.sku} className="w-full h-48 object-cover rounded-md mb-4" />
              )}
              <div className="space-y-2">
                <p className="font-semibold">SKU: {variant.sku}</p>
                <p className="text-sm">Stock: <span className="font-bold">{variant.stock}</span></p>
                {variant.color && <p className="text-sm">Color: {variant.color}</p>}
                {variant.size && <p className="text-sm">Size: {variant.size}</p>}
                {variant.material && <p className="text-sm">Material: {variant.material}</p>}
                {variant.price_adjustment !== 0 && (
                  <p className="text-sm">Price Adj: Rs. {variant.price_adjustment}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingVariant(variant);
                      setUploadedImages(variant.images || []);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => deleteVariant(variant.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
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

export default ProductVariants;
