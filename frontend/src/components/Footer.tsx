import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background pt-16 pb-8">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase">Hakkımızda</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Motosiklet tutkunları için en iyi ekipman, yedek parça ve motor modellerini sunuyoruz. Yolculuğunuzda yanınızdayız.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase">Hızlı Linkler</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">Motorlar</Link></li>
              <li><Link href="/products?category=equipment" className="hover:text-foreground transition-colors">Ekipman</Link></li>
              <li><Link href="/products?category=parts" className="hover:text-foreground transition-colors">Yedek Parça</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">İletişim</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase">Müşteri Hizmetleri</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Kargo ve Teslimat</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">İade ve Değişim</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Kullanım Koşulları</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase">Bülten</h3>
            <p className="text-sm text-muted-foreground">
              Kampanyalardan haberdar olmak için kaydolun.
            </p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="E-posta adresiniz" 
                className="flex-1 bg-transparent border-b border-input py-2 text-sm focus:outline-none focus:border-black"
              />
              <button type="submit" className="text-sm font-bold uppercase tracking-wide border-b border-transparent hover:border-black transition-colors">
                Abone Ol
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t gap-4">
          <div className="flex items-center gap-6 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Youtube className="h-5 w-5" /></a>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MotoShop. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
