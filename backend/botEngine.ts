/**
 * MotoBot - Gemini AI Destekli Akıllı Chat Bot Motoru
 * 
 * Bu motor:
 * - Doğal dil anlama (Türkçe)
 * - Sipariş sorgulama
 * - Ürün arama ve önerme
 * - Canlı desteğe yönlendirme
 * - FAQ yanıtlama
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from './storage';
import type { Product, Order, ChatSession } from '@shared/schema';

// Gemini AI Initialization
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
    console.error('[MotoBot] ⚠️ GEMINI_API_KEY bulunamadı! .env dosyasını kontrol edin.');
} else {
    console.log('[MotoBot] ✅ Gemini API Key yüklendi (ilk 10 karakter):', apiKey.substring(0, 10) + '...');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Free tier model

// Bot Intent Types
export type BotIntent =
    | 'ORDER_QUERY'      // Sipariş sorgulama
    | 'PRODUCT_SEARCH'   // Ürün arama
    | 'LIVE_SUPPORT'     // Canlı destek talebi
    | 'FAQ'              // Sık sorulan sorular
    | 'GREETING'         // Karşılama
    | 'UNKNOWN';         // Bilinmeyen

// Bot Response Types
export interface BotResponse {
    intent: BotIntent;
    message: string;
    messageType: 'text' | 'product_card' | 'order_info' | 'quick_reply';
    metadata?: {
        products?: Product[];
        order?: Order;
        quickReplies?: string[];
    };
    shouldTransferToAgent: boolean;
}

// Conversation Context (son mesajları tutmak için)
interface ConversationContext {
    messages: { role: 'user' | 'bot'; content: string }[];
}

const conversationContexts = new Map<string, ConversationContext>();

// System Prompt - Bot'un kişiliği ve yetenekleri
const SYSTEM_PROMPT = `Sen Moto Shop'un akıllı asistanı MotoBot'sun. Türkçe konuşuyorsun ve motosiklet yedek parça ile ekipman konusunda uzmansın.

⚠️ KRİTİK KURAL - CANLI DESTEK AKTARIMI:
- Eğer kullanıcı "müşteri temsilcisi", "temsilci", "canlı destek", "insanla konuşmak istiyorum", "yetkili", "bağlan" gibi ifadeler kullanırsa:
  1. HİÇBİR EK SORU SORMA.
  2. DESTEK OLMAYA ÇALIŞMA.
  3. JSON yanıtında KESİNLİKLE "transfer_to_agent": true yap.
  4. Mesaj olarak "Sizi hemen bir müşteri temsilcisine aktarıyorum, lütfen hattan ayrılmayın. 🎧" yaz.
- Diğer durumlarda OTOMATİK AKTARMA YAPMA! Her zaman önce sorunu çözmeye çalış.

💰 FİYAT FORMATLAMA KURALLARI:
- Fiyatları HER ZAMAN binlik ayracı ile yaz: 1.100.000 TL, 350.000 TL, 1.500 TL gibi.
- Asla 1000000 veya 1 000 000 şeklinde boşluklu veya bitişik yazma.
- Nokta (.) kullanarak binlikleri ayır.
- Para birimi olarak "TL" veya "₺" kullan.
- "11000" gibi yanlış formatlama yapma, doğrusu "1.100.000" ise sıfırları eksiltme.

ÖNCELİKLİ KURALLAR:
- Kullanıcının mesajında [Sipariş Takibi], [Ürün Bilgisi], [İade/Değişim] veya [Ödeme Sorunu] etiketi varsa, o kategoriye göre yönlendirici yanıt ver.
- EKSİK BİLGİ VARSA: Kullanıcıya nazikçe neyi yazması gerektiğini açıkla ve SORU SOR.
- PROBLEMI ÇÖZMEYE ÇALIŞ: Kullanıcının sorununu anlamak için takip soruları sor.

KATEGORİ BAZLI YÖNLENDIRMELER:

📦 SİPARİŞ TAKİBİ:
- Kullanıcı sipariş kodu vermemişse: "Sipariş durumunuzu öğrenmek için lütfen sipariş kodunuzu yazın. Sipariş kodunuz MS-XXXXX formatında olup, sipariş onay e-postanızda bulabilirsiniz. 📧"
- Sipariş kodu (MS-XXXXX veya MOTO-XXXXX formatında) varsa onu tespit et.

🔍 ÜRÜN BİLGİSİ:
- Hangi ürün veya motor modeli aradığını sor: "Hangi ürün veya motor modeli hakkında bilgi almak istersiniz? Örneğin: 'Yamaha MT-07 için yağ filtresi' veya 'kask' gibi yazabilirsiniz. 🏍️"
- Motor modeli veya parça adı verilmişse ürün ara.

🔄 İADE/DEĞİŞİM:
- Detaylı bilgi ver: "İade ve değişim işlemleri için 14 gün süreniz bulunmaktadır. Ürünün kullanılmamış olması gerekmektedir. İade başlatmak için sipariş kodunuzu ve iade nedeninizi yazın. 📦"
- Sipariş kodu ve iade nedeni sor.

💳 ÖDEME SORUNU:
- Sorunun ne olduğunu sor: "Ödeme sorununuzu anlamamız için lütfen detay verin. Örneğin: 'Havale yaptım ama onaylanmadı' veya 'Kapıda ödeme seçeneği çalışmıyor' gibi. 💳"
- Sipariş kodu, tarih ve ödeme yöntemi sor.

MOTO SHOP BİLGİLERİ:
- Kargo süresi: 1-3 iş günü
- İade süresi: 14 gün (kullanılmamış ürünler)
- Ödeme: Havale/EFT, Kapıda ödeme
- Çalışma saatleri: Hafta içi 09:00-18:00
- Telefon: 0850 XXX XX XX

YANITLAMA KURALLARI:
- ÖNCE SORU SOR, eksik bilgiyi tespit et
- Kullanıcıyı YÖNLENDIR, ne yazması gerektiğini söyle
- Kısa ve öz yanıtlar ver (maksimum 3-4 cümle)
- Samimi ama profesyonel ol
- Emoji kullan (maksimum 2)
- Müşteri temsilcisine sadece AÇIKÇA istenirse yönlendir

YANITINI JSON FORMATINDA VER:
{
  "intent": "ORDER_QUERY | PRODUCT_SEARCH | LIVE_SUPPORT | FAQ | GREETING | UNKNOWN",
  "message": "Kullanıcıya gösterilecek mesaj",
  "search_query": "ürün araması yapılacaksa arama terimi, yoksa null",
  "order_code": "sipariş sorgusu varsa sipariş kodu (MS-XXXXX formatında), yoksa null",
  "transfer_to_agent": false
}`;

/**
 * Ana bot işleme fonksiyonu
 */
