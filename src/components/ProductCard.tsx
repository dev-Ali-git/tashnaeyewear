import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stock?: number;
}

const ProductCard = ({ id, title, price, image, slug, stock = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(id);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      await removeFromWishlist(id);
    } else {
      await addToWishlist(id);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link to={`/product/${slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-secondary relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {stock <= 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Out of Stock
            </Badge>
          )}
          {stock > 0 && stock <= 5 && (
            <Badge variant="secondary" className="absolute top-2 right-2">
              Low Stock
            </Badge>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${slug}`}>
          <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">Rs. {price.toLocaleString()}</p>
            {stock > 0 && <p className="text-xs text-muted-foreground">{stock} in stock</p>}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", inWishlist && "text-red-500")}
              onClick={handleWishlistToggle}
            >
              <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddToCart}
              disabled={stock <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
