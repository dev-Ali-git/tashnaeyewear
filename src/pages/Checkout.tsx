import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  lens_type_id: string | null;
  quantity: number;
  has_eyesight: boolean | null;
  prescription_data: any;
  prescription_image_url: string | null;
  products: {
    title: string;
    base_price: number;
    images: string[];
  };
  product_variants: {
    color: string | null;
    size: string | null;
    price_adjustment: number | null;
  } | null;
  lens_types: {
    name: string;
    price_adjustment: number | null;
  } | null;
}

interface SavedAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [useExistingAddress, setUseExistingAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Shipping form
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    saveAddress: false,
  });

  const [paymentMethod, setPaymentMethod] = useState<"jazzcash" | "easypaisa" | "bank_transfer" | "card" | "cod">("cod");

  useEffect(() => {
    checkAuth();
    fetchCartItems();
    fetchSavedAddresses();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const fetchCartItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        products (title, base_price, images),
        product_variants (color, size, price_adjustment),
        lens_types (name, price_adjustment)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } else {
      setCartItems(data || []);
    }
    setLoading(false);
  };

  const fetchSavedAddresses = async () => {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false });

    if (data && data.length > 0) {
      setSavedAddresses(data);
      const defaultAddress = data.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setUseExistingAddress(true);
      }
    }
  };

  const calculateItemPrice = (item: CartItem) => {
    let price = item.products.base_price;
    if (item.product_variants?.price_adjustment) {
      price += item.product_variants.price_adjustment;
    }
    if (item.lens_types?.price_adjustment) {
      price += item.lens_types.price_adjustment;
    }
    return price;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item) * item.quantity, 0);
  const shippingCost = subtotal > 5000 ? 0 : 200;
  const total = subtotal + shippingCost;

  const handleShippingSubmit = async () => {
    if (useExistingAddress && selectedAddressId) {
      setStep(2);
      return;
    }

    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.addressLine1 || !shippingForm.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (shippingForm.saveAddress && user) {
      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        full_name: shippingForm.fullName,
        phone: shippingForm.phone,
        address_line1: shippingForm.addressLine1,
        address_line2: shippingForm.addressLine2,
        city: shippingForm.city,
        state: shippingForm.state,
        postal_code: shippingForm.postalCode,
      });

      if (error) {
        console.error("Error saving address:", error);
      }
    }

    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let shippingAddress;
      
      if (useExistingAddress && selectedAddressId) {
        const address = savedAddresses.find(a => a.id === selectedAddressId);
        if (address) {
          shippingAddress = {
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
          };
        }
      } else {
        shippingAddress = {
          full_name: shippingForm.fullName,
          phone: shippingForm.phone,
          address_line1: shippingForm.addressLine1,
          address_line2: shippingForm.addressLine2,
          city: shippingForm.city,
          state: shippingForm.state,
          postal_code: shippingForm.postalCode,
        };
      }

      // Generate order number
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumberData,
          subtotal,
          shipping_cost: shippingCost,
          total,
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        lens_type_id: item.lens_type_id,
        quantity: item.quantity,
        unit_price: calculateItemPrice(item),
        total_price: calculateItemPrice(item) * item.quantity,
        has_eyesight: item.has_eyesight,
        prescription_data: item.prescription_data,
        prescription_image_url: item.prescription_image_url,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Order Placed Successfully!",
        description: `Order ${order.order_number} has been confirmed`,
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="hidden sm:inline">Shipping</span>
            </div>
            <Separator className="w-16" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>
                {step > 2 ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="hidden sm:inline">Payment</span>
            </div>
            <Separator className="w-16" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>
                3
              </div>
              <span className="hidden sm:inline">Review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {savedAddresses.length > 0 && (
                    <div className="space-y-4">
                      <Label>
                        <input
                          type="checkbox"
                          checked={useExistingAddress}
                          onChange={(e) => setUseExistingAddress(e.target.checked)}
                          className="mr-2"
                        />
                        Use saved address
                      </Label>

                      {useExistingAddress && (
                        <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an address" />
                          </SelectTrigger>
                          <SelectContent>
                            {savedAddresses.map((addr) => (
                              <SelectItem key={addr.id} value={addr.id}>
                                {addr.full_name} - {addr.address_line1}, {addr.city}
                                {addr.is_default && " (Default)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {!useExistingAddress && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={shippingForm.fullName}
                            onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            value={shippingForm.phone}
                            onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                            placeholder="+92 300 1234567"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address1">Address Line 1 *</Label>
                        <Input
                          id="address1"
                          value={shippingForm.addressLine1}
                          onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                          placeholder="Street address"
                        />
                      </div>

                      <div>
                        <Label htmlFor="address2">Address Line 2</Label>
                        <Input
                          id="address2"
                          value={shippingForm.addressLine2}
                          onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={shippingForm.city}
                            onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                            placeholder="Karachi"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            value={shippingForm.state}
                            onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                            placeholder="Sindh"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postal">Postal Code</Label>
                          <Input
                            id="postal"
                            value={shippingForm.postalCode}
                            onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                            placeholder="75000"
                          />
                        </div>
                      </div>

                      {user && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            checked={shippingForm.saveAddress}
                            onChange={(e) => setShippingForm({ ...shippingForm, saveAddress: e.target.checked })}
                          />
                          <Label htmlFor="saveAddress" className="cursor-pointer">
                            Save this address for future orders
                          </Label>
                        </div>
                      )}
                    </div>
                  )}

                  <Button onClick={handleShippingSubmit} className="w-full">
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer flex-1">
                        <div className="font-semibold">Cash on Delivery (COD)</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="jazzcash" id="jazzcash" />
                      <Label htmlFor="jazzcash" className="cursor-pointer flex-1">
                        <div className="font-semibold">JazzCash</div>
                        <div className="text-sm text-muted-foreground">Mobile wallet payment</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="easypaisa" id="easypaisa" />
                      <Label htmlFor="easypaisa" className="cursor-pointer flex-1">
                        <div className="font-semibold">EasyPaisa</div>
                        <div className="text-sm text-muted-foreground">Mobile wallet payment</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="cursor-pointer flex-1">
                        <div className="font-semibold">Bank Transfer</div>
                        <div className="text-sm text-muted-foreground">Direct bank transfer</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="cursor-pointer flex-1">
                        <div className="font-semibold">Credit/Debit Card</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard accepted</div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review & Place Order */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    {useExistingAddress && selectedAddressId ? (
                      (() => {
                        const addr = savedAddresses.find(a => a.id === selectedAddressId);
                        return addr ? (
                          <div className="text-sm text-muted-foreground">
                            <p>{addr.full_name}</p>
                            <p>{addr.phone}</p>
                            <p>{addr.address_line1}</p>
                            {addr.address_line2 && <p>{addr.address_line2}</p>}
                            <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                          </div>
                        ) : null;
                      })()
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <p>{shippingForm.fullName}</p>
                        <p>{shippingForm.phone}</p>
                        <p>{shippingForm.addressLine1}</p>
                        {shippingForm.addressLine2 && <p>{shippingForm.addressLine2}</p>}
                        <p>{shippingForm.city}, {shippingForm.state} {shippingForm.postalCode}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {paymentMethod.replace("_", " ")}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.products.images?.[0] || "/placeholder.svg"}
                        alt={item.products.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.products.title}</p>
                        {item.product_variants && (
                          <p className="text-xs text-muted-foreground">
                            {item.product_variants.color} • {item.product_variants.size}
                          </p>
                        )}
                        {item.lens_types && (
                          <p className="text-xs text-muted-foreground">{item.lens_types.name}</p>
                        )}
                        <p className="text-sm">
                          Rs. {calculateItemPrice(item).toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? "FREE" : `Rs. ${shippingCost}`}</span>
                  </div>
                  {subtotal < 5000 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping on orders over Rs. 5,000
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
