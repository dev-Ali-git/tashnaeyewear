import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, Loader2, Printer, Download } from "lucide-react";

interface PrescriptionData {
  rightEye?: {
    sph?: string;
    cyl?: string;
    axis?: string;
    add?: string;
    pd?: string;
  };
  leftEye?: {
    sph?: string;
    cyl?: string;
    axis?: string;
    add?: string;
    pd?: string;
  };
  rightPrism?: {
    verticalPrism?: string;
    verticalBase?: string;
    horizontalPrism?: string;
    horizontalBase?: string;
  };
  leftPrism?: {
    verticalPrism?: string;
    verticalBase?: string;
    horizontalPrism?: string;
    horizontalBase?: string;
  };
  twoPDNumbers?: boolean;
  addPrism?: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  has_eyesight: boolean;
  product?: {
    id: string;
    title: string;
    images: string[];
    base_price: number;
  } | null;
  product_variant?: {
    id: string;
    color: string | null;
    size: string | null;
    material: string | null;
    images: string[];
    price_adjustment: number | null;
  } | null;
  lens_type?: {
    id: string;
    name: string;
    price_adjustment: number;
  } | null;
  prescription_data?: PrescriptionData | null;
  prescription_image_url?: string | null;
}

interface Address {
  full_name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total?: number | null;
  tracking_number?: string | null;
  user_id?: string | null;
  shipping_address?: Address | null;
  profile?: { 
    full_name?: string | null; 
    email?: string | null;
    phone?: string | null;
  } | null;
  order_items?: OrderItem[] | null;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const fetchOrders = async () => {
    try {
      // First, try a simple query to check if orders table is accessible
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error(`Failed to load orders: ${error.message}`);
      } else if (data) {
        console.log("Fetched orders:", data);
        
        // If we have orders, fetch the related data
        if (data.length > 0) {
          const ordersWithDetails = await Promise.all(
            data.map(async (order) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const enrichedOrder: any = { ...order };
              
              // Fetch profile
              if (order.user_id) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("full_name, email, phone")
                  .eq("id", order.user_id)
                  .single();
                enrichedOrder.profile = profile;
              }
              
              // Shipping address is already in the order as JSONB
              if (order.shipping_address) {
                enrichedOrder.shipping_address = order.shipping_address as Address;
              }
              
              // Fetch order items
              const { data: items } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", order.id);
              
              if (items) {
                enrichedOrder.order_items = await Promise.all(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  items.map(async (item: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const enrichedItem: any = { ...item };
                    
                    // Fetch product
                    if (item.product_id) {
                      const { data: product } = await supabase
                        .from("products")
                        .select("id, title, images, base_price")
                        .eq("id", item.product_id)
                        .single();
                      enrichedItem.product = product;
                    }
                    
                    // Fetch variant
                    if (item.variant_id) {
                      const { data: variant } = await supabase
                        .from("product_variants")
                        .select("id, color, size, material, images, price_adjustment")
                        .eq("id", item.variant_id)
                        .single();
                      enrichedItem.product_variant = variant;
                    }
                    
                    // Fetch lens type
                    if (item.lens_type_id) {
                      const { data: lensType } = await supabase
                        .from("lens_types")
                        .select("id, name, price_adjustment")
                        .eq("id", item.lens_type_id)
                        .single();
                      enrichedItem.lens_type = lensType;
                    }
                    
                    return enrichedItem;
                  })
                );
                
                // Calculate total from order items if not set
                if (!enrichedOrder.total && enrichedOrder.order_items && enrichedOrder.order_items.length > 0) {
                  enrichedOrder.total = enrichedOrder.order_items.reduce(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (sum: number, item: any) => sum + (item.total_price || 0),
                    0
                  );
                }
              }
              
              return enrichedOrder;
            })
          );
          
          setOrders(ordersWithDetails as Order[]);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from("orders")
      .update({
        status: formData.get("status") as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
        tracking_number: formData.get("tracking_number") as string
      })
      .eq("id", selectedOrder.id);

    if (error) {
      toast.error("Failed to update order");
    } else {
      toast.success("Order updated successfully");
      setIsDialogOpen(false);
      fetchOrders();
    }
  };

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 20px;
              color: #333; 
            }
            .header p { 
              margin: 2px 0;
              font-size: 10px;
              color: #666;
            }
            .section { 
              margin-bottom: 15px;
            }
            .section-title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .info-text {
              font-size: 11px;
              line-height: 1.6;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              padding: 6px 8px;
              text-align: left; 
              border-bottom: 1px solid #ddd;
              font-size: 11px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: 600;
            }
            .total-row td {
              font-weight: bold;
              font-size: 12px;
              padding-top: 10px;
              border-top: 2px solid #333;
              border-bottom: 2px solid #333;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #777; 
              font-size: 10px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TASHNA EYEWEAR</h1>
            <p>Invoice #${order.order_number}</p>
            <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-text">
              <strong>Name:</strong> ${order.profile?.full_name || 'N/A'}<br>
              <strong>Phone:</strong> ${order.profile?.phone || order.shipping_address?.phone || 'N/A'}<br>
              <strong>Email:</strong> ${order.profile?.email || 'N/A'}
            </div>
          </div>

          ${order.shipping_address ? `
          <div class="section">
            <div class="section-title">Shipping Address</div>
            <div class="info-text">
              ${order.shipping_address.full_name}<br>
              ${order.shipping_address.address_line1}${order.shipping_address.address_line2 ? ', ' + order.shipping_address.address_line2 : ''}<br>
              ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Order Details</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%">Product</th>
                  <th style="width: 15%; text-align: center">Qty</th>
                  <th style="width: 17%; text-align: right">Price</th>
                  <th style="width: 18%; text-align: right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items?.map(item => `
                  <tr>
                    <td>${item.product?.title || 'N/A'}</td>
                    <td style="text-align: center">${item.quantity}</td>
                    <td style="text-align: right">Rs. ${item.unit_price?.toLocaleString() || '0'}</td>
                    <td style="text-align: right">Rs. ${item.total_price?.toLocaleString() || '0'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No items</td></tr>'}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right">Grand Total:</td>
                  <td style="text-align: right">Rs. ${order.total?.toLocaleString() || '0'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>TASHNA EYEWEAR | Contact: info@tashnaeyewear.com</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
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
        <h2 className="text-2xl font-semibold">Orders Management</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {statusFilter === "all" ? "No orders found" : `No ${statusFilter} orders found`}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {statusFilter === "all" 
                ? "Orders will appear here once customers make purchases" 
                : "Try selecting a different status filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order {order.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} • 
                    {order.profile?.full_name || order.profile?.email || "Guest"}
                  </p>
                </div>
                <Badge
                  variant={
                    order.status === "delivered" ? "default" :
                    order.status === "cancelled" ? "destructive" :
                    order.status === "shipped" ? "default" :
                    order.status === "processing" ? "secondary" : "outline"
                  }
                  className={
                    order.status === "shipped" ? "bg-blue-500 hover:bg-blue-600" :
                    order.status === "processing" ? "bg-yellow-500 hover:bg-yellow-600" :
                    order.status === "pending" ? "bg-gray-500 hover:bg-gray-600" : ""
                  }
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Rs. {order.total?.toLocaleString() || '0'}</p>
                  {order.tracking_number && (
                    <p className="text-sm text-muted-foreground">
                      Tracking: {order.tracking_number}
                    </p>
                  )}
                </div>
                <Dialog open={isDialogOpen && selectedOrder?.id === order.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Customer Information */}
                      <div>
                        <h3 className="font-semibold mb-2">Customer Information</h3>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{order.profile?.full_name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{order.profile?.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{order.profile?.phone || order.shipping_address?.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Order Date</p>
                                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div>
                          <h3 className="font-semibold mb-2">Shipping Address</h3>
                          <Card>
                            <CardContent className="pt-4">
                              <p>{order.shipping_address.full_name}</p>
                              <p>{order.shipping_address.address_line1}</p>
                              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                              <p>Phone: {order.shipping_address.phone}</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Order Items */}
                      <div>
                        <h3 className="font-semibold mb-2">Order Items</h3>
                        <div className="space-y-3">
                          {order.order_items?.map((item, index) => (
                            <Card key={item.id}>
                              <CardContent className="pt-4">
                                <div className="flex gap-4 mb-3">
                                  <img 
                                    src={item.product_variant?.images?.[0] || item.product?.images?.[0] || '/placeholder.svg'} 
                                    alt={item.product?.title}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-base">{item.product?.title}</h4>
                                    <p className="text-xs text-muted-foreground">Product ID: {item.product?.id}</p>
                                    {item.product_variant && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Variant: {item.product_variant.color} {item.product_variant.size} {item.product_variant.material}
                                      </p>
                                    )}
                                    <div className="text-sm mt-2 space-y-1">
                                      <p className="text-muted-foreground">
                                        Frame: Rs. {((item.product?.base_price || 0) + (item.product_variant?.price_adjustment || 0))?.toLocaleString()}
                                        {item.lens_type && (
                                          <span> + Lens: Rs. {item.lens_type.price_adjustment?.toLocaleString() || '0'}</span>
                                        )}
                                      </p>
                                      <p className="font-semibold">
                                        Qty: {item.quantity} × Rs. {item.unit_price?.toLocaleString() || '0'} = Rs. {item.total_price?.toLocaleString() || '0'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Selected Lens Details */}
                                <Separator className="my-3" />
                                <details className="group">
                                  <summary className="cursor-pointer list-none flex items-center justify-between p-2 hover:bg-muted rounded">
                                    <span className="font-medium text-sm">Selected Lens Details</span>
                                    <span className="transition group-open:rotate-180">▼</span>
                                  </summary>
                                  <div className="mt-3 space-y-3 p-3 bg-muted/50 rounded">
                                    {/* Eyesight Status */}
                                    <div>
                                      <p className="text-sm font-medium">Eyesight Option:</p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.has_eyesight ? '✓ With Eyesight Correction' : '✗ No Eyesight Correction'}
                                      </p>
                                    </div>

                                    {/* Lens Type - Always show if exists */}
                                    {item.lens_type && (
                                      <div>
                                        <p className="text-sm font-medium">Lens Type Selected:</p>
                                        <p className="text-sm text-muted-foreground">
                                          {item.lens_type.name} (+Rs. {item.lens_type.price_adjustment?.toLocaleString() || '0'})
                                        </p>
                                      </div>
                                    )}
                                    
                                    {!item.lens_type && (
                                      <div>
                                        <p className="text-sm font-medium">Lens Type:</p>
                                        <p className="text-sm text-muted-foreground italic">No lens type selected</p>
                                      </div>
                                    )}

                                    {/* Prescription Data */}
                                    {item.has_eyesight && item.prescription_data && (
                                      <div className="space-y-4">
                                        <p className="text-sm font-medium">Prescription Details:</p>
                                        
                                        {/* Main Prescription Table */}
                                        <div className="space-y-2">
                                          {/* Header Row */}
                                          <div className="bg-gray-800 text-white p-2 rounded">
                                            <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-center">
                                              <div>Eye</div>
                                              <div>SPH</div>
                                              <div>CYL</div>
                                              <div>AXIS</div>
                                              <div>ADD</div>
                                            </div>
                                          </div>
                                          
                                          {/* Right Eye */}
                                          {item.prescription_data.rightEye && (
                                            <div className="bg-gray-50 p-2 rounded border">
                                              <div className="grid grid-cols-5 gap-2 text-xs text-center items-center">
                                                <div className="font-medium">Right</div>
                                                <div>{item.prescription_data.rightEye.sph || '-'}</div>
                                                <div>{item.prescription_data.rightEye.cyl || '-'}</div>
                                                <div>{item.prescription_data.rightEye.axis || '-'}</div>
                                                <div>{item.prescription_data.rightEye.add || '-'}</div>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Left Eye */}
                                          {item.prescription_data.leftEye && (
                                            <div className="bg-gray-50 p-2 rounded border">
                                              <div className="grid grid-cols-5 gap-2 text-xs text-center items-center">
                                                <div className="font-medium">Left</div>
                                                <div>{item.prescription_data.leftEye.sph || '-'}</div>
                                                <div>{item.prescription_data.leftEye.cyl || '-'}</div>
                                                <div>{item.prescription_data.leftEye.axis || '-'}</div>
                                                <div>{item.prescription_data.leftEye.add || '-'}</div>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Pupillary Distance (PD) */}
                                        <div className="border-t pt-3">
                                          <p className="text-xs font-semibold mb-2">Pupillary Distance (PD):</p>
                                          {item.prescription_data.twoPDNumbers ? (
                                            <div className="grid grid-cols-2 gap-3 max-w-sm">
                                              <div className="bg-gray-50 p-2 rounded border text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Right PD</p>
                                                <p className="text-sm font-medium">{item.prescription_data.rightEye?.pd || '-'}</p>
                                              </div>
                                              <div className="bg-gray-50 p-2 rounded border text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Left PD</p>
                                                <p className="text-sm font-medium">{item.prescription_data.leftEye?.pd || '-'}</p>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="bg-gray-50 p-2 rounded border text-center max-w-xs">
                                              <p className="text-xs text-muted-foreground mb-1">PD</p>
                                              <p className="text-sm font-medium">{item.prescription_data.rightEye?.pd || '-'}</p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Prism Section */}
                                        {item.prescription_data.addPrism && (
                                          <div className="border-t pt-3">
                                            <p className="text-xs font-semibold mb-2">Prism Details:</p>
                                            
                                            <div className="space-y-2">
                                              {/* Prism Header */}
                                              <div className="bg-gray-800 text-white p-2 rounded">
                                                <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-center">
                                                  <div>Eye</div>
                                                  <div>Vertical Prism</div>
                                                  <div>Base Direction</div>
                                                  <div>Horizontal Prism</div>
                                                  <div>Base Direction</div>
                                                </div>
                                              </div>
                                              
                                              {/* Right Eye Prism */}
                                              <div className="bg-gray-50 p-2 rounded border">
                                                <div className="grid grid-cols-5 gap-2 text-xs text-center items-center">
                                                  <div className="font-medium">Right</div>
                                                  <div>{item.prescription_data.rightPrism?.verticalPrism || '-'}</div>
                                                  <div>{item.prescription_data.rightPrism?.verticalBase || '-'}</div>
                                                  <div>{item.prescription_data.rightPrism?.horizontalPrism || '-'}</div>
                                                  <div>{item.prescription_data.rightPrism?.horizontalBase || '-'}</div>
                                                </div>
                                              </div>
                                              
                                              {/* Left Eye Prism */}
                                              <div className="bg-gray-50 p-2 rounded border">
                                                <div className="grid grid-cols-5 gap-2 text-xs text-center items-center">
                                                  <div className="font-medium">Left</div>
                                                  <div>{item.prescription_data.leftPrism?.verticalPrism || '-'}</div>
                                                  <div>{item.prescription_data.leftPrism?.verticalBase || '-'}</div>
                                                  <div>{item.prescription_data.leftPrism?.horizontalPrism || '-'}</div>
                                                  <div>{item.prescription_data.leftPrism?.horizontalBase || '-'}</div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Uploaded Prescription */}
                                    {item.prescription_image_url && (
                                      <div>
                                        <p className="text-sm font-medium mb-2">Uploaded Prescription:</p>
                                        <img 
                                          src={item.prescription_image_url} 
                                          alt="Prescription"
                                          className="max-w-sm border rounded"
                                        />
                                      </div>
                                    )}

                                    {!item.has_eyesight && !item.lens_type && (
                                      <p className="text-sm text-muted-foreground italic">No lens configuration for this item</p>
                                    )}
                                  </div>
                                </details>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Update Order Form */}
                      <form onSubmit={updateOrder} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="status">Order Status</Label>
                            <Select name="status" defaultValue={order.status}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="tracking_number">Tracking Number</Label>
                            <Input
                              id="tracking_number"
                              name="tracking_number"
                              defaultValue={order.tracking_number || ""}
                              placeholder="Enter tracking number"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">
                            Update Order
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => printInvoice(order)}
                            className="flex-1"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                          </Button>
                        </div>
                      </form>

                      <div className="text-right">
                        <p className="text-lg font-bold">Total: Rs. {order.total?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;