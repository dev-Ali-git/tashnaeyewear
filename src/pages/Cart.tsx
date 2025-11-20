import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const Cart = () => {
  const { cartItems, loading, updateQuantity, removeFromCart } = useCart();

  const calculateItemPrice = (item: any) => {
    let price = item.product.base_price;
    if (item.variant?.price_adjustment) {
      price += item.variant.price_adjustment;
    }
    if (item.lens_type?.price_adjustment) {
      price += item.lens_type.price_adjustment;
    }
    return price;
  };

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (calculateItemPrice(item) * item.quantity);
  }, 0);
  
  const shipping = subtotal > 5000 ? 0 : 200;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <p className="text-center">Loading cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-6">Your cart is empty</p>
              <Button asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="md:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const itemPrice = calculateItemPrice(item);
                  const itemImage = item.variant?.images?.[0] || item.product.images?.[0];
                  const variantInfo = [item.variant?.color, item.variant?.size]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <Card key={item.id} className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={itemImage}
                          alt={item.product.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{item.product.title}</h3>
                          {variantInfo && (
                            <p className="text-sm text-muted-foreground mb-1">{variantInfo}</p>
                          )}
                          {item.lens_type && (
                            <p className="text-sm text-muted-foreground mb-2">{item.lens_type.name}</p>
                          )}
                          <p className="font-bold">Rs. {itemPrice.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <div className="flex items-center border rounded-lg">
                            <button 
                              className="px-3 py-1 hover:bg-secondary"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-4 py-1 border-x">{item.quantity}</span>
                            <button 
                              className="px-3 py-1 hover:bg-secondary"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div>
                <Card className="p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? "Free" : `Rs. ${shipping}`}
                      </span>
                    </div>
                    {subtotal < 5000 && (
                      <p className="text-xs text-muted-foreground">
                        Add Rs. {(5000 - subtotal).toLocaleString()} more for free shipping
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold">Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button className="w-full mb-3" size="lg" asChild>
                    <Link to="/checkout">Proceed to Checkout</Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/shop">Continue Shopping</Link>
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
