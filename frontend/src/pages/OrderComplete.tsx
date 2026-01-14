import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ArrowRight, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// IBAN ve banka bilgileri - production'da .env'den alınabilir
const BANK_INFO = {
    iban: "TR00 0000 0000 0000 0000 0000 00",
    bankName: "Ziraat Bankası",
    accountHolder: "MotoShop A.Ş.",
};

export default function OrderComplete() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [orderData, setOrderData] = useState<{
        orderCode: string;
        totalAmount: number;
        customerEmail: string;
    } | null>(null);

    useEffect(() => {
        // localStorage'dan sipariş bilgilerini al
        const storedOrder = localStorage.getItem("lastOrder");
        if (storedOrder) {
            setOrderData(JSON.parse(storedOrder));
        }
    }, []);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text.replace(/\s/g, ""));
        toast({
            title: "Kopyalandı!",
            description: `${label} panoya kopyalandı.`,
        });
    };

    if (!orderData) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <AnnouncementBar />
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Card className="max-w-md">
                        <CardContent className="p-8 text-center">
                            <p className="text-gray-600 mb-4">Sipariş bilgisi bulunamadı.</p>
                            <Link href="/products">
                                <Button>Alışverişe Devam Et</Button>
                            </Link>
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
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Başarı Mesajı */}
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900">Siparişiniz Alındı!</h1>
                        <p className="text-gray-600">
                            Sipariş kodunuz: <span className="font-bold text-black">{orderData.orderCode}</span>
                        </p>
                    </div>

                    {/* IBAN Kartı */}
                    <Card className="border-2 border-blue-200 bg-blue-50/50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Havale / EFT Bilgileri</CardTitle>
                                    <p className="text-sm text-gray-600">Lütfen aşağıdaki hesaba ödemenizi yapın</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* IBAN */}
                            <div className="p-4 bg-white rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">IBAN</p>
                                        <p className="text-xl font-mono font-bold text-gray-900 tracking-wide">
                                            {BANK_INFO.iban}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(BANK_INFO.iban, "IBAN")}
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Kopyala
                                    </Button>
                                </div>
                            </div>

                            {/* Banka ve Hesap Sahibi */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Banka</p>
                                    <p className="font-bold text-gray-900">{BANK_INFO.bankName}</p>
                                </div>
                                <div className="p-4 bg-white rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Hesap Sahibi</p>
                                    <p className="font-bold text-gray-900">{BANK_INFO.accountHolder}</p>
                                </div>
                            </div>

                            {/* Ödenecek Tutar */}
                            <div className="p-4 bg-green-100 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-700 mb-1">Ödenecek Tutar</p>
                                        <p className="text-3xl font-black text-green-800">
                                            {orderData.totalAmount.toLocaleString("tr-TR")} ₺
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-green-400 text-green-700 hover:bg-green-50"
                                        onClick={() => copyToClipboard(orderData.totalAmount.toString(), "Tutar")}
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Kopyala
                                    </Button>
                                </div>
                            </div>

                            {/* Açıklama */}
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                    <strong>Önemli:</strong> Havale açıklama kısmına sipariş kodunuzu{" "}
                                    <span className="font-bold">({orderData.orderCode})</span> yazmanız işlemleri hızlandıracaktır.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sonraki Adımlar */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Sonraki Adımlar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium">Havale/EFT yapın</p>
                                    <p className="text-sm text-gray-500">
                                        Yukarıdaki IBAN'a sipariş tutarını gönderin
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium">Ödeme bildirimi yapın</p>
                                    <p className="text-sm text-gray-500">
                                        "Siparişlerim" sayfasından ödeme yaptığınızı bize bildirin
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    3
                                </div>
                                <div>
                                    <p className="font-medium">Onay bekleyin</p>
                                    <p className="text-sm text-gray-500">
                                        Ödemeniz onaylandığında siparişiniz hazırlanmaya başlayacak
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Butonlar */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/orders" className="flex-1">
                            <Button className="w-full h-12 text-lg font-bold bg-black hover:bg-gray-800">
                                <CreditCard className="mr-2 h-5 w-5" />
                                Ödeme Bildirimi Yap
                            </Button>
                        </Link>
                        <Link href="/products" className="flex-1">
                            <Button variant="outline" className="w-full h-12 text-lg">
                                Alışverişe Devam Et
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
