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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Plus,
    MessageSquare,
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
    XCircle,
    Package2,
    RotateCcw,
    CreditCard,
    Building2,
    Headphones,
    Send
} from "lucide-react";
import { OrderNotes } from "@/components/OrderNotes";
import { StockImportPanel } from "@/components/StockImportPanel";
import { apiRequest } from "@/lib/queryClient";
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

// Live Support Panel Component
const LiveSupportPanel = () => {
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [chatListTab, setChatListTab] = useState<"active" | "waiting">("waiting");

    const categoryLabels: Record<string, string> = {
        order: "Sipariş Takibi",
        product: "Ürün Bilgisi",
        return: "İade / Değişim",
        payment: "Ödeme Sorunu",
        other: "Diğer",
    };

    // Fetch waiting sessions
    const { data: waitingSessions, isLoading: waitingLoading, refetch: refetchWaiting } = useQuery({
        queryKey: ["/api/admin/chat/waiting"],
        queryFn: async () => {
            const res = await fetch("/api/admin/chat/waiting", { credentials: "include" });
            if (!res.ok) throw new Error("Bekleyen sohbetler alınamadı");
            return res.json();
        },
        enabled: !!isAdmin,
        refetchInterval: 5000, // Poll every 5 seconds
    });

    // Fetch active sessions (AGENT_MODE - chats admin has joined)
    const { data: activeSessions, isLoading: activeLoading, refetch: refetchActive } = useQuery({
        queryKey: ["/api/admin/chat/active"],
        queryFn: async () => {
            const res = await fetch("/api/admin/chat/active", { credentials: "include" });
            if (!res.ok) throw new Error("Aktif sohbetler alınamadı");
            return res.json();
        },
        enabled: !!isAdmin,
        refetchInterval: 5000, // Poll every 5 seconds
    });

    const handleJoinChat = async (sessionId: string) => {
        setIsJoining(true);
        try {
            const res = await fetch(`/api/admin/chat/${sessionId}/join`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Sohbete katılınamadı");
            const data = await res.json();
            setSelectedChat(data.session);
            setChatMessages(data.messages || []);
            refetchWaiting();
            refetchActive();
            toast({ title: "Başarılı", description: "Sohbete katıldınız!" });
        } catch (err) {
            toast({ title: "Hata", description: "Sohbete katılırken hata oluştu", variant: "destructive" });
        } finally {
            setIsJoining(false);
        }
    };

    // Resume an active chat (go back into chat view without changing status)
    const handleResumeChat = async (session: any) => {
        try {
            const res = await fetch(`/api/chat/session/${session.id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Sohbet yüklenemedi");
            const data = await res.json();
            setSelectedChat(data.session);
            setChatMessages(data.messages || []);
        } catch (err) {
            toast({ title: "Hata", description: "Sohbet yüklenirken hata oluştu", variant: "destructive" });
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat) return;

        try {
            // Use REST API to send message (simpler than WebSocket for admin)
            const res = await fetch("/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    chatSessionId: selectedChat.id,
                    content: messageInput,
                    sender: "AGENT",
                }),
            });

            if (res.ok) {
                // Refresh messages
                const msgRes = await fetch(`/api/chat/session/${selectedChat.id}`, { credentials: "include" });
                if (msgRes.ok) {
                    const data = await msgRes.json();
                    setChatMessages(data.messages || []);
                }
                setMessageInput("");
            }
        } catch (err) {
            toast({ title: "Hata", description: "Mesaj gönderilemedi", variant: "destructive" });
        }
    };

    const handleCloseChat = async () => {
        if (!selectedChat) return;
        try {
            await fetch(`/api/admin/chat/${selectedChat.id}/close`, {
                method: "POST",
                credentials: "include",
            });
            setSelectedChat(null);
            setChatMessages([]);
            refetchWaiting();
            refetchActive();
            toast({ title: "Başarılı", description: "Sohbet kapatıldı" });
        } catch (err) {
            toast({ title: "Hata", description: "Sohbet kapatılırken hata oluştu", variant: "destructive" });
        }
    };

    // Handle back to list (without closing chat)
    const handleBackToList = () => {
        setSelectedChat(null);
        setChatMessages([]);
        // Refetch to update lists
        refetchActive();
    };

    if (selectedChat) {
        // Active Chat View
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={handleBackToList}>
                        ← Listeye Dön
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            {selectedChat.customerName || selectedChat.customerEmail || "Anonim Müşteri"}
                        </span>
                        <Button variant="destructive" size="sm" onClick={handleCloseChat}>
                            <XCircle className="h-4 w-4 mr-1" /> Görüşmeyi Sonlandır
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="border rounded-lg h-[400px] overflow-y-auto p-4 bg-gray-50 space-y-3">
                    {chatMessages.map((msg: any) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-xl px-4 py-2 ${msg.sender === 'USER'
                                    ? 'bg-gray-200 text-gray-800'
                                    : msg.sender === 'BOT'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-green-500 text-white'
                                    }`}
                            >
                                <div className="text-xs opacity-70 mb-1">
                                    {msg.sender === 'USER' ? 'Müşteri' : msg.sender === 'BOT' ? 'MotoBot' : 'Siz'}
                                </div>
                                <p className="text-sm">{msg.content.replace(/^\[.*?\]\s*/, '')}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                        <Send className="h-4 w-4 mr-1" /> Gönder
                    </Button>
                </div>
            </div>
        );
    }

    // Sessions List View with Tabs
    return (
        <div className="space-y-4">
            {/* Tab Headers */}
            <div className="flex border-b">
                <button
                    onClick={() => setChatListTab("active")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${chatListTab === "active"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Headphones className="h-4 w-4" />
                    Aktif Sohbetler
                    {activeSessions && activeSessions.length > 0 && (
                        <Badge className="bg-green-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {activeSessions.length}
                        </Badge>
                    )}
                </button>
                <button
                    onClick={() => setChatListTab("waiting")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${chatListTab === "waiting"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Clock className="h-4 w-4" />
                    Bekleyen Sohbetler
                    {waitingSessions && waitingSessions.length > 0 && (
                        <Badge className="bg-orange-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {waitingSessions.length}
                        </Badge>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {chatListTab === "active" ? (
                /* Active Sessions (AGENT_MODE) */
                <div>
                    {activeLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : !activeSessions || activeSessions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg">
                            <Headphones className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>Şu anda aktif görüşme yok</p>
                            <p className="text-sm">Katıldığınız görüşmeler burada görünecek</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeSessions.map((session: any) => (
                                <div
                                    key={session.id}
                                    className="border rounded-lg p-4 bg-green-50 border-green-200 flex items-center justify-between hover:border-green-400 transition-colors cursor-pointer"
                                    onClick={() => handleResumeChat(session)}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="text-xs bg-green-500">Aktif</Badge>
                                            {session.category && (
                                                <Badge variant="outline" className="text-xs">
                                                    {categoryLabels[session.category] || session.category}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">
                                                {session.customerName || session.customerEmail || "Anonim Müşteri"}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                                        <MessageSquare className="h-4 w-4 mr-1" /> Devam Et
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Waiting Sessions (WAITING_FOR_AGENT) */
                <div>
                    {waitingLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : !waitingSessions || waitingSessions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                            <Headphones className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>Bekleyen sohbet yok</p>
                            <p className="text-sm">Müşteriler destek istediğinde burada görünecek</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {waitingSessions.map((session: any) => (
                                <div
                                    key={session.id}
                                    className="border rounded-lg p-4 bg-white flex items-center justify-between hover:border-orange-300 transition-colors"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {session.category && (
                                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                                    {categoryLabels[session.category] || session.category}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {new Date(session.updatedAt).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">
                                                {session.customerName || session.customerEmail || "Anonim Müşteri"}
                                            </span>
                                        </div>
                                        {session.lastMessage && (
                                            <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                                                "{session.lastMessage}"
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => handleJoinChat(session.id)}
                                        disabled={isJoining}
                                        className="bg-orange-500 hover:bg-orange-600"
                                    >
                                        {isJoining ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : (
                                            <Headphones className="h-4 w-4 mr-1" />
                                        )}
                                        Katıl
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
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
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
    const [approvePaymentId, setApprovePaymentId] = useState<number | null>(null);
    const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("orders");
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");
    const [orderSearchQuery, setOrderSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<"thisMonth" | "total">("thisMonth");
    const [statusDetailInput, setStatusDetailInput] = useState<Record<number, string>>({});

    // Status Change Dialog state (for Cancel/Return)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [statusDialogData, setStatusDialogData] = useState<{
        orderId: number,
        newStatus: string,
        title: string,
        description: string,
        label: string,
        placeholder: string,
        reason: string
    } | null>(null);

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

    // Fetch payment notifications
    const { data: paymentNotifications, isLoading: notificationsLoading } = useQuery({
        queryKey: ["/api/admin/payment-notifications"],
        queryFn: async () => {
            const res = await fetch("/api/admin/payment-notifications", { credentials: "include" });
            if (!res.ok) throw new Error("Ödeme bildirimleri alınamadı");
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
        mutationFn: async ({ id, status, statusDetail }: { id: number; status: string; statusDetail?: string }) => {
            const res = await fetch(`/api/admin/orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status, statusDetail }),
            });
            if (!res.ok) throw new Error("Durum güncellenemedi");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
            toast({ title: "Başarılı", description: "Sipariş durumu güncellendi!" });
            setStatusDetailInput({});
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        },
    });

    // Approve payment notification mutation
    const approveNotificationMutation = useMutation({
        mutationFn: async ({ id, adminNote }: { id: number; adminNote?: string }) => {
            const res = await fetch(`/api/admin/payment-notifications/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ adminNote }),
            });
            if (!res.ok) throw new Error("Ödeme onaylanamadı");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
            toast({ title: "Başarılı", description: "Ödeme onaylandı! Sipariş hazırlanmaya başladı." });
        },
        onError: (error: any) => {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        },
    });

    // Reject payment notification mutation
    const rejectNotificationMutation = useMutation({
        mutationFn: async ({ id, adminNote }: { id: number; adminNote: string }) => {
            const res = await fetch(`/api/admin/payment-notifications/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ adminNote }),
            });
            if (!res.ok) throw new Error("Ödeme reddedilemedi");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-notifications"] });
            toast({ title: "Reddedildi", description: "Ödeme bildirimi reddedildi." });
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

    // Order statistics with date filter
    const filteredStatsOrders = useMemo(() => {
        if (!orders) return [];
        if (dateFilter === "total") return orders;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return orders.filter((o: any) => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= startOfMonth;
        });
    }, [orders, dateFilter]);

    const statsOrders = filteredStatsOrders.length || 0;
    const statsApproved = filteredStatsOrders.filter((o: any) => ['processing', 'shipped', 'delivered'].includes(o.status)).length || 0;
    const statsCancelled = filteredStatsOrders.filter((o: any) => o.status === 'cancelled').length || 0;

    // Filter orders by status and date
    const filteredOrders = useMemo(() => {
        if (!orders) return [];

        let result = orders;

        // Havale/EFT filtresi: Ödenmemiş EFT siparişlerini gizle
        result = result.filter((order: any) => {
            if (order.paymentMethod === 'transfer' && order.paymentStatus !== 'paid') {
                return false;
            }
            return true;
        });

        // Date filter
        if (dateFilter === "thisMonth") {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            result = result.filter((o: any) => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= startOfMonth;
            });
        }

        // Status filter
        if (orderStatusFilter !== "all") {
            result = result.filter((order: any) => order.status === orderStatusFilter);
        }

        // Search filter - kisi adi veya siparis numarasi ile arama
        if (orderSearchQuery.trim()) {
            const query = orderSearchQuery.toLowerCase().trim();
            result = result.filter((order: any) =>
                order.customerName?.toLowerCase().includes(query) ||
                order.orderCode?.toLowerCase().includes(query) ||
                order.customerEmail?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [orders, orderStatusFilter, dateFilter, orderSearchQuery]);

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
        setDeleteProductId(id);
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
        shipped: { label: "Kargoda", color: "bg-purple-100 text-purple-800", icon: Truck },
        outForDelivery: { label: "Dağıtıma Çıktı", color: "bg-indigo-100 text-indigo-800", icon: Package2 },
        delivered: { label: "Teslim Edildi", color: "bg-green-100 text-green-800", icon: CheckCircle },
        cancelled: { label: "İptal Edildi", color: "bg-red-100 text-red-800", icon: XCircle },
        returned: { label: "İade Edildi", color: "bg-orange-100 text-orange-800", icon: RotateCcw },
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

                    {/* Stats Cards - Conditional based on active tab */}
                    {activeTab === "orders" ? (
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-end">
                                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
                                    <button
                                        onClick={() => setDateFilter("thisMonth")}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dateFilter === "thisMonth"
                                            ? "bg-black text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-900"
                                            }`}
                                    >
                                        Bu Ay
                                    </button>
                                    <button
                                        onClick={() => setDateFilter("total")}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dateFilter === "total"
                                            ? "bg-black text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-900"
                                            }`}
                                    >
                                        Toplam
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                            <ShoppingCart className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{statsOrders}</p>
                                            <p className="text-sm text-gray-500">
                                                {dateFilter === "thisMonth" ? "Bu Ayki Sipariş" : "Toplam Sipariş"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">{statsApproved}</p>
                                            <p className="text-sm text-gray-500">Onaylanan</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-red-600">{statsCancelled}</p>
                                            <p className="text-sm text-gray-500">İptal Edilen</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === "list" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                        </div>
                    ) : null}

                    <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                            <TabsTrigger
                                value="payments"
                                className="rounded-md data-[state=active]:bg-black data-[state=active]:text-white px-4"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Ödeme Bildirimleri ({paymentNotifications?.filter((n: any) => n.status === 'pending').length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                                value="livesupport"
                                className="rounded-md data-[state=active]:bg-black data-[state=active]:text-white px-4"
                            >
                                <Headphones className="h-4 w-4 mr-2" />
                                Canlı Destek
                            </TabsTrigger>
                        </TabsList>

                        {/* Orders Tab */}
                        <TabsContent value="orders">
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-gray-50">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <ShoppingCart className="h-5 w-5" />
                                                    Sipariş Takibi
                                                </CardTitle>
                                                <CardDescription>
                                                    Tüm siparişleri görüntüleyin ve yönetin
                                                </CardDescription>
                                            </div>
                                            <div className="relative w-full md:w-72">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    placeholder="Sipariş No, İsim veya E-posta..."
                                                    className="pl-8 bg-white"
                                                    value={orderSearchQuery}
                                                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant={orderStatusFilter === "all" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("all")}
                                                className={orderStatusFilter === "all" ? "bg-black text-white hover:bg-gray-800" : ""}
                                            >
                                                Tümü ({orders?.length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "pending" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("pending")}
                                                className={orderStatusFilter === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200" : "text-yellow-600 border-yellow-200 hover:bg-yellow-50"}
                                            >
                                                ⏳ Beklemede ({orders?.filter((o: any) => o.status === 'pending').length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "processing" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("processing")}
                                                className={orderStatusFilter === "processing" ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                                            >
                                                📦 Hazırlanıyor ({orders?.filter((o: any) => o.status === 'processing').length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "shipped" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("shipped")}
                                                className={orderStatusFilter === "shipped" ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200" : "text-purple-600 border-purple-200 hover:bg-purple-50"}
                                            >
                                                🚚 Kargoda ({orders?.filter((o: any) => o.status === 'shipped').length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "outForDelivery" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("outForDelivery")}
                                                className={orderStatusFilter === "outForDelivery" ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200" : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"}
                                            >
                                                🚛 Dağıtıma Çıktı ({orders?.filter((o: any) => o.status === 'outForDelivery').length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "delivered" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("delivered")}
                                                className={orderStatusFilter === "delivered" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : "text-green-600 border-green-200 hover:bg-green-50"}
                                            >
                                                ✅ Teslim Edildi ({orders?.filter((o: any) => o.status === 'delivered').length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "cancelled" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("cancelled")}
                                                className={orderStatusFilter === "cancelled" ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" : "text-red-600 border-red-200 hover:bg-red-50"}
                                            >
                                                ❌ İptal ({orders?.filter((o: any) => o.status === 'cancelled').length || 0})
                                            </Button>
                                            <Button
                                                variant={orderStatusFilter === "returned" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setOrderStatusFilter("returned")}
                                                className={orderStatusFilter === "returned" ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200" : "text-orange-600 border-orange-200 hover:bg-orange-50"}
                                            >
                                                🔄 İade Edildi ({orders?.filter((o: any) => o.status === 'returned').length || 0})
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {ordersLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="h-10 w-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                                        </div>
                                    ) : !filteredOrders || filteredOrders.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            {orderStatusFilter !== "all"
                                                ? "Bu kategoride sipariş bulunmuyor."
                                                : "Henüz sipariş bulunmuyor."}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredOrders.map((order: any) => {
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
                                                                    Sipariş #{order.orderCode} <span className="text-gray-400 text-xs font-normal ml-1">(ID: {order.id})</span>
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
                                                            <Select
                                                                value={order.status || "pending"}
                                                                onValueChange={(value) => {
                                                                    if (value === 'returned' || value === 'cancelled') {
                                                                        setStatusDialogData({
                                                                            orderId: order.id,
                                                                            newStatus: value,
                                                                            title: value === 'returned' ? 'Sipariş İade Nedeni' : 'Sipariş İptal Nedeni',
                                                                            description: value === 'returned'
                                                                                ? 'Lütfen bu sipariş için iade nedenini belirtiniz.'
                                                                                : 'Lütfen bu sipariş için iptal nedenini belirtiniz.',
                                                                            label: value === 'returned' ? 'İade Nedeni' : 'İptal Nedeni',
                                                                            placeholder: value === 'returned' ? 'Ürün hasarlı, beden uymadı...' : 'Stok tükendi, müşteri vazgeçti...',
                                                                            reason: ""
                                                                        });
                                                                        setIsStatusDialogOpen(true);
                                                                    } else {
                                                                        // Durum normale dönüyorsa, eski iptal/iade notunu temizle (statusDetail boş gönder)
                                                                        updateOrderStatusMutation.mutate({
                                                                            id: order.id,
                                                                            status: value,
                                                                            statusDetail: "" // Clear the detail
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9 w-44 bg-white">
                                                                    <span className={`flex items-center gap-2 text-sm font-medium ${order.status === 'processing' ? 'text-blue-600' :
                                                                        order.status === 'shipped' ? 'text-purple-600' :
                                                                            order.status === 'outForDelivery' ? 'text-indigo-600' :
                                                                                order.status === 'delivered' ? 'text-green-600' :
                                                                                    order.status === 'cancelled' ? 'text-red-600' :
                                                                                        order.status === 'returned' ? 'text-orange-600' :
                                                                                            'text-yellow-600'
                                                                        }`}>
                                                                        {order.status === 'processing' ? '📦 Hazırlanıyor' :
                                                                            order.status === 'shipped' ? '🚚 Kargoda' :
                                                                                order.status === 'outForDelivery' ? '🚛 Dağıtıma Çıktı' :
                                                                                    order.status === 'delivered' ? '✅ Teslim Edildi' :
                                                                                        order.status === 'cancelled' ? '❌ İptal' :
                                                                                            order.status === 'returned' ? '🔄 İade' :
                                                                                                '⏳ Beklemede'}
                                                                    </span>
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white">
                                                                    <SelectItem value="pending" className="text-yellow-600 font-medium">⏳ Beklemede</SelectItem>
                                                                    <SelectItem value="processing" className="text-blue-600 font-medium">📦 Hazırlanıyor</SelectItem>
                                                                    <SelectItem value="shipped" className="text-purple-600 font-medium">🚚 Kargoda</SelectItem>
                                                                    <SelectItem value="outForDelivery" className="text-indigo-600 font-medium">🚛 Dağıtıma Çıktı</SelectItem>
                                                                    <SelectItem value="delivered" className="text-green-600 font-medium">✅ Teslim Edildi</SelectItem>
                                                                    <SelectItem value="cancelled" className="text-red-600 font-medium">❌ İptal Edildi</SelectItem>
                                                                    <SelectItem value="returned" className="text-orange-600 font-medium">🔄 İade Edildi</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedOrderId(order.id);
                                                                    setIsOrderDetailOpen(true);
                                                                }}
                                                                className="h-9"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Detay
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                    }
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
                                                            {product.stock < 10 ? (
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                                    ⚠️ Stok: {product.stock}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    • Stok: {product.stock}
                                                                </span>
                                                            )}
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

                            {/* Stock Import Panel */}
                            <div className="mt-6">
                                <StockImportPanel />
                            </div>
                        </TabsContent>

                        {/* Payment Notifications Tab */}
                        <TabsContent value="payments">
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-gray-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Ödeme Bildirimleri
                                    </CardTitle>
                                    <CardDescription>
                                        Havale/EFT ödeme bildirimlerini onaylayın veya reddedin
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {notificationsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                        </div>
                                    ) : !paymentNotifications || paymentNotifications.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                            <p>Henüz ödeme bildirimi yok</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {paymentNotifications.map((notification: any) => (
                                                <div key={notification.id} className={`p-6 ${notification.status === 'pending' ? 'bg-yellow-50' :
                                                    notification.status === 'approved' ? 'bg-green-50' :
                                                        notification.status === 'rejected' ? 'bg-red-50' : ''
                                                    }`}>
                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-lg">#{notification.order?.orderCode || 'N/A'}</span>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${notification.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                                                    notification.status === 'approved' ? 'bg-green-200 text-green-800' :
                                                                        'bg-red-200 text-red-800'
                                                                    }`}>
                                                                    {notification.status === 'pending' ? '⏳ Bekliyor' :
                                                                        notification.status === 'approved' ? '✅ Onaylandı' : '❌ Reddedildi'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500">Gönderen:</span>
                                                                    <p className="font-medium">{notification.senderName}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Banka:</span>
                                                                    <p className="font-medium">{notification.bankName}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Tutar:</span>
                                                                    <p className="font-bold text-green-600">{notification.amount.toLocaleString('tr-TR')} ₺</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Tarih:</span>
                                                                    <p className="font-medium">{notification.transferDate}</p>
                                                                </div>
                                                            </div>
                                                            {notification.order && (
                                                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                                                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                                                        <User className="h-4 w-4 text-gray-500" />
                                                                        <span className="font-semibold text-gray-900">{notification.order.customerName}</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                        <span className="flex items-center gap-1.5" title="Telefon">
                                                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                                            {notification.order.customerPhone}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5" title="E-posta">
                                                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                                            {notification.order.customerEmail}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5 col-span-2 pt-1 font-medium text-gray-900 text-sm">
                                                                            Sipariş Tutarı: {notification.order.totalAmount.toLocaleString('tr-TR')} ₺
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {notification.adminNote && (
                                                                <div className="text-sm italic text-gray-600 bg-white p-2 rounded border">
                                                                    Not: {notification.adminNote}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {notification.status === 'pending' ? (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => setApprovePaymentId(notification.id)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    disabled={approveNotificationMutation.isPending}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    Onayla
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    onClick={() => {
                                                                        setRejectPaymentId(notification.id);
                                                                        setRejectReason("");
                                                                    }}
                                                                    disabled={rejectNotificationMutation.isPending}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" />
                                                                    Reddet
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="sm" className="h-8">
                                                                            <Edit className="h-3.5 w-3.5 mr-1" />
                                                                            Düzenle
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => setApprovePaymentId(notification.id)}>
                                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                                            Tekrar Onayla
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setRejectPaymentId(notification.id);
                                                                            setRejectReason("");
                                                                        }} className="text-red-600">
                                                                            <XCircle className="mr-2 h-4 w-4" />
                                                                            Tekrar Reddet
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Live Support Tab */}
                        <TabsContent value="livesupport">
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-gray-50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Headphones className="h-5 w-5" />
                                                Canlı Destek
                                            </CardTitle>
                                            <CardDescription>
                                                Bekleyen müşteri sohbetlerini yönetin
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <LiveSupportPanel />
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

                            {/* Order Notes */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Sipariş Notları ve Geçmişi
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 border">
                                    <OrderNotes orderId={selectedOrder.order.id} />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Delete Product Alert */}
            <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteProductId) {
                                    deleteProductMutation.mutate(deleteProductId);
                                    setDeleteProductId(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Approve Payment Alert */}
            <AlertDialog open={!!approvePaymentId} onOpenChange={(open) => !open && setApprovePaymentId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ödemeyi Onayla</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu ödeme bildirimini onaylamak istediğinize emin misiniz? Sipariş durumu "Hazırlanıyor" olarak güncellenecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (approvePaymentId) {
                                    approveNotificationMutation.mutate({ id: approvePaymentId });
                                    setApprovePaymentId(null);
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Onayla
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject Payment Dialog */}
            <Dialog open={!!rejectPaymentId} onOpenChange={(open) => !open && setRejectPaymentId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ödemeyi Reddet</DialogTitle>
                        <DialogDescription>
                            Lütfen ret sebebini giriniz. Bu not kullanıcı tarafından görülebilecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rejectReason" className="mb-2 block">Red Sebebi</Label>
                        <Textarea
                            id="rejectReason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Sipariş tutarı hesabıma geçmedi..."
                            className="mb-2"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectReason("Ödemeniz onaylanmadı. Tutar 1-3 iş günü içinde hesabınıza iade edilecektir.")}
                            className="text-xs"
                        >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            Otomatik İade Mesajı Ekle
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectPaymentId(null)}>İptal</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (rejectPaymentId && rejectReason.trim()) {
                                    rejectNotificationMutation.mutate({ id: rejectPaymentId, adminNote: rejectReason });
                                    setRejectPaymentId(null);
                                }
                            }}
                            disabled={!rejectReason.trim()}
                        >
                            Reddet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Change Dialog (Cancel / Return) */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{statusDialogData?.title}</DialogTitle>
                        <DialogDescription>
                            {statusDialogData?.description} Bu bilgi müşteriye gösterilecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="statusReason" className="mb-2 block">{statusDialogData?.label}</Label>
                        <Textarea
                            id="statusReason"
                            value={statusDialogData?.reason || ""}
                            onChange={(e) => setStatusDialogData(prev => prev ? ({ ...prev, reason: e.target.value }) : null)}
                            placeholder={statusDialogData?.placeholder}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>İptal</Button>
                        <Button
                            onClick={async () => {
                                if (statusDialogData) {
                                    try {
                                        // 1. Create note for cancellation/return reason
                                        if (statusDialogData.reason) {
                                            await apiRequest("POST", `/api/admin/orders/${statusDialogData.orderId}/notes`, {
                                                note: statusDialogData.reason,
                                                noteType: statusDialogData.newStatus === 'returned' ? 'return' : 'cancellation'
                                            });
                                            // Invalidate notes query to refresh list
                                            queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${statusDialogData.orderId}/notes`] });
                                        }

                                        // 2. Update order status
                                        updateOrderStatusMutation.mutate({
                                            id: statusDialogData.orderId,
                                            status: statusDialogData.newStatus,
                                            statusDetail: "" // Clear legacy detail field
                                        });
                                        setIsStatusDialogOpen(false);
                                    } catch (error) {
                                        toast({
                                            title: "Hata",
                                            description: "İşlem sırasında bir hata oluştu.",
                                            variant: "destructive",
                                        });
                                    }
                                }
                            }}
                        >
                            Kaydet ve Güncelle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
