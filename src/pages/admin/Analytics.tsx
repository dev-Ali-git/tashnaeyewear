import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  title: string;
  sales: number;
  revenue: number;
}

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Fetch orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total")
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Group by date
    const revenueByDate: { [key: string]: { revenue: number; orders: number } } = {};
    orders?.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, orders: 0 };
      }
      revenueByDate[date].revenue += Number(order.total);
      revenueByDate[date].orders += 1;
    });

    const chartData = Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }));

    setRevenueData(chartData);

    // Fetch top products
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, total_price, product:products(title)");

    const productStats: { [key: string]: { title: string; sales: number; revenue: number } } = {};
    orderItems?.forEach((item: any) => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = {
          title: item.product?.title || "Unknown",
          sales: 0,
          revenue: 0
        };
      }
      productStats[productId].sales += item.quantity;
      productStats[productId].revenue += Number(item.total_price);
    });

    const topProductsData = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(topProductsData);
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
      <h2 className="text-2xl font-semibold">Analytics</h2>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue (Rs.)" />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--accent))" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (Rs.)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;