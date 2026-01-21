# 🏍️ MotoShop - Motosiklet E-Ticaret Platformu

Modern ve kapsamlı bir motosiklet e-ticaret platformu. Motosiklet, ekipman ve yedek parça satışı yapabileceğiniz, müşteri desteği sunabileceğiniz tam teşekküllü bir online mağaza.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## ✨ Özellikler

### 🛒 E-Ticaret
- **Ürün Kataloğu** - Motosiklet, ekipman ve yedek parça kategorileri
- **Sepet Yönetimi** - Anlık sepet güncelleme ve miktar kontrolü
- **Sipariş Takibi** - Müşteriler siparişlerini anlık takip edebilir
- **Misafir Sipariş Takibi** - Üye olmadan sipariş numarası ile takip
- **Ödeme Seçenekleri** - Havale/EFT ile ödeme bildirimi sistemi

### 💬 Canlı Destek
- **Akıllı Bot Sistemi** - Gemini AI destekli otomatik yanıtlar
- **Kategori Bazlı Yönlendirme** - Sipariş, ürün, iade, ödeme konularına göre
- **Yetkili Desteği** - Gerçek zamanlı WebSocket ile canlı destek
- **Admin Paneli** - Bekleyen ve aktif sohbetleri yönetme

### 📦 Admin Paneli
- **Sipariş Yönetimi** - Durum güncelleme, sipariş notları
- **Ürün Yönetimi** - Ekleme, düzenleme, silme
- **Excel Stok Import** - Toplu stok güncelleme şablonu ile
- **Ödeme Onayı** - Havale bildirimlerini onaylama/reddetme
- **Canlı Destek** - Müşteri sohbetlerine katılma

### 🔐 Kullanıcı Sistemi
- **Üyelik & Giriş** - Güvenli şifre hash'leme (bcrypt)
- **Oturum Yönetimi** - Express session ile
- **Sipariş Geçmişi** - Kullanıcıya özel sipariş listesi

---

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Radix UI |
| **Backend** | Node.js, Express.js, TypeScript |
| **Veritabanı** | PostgreSQL, Drizzle ORM |
| **Gerçek Zamanlı** | WebSocket (ws) |
| **AI** | Google Gemini API |
| **Build** | Vite, ESBuild |

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+

### Adımlar

```bash
# 1. Repoyu klonla
git clone https://github.com/ibrahimgenc27/motoshopify.git
cd motoshopify

# 2. Bağımlılıkları yükle
npm install

# 3. .env dosyası oluştur
cp .env.example .env
# DATABASE_URL ve GEMINI_API_KEY değerlerini doldur

# 4. Veritabanını hazırla
npm run db:push

# 5. Geliştirme sunucusunu başlat
npm run dev
```

---

## 📁 Proje Yapısı

```
├── backend/           # Express.js API sunucusu
│   ├── routes.ts      # API endpoint'leri
│   ├── storage.ts     # Veritabanı işlemleri
│   └── botEngine.ts   # Gemini AI entegrasyonu
├── frontend/          # React uygulaması
│   ├── src/
│   │   ├── components/  # UI bileşenleri
│   │   ├── pages/       # Sayfa bileşenleri
│   │   └── hooks/       # Custom React hooks
├── shared/            # Ortak tipler ve şemalar
│   └── schema.ts      # Drizzle veritabanı şeması
└── public/            # Statik dosyalar
```

---

## 📝 API Endpoints

### Genel
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/products` | Tüm ürünleri listele |
| GET | `/api/products/:id` | Ürün detayı |
| POST | `/api/auth/register` | Kayıt ol |
| POST | `/api/auth/login` | Giriş yap |

### Admin
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/orders` | Siparişleri listele |
| PATCH | `/api/admin/orders/:id/status` | Sipariş durumu güncelle |
| GET | `/api/admin/stock-template` | Excel şablonu indir |
| POST | `/api/admin/stock-import` | Excel ile stok güncelle |

### Canlı Destek
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/chat/session` | Sohbet başlat |
| WS | `/ws` | WebSocket bağlantısı |

---

## 🎯 Ekran Görüntüleri

### Ana Sayfa
- Modern ve responsive tasarım
- Ürün kategorileri
- Öne çıkan ürünler

### Admin Paneli
- Sipariş yönetimi dashboard
- Ürün ekleme/düzenleme
- Canlı destek yönetimi

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 👨‍💻 Geliştirici

**İbrahim Genç**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ibrahimgenc27)

---

<p align="center">
  <sub>🏍️ MotoShop - 2026</sub>
</p>
