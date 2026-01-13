import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderCode = searchParams.get("code");

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-6">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h1 className="text-4xl font-bold tracking-tighter uppercase">SİPARİŞİNİZ ALINDI!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Maceraya bir adım daha yaklaştınız. Sipariş onayınız e-posta adresinize gönderildi.
        </p>

        {orderCode && (
          <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Sipariş Numaranız</p>
            <div className="text-3xl font-black tracking-widest text-black">{orderCode}</div>
            <p className="text-xs text-gray-500 mt-2">Bu numara ile <Link href="/track-order" className="underline text-black font-bold">buradan</Link> siparişinizi takip edebilirsiniz.</p>
          </div>
        )}

        <div className="pt-4">
          <Link href="/products">
            <Button size="lg" className="rounded-none px-12 h-14 text-lg bg-black text-white">
              ALIŞVERİŞE DEVAM ET
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
