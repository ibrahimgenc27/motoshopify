import { Link } from "wouter";
import { ShoppingBag, Search, User, Menu } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./CartDrawer";
import { useState } from "react";

export function Header() {
  const { data: cartItems } = useCart();
  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Mobile Menu */}
          <div className="flex lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/products" className="text-lg font-medium hover:text-primary">Motorlar</Link>
                  <Link href="/products/category/equipment" className="text-lg font-medium hover:text-primary">Ekipman</Link>
                  <Link href="/products/category/parts" className="text-lg font-medium hover:text-primary">Yedek Parça</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tighter uppercase cursor-pointer">
              MOTO<span className="text-primary">SHOP</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-8 mx-6">
            <Link href="/products" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">MOTORLAR</Link>
            <Link href="/products?category=equipment" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">EKİPMAN</Link>
            <Link href="/products?category=parts" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">YEDEK PARÇA</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <User className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
