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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { CreditCard, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Checkout() {
  const { data: cartItems, sessionId } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState("credit-card");

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

  // Prefill form with user data if logged in
  useEffect(() => {
    if (user) {
      form.setValue("customerName", user.name);
      form.setValue("customerEmail", user.email);
    }
  }, [user, form]);

  // Credit card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  async function onSubmit(data: any) {
    if (!cartItems || cartItems.length === 0) return;

    // Validate credit card if selected
    if (paymentMethod === "credit-card") {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        toast({
          title: "Hata",
          description: "Geçerli bir kart numarası giriniz.",
          variant: "destructive",
        });
        return;
      }
      if (!cardName) {
        toast({
          title: "Hata",
          description: "Kart üzerindeki ismi giriniz.",
          variant: "destructive",
        });
        return;
      }
      if (!expiryDate || expiryDate.length < 5) {
        toast({
          title: "Hata",
          description: "Geçerli bir son kullanma tarihi giriniz.",
          variant: "destructive",
        });
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast({
          title: "Hata",
          description: "Geçerli bir CVV giriniz.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        selectedColor: item.selectedColor,
      }));

      const res = await apiRequest("POST", "/api/orders", {
        ...data,
        sessionId,
        totalAmount: total,
        items: orderItems,
      });

      const { orderCode } = await res.json();

      // Cart is automatically cleared by the backend upon successful order creation
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${sessionId}`] });

      toast({
        title: "Sipariş Başarılı",
        description: "Siparişiniz başarıyla alındı. Teşekkür ederiz!",
      });

      setLocation(`/checkout/success?code=${orderCode}`);
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
          <div className="space-y-6">
            {/* Delivery Info */}
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
                            <Input
                              placeholder="mehmet@example.com"
                              type="email"
                              {...field}
                              className="rounded-none h-12"
                              disabled={!!user}
                            />
                          </FormControl>
                          <FormMessage />
                          {user && <p className="text-xs text-muted-foreground mt-1">Giriş yaptığınız e-posta adresi otomatik kullanılır.</p>}
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
                </form>
              </Form>
            </div>

            {/* Payment */}
            <div className="bg-white dark:bg-zinc-900 p-8 border rounded-none shadow-sm">
              <h2 className="text-xl font-bold mb-6 uppercase tracking-tighter">Ödeme Yöntemi</h2>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className={`flex items-center space-x-3 p-4 border cursor-pointer transition-colors ${paymentMethod === 'credit-card' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Kredi / Banka Kartı</span>
                  </Label>
                </div>

                <div className={`flex items-center space-x-3 p-4 border cursor-pointer transition-colors ${paymentMethod === 'transfer' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">Havale / EFT</span>
                  </Label>
                </div>
              </RadioGroup>

              {/* Credit Card Form */}
              {paymentMethod === "credit-card" && (
                <div className="mt-6 space-y-4 p-4 bg-gray-50 dark:bg-zinc-800 border">
                  <div>
                    <Label htmlFor="cardNumber" className="text-sm font-medium">Kart Numarası</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="rounded-none h-12 mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardName" className="text-sm font-medium">Kart Üzerindeki İsim</Label>
                    <Input
                      id="cardName"
                      placeholder="MEHMET YILMAZ"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="rounded-none h-12 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-sm font-medium">Son Kullanma</Label>
                      <Input
                        id="expiry"
                        placeholder="AA/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="rounded-none h-12 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv" className="text-sm font-medium">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        maxLength={4}
                        type="password"
                        className="rounded-none h-12 mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Info */}
              {paymentMethod === "transfer" && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">Havale Bilgileri</p>
                  <p className="text-blue-700 dark:text-blue-400">
                    Sipariş onayından sonra havale bilgileri e-posta ile gönderilecektir.
                  </p>
                </div>
              )}

              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="w-full h-14 text-lg font-bold rounded-none bg-black text-white hover:bg-black/90 mt-6"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "İŞLENİYOR..." : `SİPARİŞİ TAMAMLA - ${total.toLocaleString('tr-TR')} TL`}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 border rounded-none shadow-sm sticky top-8">
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
