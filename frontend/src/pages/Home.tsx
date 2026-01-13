import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: products, isLoading } = useProducts();

  // Show only first 4 products as "Popular"
  const popularProducts = products?.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] w-full overflow-hidden bg-black">
          {/* Hero Image - Unsplash Motorcycle */}
          <img 
            src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Motorcycle" 
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="relative z-10 container h-full flex flex-col justify-end pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-6 animate-in">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tighter leading-[1.1]">
                YOLUN <br/>HAKİMİ OL
              </h1>
              <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                Şehirde özgürlük, virajlarda tutku. En yeni modeller ve ekipmanlarla maceraya hazır olun.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/products">
                  <Button size="lg" className="rounded-none bg-white text-black hover:bg-gray-100 px-8 h-12 text-base font-bold">
                    ŞİMDİ İNCELE
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Collection */}
        <section className="py-20 container px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Popüler Modeller</h2>
            <Link href="/products" className="group flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4">
              Tümünü Gör <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-4">
                  <div className="aspect-square bg-secondary/50 animate-pulse" />
                  <div className="h-4 bg-secondary/50 w-2/3 animate-pulse" />
                  <div className="h-4 bg-secondary/50 w-1/3 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {popularProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Text with Image Section */}
        <section className="bg-secondary/30">
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-square md:aspect-auto h-full min-h-[500px]">
              {/* Feature Image - Unsplash */}
              <img 
                src="https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=987&auto=format&fit=crop" 
                alt="Feature" 
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-12 md:p-24 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Neden Biz?</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Sadece motosiklet satmıyoruz, bir yaşam tarzı sunuyoruz. Uzman ekibimiz, geniş yedek parça ağımız ve satış sonrası desteğimizle her kilometrede yanınızdayız.
              </p>
              <ul className="space-y-3 pt-4">
                <li className="flex items-center gap-3 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" /> 2 Yıl Garanti
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Yetkili Servis Ağı
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Ücretsiz İlk Bakım
                </li>
              </ul>
              <div className="pt-6">
                <Link href="/about">
                  <Button variant="outline" size="lg" className="rounded-none border-black hover:bg-black hover:text-white px-8 h-12">
                    HİKAYEMİZİ OKU
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter / CTA */}
        <section className="py-24 container px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Maceraya Hazır Mısın?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            En yeni modellerimizi keşfedin ve size en uygun yol arkadaşını bugün bulun.
          </p>
          <Link href="/products">
            <Button size="lg" className="rounded-none px-12 h-14 text-lg bg-black text-white hover:bg-black/90">
              KOLEKSİYONU KEŞFET
            </Button>
          </Link>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
