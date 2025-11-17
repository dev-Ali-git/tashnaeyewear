import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: any;
  tracking_number: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    title: string;
    images: string[];
  };
  product_variants: {
    color: string | null;
    size: string | null;
  } | null;
  lens_types: {
    name: string;
  } | null;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);

    // Fetch order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      console.error("Error fetching order:", orderError);
      navigate("/");
      return;
    }

    setOrder(orderData);

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products (title, images),
        product_variants (color, size),
        lens_types (name)
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    } else {
      setOrderItems(itemsData || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Order Number</p>
                  <p className="font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-semibold capitalize">
                    {order.payment_method.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold capitalize">{order.status}</p>
                </div>
              </div>

              {order.tracking_number && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Tracking Number</p>
                  <p className="font-semibold">{order.tracking_number}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-muted-foreground mb-2 text-sm">Shipping Address</p>
                <div className="text-sm">
                  <p className="font-semibold">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.phone}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state}{" "}
                    {order.shipping_address.postal_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.products.images?.[0] || "/placeholder.svg"}
                      alt={item.products.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.products.title}</p>
                      {item.product_variants && (
                        <p className="text-sm text-muted-foreground">
                          {item.product_variants.color} • {item.product_variants.size}
                        </p>
                      )}
                      {item.lens_types && (
                        <p className="text-sm text-muted-foreground">{item.lens_types.name}</p>
                      )}
                      <p className="text-sm mt-1">
                        Quantity: {item.quantity} × Rs. {item.unit_price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs. {item.total_price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rs. {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {order.shipping_cost === 0
                        ? "FREE"
                        : `Rs. ${order.shipping_cost.toLocaleString()}`}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rs. {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
              Continue Shopping
            </Button>
            <Button onClick={() => navigate("/account/orders")} className="flex-1">
              View All Orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
