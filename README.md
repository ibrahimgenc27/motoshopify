<p align="center">
  <img src="https://img.shields.io/badge/🏍️-MotoShop-FF6B00?style=for-the-badge&labelColor=1a1a2e" alt="MotoShop" height="40"/>
</p>

<h1 align="center">🏍️ MotoShop — Motosiklet E-Ticaret Platformu</h1>

<p align="center">
  <strong>Full-stack, AI destekli, gerçek zamanlı müşteri desteğine sahip modern bir motosiklet e-ticaret uygulaması.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini"/>
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSocket"/>
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle"/>
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/📄_Lisans-MIT-green?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/📦_Version-1.0.0-blue?style=flat-square" alt="Version"/>
</p>

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Temel Özellikler](#-temel-özellikler)
- [Mimari & Teknoloji Yığını](#-mimari--teknoloji-yığını)
- [Veritabanı Tasarımı](#-veritabanı-tasarımı)
- [Proje Yapısı](#-proje-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Kurulum & Çalıştırma](#-kurulum--çalıştırma)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Geliştirici](#-geliştirici)

---

## 🎯 Proje Hakkında

**MotoShop**, motosiklet, ekipman ve yedek parça satışı için geliştirilmiş **tam donanımlı bir e-ticaret platformudur.** Proje, modern web teknolojileri kullanılarak sıfırdan tasarlanmış olup; ürün kataloğu, sepet yönetimi, sipariş takibi, havale/EFT ödeme bildirimi, ürün değerlendirme sistemi ve **Google Gemini AI destekli akıllı chatbot** gibi kapsamlı özelliklere sahiptir.

### Neden Bu Proje?

- 🧠 **AI Entegrasyonu** — Gemini 2.0 Flash modeli ile Türkçe doğal dil anlayan akıllı müşteri destek botu
- ⚡ **Gerçek Zamanlı İletişim** — WebSocket altyapısı ile anlık canlı destek ve bot-kullanıcı etkileşimi
- 🏗️ **Full-Stack Mimari** — Monorepo yapı: frontend, backend ve shared modüller tek proje altında
- 🔒 **Güvenlik** — bcrypt ile şifre hash'leme, session tabanlı kimlik doğrulama, admin yetkilendirme middleware'i
- 📊 **Admin Dashboard** — Sipariş yönetimi, ürün CRUD, Excel ile toplu stok güncelleme, ödeme onayı ve canlı destek paneli

---

## ✨ Temel Özellikler

### 🛒 E-Ticaret Modülü
| Özellik | Açıklama |
|---------|----------|
| **Ürün Kataloğu** | Motosiklet, ekipman ve yedek parça kategorileri; çoklu resim, renk seçimi ve teknik özellikler desteği |
| **Sepet Yönetimi** | Session bazlı sepet; anlık ekleme, çıkarma ve miktar güncelleme |
| **Sipariş Sistemi** | Transaction ile atomik sipariş oluşturma, otomatik stok düşümü, benzersiz sipariş kodu (MS-XXXXX) |
| **Sipariş Takibi** | Kullanıcı panelinden ve misafir olarak (sipariş kodu + e-posta ile) takip |
| **Ödeme Bildirimi** | Havale/EFT sonrası ödeme bildirim formu; admin onay/red mekanizması |
| **Ürün Yorumları** | Kayıtlı kullanıcılar tarafından yıldız puanlama ve yorum; fotoğraf/video ekleme desteği |

### 🤖 AI Chatbot (MotoBot)
| Özellik | Açıklama |
|---------|----------|
| **Doğal Dil Anlama** | Google Gemini 2.0 Flash modeli ile Türkçe doğal dil işleme |
| **Sipariş Sorgulama** | Kullanıcının sipariş kodunu tespit edip veritabanından durumunu çekme |
| **Ürün Arama** | Kelime bazlı esnek arama; %50 kelime eşleşmesi ile fuzzy matching |
| **Kategori Yönlendirme** | Sipariş, ürün, iade, ödeme kategorilerine göre bağlama duyarlı yanıtlar |
| **Canlı Desteğe Aktarım** | Kullanıcı talep ettiğinde otomatik olarak canlı destek kuyruğuna yönlendirme |
| **Konuşma Bağlamı** | Son 10 mesajı tutan konuşma hafızası ile tutarlı diyalog |

### 💬 Canlı Destek (WebSocket)
| Özellik | Açıklama |
|---------|----------|
| **Hibrit Sistem** | Bot → Bekleme → Canlı Destek akışı (durum makinesi: `BOT_MODE` → `WAITING_FOR_AGENT` → `AGENT_MODE` → `CLOSED`) |
| **Gerçek Zamanlı Mesajlaşma** | WebSocket ile anında mesaj iletimi, yazıyor göstergesi |
| **Admin Panel Entegrasyonu** | Bekleyen ve aktif sohbetleri görüntüleme, sohbete katılma |
| **Otomatik Yeniden Bağlanma** | Bağlantı koptuğunda 3 saniye sonra otomatik reconnect |

### 📦 Admin Paneli
| Özellik | Açıklama |
|---------|----------|
| **Sipariş Yönetimi** | Durum güncelleme (Onay Bekliyor → Onaylandı → Hazırlanıyor → Kargoda → Teslim Edildi), sipariş notları ekleme/düzenleme |
| **Ürün Yönetimi** | CRUD (Oluşturma, Okuma, Güncelleme, Silme), çoklu görsel yükleme (Multer ile 5MB limit) |
| **Excel Stok Import** | Stok şablonu indirme ve toplu stok güncelleme; hatalı satırlar için benzer ürün adı önerisi |
| **Ödeme Onayı** | Havale bildirimlerini onaylama/reddetme; onay sonrası otomatik sipariş durumu güncelleme |
| **Canlı Destek** | Bekleyen müşteri sohbetlerini görüntüleme ve sohbete katılma |

### 🔐 Kullanıcı & Güvenlik
| Özellik | Açıklama |
|---------|----------|
| **Kayıt & Giriş** | bcrypt (10 round) ile şifre hash'leme; e-posta, isim ve KVKK onayı |
| **Session Yönetimi** | Express-session ile sunucu taraflı oturum; cookie tabanlı kimlik bilgisi |
| **Admin Middleware** | `requireAdmin` middleware'i ile rol tabanlı erişim kontrolü |
| **Zod Validasyon** | Frontend ve backend'de ortak Zod şemaları ile girdi doğrulama (telefon formatı, e-posta vb.) |

---

## 🏗️ Mimari & Teknoloji Yığını

### Yüksek Seviye Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React 18 + TypeScript + TailwindCSS + Radix UI + Framer Motion │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Pages   │ │Components│ │  Hooks   │ │   React Query    │   │
│  │ (14 sayfa│ │(9 bileşen│ │(6 custom │ │  (Cache & Fetch) │   │
│  │  + 404)  │ │  + UI)   │ │  hook)   │ │                  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└────────────────────────┬──────────────────────┬─────────────────┘
                         │ REST API (HTTP)       │ WebSocket
┌────────────────────────▼──────────────────────▼─────────────────┐
│                     SERVER (Node.js)                            │
│  Express.js + TypeScript                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Routes  │ │ Storage  │ │BotEngine │ │   WebSocket      │   │
│  │(1636 LOC)│ │(648 LOC) │ │(480 LOC) │ │   Server (ws)    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                           │                      │              │
│              ┌────────────▼──────┐  ┌────────────▼───────────┐  │
│              │   Drizzle ORM     │  │  Google Gemini AI      │  │
│              │   (Type-safe DB)  │  │  (gemini-2.0-flash)    │  │
│              └────────┬──────────┘  └────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │    PostgreSQL     │
              │    (8 Tablo)      │
              └───────────────────┘
```

### Teknoloji Detayları

| Katman | Teknoloji | Versiyon | Kullanım Amacı |
|--------|-----------|----------|----------------|
| **Frontend** | React | 18.3 | SPA bileşen mimarisi |
| **Routing** | Wouter | 3.3 | Hafif, hook tabanlı client-side routing |
| **State/Cache** | TanStack Query | 5.x | Server state yönetimi, otomatik cache |
| **UI Kütüphanesi** | Radix UI | — | Erişilebilir, headless UI primitifleri (20+ bileşen) |
| **Stil** | TailwindCSS | 3.4 | Utility-first CSS framework |
| **Animasyon** | Framer Motion | 11.x | Sayfa geçişleri ve mikro-animasyonlar |
| **Form** | React Hook Form + Zod | — | Performanslı form yönetimi ve validasyon |
| **Grafikler** | Recharts | 2.x | Admin dashboard grafikleri |
| **Backend** | Express.js | 4.x | RESTful API sunucusu |
| **ORM** | Drizzle ORM | 0.39 | Type-safe SQL sorgu oluşturucu |
| **Veritabanı** | PostgreSQL | 14+ | İlişkisel veritabanı |
| **Gerçek Zamanlı** | ws (WebSocket) | 8.x | Çift yönlü gerçek zamanlı iletişim |
| **AI** | Google Generative AI | 0.24 | Gemini 2.0 Flash ile doğal dil işleme |
| **Şifreleme** | bcrypt | 6.x | Şifre hash'leme (10 round salt) |
| **Dosya Yükleme** | Multer | 2.x | Ürün görseli yükleme (5MB limit) |
| **Excel İşleme** | SheetJS (xlsx) | 0.18 | Stok şablonu oluşturma ve import |
| **Validasyon** | Zod | 3.24 | Runtime tip doğrulama ve şema tanımlama |
| **Build** | Vite + ESBuild | 7.x | Hızlı HMR ve production bundling |

---

## 🗄️ Veritabanı Tasarımı

Projede **8 tablo** Drizzle ORM ile yönetilmektedir. Tüm şemalar `shared/schema.ts` dosyasında tanımlanarak frontend ve backend arasında paylaşılmaktadır.

```
┌───────────────┐       ┌───────────────┐       ┌───────────────────┐
│   products    │       │    orders      │       │    users          │
├───────────────┤       ├───────────────┤       ├───────────────────┤
│ id (PK)       │◄──┐   │ id (PK)       │       │ id (PK)           │
│ name          │   │   │ orderCode (UQ)│       │ email (UQ)        │
│ description   │   │   │ sessionId     │       │ password (hashed) │
│ price         │   │   │ customerName  │       │ name              │
│ originalPrice │   │   │ customerEmail │       │ role (user/admin) │
│ image         │   │   │ address       │       │ privacyAccepted   │
│ images[]      │   │   │ totalAmount   │       │ commercialConsent │
│ category      │   │   │ status        │       │ createdAt         │
│ specs (JSONB) │   │   │ paymentStatus │       └───────────────────┘
│ stock         │   │   │ paymentMethod │
│ colors[]      │   │   │ createdAt     │       ┌───────────────────┐
└───────────────┘   │   └──────┬────────┘       │  chat_sessions    │
                    │          │                 ├───────────────────┤
┌───────────────┐   │   ┌──────▼────────┐       │ id (PK, UUID)     │
│  cart_items   │   │   │  order_items  │       │ sessionId         │
├───────────────┤   │   ├───────────────┤       │ userId (FK?)      │
│ id (PK)       │   │   │ id (PK)       │       │ category          │
│ sessionId     │   └───┤ productId(FK) │       │ status (enum)     │
│ productId(FK) │       │ orderId (FK)  │       │ agentId           │
│ quantity      │       │ quantity      │       │ customerName      │
│ selectedColor │       │ price         │       │ customerEmail     │
└───────────────┘       │ selectedColor │       │ createdAt         │
                        └───────────────┘       └──────┬────────────┘
                                                       │
┌───────────────────┐   ┌───────────────────┐   ┌──────▼────────────┐
│   order_notes     │   │payment_notifications│ │  chat_messages    │
├───────────────────┤   ├───────────────────┤   ├───────────────────┤
│ id (PK)           │   │ id (PK)           │   │ id (PK, UUID)     │
│ orderId (FK)      │   │ orderId (FK)      │   │ chatSessionId(FK) │
│ note              │   │ senderName        │   │ sender (enum)     │
│ noteType          │   │ bankName          │   │ content           │
│ orderStatus       │   │ amount            │   │ messageType       │
│ createdAt         │   │ transferDate      │   │ metadata (JSONB)  │
│ updatedAt         │   │ status            │   │ isRead            │
└───────────────────┘   │ adminNote         │   │ createdAt         │
                        │ notificationDate  │   └───────────────────┘
                        └───────────────────┘
```

---

## 📁 Proje Yapısı

```
motoshopify/
├── backend/                     # 🖥️ Express.js API Sunucusu
│   ├── index.ts                 #    Sunucu başlatma, session ve middleware konfigürasyonu
│   ├── routes.ts                #    Tüm API endpoint'leri (1636 satır)
│   │                            #    - Ürün, Sepet, Sipariş CRUD
│   │                            #    - Auth (Register/Login/Logout)
│   │                            #    - Admin (requireAdmin middleware)
│   │                            #    - Ödeme bildirimi onay/red
│   │                            #    - WebSocket chat sunucusu
│   │                            #    - Excel stok import/export
│   │                            #    - Ürün yorum yönetimi
│   ├── storage.ts               #    Veritabanı erişim katmanı (IStorage interface + DatabaseStorage)
│   ├── botEngine.ts             #    Gemini AI chatbot motoru (intent analiz, sipariş sorgu, ürün arama)
│   ├── db.ts                    #    PostgreSQL bağlantı yapılandırması
│   ├── vite.ts                  #    Vite dev server entegrasyonu
│   └── static.ts                #    Production static file serving
│
├── frontend/                    # ⚛️ React SPA
│   ├── index.html               #    Giriş noktası HTML
│   └── src/
│       ├── App.tsx              #    Router tanımları ve global providers
│       ├── main.tsx             #    React DOM render
│       ├── index.css            #    Global stiller
│       │
│       ├── pages/               #    📄 Sayfa Bileşenleri (14 sayfa)
│       │   ├── Home.tsx         #       Ana sayfa (hero, kategoriler, öne çıkan ürünler)
│       │   ├── ProductList.tsx  #       Ürün listeleme (kategori filtreleme)
│       │   ├── ProductDetail.tsx#       Ürün detay (galeri, renk seçimi, sepete ekle)
│       │   ├── Cart.tsx         #       Sepet sayfası (miktar düzenleme, toplam)
│       │   ├── Checkout.tsx     #       Ödeme sayfası (adres, iletişim formu)
│       │   ├── CheckoutSuccess.tsx#     Sipariş başarı sayfası
│       │   ├── OrderComplete.tsx#       Sipariş tamamlama ve ödeme yönlendirme
│       │   ├── OrderTracking.tsx#       Misafir sipariş takibi (kod + e-posta)
│       │   ├── MyOrders.tsx     #       Kullanıcı sipariş geçmişi
│       │   ├── PaymentNotification.tsx# Havale/EFT bildirim formu
│       │   ├── Login.tsx        #       Giriş sayfası
│       │   ├── Register.tsx     #       Kayıt sayfası (KVKK onayı dahil)
│       │   ├── Admin.tsx        #       Admin paneli (123KB - tam dashboard)
│       │   └── not-found.tsx    #       404 sayfası
│       │
│       ├── components/          #    🧩 Yeniden Kullanılabilir Bileşenler
│       │   ├── Header.tsx       #       Navigasyon, sepet ikonu, kullanıcı menüsü
│       │   ├── Footer.tsx       #       Site alt bilgi alanı
│       │   ├── ChatWidget.tsx   #       AI chatbot widget (27KB - tam chat UI)
│       │   ├── CartDrawer.tsx   #       Yan panel sepet görünümü
│       │   ├── ProductCard.tsx  #       Ürün kartı bileşeni
│       │   ├── ProductReviews.tsx#      Yorum sistemi (yıldız, fotoğraf, video)
│       │   ├── OrderNotes.tsx   #       Sipariş not bileşeni (admin)
│       │   ├── StockImportPanel.tsx#    Excel stok import paneli (admin)
│       │   ├── AnnouncementBar.tsx#     Üst bildirim çubuğu
│       │   └── ui/              #       shadcn/ui bileşen kütüphanesi
│       │
│       ├── hooks/               #    🪝 Custom React Hooks
│       │   ├── useChat.ts       #       WebSocket chat bağlantısı ve state yönetimi
│       │   ├── use-auth.ts      #       Kimlik doğrulama hook'u
│       │   ├── use-cart.ts      #       Sepet işlemleri hook'u
│       │   ├── use-products.ts  #       Ürün verileri hook'u
│       │   ├── use-toast.ts     #       Bildirim hook'u
│       │   └── use-mobile.tsx   #       Responsive tasarım hook'u
│       │
│       └── lib/                 #    📚 Yardımcı Fonksiyonlar
│           └── queryClient.ts   #       TanStack Query yapılandırması
│
├── shared/                      #    🔗 Frontend-Backend Ortak Modül
│   ├── schema.ts                #       Drizzle tablo tanımları + Zod şemaları + TypeScript tipleri
│   └── routes.ts                #       API endpoint tanımları ve URL builder
│
├── public/                      #    📂 Statik Dosyalar
│   └── uploads/                 #       Yüklenen ürün görselleri
│
├── script/                      #    🔧 Build Scriptleri
│   └── build.ts                 #       Production build süreci
│
├── drizzle.config.ts            #    Drizzle Kit yapılandırması
├── vite.config.ts               #    Vite yapılandırması
├── tailwind.config.ts           #    TailwindCSS yapılandırması
├── tsconfig.json                #    TypeScript yapılandırması
├── components.json              #    shadcn/ui bileşen yapılandırması
└── package.json                 #    Proje bağımlılıkları ve scriptler
```

---

## 📡 API Dokümantasyonu

### 🛍️ Ürünler

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `GET` | `/api/products` | Tüm ürünleri listele | — |
| `GET` | `/api/products/:id` | Ürün detayı getir | — |
| `GET` | `/api/products/category/:category` | Kategoriye göre filtrele | — |
| `POST` | `/api/admin/products` | Yeni ürün ekle | 🔒 Admin |
| `PUT` | `/api/admin/products/:id` | Ürün güncelle | 🔒 Admin |
| `DELETE` | `/api/admin/products/:id` | Ürün sil | 🔒 Admin |

### 🛒 Sepet

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `GET` | `/api/cart/:sessionId` | Sepet içeriğini getir | — |
| `POST` | `/api/cart` | Sepete ürün ekle | — |
| `PATCH` | `/api/cart/:id` | Miktar güncelle | — |
| `DELETE` | `/api/cart/:id` | Sepetten çıkar | — |
| `POST` | `/api/cart/clear/:sessionId` | Sepeti temizle | — |

### 📦 Siparişler

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `POST` | `/api/orders` | Sipariş oluştur (transaction ile atomik) | — |
| `GET` | `/api/orders` | Kullanıcının siparişleri | 🔒 User |
| `POST` | `/api/track-order` | Sipariş takip (kod + e-posta) | — |
| `GET` | `/api/admin/orders` | Tüm siparişleri listele | 🔒 Admin |
| `GET` | `/api/admin/orders/:id` | Sipariş detayı + ürünler | 🔒 Admin |
| `PATCH` | `/api/admin/orders/:id/status` | Sipariş durumu güncelle | 🔒 Admin |

### 💳 Ödeme Bildirimleri

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `POST` | `/api/payment-notification` | Havale bildirimi gönder | — |
| `GET` | `/api/admin/payment-notifications` | Tüm bildirimleri listele | 🔒 Admin |
| `POST` | `/api/admin/payment-notifications/:id/approve` | Ödeme onayla | 🔒 Admin |
| `POST` | `/api/admin/payment-notifications/:id/reject` | Ödeme reddet | 🔒 Admin |

### 🔐 Kimlik Doğrulama

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `POST` | `/api/auth/register` | Yeni kullanıcı kaydı | — |
| `POST` | `/api/auth/login` | Giriş yap | — |
| `POST` | `/api/auth/logout` | Çıkış yap | 🔒 User |
| `GET` | `/api/auth/me` | Mevcut kullanıcı bilgisi | — |

### 📝 Sipariş Notları

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `GET` | `/api/admin/orders/:id/notes` | Sipariş notlarını getir | 🔒 Admin |
| `POST` | `/api/admin/orders/:id/notes` | Not ekle | 🔒 Admin |
| `PUT` | `/api/admin/orders/notes/:noteId` | Not düzenle | 🔒 Admin |
| `DELETE` | `/api/admin/orders/notes/:noteId` | Not sil | 🔒 Admin |

### ⭐ Ürün Yorumları

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `GET` | `/api/products/:id/reviews` | Ürün yorumlarını getir | — |
| `POST` | `/api/products/:id/reviews` | Yorum ekle | 🔒 User |
| `PUT` | `/api/reviews/:id` | Yorum düzenle | 🔒 Owner/Admin |
| `DELETE` | `/api/reviews/:id` | Yorum sil | 🔒 Owner/Admin |

### 📊 Stok Yönetimi

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `GET` | `/api/admin/stock-template` | Excel stok şablonu indir | 🔒 Admin |
| `POST` | `/api/admin/stock-import` | Excel ile toplu stok güncelle | 🔒 Admin |

### 💬 Canlı Destek

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| `POST` | `/api/chat/session` | Chat oturumu başlat/devam et | — |
| `POST` | `/api/chat/request-agent` | Canlı destek talep et | — |
| `WS` | `/ws/chat` | WebSocket gerçek zamanlı mesajlaşma | — |
| `POST` | `/api/upload` | Görsel yükleme (5MB limit) | — |

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** 9+

### Adımlar

```bash
# 1. Repoyu klonlayın
git clone https://github.com/ibrahimgenc27/motoshopify.git
cd motoshopify

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini ayarlayın
# .env dosyası oluşturun ve aşağıdaki değişkenleri doldurun:
```

```env
# .env
DATABASE_URL=postgresql://kullanici:sifre@localhost:5432/motoshop
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```

```bash
# 4. Veritabanını hazırlayın
npm run db:push

# 5. Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.

### Mevcut Scriptler

| Script | Komut | Açıklama |
|--------|-------|----------|
| **Dev** | `npm run dev` | Geliştirme sunucusu (HMR aktif) |
| **Build** | `npm run build` | Production build oluşturma |
| **Start** | `npm start` | Production sunucusu başlatma |
| **Type Check** | `npm run check` | TypeScript tip kontrolü |
| **DB Push** | `npm run db:push` | Drizzle şemasını veritabanına uygulama |

---

## 🎯 Ekran Görüntüleri

### Ana Sayfa
- Hero banner ile öne çıkan kampanyalar
- Kategoriye göre ürün keşfi (Motosikletler, Ekipmanlar, Yedek Parçalar)
- Öne çıkan ürünler carousel

### Ürün Detay
- Çoklu ürün görseli galerisi
- Renk seçimi ve stok durumu gösterimi
- Teknik özellikler tablosu (JSONB)
- Ürün yorumları ve puanlama sistemi

### Sipariş Akışı
- Adım adım checkout süreci
- Gerçek zamanlı form validasyonu (Zod)
- Havale/EFT ödeme bildirim formu
- Sipariş takip sayfası

### Admin Dashboard
- Sipariş yönetimi ve durum takibi
- Ürün ekleme/düzenleme (görsel yükleme)
- Excel ile toplu stok güncelleme
- Ödeme bildirimi onay/red paneli
- Canlı destek yönetim ekranı

### AI Chatbot
- Floating chat widget (tüm sayfalarda erişilebilir)
- Kategori bazlı yönlendirme butonları
- Ürün kartları ve sipariş bilgisi gösterimi
- Bot → Canlı destek geçiş akışı

---

## 🧪 Teknik Detaylar

### Shared Module Yaklaşımı
Proje monorepo yapısında olup, `shared/` klasörü frontend ve backend arasında paylaşılan tipleri ve şemaları barındırır. Bu sayede:
- Veritabanı şemaları aynı zamanda frontend tip tanımları olarak kullanılır
- API endpoint tanımları tek bir yerden yönetilir
- Zod validasyon şemaları hem sunucu hem de istemci tarafında çalışır

### WebSocket Chat Mimarisi
Chat sistemi bir **durum makinesi** (state machine) patterns'i kullanır:

```
BOT_MODE → Kullanıcı botla konuşur
    ↓ (kullanıcı canlı destek isterse)
WAITING_FOR_AGENT → Sıraya alınır
    ↓ (admin sohbete katılırsa)
AGENT_MODE → Gerçek zamanlı mesajlaşma
    ↓ (sohbet sonlandırılırsa)
CLOSED → Oturum kapatılır
```

### Stok Yönetimi Transaction'ları
Sipariş oluşturulduğunda, veritabanı transaction'ı ile atomik olarak:
1. Sipariş kaydı oluşturulur
2. Sipariş kalemleri eklenir
3. Her ürünün stoku düşürülür
4. Sepet temizlenir

Bu sayede veri tutarlılığı her koşulda korunur.

---

## 📄 Lisans

Bu proje **MIT** lisansı altında lisanslanmıştır.

---

## 👨‍💻 Geliştirici

<p align="center">
  <strong>İbrahim Genç</strong>
</p>

<p align="center">
  <a href="https://github.com/ibrahimgenc27">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>

---

<p align="center">
  <sub>🏍️ MotoShop — Modern E-Ticaret Platformu | 2025</sub>
</p>