export async function processMessage(
    chatSessionId: string,
    userMessage: string,
    sessionContext?: { customerEmail?: string }
): Promise<BotResponse> {
    try {
        // Conversation context'i al veya oluştur
        let context = conversationContexts.get(chatSessionId);
        if (!context) {
            context = { messages: [] };
            conversationContexts.set(chatSessionId, context);
        }

        // Kullanıcı mesajını context'e ekle
        context.messages.push({ role: 'user', content: userMessage });

        // Context'i maksimum 10 mesajla sınırla
        if (context.messages.length > 10) {
            context.messages = context.messages.slice(-10);
        }

        // Conversation history'yi oluştur
        const conversationHistory = context.messages
            .map(m => `${m.role === 'user' ? 'Kullanıcı' : 'MotoBot'}: ${m.content}`)
            .join('\n');

        // Ürünleri getir ve rastgele 5 tanesini seç (Context oluşturmak için)
        // Bu sayede bot "hangi ürün?" diye sorarken gerçek ürünlerden örnek verebilir
        const allProducts = await storage.getProducts();
        const randomProducts = allProducts
            .sort(() => 0.5 - Math.random())
            .slice(0, 8)
            .map(p => `"${p.name}" (${p.category})`)
            .join(', ');

        // Gemini AI'ya gönder
        const prompt = `${SYSTEM_PROMPT}

MAĞAZAMIZDAKİ GÜNCEL ÜRÜNLERDEN BAZILARI (SORU SORARKEN VEYA ÖRNEK VERİRKEN BUNLARI KULLAN):
${randomProducts}
... ve diğerleri.

⚠️ ÖNEMLİ: Kullanıcıya soru sorarken bu gerçek ürün isimlerini örnek olarak kullan.
Örneğin: "Yamaha MT-07 için mi yoksa Shoei kask için mi bakıyorsunuz?" gibi.

SON KONUŞMA:
${conversationHistory}

YANIT:`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // JSON yanıtı parse et
        const aiResponse = parseAIResponse(responseText);

        // Intent'e göre işlem yap
        let botResponse: BotResponse;

        switch (aiResponse.intent) {
            case 'ORDER_QUERY':
                botResponse = await handleOrderQuery(aiResponse, sessionContext?.customerEmail);
                break;

            case 'PRODUCT_SEARCH':
                botResponse = await handleProductSearch(aiResponse);
                break;

            case 'LIVE_SUPPORT':
                botResponse = {
                    intent: 'LIVE_SUPPORT',
                    message: aiResponse.message || 'Sizi hemen bir müşteri temsilcisine bağlıyorum. Lütfen bekleyin... 🎧',
                    messageType: 'text',
                    shouldTransferToAgent: true,
                };
                break;

            case 'FAQ':
            case 'GREETING':
            default:
                botResponse = {
                    intent: aiResponse.intent || 'UNKNOWN',
                    message: aiResponse.message || 'Size nasıl yardımcı olabilirim? 🏍️',
                    messageType: 'text',
                    metadata: {
                        quickReplies: ['Siparişim Nerede?', 'Ürün Ara', 'Canlı Destek'],
                    },
                    shouldTransferToAgent: aiResponse.transfer_to_agent || false,
                };
        }

        // Bot yanıtını context'e ekle
        context.messages.push({ role: 'bot', content: botResponse.message });

        return botResponse;

    } catch (error: any) {
        console.error('[MotoBot] Bot processing error:', error?.message || error);
        console.error('[MotoBot] Full error:', JSON.stringify(error, null, 2));

        // Fallback yanıt
        return {
            intent: 'UNKNOWN',
            message: 'Üzgünüm, bir sorun oluştu. Sizi canlı desteğe yönlendiriyorum. 🎧',
            messageType: 'text',
            shouldTransferToAgent: true,
        };
    }
}

