import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProduct } from "@/hooks/use-products";
import { useAddToCart } from "@/hooks/use-cart";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { data: product, isLoading, isError } = useProduct(id);
  const addToCartMutation = useAddToCart();
  const [isBuying, setIsBuying] = useState(false);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Initialize selected color once product is loaded
  if (product && !selectedColor && product.colors && product.colors.length > 0) {
    setSelectedColor(product.colors[0]);
  }

  const handleAddToCart = () => {
    if (!product) return;
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      selectedColor: selectedColor || undefined
    });
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsBuying(true);
    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
        selectedColor: selectedColor || undefined
      });
      setLocation("/checkout");
    } catch (error) {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <div className="flex-1 container py-12 px-4 flex gap-12 flex-col lg:flex-row">
          <div className="flex-1 aspect-square bg-secondary/50 animate-pulse" />
          <div className="flex-1 space-y-8">
            <div className="h-12 bg-secondary/50 w-3/4 animate-pulse" />
            <div className="h-8 bg-secondary/50 w-1/4 animate-pulse" />
            <div className="h-64 bg-secondary/50 w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Ürün bulunamadı</h1>
          <Link href="/products">
            <Button>Ürünlere Dön</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Ürünlere Dön
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Gallery Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary/10 overflow-hidden relative group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="aspect-square bg-secondary/10 cursor-pointer ring-2 ring-black">
                  <img src={product.image} className="w-full h-full object-cover" alt="" />
                </div>
                {product.images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-secondary/10 cursor-pointer hover:opacity-80 transition-opacity">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col">
            <div className="mb-8 border-b pb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
              <div className="flex items-end gap-4">
                <span className="text-2xl font-medium">
                  {product.price.toLocaleString('tr-TR')} TL
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through mb-1">
                    {product.originalPrice.toLocaleString('tr-TR')} TL
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wide">Renk: {selectedColor}</label>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "px-4 py-2 text-sm border bg-white hover:border-black transition-colors rounded-full min-w-[3rem]",
                          selectedColor === color ? "border-black bg-black text-white" : "border-input text-foreground"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || isBuying}
                  className="w-full h-12 text-base rounded-none border-2 border-black bg-transparent text-black hover:bg-black hover:text-white transition-all"
                >
                  {addToCartMutation.isPending ? "Ekleniyor..." : "SEPETE EKLE"}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={isBuying || addToCartMutation.isPending}
                  className="w-full h-12 text-base rounded-none bg-black text-white hover:bg-black/90"
                >
                  {isBuying ? "YÖNLENDİRİLİYOR..." : "HEMEN SATIN AL"}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 py-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span>Ücretsiz Kargo</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>2 Yıl Garanti</span>
                </div>
              </div>

              {/* Description & Specs */}
              <div className="pt-6 border-t">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>

                {product.specs && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="specs">
                      <AccordionTrigger className="text-sm font-bold uppercase tracking-widest">Teknik Özellikler</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          {Object.entries(product.specs).map(([key, value]) => (
                            <div key={key} className="flex flex-col space-y-1">
                              <span className="text-xs text-muted-foreground font-medium uppercase">{key}</span>
                              <span className="text-sm font-medium">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="delivery">
                      <AccordionTrigger className="text-sm font-bold uppercase tracking-widest">Teslimat & İade</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Siparişleriniz 1-3 iş günü içerisinde kargoya verilir. 14 gün içerisinde ücretsiz iade hakkınız bulunmaktadır.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
