import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  orderCount?: number;
  totalSpent?: number;
}

const CustomersManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profiles) {
      const customersWithOrders = await Promise.all(
        profiles.map(async (profile) => {
          const { data: orders } = await supabase
            .from("orders")
            .select("total")
            .eq("user_id", profile.id);

          const orderCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

          return {
            ...profile,
            orderCount,
            totalSpent
          };
        })
      );

      setCustomers(customersWithOrders);
    }
    setLoading(false);
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
      <h2 className="text-2xl font-semibold">Customers</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.full_name || "N/A"}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{customer.orderCount}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    Rs. {customer.totalSpent?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersManagement;