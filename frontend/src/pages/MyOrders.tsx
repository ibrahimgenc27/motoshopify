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
    Calendar,
    Package2,
    RotateCcw,
    Info,
    User
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
        statusDetail?: string;
        paymentStatus?: string;
        paymentMethod?: string;
        createdAt: string;
        address: string;
    };
    items: OrderItem[];
}

// Progress bar steps - only normal flow statuses (no pending, cancelled, returned)
const progressSteps = [
    { id: "processing", label: "Hazırlanıyor", icon: Package, color: "text-blue-600 bg-blue-100 border-blue-200" },
    { id: "shipped", label: "Kargoda", icon: Truck, color: "text-purple-600 bg-purple-100 border-purple-200" },
    { id: "outForDelivery", label: "Dağıtıma Çıktı", icon: Package2, color: "text-indigo-600 bg-indigo-100 border-indigo-200" },
    { id: "delivered", label: "Teslim Edildi", icon: CheckCircle, color: "text-green-600 bg-green-100 border-green-200" },
];

function OrderCard({ orderData, displayNumber }: { orderData: any, displayNumber: number }) {
    const order = orderData.order || orderData;
    const items = (orderData.items || []) as OrderItem[];
    const [progressWidth, setProgressWidth] = useState(0);

    useEffect(() => {
        // Only calculate progress for normal flow statuses
        const normalFlowStatuses = ["processing", "shipped", "outForDelivery", "delivered"];
        if (!normalFlowStatuses.includes(order.status)) {
            setProgressWidth(0);
            return;
        }

        const currentIndex = normalFlowStatuses.indexOf(order.status);
        let pct = 0;
        if (currentIndex === 0) pct = 15;
        else if (currentIndex === 1) pct = 40;
        else if (currentIndex === 2) pct = 65;
        else if (currentIndex >= 3) pct = 100;

        const timer = setTimeout(() => {
            setProgressWidth(pct);
        }, 100);

        return () => clearTimeout(timer);
    }, [order.status]);

    if (!order || !order.id) return null;

    const currentStatusIndex = ["processing", "shipped", "outForDelivery", "delivered"].indexOf(order.status);
    // İlerleme çubuğunu sadece ödeme tamamlanmış siparisler için göster
    const isPaymentCompleted = order.paymentStatus === 'paid';
    const shouldShowProgress = isPaymentCompleted && ["processing", "shipped", "outForDelivery", "delivered"].includes(order.status);

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
                                    ❌ İptal Edildi
                                </span>
                            )}
                            {order.status === 'returned' && (
                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                                    🔄 İade Edildi
                                </span>
                            )}
                            {/* Ödeme durumu badge */}
                            {(order.paymentStatus === 'unpaid' || order.paymentStatus === undefined) && order.status !== 'cancelled' && (
                                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                                    💳 Ödeme Bekleniyor
                                </span>
                            )}
                            {order.paymentStatus === 'rejected' && order.status !== 'cancelled' && (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                                    ⛔ Ödeme Reddedildi
                                </span>
                            )}
                            {order.paymentStatus === 'pending_approval' && order.status !== 'cancelled' && (
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                    ⏳ Onay Bekleniyor
                                </span>
                            )}
                            {order.paymentStatus === 'paid' && (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                    ✅ Ödendi
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
                        {/* Ödeme bildirimi butonu - Rejected durumunda da göster */}
                        {(order.paymentStatus === 'unpaid' || order.paymentStatus === undefined || order.paymentStatus === 'rejected') && order.status !== 'cancelled' && (
                            <Link href="/payment-notification">
                                <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8">
                                    💳 Ödeme Bildir
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <CardContent className="p-0">
                {/* Progress Bar - Only for Normal Flow */}
                {shouldShowProgress && (
                    <div className="p-8 border-b bg-white">
                        <div className="relative mx-4">
                            <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />
                            <div
                                className="absolute top-5 left-0 h-1 bg-green-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressWidth}%` }}
                            />
                            <div className="flex justify-between w-full relative z-10">
                                {progressSteps.map((step, idx) => {
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
                            {/* Status Detail / Cancellation or Return Reason */}
                            {(() => {
                                // @ts-ignore - notes property is added in backend response but not in shared type yet
                                const cancellationNote = order.notes?.find((n: any) => n.noteType === 'cancellation');
                                // @ts-ignore
                                const returnNote = order.notes?.find((n: any) => n.noteType === 'return');
                                const displayNote = cancellationNote?.note || returnNote?.note || order.statusDetail;

                                if (displayNote) {
                                    return (
                                        <div className={`mt-6 p-4 border rounded-lg ${order.status === 'cancelled' || cancellationNote ? 'bg-red-50 border-red-200' :
                                            order.status === 'returned' || returnNote ? 'bg-orange-50 border-orange-200' :
                                                'bg-blue-50 border-blue-200'
                                            }`}>
                                            <p className={`text-sm font-medium ${order.status === 'cancelled' || cancellationNote ? 'text-red-900' :
                                                order.status === 'returned' || returnNote ? 'text-orange-900' :
                                                    'text-blue-900'
                                                }`}>
                                                {cancellationNote ? '❌ İptal Nedeni: ' : returnNote ? '🔄 İade Nedeni: ' : '📦 '}
                                                {displayNote}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Order Activity Timeline */}
                            {(() => {
                                // @ts-ignore
                                const notes = (order.notes || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                if (notes.length > 0) {
                                    return (
                                        <div className="mt-8 pt-6 border-t border-gray-100">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Clock className="h-3.5 w-3.5 text-gray-600" />
                                                </div>
                                                Sipariş Hareketleri
                                            </h4>
                                            <div className="space-y-6 relative pl-3">
                                                {/* Vertical line */}
                                                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

                                                {notes.map((note: any, index: number) => {
                                                    const isFirst = index === 0;
                                                    const noteType = note.noteType;
                                                    const statusForGeneric = note.orderStatus || 'pending';

                                                    let Icon = Info;
                                                    let colorClass = 'bg-gray-100 text-gray-600 border-gray-200';

                                                    if (noteType === 'cancellation') {
                                                        Icon = XCircle;
                                                        colorClass = 'bg-red-100 text-red-600 border-red-200';
                                                    } else if (noteType === 'return') {
                                                        Icon = RotateCcw;
                                                        colorClass = 'bg-orange-100 text-orange-600 border-orange-200';
                                                    } else {
                                                        switch (statusForGeneric) {
                                                            case 'pending': Icon = Clock; colorClass = 'bg-yellow-100 text-yellow-600 border-yellow-200'; break;
                                                            case 'processing': Icon = Package; colorClass = 'bg-blue-100 text-blue-600 border-blue-200'; break;
                                                            case 'shipped': Icon = Truck; colorClass = 'bg-purple-100 text-purple-600 border-purple-200'; break;
                                                            case 'outForDelivery': Icon = Package2; colorClass = 'bg-indigo-100 text-indigo-600 border-indigo-200'; break;
                                                            case 'delivered': Icon = CheckCircle; colorClass = 'bg-green-100 text-green-600 border-green-200'; break;
                                                            default: Icon = Info; colorClass = 'bg-gray-100 text-gray-600 border-gray-200'; break;
                                                        }
                                                    }

                                                    return (
                                                        <div key={note.id} className="relative pl-8">
                                                            {/* Icon Dot */}
                                                            <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300
                                                                ${colorClass} 
                                                                ${isFirst ? 'scale-110 ring-2 ring-offset-1 ring-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'scale-100 opacity-90 grayscale-[0.5]'}
                                                            `}>
                                                                <Icon className="h-3 w-3" />
                                                            </div>

                                                            <div className={`flex flex-col gap-1 transition-all duration-300 ${isFirst ? '' : 'opacity-75'}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs font-medium ${isFirst ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                        {new Date(note.createdAt).toLocaleString('tr-TR', {
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                    {noteType === 'cancellation' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">İPTAL</span>}
                                                                    {noteType === 'return' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">İADE</span>}
                                                                </div>
                                                                <p className={`text-sm leading-relaxed ${isFirst ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                                    {note.note}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                )}

                {/* Special Status Messages */}
                {order.status === 'pending' && (
                    <div className="p-8 border-b bg-yellow-50">
                        <div className="text-center space-y-2">
                            <Clock className="h-12 w-12 text-yellow-600 mx-auto" />
                            <h3 className="font-bold text-gray-900">⏳ Siparişiniz Beklemede</h3>
                            <p className="text-sm text-gray-600">Siparişiniz alındı ve işleme hazırlanıyor.</p>
                        </div>
                    </div>
                )}
                {order.paymentStatus === 'rejected' && order.status !== 'cancelled' && (
                    <div className="p-8 border-b bg-red-50">
                        <div className="text-center space-y-2">
                            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                            <h3 className="font-bold text-gray-900">⛔ Ödeme Reddedildi</h3>
                            <p className="text-sm text-gray-600">Ödemeniz onaylanmadı. Lütfen tekrar bildirim yapın veya iletişime geçin.</p>
                            {((order as any).latestPaymentNote) && (
                                <div className="mt-4 p-4 bg-white border border-red-100 rounded-lg max-w-lg mx-auto">
                                    <p className="font-medium text-red-900 mb-1">Red Nedeni:</p>
                                    <p className="text-sm text-red-800">
                                        {(order as any).latestPaymentNote}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {order.status === 'cancelled' && (
                    <div className="p-8 border-b bg-red-50">
                        <div className="text-center space-y-2">
                            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                            <h3 className="font-bold text-gray-900">❌ Sipariş İptal Edildi</h3>
                            <p className="text-sm text-gray-600">Bu sipariş iptal edilmiştir.</p>

                            {/* Admin Notu / Red Nedeni */}
                            {((order as any).latestPaymentNote || order.statusDetail) && (
                                <div className="mt-4 p-4 bg-white border border-red-100 rounded-lg max-w-lg mx-auto">
                                    <p className="font-medium text-red-900 mb-1">İptal Nedeni / Açıklama:</p>
                                    <p className="text-sm text-red-800">
                                        {((order as any).latestPaymentNote || order.statusDetail || "").replace('İptal Nedeni: ', '')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {order.status === 'returned' && (
                    <div className="p-8 border-b bg-orange-50">
                        <div className="text-center space-y-2">
                            <RotateCcw className="h-12 w-12 text-orange-600 mx-auto" />
                            <h3 className="font-bold text-gray-900">🔄 Sipariş İade Edildi</h3>
                            <p className="text-sm text-gray-600">Bu sipariş iade işlemi tamamlanmıştır.</p>
                            {order.statusDetail && (
                                <div className="mt-4 p-4 bg-white border border-orange-100 rounded-lg max-w-lg mx-auto">
                                    <p className="font-medium text-orange-900 mb-1">Bilgi / İade Nedeni:</p>
                                    <p className="text-sm text-orange-800">
                                        {order.statusDetail.replace('İade Nedeni: ', '')}
                                    </p>
                                </div>
                            )}
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
