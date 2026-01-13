import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";

export default function Cart() {
    const { data: cartItems, isLoading } = useCart();
    const removeMutation = useRemoveFromCart();
    const updateMutation = useUpdateCartQuantity();
    const [, setLocation] = useLocation();

    const subtotal = cartItems?.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;
    const itemCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <AnnouncementBar />
                <Header />
                <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="animate-pulse space-y-8">
                            <div className="h-10 bg-secondary/50 w-1/3" />
                            <div className="h-32 bg-secondary/50" />
                            <div className="h-32 bg-secondary/50" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <AnnouncementBar />
                <Header />
                <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-4xl mx-auto text-center py-20 space-y-6">
                        <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30" />
                        <h1 className="text-3xl font-bold tracking-tight">Sepetiniz Boş</h1>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Henüz sepetinize ürün eklemediniz. Harika motorlarımızı keşfedin!
                        </p>
                        <Link href="/products">
                            <Button size="lg" className="rounded-none bg-black text-white hover:bg-black/90 px-8 h-12">
                                ALIŞVERİŞE BAŞLA
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Back Link */}
                    <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Alışverişe Devam Et
                    </Link>

                    {/* Page Title */}
                    <div className="mb-10">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            SEPETİM <span className="text-muted-foreground font-normal">({itemCount} ürün)</span>
                        </h1>
                        <div className="h-1 w-20 bg-black mt-4" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-6 pb-6 border-b">
                                    {/* Product Image */}
                                    <Link href={`/products/${item.productId}`}>
                                        <div className="h-32 w-32 flex-shrink-0 overflow-hidden bg-secondary/10 cursor-pointer hover:opacity-80 transition-opacity">
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>
                                    </Link>

                                    {/* Product Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <Link href={`/products/${item.productId}`}>
                                                <h3 className="font-bold text-lg hover:underline cursor-pointer">{item.product.name}</h3>
                                            </Link>
                                            {item.selectedColor && (
                                                <p className="text-sm text-muted-foreground">Renk: {item.selectedColor}</p>
                                            )}
                                            <p className="text-lg font-semibold">{item.product.price.toLocaleString('tr-TR')} TL</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center border h-10">
                                                <button
                                                    className="px-3 h-full hover:bg-muted flex items-center justify-center disabled:opacity-50 transition-colors"
                                                    onClick={() => {
                                                        if (item.quantity > 1) {
                                                            updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
                                                        } else {
                                                            removeMutation.mutate(item.id);
                                                        }
                                                    }}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-12 text-center font-medium tabular-nums">{item.quantity}</span>
                                                <button
                                                    className="px-3 h-full hover:bg-muted flex items-center justify-center disabled:opacity-50 transition-colors"
                                                    onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Item Total & Remove */}
                                            <div className="flex items-center gap-6">
                                                <span className="font-bold text-lg">
                                                    {(item.product.price * item.quantity).toLocaleString('tr-TR')} TL
                                                </span>
                                                <button
                                                    onClick={() => removeMutation.mutate(item.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                                                    disabled={removeMutation.isPending}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-secondary/30 p-8 sticky top-8">
                                <h2 className="text-xl font-bold mb-6 uppercase tracking-tighter">Sipariş Özeti</h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Ara Toplam ({itemCount} ürün)</span>
                                        <span>{subtotal.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Kargo</span>
                                        <span className="text-green-600 font-medium">ÜCRETSİZ</span>
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Toplam</span>
                                        <span>{subtotal.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <Button
                                        onClick={() => setLocation("/checkout")}
                                        className="w-full h-14 text-base font-bold rounded-none bg-black text-white hover:bg-black/90"
                                    >
                                        ÖDEMEYE GEÇ
                                    </Button>
                                    <Link href="/products" className="block">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-none border-black text-black hover:bg-black hover:text-white"
                                        >
                                            ALIŞVERİŞE DEVAM ET
                                        </Button>
                                    </Link>
                                </div>

                                <p className="text-xs text-muted-foreground mt-6 text-center">
                                    Vergiler ödeme adımında hesaplanır.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
