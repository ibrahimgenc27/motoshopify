import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function Checkout() {
  const { data: cartItems, sessionId } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const total = cartItems?.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;

  const form = useForm({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      sessionId: sessionId || "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      totalAmount: total,
    },
  });

  async function onSubmit(data: any) {
    if (!cartItems || cartItems.length === 0) return;

    try {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        selectedColor: item.selectedColor,
      }));

      await apiRequest("POST", "/api/orders", {
        ...data,
        sessionId,
        totalAmount: total,
        items: orderItems,
      });

      // Clear cart
      await apiRequest("POST", `/api/cart/clear/${sessionId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });

      toast({
        title: "Sipariş Başarılı",
        description: "Siparişiniz başarıyla alındı. Teşekkür ederiz!",
      });

      setLocation("/checkout/success");
    } catch (err) {
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
          <Button onClick={() => setLocation("/products")}>Alışverişe Başla</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
      <AnnouncementBar />
      <Header />
      
      <main className="flex-1 container max-w-6xl mx-auto py-12 px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 p-8 border rounded-none shadow-sm">
            <h1 className="text-2xl font-bold mb-8 uppercase tracking-tighter">Teslimat Bilgileri</h1>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Soyad</FormLabel>
                      <FormControl>
                        <Input placeholder="Mehmet Yılmaz" {...field} className="rounded-none h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input placeholder="mehmet@example.com" type="email" {...field} className="rounded-none h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="0555 555 55 55" {...field} className="rounded-none h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Input placeholder="Mahalle, Sokak, No..." {...field} className="rounded-none h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <h2 className="text-xl font-bold mb-4 uppercase tracking-tighter">Ödeme (Yalandan)</h2>
                  <div className="p-4 border border-dashed border-primary/50 bg-primary/5 text-sm text-primary font-medium">
                    Şu an test modundasınız. Herhangi bir kart bilgisi gerekmez.
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold rounded-none bg-black text-white hover:bg-black/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "İŞLENİYOR..." : `SİPARİŞİ TAMAMLA - ${total.toLocaleString('tr-TR')} TL`}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 border rounded-none shadow-sm">
              <h2 className="text-xl font-bold mb-6 uppercase tracking-tighter">Sipariş Özeti</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.product.name}</h3>
                      <p className="text-xs text-muted-foreground">Adet: {item.quantity}</p>
                      {item.selectedColor && (
                        <p className="text-xs text-muted-foreground">Renk: {item.selectedColor}</p>
                      )}
                    </div>
                    <div className="text-sm font-bold">
                      {(item.product.price * item.quantity).toLocaleString('tr-TR')} TL
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam</span>
                  <span>{total.toLocaleString('tr-TR')} TL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kargo</span>
                  <span className="text-green-600 font-medium">ÜCRETSİZ</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span>{total.toLocaleString('tr-TR')} TL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
