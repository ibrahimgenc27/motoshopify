import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Trash2,
    Edit,
    Package,
    ShieldCheck,
    ImageIcon,
    DollarSign,
    Tag,
    FileText,
    Palette,
    Boxes,
    Save,
    Bike,
    HardHat,
    Wrench,
    TrendingUp,
    Search,
    X,
    Upload,
    Loader2,
    ShoppingCart,
    Eye,
    MapPin,
    Mail,
    Phone,
    User,
    Calendar,
    CheckCircle,
    Clock,
    Truck,
    XCircle
} from "lucide-react";
import { api } from "@shared/routes";

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    stock: number;
    colors: string;
    specs: string;
}

const initialFormData: ProductFormData = {
    name: "",
    description: "",
    price: 0,
    originalPrice: undefined,
    image: "",
    category: "motorcycle",
    stock: 10,
    colors: "",
    specs: "",
};

export default function Admin() {
    // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
    const [, setLocation] = useLocation();
    const { user, isLoading: authLoading, isAdmin } = useAuth();
    const { data: products, isLoading: productsLoading } = useProducts();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Order management state
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

    // Fetch orders
    const { data: orders, isLoading: ordersLoading } = useQuery({
        queryKey: ["/api/admin/orders"],
        queryFn: async () => {
            const res = await fetch("/api/admin/orders", { credentials: "include" });
            if (!res.ok) throw new Error("Siparişler alınamadı");
            return res.json();
        },
        enabled: isAdmin,
    });

    // Fetch selected order details
    const { data: selectedOrder, isLoading: orderDetailLoading } = useQuery({
        queryKey: ["/api/admin/orders", selectedOrderId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/orders/${selectedOrderId}`, { credentials: "include" });
            if (!res.ok) throw new Error("Sipariş detayı alınamadı");
            return res.json();
        },
        enabled: !!selectedOrderId,
    });

    // Create product mutation
    const createProductMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.admin.createProduct.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Ürün eklenemedi");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Başarılı", description: "Ürün eklendi!" });
            setFormData(initialFormData);
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        },
    });

    // Update product mutation
    const updateProductMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await fetch(api.admin.updateProduct.path.replace(":id", String(id)), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Ürün güncellenemedi");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Başarılı", description: "Ürün güncellendi!" });
            setFormData(initialFormData);
            setEditingId(null);
            setIsEditDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        },
    });

    // Delete product mutation
    const deleteProductMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(api.admin.deleteProduct.path.replace(":id", String(id)), {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Ürün silinemedi");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Başarılı", description: "Ürün silindi!" });
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        },
    });

    // Update order status mutation
    const updateOrderStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await fetch(`/api/admin/orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Durum güncellenemedi");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
            toast({ title: "Başarılı", description: "Sipariş durumu güncellendi!" });
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        },
    });

    // Calculate stats
    const motorcycleCount = products?.filter(p => p.category === 'motorcycle').length || 0;
    const equipmentCount = products?.filter(p => p.category === 'equipment').length || 0;
    const partsCount = products?.filter(p => p.category === 'parts').length || 0;
    const totalStock = products?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0;

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!products) return [];

        return products.filter(product => {
            if (categoryFilter !== "all" && product.category !== categoryFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return product.name.toLowerCase().includes(query);
            }
            return true;
        });
    }, [products, searchQuery, categoryFilter]);

    // Image upload handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                credentials: "include",
                body: formDataUpload,
            });

            if (!res.ok) throw new Error("Yükleme başarısız");

            const data = await res.json();
            setFormData(prev => ({ ...prev, image: data.url }));
            toast({ title: "Başarılı", description: "Görsel yüklendi!" });
        } catch (error) {
            toast({ title: "Hata", description: "Görsel yüklenemedi", variant: "destructive" });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Handler functions
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const productData = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            originalPrice: formData.originalPrice || null,
            image: formData.image,
            category: formData.category,
            stock: formData.stock,
            colors: formData.colors ? formData.colors.split(",").map((c) => c.trim()) : [],
            specs: formData.specs
                ? Object.fromEntries(
                    formData.specs.split("\n").map((line) => {
                        const [key, value] = line.split(":").map((s) => s.trim());
                        return [key, value || ""];
                    })
                )
                : {},
        };

        if (editingId) {
            updateProductMutation.mutate({ id: editingId, data: productData });
        } else {
            createProductMutation.mutate(productData);
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice || undefined,
            image: product.image,
            category: product.category,
            stock: product.stock,
            colors: product.colors?.join(", ") || "",
            specs: product.specs
                ? Object.entries(product.specs)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n")
                : "",
        });
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditingId(null);
        setFormData(initialFormData);
    };

    const handleDelete = (id: number) => {
        if (confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
            deleteProductMutation.mutate(id);
        }
    };

    const handleViewOrder = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsOrderDetailOpen(true);
    };

    const categoryLabels: Record<string, string> = {
        motorcycle: "Motor",
        equipment: "Ekipman",
        parts: "Yedek Parça",
    };

    const categoryColors: Record<string, string> = {
        motorcycle: "bg-blue-500",
        equipment: "bg-amber-500",
        parts: "bg-emerald-500",
    };

    const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
        pending: { label: "Beklemede", color: "bg-yellow-100 text-yellow-800", icon: Clock },
        processing: { label: "Hazırlanıyor", color: "bg-blue-100 text-blue-800", icon: Package },
        shipped: { label: "Kargoya Verildi", color: "bg-purple-100 text-purple-800", icon: Truck },
        delivered: { label: "Teslim Edildi", color: "bg-green-100 text-green-800", icon: CheckCircle },
        cancelled: { label: "İptal Edildi", color: "bg-red-100 text-red-800", icon: XCircle },
    };

    // NOW we can have conditional returns - after all hooks
    if (!authLoading && !isAdmin) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <AnnouncementBar />
                <Header />
                <main className="flex-1 flex items-center justify-center py-12 px-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <ShieldCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <CardTitle className="text-2xl">Erişim Reddedildi</CardTitle>
                            <CardDescription>
                                Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekiyor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button onClick={() => setLocation("/login")} className="rounded-xl">
                                Giriş Yap
                            </Button>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="h-10 w-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    // Product Form Component
    const ProductForm = ({ isDialog = false }: { isDialog?: boolean }) => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <Tag className="h-4 w-4 text-gray-500" /> Ürün Adı
                    </Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Örn: Yamaha MT-07 2024"
                        required
                        className="h-10"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <Boxes className="h-4 w-4 text-gray-500" /> Kategori
                    </Label>
                    <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="motorcycle">🏍️ Motor</SelectItem>
                            <SelectItem value="equipment">🪖 Ekipman</SelectItem>
                            <SelectItem value="parts">🔧 Yedek Parça</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-gray-500" /> Fiyat (₺)
                    </Label>
                    <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                            setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                        }
                        placeholder="350000"
                        required
                        className="h-10"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-gray-500" /> Stok Adedi
                    </Label>
                    <Input
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                            setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                        }
                        placeholder="10"
                        required
                        className="h-10"
                    />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-1.5 md:col-span-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <ImageIcon className="h-4 w-4 text-gray-500" /> Ürün Görseli
                    </Label>
                    <div className="flex gap-3 items-start">
                        {/* Image Preview */}
                        <div
                            className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {formData.image ? (
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Plus className="h-6 w-6" />
                                    <span className="text-xs mt-1">Ekle</span>
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="h-9"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Görsel Yükle
                                    </>
                                )}
                            </Button>
                            {formData.image && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {formData.image}
                                </p>
                            )}
                            <p className="text-xs text-gray-400">
                                JPG, PNG, GIF veya WebP (max 5MB)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-gray-500" /> Açıklama
                    </Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ürün açıklaması..."
                        required
                        rows={2}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <Palette className="h-4 w-4 text-gray-500" /> Renkler
                    </Label>
                    <Input
                        value={formData.colors}
                        onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                        placeholder="Siyah, Beyaz, Kırmızı"
                        className="h-10"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-gray-500" /> Özellikler
                    </Label>
                    <Textarea
                        value={formData.specs}
                        onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                        placeholder="Motor: 689cc&#10;Güç: 73 HP"
                        rows={2}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    className="h-10 px-5 bg-black hover:bg-gray-800"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Güncelle" : "Ürün Ekle"}
                </Button>
                {isDialog && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseEditDialog}
                        className="h-10"
                    >
                        İptal
                    </Button>
                )}
            </div>
        </form>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AnnouncementBar />
            <Header />

            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-black flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
                                <p className="text-gray-500">
                                    Hoş geldin, <span className="font-medium text-gray-700">{user?.name}</span>! Ürünleri ve siparişleri buradan yönetebilirsin.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Bike className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{motorcycleCount}</p>
                                    <p className="text-sm text-gray-500">Motor</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <HardHat className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{equipmentCount}</p>
                                    <p className="text-sm text-gray-500">Ekipman</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Wrench className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{partsCount}</p>
                                    <p className="text-sm text-gray-500">Yedek Parça</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
                                    <p className="text-sm text-gray-500">Toplam Stok</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
                                    <p className="text-sm text-gray-500">Sipariş</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="orders" className="space-y-6">
                        <TabsList className="bg-white border shadow-sm rounded-lg p-1">
                            <TabsTrigger
                                value="orders"
                                className="rounded-md data-[state=active]:bg-black data-[state=active]:text-white px-4"
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Siparişler ({orders?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                                value="list"
                                className="rounded-md data-[state=active]:bg-black data-[state=active]:text-white px-4"
                            >
                                <Package className="h-4 w-4 mr-2" />
                                Ürün Listesi ({products?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                                value="add"
                                className="rounded-md data-[state=active]:bg-black data-[state=active]:text-white px-4"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Ürün Ekle
                            </TabsTrigger>
                        </TabsList>

                        {/* Orders Tab */}
                        <TabsContent value="orders">
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-gray-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Sipariş Takibi
                                    </CardTitle>
                                    <CardDescription>
                                        Tüm siparişleri görüntüleyin ve yönetin
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {ordersLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="h-10 w-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                        </div>
                                    ) : !orders || orders.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            Henüz sipariş bulunmuyor.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orders.map((order: any) => {
                                                const status = statusLabels[order.status] || statusLabels.pending;
                                                const StatusIcon = status.icon;
                                                return (
                                                    <div
                                                        key={order.id}
                                                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <ShoppingCart className="h-6 w-6 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-gray-900">
                                                                    Sipariş #{order.id}
                                                                </h3>
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                                                                    <StatusIcon className="h-3 w-3 inline mr-1" />
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {order.customerName}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {order.customerEmail}
                                                                </span>
                                                                <span className="font-bold text-gray-900">
                                                                    {order.totalAmount?.toLocaleString("tr-TR")} ₺
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleViewOrder(order.id)}
                                                                className="h-9"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Detay
                                                            </Button>
                                                            <Select
                                                                value={order.status || "pending"}
                                                                onValueChange={(value) => updateOrderStatusMutation.mutate({ id: order.id, status: value })}
                                                            >
                                                                <SelectTrigger className="h-9 w-44 bg-white">
                                                                    <span className={`flex items-center gap-2 text-sm font-medium ${order.status === 'processing' ? 'text-blue-600' :
                                                                            order.status === 'shipped' ? 'text-purple-600' :
                                                                                order.status === 'delivered' ? 'text-green-600' :
                                                                                    order.status === 'cancelled' ? 'text-red-600' :
                                                                                        'text-yellow-600'
                                                                        }`}>
                                                                        {order.status === 'processing' ? '📦 Hazırlanıyor' :
                                                                            order.status === 'shipped' ? '🚚 Kargoda' :
                                                                                order.status === 'delivered' ? '✅ Teslim Edildi' :
                                                                                    order.status === 'cancelled' ? '❌ İptal' :
                                                                                        '⏳ Beklemede'}
                                                                    </span>
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white">
                                                                    <SelectItem value="pending" className="text-yellow-600 font-medium">⏳ Beklemede</SelectItem>
                                                                    <SelectItem value="processing" className="text-blue-600 font-medium">📦 Hazırlanıyor</SelectItem>
                                                                    <SelectItem value="shipped" className="text-purple-600 font-medium">🚚 Kargoda</SelectItem>
                                                                    <SelectItem value="delivered" className="text-green-600 font-medium">✅ Teslim Edildi</SelectItem>
                                                                    <SelectItem value="cancelled" className="text-red-600 font-medium">❌ İptal</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Product List Tab */}
                        <TabsContent value="list">
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-gray-50">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Package className="h-5 w-5" />
                                                Tüm Ürünler
                                            </CardTitle>
                                            <CardDescription>
                                                Sistemdeki tüm ürünleri görüntüleyin ve yönetin
                                            </CardDescription>
                                        </div>

                                        {/* Search Box */}
                                        <div className="relative w-full md:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Ürün ara..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-10"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category Filter */}
                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        <Button
                                            variant={categoryFilter === "all" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCategoryFilter("all")}
                                            className={categoryFilter === "all" ? "bg-black text-white" : ""}
                                        >
                                            Tümü ({products?.length || 0})
                                        </Button>
                                        <Button
                                            variant={categoryFilter === "motorcycle" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCategoryFilter("motorcycle")}
                                            className={categoryFilter === "motorcycle" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                        >
                                            🏍️ Motor ({motorcycleCount})
                                        </Button>
                                        <Button
                                            variant={categoryFilter === "equipment" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCategoryFilter("equipment")}
                                            className={categoryFilter === "equipment" ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
                                        >
                                            🪖 Ekipman ({equipmentCount})
                                        </Button>
                                        <Button
                                            variant={categoryFilter === "parts" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCategoryFilter("parts")}
                                            className={categoryFilter === "parts" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                                        >
                                            🔧 Yedek Parça ({partsCount})
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {productsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="h-10 w-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            {searchQuery || categoryFilter !== "all"
                                                ? "Arama kriterlerine uygun ürün bulunamadı."
                                                : "Henüz ürün eklenmemiş."}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredProducts.map((product: any) => (
                                                <div
                                                    key={product.id}
                                                    className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
                                                >
                                                    <div className="relative">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="h-16 w-16 object-cover rounded-lg"
                                                        />
                                                        <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${categoryColors[product.category]} ring-2 ring-white`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {product.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                                {categoryLabels[product.category] || product.category}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-900">
                                                                {product.price.toLocaleString("tr-TR")} ₺
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                • Stok: {product.stock}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(product)}
                                                            className="h-9"
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Düzenle
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(product.id)}
                                                            className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Add Product Tab */}
                        <TabsContent value="add">
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-gray-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <Plus className="h-5 w-5" />
                                        Yeni Ürün Ekle
                                    </CardTitle>
                                    <CardDescription>
                                        Yeni bir ürün eklemek için formu doldurun
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <ProductForm />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            {/* Edit Product Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Ürün Düzenle
                        </DialogTitle>
                        <DialogDescription>
                            Ürün bilgilerini güncelleyin
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm isDialog />
                </DialogContent>
            </Dialog>

            {/* Order Detail Dialog */}
            <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Sipariş Detayı #{selectedOrderId}
                        </DialogTitle>
                        <DialogDescription>
                            Sipariş bilgilerini görüntüleyin
                        </DialogDescription>
                    </DialogHeader>

                    {orderDetailLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-8 w-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                        </div>
                    ) : selectedOrder ? (
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Müşteri Bilgileri
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500">Ad Soyad:</span>
                                        <span className="font-medium">{selectedOrder.order.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500">E-posta:</span>
                                        <span className="font-medium">{selectedOrder.order.customerEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500">Telefon:</span>
                                        <span className="font-medium">{selectedOrder.order.customerPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500">Tarih:</span>
                                        <span className="font-medium">
                                            {new Date(selectedOrder.order.createdAt).toLocaleDateString("tr-TR")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <span className="text-gray-500">Adres:</span>
                                    <span className="font-medium">{selectedOrder.order.address}</span>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Sipariş Ürünleri
                                </h3>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item: any, index: number) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="h-14 w-14 object-cover rounded-md"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>Adet: {item.quantity}</span>
                                                    {item.selectedColor && (
                                                        <span>• Renk: {item.selectedColor}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">
                                                    {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.price.toLocaleString("tr-TR")} ₺ / adet
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="font-semibold text-gray-900">Toplam Tutar:</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {selectedOrder.order.totalAmount?.toLocaleString("tr-TR")} ₺
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
