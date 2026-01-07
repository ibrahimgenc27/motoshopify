import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProducts, useProductsByCategory } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { useLocation, useSearch } from "wouter";

export default function ProductList() {
  const [location] = useLocation();
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const category = searchParams.get("category");

  const { data: allProducts, isLoading: loadingAll } = useProducts();
  const { data: catProducts, isLoading: loadingCat } = useProductsByCategory(category || "");

  const isLoading = category ? loadingCat : loadingAll;
  const products = category ? catProducts : allProducts;

  const getTitle = () => {
    switch(category) {
      case 'equipment': return 'EKİPMANLAR';
      case 'parts': return 'YEDEK PARÇA';
      case 'motorcycle': return 'MOTORLAR';
      default: return 'TÜM ÜRÜNLER';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      
      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{getTitle()}</h1>
          <div className="h-1 w-20 bg-black mx-auto" />
          <p className="text-muted-foreground max-w-lg mx-auto">
            En kaliteli ürünleri sizin için seçtik.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="space-y-4">
                <div className="aspect-square bg-secondary/50 animate-pulse" />
                <div className="h-4 bg-secondary/50 w-2/3 animate-pulse" />
                <div className="h-4 bg-secondary/50 w-1/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Bu kategoride ürün bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
