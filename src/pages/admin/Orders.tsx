import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total: number;
  tracking_number: string | null;
  user_id: string | null;
  profile?: { full_name: string | null; email: string };
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profile:profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (data) setOrders(data as Order[]);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Orders Management</h2>

      <div className="space-y-4">
        {orders.map((order) => (
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
                    order.status === "cancelled" ? "destructive" : "secondary"
                  }
                >
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Rs. {order.total.toLocaleString()}</p>
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
                      Manage
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Order {order.order_number}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={updateOrder} className="space-y-4">
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
                      <Button type="submit" className="w-full">
                        Update Order
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersManagement;