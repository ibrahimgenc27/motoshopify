import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link href={`/products/${product.id}`} className="group cursor-pointer block">
      <div className="relative aspect-square overflow-hidden bg-secondary/10">
        {isDiscounted && (
          <Badge className="absolute left-2 bottom-2 z-10 bg-red-600 text-white hover:bg-red-700 rounded-sm px-2 py-0.5 text-xs font-medium">
            İNDİRİM
          </Badge>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-bold text-foreground group-hover:underline underline-offset-4 decoration-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal text-foreground">
            {product.price.toLocaleString('tr-TR')} TL
          </span>
          {isDiscounted && (
            <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
              {product.originalPrice?.toLocaleString('tr-TR')} TL
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
