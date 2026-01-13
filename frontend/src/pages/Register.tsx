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
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle } from "lucide-react";

export default function Register() {
    const [, setLocation] = useLocation();
    const { register, isAuthenticated } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        passwordConfirm: "",
        privacyAccepted: false,
        commercialConsent: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Redirect if already authenticated
    if (isAuthenticated) {
        setLocation("/");
        return null;
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (formData.name.length < 2) {
            newErrors.name = "İsim en az 2 karakter olmalıdır";
        }

        if (!formData.email.includes("@")) {
            newErrors.email = "Geçerli bir e-posta adresi giriniz";
        }

        if (formData.password.length < 6) {
            newErrors.password = "Şifre en az 6 karakter olmalıdır";
        }

        if (formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = "Şifreler eşleşmiyor";
        }

        if (!formData.privacyAccepted) {
            newErrors.privacyAccepted = "Aydınlatma metnini kabul etmelisiniz";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                privacyAccepted: formData.privacyAccepted,
                commercialConsent: formData.commercialConsent,
            });
            toast({
                title: "Kayıt başarılı!",
                description: "Hoş geldiniz! Hesabınız oluşturuldu.",
            });
            setLocation("/");
        } catch (error: any) {
            toast({
                title: "Kayıt başarısız",
                description: error.message || "Lütfen bilgilerinizi kontrol edin.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    {/* Register Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Kayıt Ol
                            </h1>
                            <p className="text-gray-500">
                                Ücretsiz hesap oluşturun ve avantajlardan yararlanın
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Ad Soyad
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Adınız Soyadınız"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black ${errors.name ? "border-red-500" : ""
                                            }`}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email Field */}
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
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`pl-10 h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black ${errors.email ? "border-red-500" : ""
                                            }`}
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Şifre
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="En az 6 karakter"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black ${errors.password ? "border-red-500" : ""
                                            }`}
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
                                {errors.password && (
                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Password Confirm Field */}
                            <div className="space-y-2">
                                <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                                    Şifre Tekrar
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="passwordConfirm"
                                        type={showPasswordConfirm ? "text" : "password"}
                                        placeholder="Şifrenizi tekrar girin"
                                        value={formData.passwordConfirm}
                                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                                        className={`pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black ${errors.passwordConfirm ? "border-red-500" : ""
                                            }`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.passwordConfirm && (
                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.passwordConfirm}
                                    </p>
                                )}
                            </div>

                            {/* Privacy Checkbox */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="privacy"
                                        checked={formData.privacyAccepted}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, privacyAccepted: checked === true })
                                        }
                                        className="mt-1"
                                    />
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="privacy"
                                            className={`text-sm leading-relaxed cursor-pointer ${errors.privacyAccepted ? "text-red-500" : "text-gray-600"
                                                }`}
                                        >
                                            <span className="font-medium">Aydınlatma Metni</span>'ni okudum ve kabul ediyorum.
                                            Kişisel verilerimin işlenmesine onay veriyorum. *
                                        </Label>
                                        {errors.privacyAccepted && (
                                            <p className="text-red-500 text-xs flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> {errors.privacyAccepted}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Commercial Consent Checkbox */}
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="commercial"
                                        checked={formData.commercialConsent}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, commercialConsent: checked === true })
                                        }
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor="commercial"
                                        className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                                    >
                                        Kampanya ve fırsatlardan haberdar olmak için <span className="font-medium">ticari elektronik ileti</span> almayı kabul ediyorum.
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-base transition-all duration-200 mt-4"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Kayıt yapılıyor...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Kayıt Ol
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                )}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center text-sm text-gray-500 pt-2">
                            Zaten hesabınız var mı?{" "}
                            <Link href="/login" className="font-semibold text-black hover:underline">
                                Giriş Yap
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
