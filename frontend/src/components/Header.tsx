import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, User, Menu, LogOut, ShieldCheck, ChevronDown, Package } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CartDrawer } from "./CartDrawer";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { data: cartItems } = useCart();
  const { user, isAuthenticated, isAdmin, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Çıkış yapıldı",
        description: "Güle güle!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış yapılamadı",
        variant: "destructive",
      });
    }
  };

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
                  <Link href="/" className="text-lg font-medium hover:text-primary">Anasayfa</Link>
                  <Link href="/products" className="text-lg font-medium hover:text-primary">Tüm Ürünler</Link>
                  <Link href="/products?category=motorcycle" className="text-lg font-medium hover:text-primary">Motorlar</Link>
                  <Link href="/products?category=equipment" className="text-lg font-medium hover:text-primary">Ekipman</Link>
                  <Link href="/products?category=parts" className="text-lg font-medium hover:text-primary">Yedek Parça</Link>
                  <Link href="/track-order" className="text-lg font-medium hover:text-primary flex items-center gap-2 text-blue-600">
                    Sipariş Takibi
                  </Link>
                  <hr className="my-2" />
                  {isAuthenticated ? (
                    <>
                      <div className="text-sm text-gray-500">Hoş geldin, {user?.name}</div>
                      {isAdmin && (
                        <Link href="/admin" className="text-lg font-medium hover:text-primary flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5" /> Admin Paneli
                        </Link>
                      )}
                      <button onClick={handleLogout} className="text-lg font-medium hover:text-primary text-left flex items-center gap-2">
                        <LogOut className="h-5 w-5" /> Çıkış Yap
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="text-lg font-medium hover:text-primary">Giriş Yap</Link>
                      <Link href="/register" className="text-lg font-medium hover:text-primary">Kayıt Ol</Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <img src="/logo.png" alt="MotoShop" className="h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-8 mx-6">
            <Link href="/" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">ANASAYFA</Link>
            <Link href="/products" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">TÜM ÜRÜNLER</Link>
            <Link href="/products?category=motorcycle" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">MOTORLAR</Link>
            <Link href="/products?category=equipment" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">EKİPMAN</Link>
            <Link href="/products?category=parts" className="text-sm font-medium hover:underline underline-offset-4 decoration-2">YEDEK PARÇA</Link>
            <Link href="/track-order" className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline underline-offset-4 decoration-2">SİPARİŞ TAKİBİ</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <div className="hidden sm:flex">
              {isLoading ? (
                <Button variant="ghost" size="icon" disabled>
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </Button>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1 px-3">
                      <div className="h-7 w-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-white border border-gray-200 shadow-lg rounded-lg py-2">
                    <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100 mb-1">
                      Merhaba, <span className="font-semibold text-gray-900">{user?.name}</span>
                    </div>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={() => setLocation("/admin")}
                        className="cursor-pointer mx-2 rounded-md hover:bg-gray-100 text-gray-700"
                      >
                        <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-gray-900 font-medium">Admin Paneli</span>
                      </DropdownMenuItem>
                    )}
                    {!isAdmin && (
                      <DropdownMenuItem
                        onClick={() => setLocation("/orders")}
                        className="cursor-pointer mx-2 rounded-md hover:bg-gray-100 text-gray-700"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        <span className="font-medium">Siparişlerim</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer mx-2 rounded-md hover:bg-red-50 text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span className="font-medium">Çıkış Yap</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/login")}
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
            </div>

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