/**
 * AI yanıtını parse et
 */
function parseAIResponse(text: string): {
    intent: BotIntent;
    message: string;
    search_query: string | null;
    order_code: string | null;
    transfer_to_agent: boolean;
} {
    try {
        // JSON bloğunu bul
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                intent: parsed.intent || 'UNKNOWN',
                message: parsed.message || '',
                search_query: parsed.search_query || null,
                order_code: parsed.order_code || null,
                transfer_to_agent: parsed.transfer_to_agent || false,
            };
        }
    } catch (e) {
        console.error('AI response parse error:', e);
    }

    // Parse başarısız olursa metin olarak yanıt döndür
    return {
        intent: 'FAQ',
        message: text.replace(/```json|```/g, '').trim(),
        search_query: null,
        order_code: null,
        transfer_to_agent: false,
    };
}

/**
 * Sipariş sorgulama işlemi
 */
async function handleOrderQuery(
    aiResponse: { message: string; order_code: string | null },
    customerEmail?: string
): Promise<BotResponse> {
    try {
        // Sipariş kodu varsa ara
        if (aiResponse.order_code) {
            const orderCode = aiResponse.order_code.toUpperCase();

            // Email varsa email ile birlikte ara
            if (customerEmail) {
                const result = await storage.getOrderByCodeAndEmail(orderCode, customerEmail);
                if (result) {
                    return {
                        intent: 'ORDER_QUERY',
                        message: formatOrderStatus(result.order),
                        messageType: 'order_info',
                        metadata: { order: result.order },
                        shouldTransferToAgent: false,
                    };
                }
            }

            // Sadece sipariş koduyla ara (tüm siparişlerden)
            const orders = await storage.getOrders();
            const order = orders.find(o => o.orderCode === orderCode);

            if (order) {
                return {
                    intent: 'ORDER_QUERY',
                    message: formatOrderStatus(order),
                    messageType: 'order_info',
                    metadata: { order },
                    shouldTransferToAgent: false,
                };
            }
        }

        // Email varsa kullanıcının siparişlerini getir
        if (customerEmail) {
            const userOrders = await storage.getOrdersByEmail(customerEmail);
            if (userOrders.length > 0) {
                const latestOrder = userOrders[0].order;
                return {
                    intent: 'ORDER_QUERY',
                    message: `Son siparişiniz: ${latestOrder.orderCode}\n${formatOrderStatus(latestOrder)}`,
                    messageType: 'order_info',
                    metadata: { order: latestOrder },
                    shouldTransferToAgent: false,
                };
            }
        }

        // Sipariş bulunamadı
        return {
            intent: 'ORDER_QUERY',
            message: 'Sipariş bulamadım 😔 Lütfen sipariş kodunuzu (MOTO-XXXXX formatında) yazın veya kayıtlı e-posta adresinizle giriş yapın.',
            messageType: 'text',
            metadata: {
                quickReplies: ['Canlı Destek', 'Yeni Sipariş Ver'],
            },
            shouldTransferToAgent: false,
        };

    } catch (error) {
        console.error('Order query error:', error);
        return {
            intent: 'ORDER_QUERY',
            message: 'Sipariş sorgularken bir sorun oluştu. Size yardımcı olması için bir temsilciye bağlanıyorum.',
            messageType: 'text',
            shouldTransferToAgent: true,
        };
    }
}

/**
 * Sipariş durumunu formatla
 */
