/**
 * ChatWidget - Sağ alt köşede açılır chat penceresi
 * Kategori seçimli yapılandırılmış akış
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    MessageCircle,
    X,
    Send,
    Loader2,
    Bot,
    Headphones,
    ShoppingCart,
    ExternalLink,
    Package,
    Search,
    RotateCcw,
    CreditCard,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Kategori tanımları
const CATEGORIES = [
    { id: 'order', label: 'Sipariş Takibi', icon: Package, description: 'Siparişinizin durumunu öğrenin' },
    { id: 'product', label: 'Ürün Bilgisi', icon: Search, description: 'Ürünler hakkında bilgi alın' },
    { id: 'return', label: 'İade / Değişim', icon: RotateCcw, description: 'İade ve değişim işlemleri' },
    { id: 'payment', label: 'Ödeme Sorunu', icon: CreditCard, description: 'Ödeme ile ilgili sorunlar' },
    { id: 'other', label: 'Diğer', icon: HelpCircle, description: 'Diğer konular' },
];

// Misafir ID oluşturma
function createGuestId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Kullanıcı tipine göre session key oluştur
function getSessionStorageKey(userId?: number): string {
    if (userId) {
        return `chat_session_user_${userId}`;
    }
    return 'chat_session_guest';
}

// Misafir ID'sini al veya oluştur
function getOrCreateGuestId(): string {
    const stored = localStorage.getItem('chat_guest_id');
    if (stored) return stored;

    const newId = createGuestId();
    localStorage.setItem('chat_guest_id', newId);
    return newId;
}

// Session ID oluştur - kullanıcıya özgü
function createSessionId(userId?: number): string {
    if (userId) {
        return `user_${userId}_${Date.now()}`;
    }
    const guestId = getOrCreateGuestId();
    return `${guestId}_${Date.now()}`;
}

interface ProductCardProps {
    product: {
        id: number;
        name: string;
        price: number;
        image: string;
    };
}

function ProductCard({ product }: ProductCardProps) {
    const formattedPrice = (product.price / 100).toLocaleString('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border p-3 mt-2 max-w-[200px]">
            <img
                src={product.image}
                alt={product.name}
                className="w-full h-24 object-cover rounded-md mb-2"
            />
            <p className="font-medium text-sm truncate">{product.name}</p>
            <p className="text-orange-600 font-bold text-sm">{formattedPrice}</p>
            <div className="flex gap-1 mt-2">
                <Button size="sm" variant="default" className="text-xs flex-1 h-7 bg-orange-500 hover:bg-orange-600">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Sepet
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7 px-2" asChild>
                    <a href={`/products/${product.id}`}>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </Button>
            </div>
        </div>
    );
}

export function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Kullanıcının önceki ID'sini takip et (değişiklik tespiti için)
    const previousUserIdRef = useRef<number | null | undefined>(undefined);

    // Chat durumunu localStorage'dan yükle (sayfa yenilemede kaybolmasın)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
        const storageKey = getSessionStorageKey(user?.id);
        const stored = localStorage.getItem(`${storageKey}_category`);
        return stored;
    });

    const [hasStartedChat, setHasStartedChat] = useState(() => {
        const storageKey = getSessionStorageKey(user?.id);
        const stored = localStorage.getItem(`${storageKey}_started`);
        return stored === 'true';
    });

    // Session ID yönetimi - Kullanıcıya özgü
    const [sessionId, setSessionId] = useState(() => {
        const storageKey = getSessionStorageKey(user?.id);
        const stored = localStorage.getItem(storageKey);
        if (stored) return stored;

        const newId = createSessionId(user?.id);
        localStorage.setItem(storageKey, newId);
        return newId;
    });

    const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Kullanıcı değişikliğini izle (giriş/çıkış)
    useEffect(() => {
        const currentUserId = user?.id;
        const previousUserId = previousUserIdRef.current;

        // İlk render'da sadece ref'i güncelle
        if (previousUserId === undefined) {
            previousUserIdRef.current = currentUserId;
            return;
        }

        // Kullanıcı değiştiyse (giriş veya çıkış yaptı)
        if (previousUserId !== currentUserId) {
            console.log('[Chat] User changed:', previousUserId, '->', currentUserId);

            // Yeni kullanıcının session'ını yükle veya oluştur
            const storageKey = getSessionStorageKey(currentUserId);
            let newSessionId = localStorage.getItem(storageKey);

            if (!newSessionId) {
                newSessionId = createSessionId(currentUserId);
                localStorage.setItem(storageKey, newSessionId);
            }

            // Yeni kullanıcının chat durumunu yükle
            const storedCategory = localStorage.getItem(`${storageKey}_category`);
            const storedStarted = localStorage.getItem(`${storageKey}_started`);

            setSessionId(newSessionId);
            setSelectedCategory(storedCategory);
            setHasStartedChat(storedStarted === 'true');

            previousUserIdRef.current = currentUserId;
        }
    }, [user?.id]);

    // Session ID değiştiğinde localStorage'a kaydet
    useEffect(() => {
        const storageKey = getSessionStorageKey(user?.id);
        localStorage.setItem(storageKey, sessionId);
    }, [sessionId, user?.id]);

    // Chat durumunu localStorage'a kaydet
    useEffect(() => {
        const storageKey = getSessionStorageKey(user?.id);
        if (selectedCategory) {
            localStorage.setItem(`${storageKey}_category`, selectedCategory);
        } else {
            localStorage.removeItem(`${storageKey}_category`);
        }
    }, [selectedCategory, user?.id]);

    useEffect(() => {
        const storageKey = getSessionStorageKey(user?.id);
        localStorage.setItem(`${storageKey}_started`, hasStartedChat.toString());
    }, [hasStartedChat, user?.id]);
    const {
        chatSession,
        messages,
        isConnected,
        isBotTyping,
        isLoading,
        sendMessage,
    } = useChat({
        sessionId,
        customerName: user?.name,
        customerEmail: user?.email,
        category: selectedCategory || undefined,
        enabled: !!selectedCategory
    });

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isBotTyping]);

    // Focus input when category is selected
    useEffect(() => {
        if (selectedCategory && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [selectedCategory]);

    // 5 dakika inaktivite sonrası otomatik sonlandırma
    useEffect(() => {
        if (!hasStartedChat || !isOpen) return;

        const timeoutId = setTimeout(() => {
            // 5 dakika (300000ms) sonra görüşmeyi sonlandır
            handleBack();
        }, 5 * 60 * 1000);

        // Her mesajda veya input değişikliğinde timer sıfırlanır
        return () => clearTimeout(timeoutId);
    }, [messages, inputValue, hasStartedChat, isOpen]);

    // Kategoriye özel yönlendirme mesajları
    const getCategoryGuidance = (categoryId: string): string => {
        switch (categoryId) {
            case 'order':
                return '[Sipariş Takibi] Sipariş kodumu öğrenmek istiyorum';
            case 'product':
                return '[Ürün Bilgisi] Ürünler hakkında bilgi almak istiyorum';
            case 'return':
                return '[İade/Değişim] İade ve değişim işlemleri hakkında bilgi almak istiyorum';
            case 'payment':
                return '[Ödeme Sorunu] Ödeme ile ilgili bir sorunum var';
            default:
                return '[Diğer] Yardıma ihtiyacım var';
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setHasStartedChat(true);
        // Kategoriye özel yönlendirme mesajını otomatik gönder
        setTimeout(() => {
            sendMessage(getCategoryGuidance(categoryId));
        }, 500);
    };

    const handleSend = () => {
        if (!inputValue.trim() || !selectedCategory) return;

        // İlk mesajda kategori bilgisini ekle
        let messageToSend = inputValue.trim();
        if (!hasStartedChat) {
            const category = CATEGORIES.find(c => c.id === selectedCategory);
            messageToSend = `[${category?.label}] ${messageToSend}`;
            setHasStartedChat(true);
        }

        sendMessage(messageToSend);
        setInputValue('');
    };

    const handleBack = () => {
        // End Chat - Kullanıcıya özgü session'ı temizle
        const storageKey = getSessionStorageKey(user?.id);
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_category`);
        localStorage.removeItem(`${storageKey}_started`);

        setSelectedCategory(null);
        setHasStartedChat(false);
        setSessionId(createSessionId(user?.id)); // Yeni session oluştur
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getStatusBadge = () => {
        if (!chatSession) return null;

        switch (chatSession.status) {
            case 'BOT_MODE':
                return <Badge variant="secondary" className="text-xs"><Bot className="w-3 h-3 mr-1" /> MotoBot</Badge>;
            case 'WAITING_FOR_AGENT':
                return <Badge variant="outline" className="text-xs animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Bekliyor...</Badge>;
            case 'AGENT_MODE':
                return <Badge className="text-xs bg-green-500"><Headphones className="w-3 h-3 mr-1" /> Canlı Destek</Badge>;
            default:
                return null;
        }
    };

    const getPlaceholder = () => {
        switch (selectedCategory) {
            case 'order': return 'Sipariş kodunuzu yazın (örn: MS-XXXXX)...';
            case 'product': return 'Hangi ürünü arıyorsunuz?';
            case 'return': return 'İade/değişim talebinizi açıklayın...';
            case 'payment': return 'Ödeme sorununuzu açıklayın...';
            default: return 'Sorununuzu açıklayın...';
        }
    };

    return (
        <>
            {/* Chat Button - Zıplama yok, sadece hover efekti */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isOpen
                        ? "bg-gray-700 hover:bg-gray-800 rotate-90"
                        : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-110"
                )}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-24 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 origin-bottom-right",
                    isOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                )}
                style={{ height: '520px', maxHeight: 'calc(100vh - 150px)' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Moto Shop Destek</h3>
                            <p className="text-xs text-white/80">
                                {isConnected ? 'Çevrimiçi' : 'Bağlanılıyor...'}
                            </p>
                        </div>
                    </div>
                    {hasStartedChat && getStatusBadge()}
                </div>

                {/* Content Area */}
                {!selectedCategory ? (
                    /* Kategori Seçim Ekranı */
                    <div className="flex-1 p-4 flex flex-col">
                        <div className="text-center mb-4">
                            <h4 className="font-medium text-gray-800">Nasıl yardımcı olabiliriz?</h4>
                            <p className="text-sm text-gray-500">Lütfen konunuzu seçin</p>
                        </div>

                        <div className="space-y-2 flex-1">
                            {CATEGORIES.map((category) => {
                                const Icon = category.icon;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategorySelect(category.id)}
                                        className="w-full p-3 flex items-center gap-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                            <Icon className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{category.label}</p>
                                            <p className="text-xs text-gray-500">{category.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : !hasStartedChat ? (
                    /* İlk Soru Yazma Ekranı */
                    <div className="flex-1 p-4 flex flex-col">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" /> Geri
                        </button>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            {(() => {
                                const category = CATEGORIES.find(c => c.id === selectedCategory);
                                const Icon = category?.icon || HelpCircle;
                                return (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                                            <Icon className="w-8 h-8 text-orange-600" />
                                        </div>
                                        <h4 className="font-medium text-gray-800 mb-2">{category?.label}</h4>
                                        <p className="text-sm text-gray-500 mb-6">Sorununuzu aşağıya yazın</p>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Input for first message */}
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={getPlaceholder()}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Sohbet Ekranı */
                    <>
                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex",
                                                msg.sender === 'USER' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[80%] rounded-2xl px-4 py-2",
                                                    msg.sender === 'USER'
                                                        ? "bg-orange-500 text-white rounded-br-none"
                                                        : msg.sender === 'AGENT'
                                                            ? "bg-green-500 text-white rounded-bl-none"
                                                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                                                )}
                                            >
                                                {/* Sender icon for non-user messages */}
                                                {msg.sender !== 'USER' && (
                                                    <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                                                        {msg.sender === 'BOT' ? (
                                                            <><Bot className="w-3 h-3" /> MotoBot</>
                                                        ) : (
                                                            <><Headphones className="w-3 h-3" /> Müşteri Temsilcisi</>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Message content - kategori prefix'ini gizle */}
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {msg.content.replace(/^\[.*?\]\s*/, '')}
                                                </p>

                                                {/* Product cards */}
                                                {msg.metadata?.products && msg.metadata.products.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {msg.metadata.products.map((product: any) => (
                                                            <ProductCard key={product.id} product={product} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing indicator */}
                                    {isBotTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Mesajınızı yazın..."
                                    className="flex-1"
                                    disabled={chatSession?.status === 'CLOSED'}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || chatSession?.status === 'CLOSED'}
                                    className="bg-orange-500 hover:bg-orange-600"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>

                            {chatSession?.status === 'CLOSED' ? (
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    Bu sohbet kapatılmış.
                                </p>
                            ) : isConfirmingEnd ? (
                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-xs text-red-600 text-center mb-2 font-medium">
                                        Görüşmeyi sonlandırmak istediğinize emin misiniz?
                                        <br />
                                        <span className="text-[10px] font-normal opacity-80">Sohbet geçmişi silinecektir.</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsConfirmingEnd(false)}
                                            className="flex-1 py-1.5 text-xs bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleBack();
                                                setIsConfirmingEnd(false);
                                            }}
                                            className="flex-1 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            Evet, Sonlandır
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsConfirmingEnd(true)}
                                    className="w-full mt-3 text-xs text-gray-500 hover:text-red-500 transition-colors py-2 border border-gray-200 rounded-lg hover:border-red-300"
                                >
                                    Görüşmeyi Sonlandır
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
