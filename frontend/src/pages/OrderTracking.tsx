import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Clock, Truck, CheckCircle, MapPin, Calendar, Search, XCircle, RotateCcw, Package2, AlertCircle, CreditCard } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    code: z.string().min(1, "Sipariş kodu gereklidir"),
});

// Progress bar steps - only normal flow statuses
const progressSteps = [
    { id: "processing", label: "Hazırlanıyor", icon: Package, color: "text-blue-600 bg-blue-100 border-blue-200" },
    { id: "shipped", label: "Kargoda", icon: Truck, color: "text-purple-600 bg-purple-100 border-purple-200" },
    { id: "outForDelivery", label: "Dağıtıma Çıktı", icon: Package2, color: "text-indigo-600 bg-indigo-100 border-indigo-200" },
    { id: "delivered", label: "Teslim Edildi", icon: CheckCircle, color: "text-green-600 bg-green-100 border-green-200" },
];

export default function OrderTracking() {
    const [orderResult, setOrderResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            code: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setOrderResult(null);
        try {
            const res = await apiRequest("POST", "/api/track-order", values);
            const data = await res.json();
            setOrderResult(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Sorgulama Başarısız",
                description: "Sipariş bulunamadı veya bilgiler eşleşmiyor.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    // Helper to determine progress width
    const getProgressWidth = (status: string) => {
        const statusOrder = ["processing", "shipped", "outForDelivery", "delivered"];
        const index = statusOrder.indexOf(status);
        if (index === 0) return 15;
        if (index === 1) return 40;
        if (index === 2) return 65;
        if (index >= 3) return 100;
        return 0;
    };

    // Check if order should show progress bar
    const shouldShowProgressBar = (status: string) => {
        return ["processing", "shipped", "outForDelivery", "delivered"].includes(status);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto space-y-10">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Sipariş Takibi</h1>
                        <p className="text-gray-500 text-lg max-w-lg mx-auto">
                            Kayıt olmadan sipariş durumunuzu öğrenmek için sipariş kodunuzu ve e-posta adresinizi girin.
                        </p>
                    </div>

                    <Card className="border-gray-200 shadow-sm">
                        <CardContent className="p-8">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sipariş Kodu</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn: MS-XB921" {...field} className="h-12 text-lg uppercase" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>E-posta Adresi</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ornek@email.com" {...field} className="h-12 text-lg" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 text-lg font-bold bg-black hover:bg-gray-800" disabled={isLoading}>
                                        {isLoading ? "Sorgulanıyor..." : (
                                            <>
                                                <Search className="mr-2 h-5 w-5" /> Siparişi Sorgula
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {orderResult && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="overflow-hidden border-gray-200 shadow-lg">
                                <div className="border-b bg-gray-50/50 p-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500">Sipariş Kodu</div>
                                            <div className="text-xl font-black text-gray-900">{orderResult.order.orderCode}</div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-sm text-gray-500">Toplam Tutar</div>
                                            <div className="text-xl font-black text-gray-900">{orderResult.order.totalAmount.toLocaleString("tr-TR")} ₺</div>
                                        </div>
                                    </div>
                                    {/* Ödeme durumu badge */}
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {(orderResult.order.paymentStatus === 'unpaid' || !orderResult.order.paymentStatus) && orderResult.order.status !== 'cancelled' && (
                                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                                                💳 Ödeme Bekleniyor
                                            </span>
                                        )}
                                        {orderResult.order.paymentStatus === 'pending_approval' && (
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                                ⏳ Onay Bekleniyor
                                            </span>
                                        )}
                                        {orderResult.order.paymentStatus === 'paid' && (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                                ✅ Ödendi
                                            </span>
                                        )}
                                    </div>
                                    {/* Ödeme bildirimi butonu */}
                                    {(orderResult.order.paymentStatus === 'unpaid' || !orderResult.order.paymentStatus) && orderResult.order.status !== 'cancelled' && (
                                        <div className="mt-4">
                                            <Link href={`/payment-notification?orderId=${orderResult.order.id}&orderCode=${orderResult.order.orderCode}&amount=${orderResult.order.totalAmount}`}>
                                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                                    <CreditCard className="h-4 w-4 mr-2" />
                                                    Ödeme Bildirimi Yap
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-0">
                                    {/* Status Display */}
                                    <div className="p-8 border-b bg-white">
                                        {/* Pending Status */}
                                        {orderResult.order.status === "pending" && (
                                            <div className="text-center space-y-3">
                                                <div className="flex justify-center">
                                                    <div className="h-16 w-16 rounded-full bg-yellow-100 border-2 border-yellow-200 flex items-center justify-center">
                                                        <Clock className="h-8 w-8 text-yellow-600" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">Siparişiniz Beklemede</h3>
                                                <p className="text-gray-500">Siparişiniz alındı ve işleme hazırlanıyor.</p>
                                            </div>
                                        )}

                                        {/* Cancelled Status */}
                                        {orderResult.order.status === "cancelled" && (
                                            <div className="text-center space-y-3">
                                                <div className="flex justify-center">
                                                    <div className="h-16 w-16 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center">
                                                        <XCircle className="h-8 w-8 text-red-600" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">Sipariş İptal Edildi</h3>
                                                <p className="text-gray-500">Bu sipariş iptal edilmiştir.</p>
                                                {orderResult.order.statusDetail && (
                                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-700">
                                                            <AlertCircle className="inline h-4 w-4 mr-1" />
                                                            {orderResult.order.statusDetail}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Returned Status */}
                                        {orderResult.order.status === "returned" && (
                                            <div className="text-center space-y-3">
                                                <div className="flex justify-center">
                                                    <div className="h-16 w-16 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                                                        <RotateCcw className="h-8 w-8 text-orange-600" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">Sipariş İade Edildi</h3>
                                                <p className="text-gray-500">Bu sipariş iade işlemi tamamlanmıştır.</p>
                                                {orderResult.order.statusDetail && (
                                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-700">
                                                            <AlertCircle className="inline h-4 w-4 mr-1" />
                                                            {orderResult.order.statusDetail}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Progress Bar - Normal Flow Only */}
                                        {shouldShowProgressBar(orderResult.order.status) && (
                                            <div className="relative mx-4">
                                                <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />
                                                <div
                                                    className="absolute top-5 left-0 h-1 bg-green-600 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${getProgressWidth(orderResult.order.status)}%` }}
                                                />
                                                <div className="flex justify-between w-full relative z-10">
                                                    {progressSteps.map((step, idx) => {
                                                        const Icon = step.icon;
                                                        const currentStatusIndex = ["processing", "shipped", "outForDelivery", "delivered"].indexOf(orderResult.order.status);
                                                        const isCompleted = currentStatusIndex >= idx;
                                                        const isCurrent = currentStatusIndex === idx;

                                                        return (
                                                            <div key={step.id} className="flex flex-col items-center gap-3">
                                                                <div className={`
                                                                h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                                                ${isCompleted
                                                                        ? `${step.color} scale-110 shadow-sm`
                                                                        : "bg-white border-gray-200 text-gray-400 grayscale"}
                                                              `}>
                                                                    <Icon className={`h-5 w-5 ${isCurrent ? 'scale-125' : ''}`} />
                                                                </div>
                                                                <span className={`text-xs font-bold uppercase tracking-wide ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                                                                    {step.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* Status Detail */}
                                                {orderResult.order.statusDetail && (
                                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-sm text-blue-900 font-medium">
                                                            <Package className="inline h-4 w-4 mr-2" />
                                                            {orderResult.order.statusDetail}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Items List */}
                                    <div className="divide-y divide-gray-100">
                                        {orderResult.items && orderResult.items.map((item: any) => (
                                            <div key={item.id} className="p-6 flex gap-4 items-center">
                                                <div className="h-16 w-16 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                                                    {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                    <div className="text-sm text-gray-500">
                                                        {item.quantity} Adet {item.selectedColor && `• ${item.selectedColor}`}
                                                    </div>
                                                </div>
                                                <div className="font-bold text-gray-900">
                                                    {item.price.toLocaleString("tr-TR")} ₺
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