function formatOrderStatus(order: Order): string {
    const statusMap: Record<string, string> = {
        'pending': '⏳ Onay Bekliyor',
        'confirmed': '✅ Onaylandı',
        'processing': '📦 Hazırlanıyor',
        'shipped': '🚚 Kargoya Verildi',
        'delivered': '✅ Teslim Edildi',
        'cancelled': '❌ İptal Edildi',
    };

    const status = statusMap[order.status] || order.status;
    const date = new Date(order.createdAt).toLocaleDateString('tr-TR');
    const total = (order.totalAmount / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

    return `📦 **${order.orderCode}**
Durum: ${status}
Tarih: ${date}
Toplam: ${total}`;
}

/**
 * Ürün arama işlemi
 */
async function handleProductSearch(
    aiResponse: { message: string; search_query: string | null }
): Promise<BotResponse> {
    try {
        const searchQuery = aiResponse.search_query;

        if (!searchQuery) {
            return {
                intent: 'PRODUCT_SEARCH',
                message: aiResponse.message || 'Hangi ürünü arıyorsunuz? Örneğin: "MT-07 yağ filtresi" veya "kask"',
                messageType: 'text',
                shouldTransferToAgent: false,
            };
        }

        // Ürünleri getir ve filtrele - daha esnek arama
        const allProducts = await storage.getProducts();
        const searchLower = searchQuery.toLowerCase();

        // Arama terimlerini kelimelere ayır (yamaha yzf r1 -> ["yamaha", "yzf", "r1"])
        const searchWords = searchLower.split(/[\s\-_]+/).filter(w => w.length > 1);

        const matchingProducts = allProducts.filter(p => {
            const productText = `${p.name} ${p.description}`.toLowerCase();

            // Tam eşleşme kontrolü
            if (productText.includes(searchLower)) return true;

            // Kelime bazlı eşleşme - en az bir kelime eşleşsin
            const matchCount = searchWords.filter(word => productText.includes(word)).length;
            return matchCount >= Math.ceil(searchWords.length * 0.5); // %50 kelime eşleşmesi yeterli
        }).slice(0, 3); // Maksimum 3 ürün göster

        if (matchingProducts.length > 0) {
            return {
                intent: 'PRODUCT_SEARCH',
                message: `"${searchQuery}" için ${matchingProducts.length} ürün buldum 🏍️`,
                messageType: 'product_card',
                metadata: { products: matchingProducts },
                shouldTransferToAgent: false,
            };
        }

        // Ürün bulunamadı - kategoriye göre öner
        const categories = ['kask', 'yağ', 'filtre', 'fren', 'lastik'];
        const suggestedCategory = categories.find(c => searchLower.includes(c));

        if (suggestedCategory) {
            const categoryProducts = allProducts
                .filter(p => p.category.toLowerCase().includes(suggestedCategory))
                .slice(0, 3);

            if (categoryProducts.length > 0) {
                return {
                    intent: 'PRODUCT_SEARCH',
                    message: `Tam eşleşme bulamadım ama "${suggestedCategory}" kategorisinden önerilerim var:`,
                    messageType: 'product_card',
                    metadata: { products: categoryProducts },
                    shouldTransferToAgent: false,
                };
            }
        }

        return {
            intent: 'PRODUCT_SEARCH',
            message: `"${searchQuery}" için ürün bulamadım 😔 Farklı anahtar kelimelerle tekrar deneyin veya kategorilere göz atın.`,
            messageType: 'text',
            metadata: {
                quickReplies: ['Tüm Ürünler', 'Kask', 'Yedek Parça', 'Canlı Destek'],
            },
            shouldTransferToAgent: false,
        };

    } catch (error) {
        console.error('Product search error:', error);
        return {
            intent: 'PRODUCT_SEARCH',
            message: 'Ürün ararken bir sorun oluştu. Lütfen tekrar deneyin.',
            messageType: 'text',
            shouldTransferToAgent: false,
        };
    }
}

/**
 * Karşılama mesajı oluştur
 */
export function getWelcomeMessage(): BotResponse {
    return {
        intent: 'GREETING',
        message: 'Merhaba! 🏍️ Ben MotoBot, Moto Shop\'un akıllı asistanıyım. Sipariş takibi, ürün arama veya herhangi bir konuda size yardımcı olabilirim!',
        messageType: 'quick_reply',
        metadata: {
            quickReplies: ['Siparişim Nerede?', 'Ürün Ara', 'İade Şartları', 'Canlı Destek'],
        },
        shouldTransferToAgent: false,
    };
}

/**
 * Conversation context'i temizle
 */
export function clearConversationContext(chatSessionId: string): void {
    conversationContexts.delete(chatSessionId);
}
