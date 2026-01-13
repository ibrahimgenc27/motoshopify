import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    ShoppingCart,
    ArrowRight,
    MapPin,
    Calendar
} from "lucide-react";
import { useEffect, useState } from "react";

interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    selectedColor?: string;
    name: string;
    image: string;
    description: string;
}

interface Order {
    order: {
        id: number;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        status: string;
        createdAt: string;
        address: string;
    };
    items: OrderItem[];
}

const steps = [
    { id: "pending", label: "Sipariş Alındı", icon: Clock, color: "text-yellow-600 bg-yellow-100 border-yellow-200" },
    { id: "processing", label: "Hazırlanıyor", icon: Package, color: "text-blue-600 bg-blue-100 border-blue-200" },
    { id: "shipped", label: "Kargoya Verildi", icon: Truck, color: "text-purple-600 bg-purple-100 border-purple-200" },
    { id: "delivered", label: "Teslim Edildi", icon: CheckCircle, color: "text-green-600 bg-green-100 border-green-200" },
];

function OrderCard({ orderData, displayNumber }: { orderData: any, displayNumber: number }) {
    const order = orderData.order || orderData;
    const items = (orderData.items || []) as OrderItem[];
    const [progressWidth, setProgressWidth] = useState(0);

    useEffect(() => {
        // Calculate progress percentage
        if (order.status === 'cancelled') {
            setProgressWidth(0);
            return;
        }

        const statusOrder = ["pending", "processing", "shipped", "delivered"];
        const currentIndex = statusOrder.indexOf(order.status);

        // Calculate width: 0% to 100%
        // 4 steps: 0 -> 12.5%, 1 -> 37.5%, 2 -> 62.5%, 3 -> 87.5% (to center on dots)
        // Actually full width is better
        let pct = 0;
        if (currentIndex === 0) pct = 15;
        else if (currentIndex === 1) pct = 40;
        else if (currentIndex === 2) pct = 65;
        else if (currentIndex >= 3) pct = 100;

        // Add a small delay for animation effect
        const timer = setTimeout(() => {
            setProgressWidth(pct);
        }, 100);

        return () => clearTimeout(timer);
    }, [order.status]);

    if (!order || !order.id) return null;

    const currentStatusIndex = ["pending", "processing", "shipped", "delivered"].indexOf(order.status);

    return (
        <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Header Section */}
            <div className="border-b bg-gray-50/50 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">
                                {displayNumber}. Sipariş
                            </h2>
                            {order.status === 'cancelled' && (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                    İptal Edildi
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            <span className="hidden sm:inline text-gray-300">|</span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {order.address}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Toplam Tutar</div>
                        <div className="text-2xl font-black text-gray-900 tracking-tight">
                            {order.totalAmount.toLocaleString("tr-TR")} ₺
                        </div>
                    </div>
                </div>
            </div>

            <CardContent className="p-0">
                {/* Animated Progress Timeline */}
                {order.status !== 'cancelled' && (
                    <div className="p-8 border-b bg-white">
                        <div className="relative mx-4">
                            {/* Background Line */}
                            <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />

                            {/* Animated Progress Line */}
                            <div
                                className="absolute top-5 left-0 h-1 bg-green-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressWidth}%` }}
                            />

                            <div className="flex justify-between w-full relative z-10">
                                {steps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isCompleted = currentStatusIndex >= idx;
                                    const isCurrent = currentStatusIndex === idx;

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-3 relative group cursor-default">
                                            <div className={`
                        h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                        ${isCompleted
                                                    ? `${step.color} scale-110 shadow-sm`
                                                    : "bg-white border-gray-200 text-gray-400 grayscale"}
                      `}>
                                                <Icon className={`h-5 w-5 transition-transform duration-500 ${isCurrent ? 'scale-125' : ''}`} />
                                            </div>
                                            <span className={`
                        text-xs font-bold uppercase tracking-wide transition-colors duration-300
                        ${isCompleted ? "text-gray-900" : "text-gray-400"}
                      `}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="divide-y divide-gray-100">
                    {items && items.length > 0 ? (
                        items.map((item) => (
                            <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start hover:bg-gray-50/50 transition-colors">
                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm group">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4 w-full text-center sm:text-left">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                            <Link href={`/products/${item.productId}`} className="hover:underline hover:text-black">
                                                {item.name}
                                            </Link>
                                        </h3>
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-sm text-gray-600">
                                            {item.selectedColor && (
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                                                    {item.selectedColor}
                                                </span>
                                            )}
                                            <span className="font-medium text-gray-500">x {item.quantity} Adet</span>
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {item.price.toLocaleString("tr-TR")} ₺
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-gray-50/30 italic">
                            Sipariş detaylarına şu an ulaşılamıyor veya ürün listesi boş.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyOrders() {
    const [, setLocation] = useLocation();

    const { data: orders, isLoading } = useQuery<Order[]>({
        queryKey: ["/api/orders"],
        queryFn: async () => {
            const res = await fetch("/api/orders");
            if (res.status === 401) {
                setLocation("/login");
                return [];
            }
            if (!res.ok) throw new Error("Siparişler alınamadı");
            return res.json();
        },
    });

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Siparişlerim</h1>
                            <p className="text-gray-500 mt-2 text-lg">Geçmiş siparişlerinizi ve durumlarını anlık takip edin.</p>
                        </div>
                        <Link href="/products">
                            <Button variant="outline" className="hidden sm:flex border-black text-black hover:bg-black hover:text-white transition-colors">
                                Alışverişe Devam Et
                            </Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-12 w-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                <p className="text-gray-400 animate-pulse">Siparişleriniz yükleniyor...</p>
                            </div>
                        </div>
                    ) : !orders || orders.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <ShoppingCart className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Henüz siparişiniz yok</h3>
                                <p className="text-gray-500 max-w-sm mb-8 text-lg">
                                    Hesabınızda henüz hiç sipariş bulunmuyor. Motorsiklet tutkunları için hazırladığımız özel ürünlere göz atın.
                                </p>
                                <Link href="/products">
                                    <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-black hover:bg-black/80 hover:scale-105 transition-all">
                                        Ürünleri Keşfet <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-10">
                            {orders.map((orderData: any, index) => (
                                <OrderCard
                                    key={orderData.order?.id || orderData.id || index}
                                    orderData={orderData}
                                    displayNumber={orders.length - index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
