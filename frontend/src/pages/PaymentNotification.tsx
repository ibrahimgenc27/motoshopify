import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link, useSearch } from "wouter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Send, ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
    orderId: z.string().min(1, "Sipariş seçiniz"),
    senderName: z.string().min(2, "Gönderen adı en az 2 karakter olmalıdır"),
    bankName: z.string().min(2, "Banka adı gereklidir"),
    amount: z.string().min(1, "Tutar gereklidir"),
    transferDate: z.string().min(1, "Havale tarihi gereklidir"),
});

const BANKS = [
    "Ziraat Bankası",
    "İş Bankası",
    "Garanti BBVA",
    "Yapı Kredi",
    "Akbank",
    "Halkbank",
    "Vakıfbank",
    "QNB Finansbank",
    "Denizbank",
    "TEB",
    "ING",
    "Diğer",
];

export default function PaymentNotification() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [success, setSuccess] = useState(false);

    // URL parametrelerini al
    const searchString = useSearch();
    const urlParams = new URLSearchParams(searchString);
    const urlOrderId = urlParams.get("orderId");
    const urlOrderCode = urlParams.get("orderCode");
    const urlAmount = urlParams.get("amount");

    // Misafir modunda mı kontrol et (URL parametreleri varsa misafir)
    const isGuestMode = !!urlOrderId;

    // Kullanıcının ödenmemiş siparişlerini al (sadece login durumunda)
    const { data: orders, isLoading: ordersLoading } = useQuery({
        queryKey: ["/api/orders"],
        queryFn: async () => {
            const res = await fetch("/api/orders");
            if (res.status === 401) {
                // Login gerekli ama URL'de sipariş varsa misafir modunda devam et
                if (isGuestMode) return [];
                setLocation("/login");
                return [];
            }
            if (!res.ok) throw new Error("Siparişler alınamadı");
            return res.json();
        },
        enabled: !isGuestMode, // Misafir modunda bu query'yi çalıştırma
    });

    // Sadece ödenmemiş siparişleri filtrele
    const unpaidOrders = orders?.filter(
        (o: any) => o.order?.paymentStatus === "unpaid" || o.order?.paymentStatus === undefined
    ) || [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            orderId: urlOrderId || "",
            senderName: "",
            bankName: "",
            amount: urlAmount || "",
            transferDate: new Date().toISOString().split("T")[0],
        },
    });

    // URL parametreleri değiştiğinde form'u güncelle
    useEffect(() => {
        if (urlOrderId) {
            form.setValue("orderId", urlOrderId);
        }
        if (urlAmount) {
            // Formatı düzgün yap
            form.setValue("amount", Number(urlAmount).toLocaleString("tr-TR"));
        }
    }, [urlOrderId, urlAmount, form]);


    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const res = await apiRequest("POST", "/api/payment-notification", {
                orderId: Number(values.orderId),
                senderName: values.senderName,
                bankName: values.bankName,
                amount: Number(values.amount.replace(/[^0-9]/g, "")),
                transferDate: values.transferDate,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Bildirim gönderilemedi");
            }
            return res.json();
        },
        onSuccess: () => {
            setSuccess(true);
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            toast({
                title: "Bildirim Gönderildi!",
                description: "Ödeme bildiriminiz başarıyla alındı. En kısa sürede kontrol edilecektir.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Hata",
                description: error.message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        mutation.mutate(values);
    };

    // Seçilen siparişin tutarını otomatik doldur
    const selectedOrderId = form.watch("orderId");
    const selectedOrder = unpaidOrders.find(
        (o: any) => o.order?.id?.toString() === selectedOrderId
    );

    // Sipariş değiştiğinde tutarı otomatik doldur
    useEffect(() => {
        if (selectedOrder && selectedOrder.order?.totalAmount) {
            // Formatı düzgün yap (1.204.200 gibi)
            form.setValue("amount", selectedOrder.order.totalAmount.toLocaleString("tr-TR"));
        }
    }, [selectedOrderId, selectedOrder, form]);

    if (success) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <AnnouncementBar />
                <Header />
                <main className="flex-1 flex items-center justify-center py-12 px-4">
                    <Card className="max-w-md">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Bildirim Alındı!</h2>
                                <p className="text-gray-600">
                                    Ödeme bildiriminiz başarıyla gönderildi. Ödemeniz onaylandığında siparişiniz hazırlanmaya başlayacaktır.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                {isGuestMode ? (
                                    <Link href="/track-order">
                                        <Button className="w-full">Sipariş Takip</Button>
                                    </Link>
                                ) : (
                                    <Link href="/orders">
                                        <Button className="w-full">Siparişlerime Git</Button>
                                    </Link>
                                )}
                                <Link href="/products">
                                    <Button variant="outline" className="w-full">Alışverişe Devam Et</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto space-y-8">
                    {/* Başlık */}
                    <div className="flex items-center gap-4">
                        <Link href={isGuestMode ? "/track-order" : "/orders"}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Ödeme Bildirimi</h1>
                            <p className="text-gray-500">Havale/EFT yaptığınızı bize bildirin</p>
                        </div>
                    </div>

                    {/* Bilgi Kartı */}
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardContent className="p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800">
                                Havale/EFT yaptıktan sonra bu formu doldurarak ödemenizi bize bildirin.
                                Ödemeniz kontrol edildikten sonra siparişiniz hazırlanmaya başlayacaktır.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Misafir modunda sipariş bilgisi */}
                    {isGuestMode && urlOrderCode && (
                        <Card className="border-green-200 bg-green-50/50">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-green-700">Sipariş Kodu</p>
                                        <p className="font-bold text-green-800">{urlOrderCode}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-green-700">Tutar</p>
                                        <p className="font-bold text-green-800">{Number(urlAmount).toLocaleString("tr-TR")} ₺</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Ödeme Bilgileri
                            </CardTitle>
                            <CardDescription>
                                Lütfen havale/EFT bilgilerinizi girin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!isGuestMode && ordersLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="h-8 w-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                </div>
                            ) : !isGuestMode && unpaidOrders.length === 0 ? (
                                <div className="text-center py-8 space-y-4">
                                    <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                                    <p className="text-gray-600">Ödeme bekleyen siparişiniz bulunmuyor.</p>
                                    <Link href="/products">
                                        <Button>Alışverişe Başla</Button>
                                    </Link>
                                </div>
                            ) : (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {/* Sipariş Seçimi - sadece login modunda göster */}
                                        {!isGuestMode && (
                                            <FormField
                                                control={form.control}
                                                name="orderId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Sipariş</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Sipariş seçin..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="bg-white">
                                                                {unpaidOrders.map((o: any) => (
                                                                    <SelectItem key={o.order.id} value={o.order.id.toString()}>
                                                                        {o.order.orderCode} - {o.order.totalAmount.toLocaleString("tr-TR")} ₺
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Gönderen Ad Soyad */}
                                        <FormField
                                            control={form.control}
                                            name="senderName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Gönderen Ad Soyad</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Banka hesabı sahibinin adı" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Banka */}
                                        <FormField
                                            control={form.control}
                                            name="bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Gönderdiğiniz Banka</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Banka seçin..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-white">
                                                            {BANKS.map((bank) => (
                                                                <SelectItem key={bank} value={bank}>
                                                                    {bank}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Tutar */}
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Gönderilen Tutar (₺)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            placeholder={selectedOrder ? selectedOrder.order.totalAmount.toLocaleString("tr-TR") : "0"}
                                                            value={field.value}
                                                            onChange={(e) => {
                                                                // Sadece rakamları al ve formatla
                                                                const rawValue = e.target.value.replace(/[^0-9]/g, "");
                                                                if (rawValue) {
                                                                    field.onChange(Number(rawValue).toLocaleString("tr-TR"));
                                                                } else {
                                                                    field.onChange("");
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    {selectedOrder && (
                                                        <p className="text-xs text-gray-500">
                                                            Sipariş tutarı: {selectedOrder.order.totalAmount.toLocaleString("tr-TR")} ₺
                                                        </p>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Havale Tarihi */}
                                        <FormField
                                            control={form.control}
                                            name="transferDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Havale Tarihi</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-lg font-bold"
                                            disabled={mutation.isPending}
                                        >
                                            {mutation.isPending ? (
                                                "Gönderiliyor..."
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-5 w-5" />
                                                    Bildirim Gönder
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
