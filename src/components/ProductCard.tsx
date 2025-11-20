import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
}

const ProductCard = ({ id, title, price, image, slug }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(id);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link to={`/product/${slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-secondary">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${slug}`}>
          <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg">Rs. {price.toLocaleString()}</p>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                // Add to wishlist logic
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddToCart}
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
