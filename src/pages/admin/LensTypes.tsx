import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface LensType {
  id: string;
  name: string;
  description: string | null;
  price_adjustment: number | null;
  product_id: string;
  display_order: number | null;
  is_enabled: boolean | null;
  image_url: string | null;
}

interface Product {
  id: string;
  title: string;
}

const LensTypesManagement = () => {
  const { toast } = useToast();
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLensType, setEditingLensType] = useState<LensType | null>(null);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchLensTypes(), fetchProducts()]);
    setLoading(false);
  };

  const fetchLensTypes = async () => {
    const { data, error } = await supabase
      .from("lens_types")
      .select("*, products(title)")
      .order("display_order");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lens types",
        variant: "destructive"
      });
      return;
    }

    setLensTypes(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, title")
      .eq("has_lens_options", true)
      .order("title");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
      return;
    }

    setProducts(data || []);
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
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setUploadedImage(url);
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const lensTypeData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      price_adjustment: Number(formData.get("price_adjustment")),
      product_id: formData.get("product_id") as string,
      display_order: Number(formData.get("display_order")) || 0,
      is_enabled: formData.get("is_enabled") === "on",
      image_url: uploadedImage || editingLensType?.image_url || null,
    };

    let error;
    if (editingLensType) {
      const { error: updateError } = await supabase
        .from("lens_types")
        .update(lensTypeData)
        .eq("id", editingLensType.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("lens_types")
        .insert(lensTypeData);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Lens type ${editingLensType ? "updated" : "created"} successfully`
    });

    setDialogOpen(false);
    setEditingLensType(null);
    setUploadedImage(null);
    fetchLensTypes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lens type?")) return;

    const { error } = await supabase
      .from("lens_types")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Lens type deleted successfully"
    });

    fetchLensTypes();
  };

  const openEditDialog = (lensType: LensType) => {
    setEditingLensType(lensType);
    setUploadedImage(lensType.image_url);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingLensType(null);
    setUploadedImage(null);
    setDialogOpen(true);
  };

  const filteredLensTypes = selectedProductFilter === "all"
    ? lensTypes
    : lensTypes.filter(lt => lt.product_id === selectedProductFilter);

  const getProductTitle = (productId: string) => {
    return products.find(p => p.id === productId)?.title || "Unknown Product";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Lens Types Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lens Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLensType ? "Edit Lens Type" : "Add New Lens Type"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product_id">Product *</Label>
                <Select name="product_id" defaultValue={editingLensType?.product_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Lens Type Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingLensType?.name}
                  required
                  placeholder="e.g., Progressive Lenses"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingLensType?.description || ""}
                  placeholder="Brief description of the lens type"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="price_adjustment">Price Adjustment (Rs.) *</Label>
                <Input
                  id="price_adjustment"
                  name="price_adjustment"
                  type="number"
                  step="0.01"
                  defaultValue={editingLensType?.price_adjustment || 0}
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  defaultValue={editingLensType?.display_order || 0}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="image">Lens Type Image</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                  </div>
                  {uploadedImage && (
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setUploadedImage(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enabled"
                  name="is_enabled"
                  defaultChecked={editingLensType?.is_enabled ?? true}
                />
                <Label htmlFor="is_enabled">Enabled (visible to customers)</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLensType ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingLensType(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Lens Types</CardTitle>
            <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price Adjustment</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredLensTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No lens types found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLensTypes.map((lensType) => (
                  <TableRow key={lensType.id}>
                    <TableCell className="font-medium">
                      {getProductTitle(lensType.product_id)}
                    </TableCell>
                    <TableCell>{lensType.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {lensType.description || "-"}
                    </TableCell>
                    <TableCell>Rs. {lensType.price_adjustment?.toLocaleString()}</TableCell>
                    <TableCell>{lensType.display_order}</TableCell>
                    <TableCell>
                      {lensType.is_enabled ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(lensType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lensType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LensTypesManagement;
