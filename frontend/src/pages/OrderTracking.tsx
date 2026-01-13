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
import { Package, Clock, Truck, CheckCircle, MapPin, Calendar, Search } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    code: z.string().min(1, "Sipariş kodu gereklidir"),
});

const steps = [
    { id: "pending", label: "Sipariş Alındı", icon: Clock, color: "text-yellow-600 bg-yellow-100 border-yellow-200" },
    { id: "processing", label: "Hazırlanıyor", icon: Package, color: "text-blue-600 bg-blue-100 border-blue-200" },
    { id: "shipped", label: "Kargoya Verildi", icon: Truck, color: "text-purple-600 bg-purple-100 border-purple-200" },
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

    // Helper to determine progress width (borrowed from MyOrders)
    const getProgressWidth = (status: string) => {
        const statusOrder = ["pending", "processing", "shipped", "delivered"];
        const index = statusOrder.indexOf(status);
        if (index === 0) return 15;
        if (index === 1) return 40;
        if (index === 2) return 65;
        if (index >= 3) return 100;
        return 0;
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
                                </div>

                                <CardContent className="p-0">
                                    {/* Stepper */}
                                    <div className="p-8 border-b bg-white">
                                        <div className="relative mx-4">
                                            <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />
                                            <div
                                                className="absolute top-5 left-0 h-1 bg-green-600 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${getProgressWidth(orderResult.order.status)}%` }}
                                            />
                                            <div className="flex justify-between w-full relative z-10">
                                                {steps.map((step, idx) => {
                                                    const Icon = step.icon;
                                                    const currentStatusIndex = ["pending", "processing", "shipped", "delivered"].indexOf(orderResult.order.status);
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
                                        </div>
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
