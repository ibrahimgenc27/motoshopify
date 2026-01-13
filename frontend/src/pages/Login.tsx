import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";

export default function Login() {
    const [, setLocation] = useLocation();
    const { login, isAuthenticated } = useAuth();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        setLocation("/");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login({ email, password });
            toast({
                title: "Hoş geldiniz!",
                description: "Başarıyla giriş yaptınız.",
            });
            setLocation("/");
        } catch (error: any) {
            toast({
                title: "Giriş başarısız",
                description: error.message || "Lütfen bilgilerinizi kontrol edin.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestContinue = () => {
        toast({
            title: "Misafir olarak devam ediyorsunuz",
            description: "Alışverişe devam edebilirsiniz.",
        });
        setLocation("/");
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    {/* Login Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Giriş Yap
                            </h1>
                            <p className="text-gray-500">
                                Hesabınıza giriş yaparak alışverişe devam edin
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    E-posta Adresi
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Şifre
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-base transition-all duration-200"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Giriş yapılıyor...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Giriş Yap
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">veya</span>
                            </div>
                        </div>

                        {/* Guest Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGuestContinue}
                            className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold text-base transition-all duration-200"
                        >
                            <User className="h-5 w-5 mr-2" />
                            Misafir Olarak Devam Et
                        </Button>

                        {/* Register Link */}
                        <div className="text-center text-sm text-gray-500">
                            Hesabınız yok mu?{" "}
                            <Link href="/register" className="font-semibold text-black hover:underline">
                                Kayıt Ol
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
