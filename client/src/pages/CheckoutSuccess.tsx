import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutSuccess() {
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
