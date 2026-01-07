
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Products
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.get(api.products.getByCategory.path, async (req, res) => {
    const products = await storage.getProductsByCategory(req.params.category);
    res.json(products);
  });

  // Cart
  app.get(api.cart.list.path, async (req, res) => {
    const items = await storage.getCartItems(req.params.sessionId);
    res.json(items);
  });

  app.post(api.cart.add.path, async (req, res) => {
    const item = await storage.addToCart(req.body);
    res.status(201).json(item);
  });

  app.delete(api.cart.remove.path, async (req, res) => {
    await storage.removeFromCart(Number(req.params.id));
    res.status(204).end();
  });

  app.patch(api.cart.update.path, async (req, res) => {
    const item = await storage.updateCartItem(Number(req.params.id), req.body.quantity);
    res.json(item);
  });

  app.post(api.cart.clear.path, async (req, res) => {
    await storage.clearCart(req.params.sessionId);
    res.status(204).end();
  });

  app.post(api.orders.create.path, async (req, res) => {
    const order = await storage.createOrder(req.body);
    res.status(201).json(order);
  });

  // Seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    console.log("Seeding database with motorcycles...");
    
    await storage.createProduct({
      name: "Yamaha MT-07 2024",
      description: "CP2 motor teknolojisi ile sınıfının lideri. 689cc, 73 HP, sıvı soğutmalı. Şehir içi ve virajlı yolların hakimi. LED farlar ve yeni TFT ekran.",
      price: 350000,
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop",
      category: "motorcycle",
      specs: {
        "Motor": "689cc CP2",
        "Güç": "73.4 HP",
        "Tork": "67 Nm",
        "Ağırlık": "184 kg"
      },
      colors: ["Cyan Storm", "Icon Blue", "Tech Black"],
      stock: 5
    });

    await storage.createProduct({
      name: "Yamaha R25",
      description: "Supersport DNA'sı. Yüksek devir çevirebilen 249cc motor. Hafif şasi ve agresif tasarım. Başlangıç ve orta seviye için mükemmel tercih.",
      price: 200000,
      image: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=987&auto=format&fit=crop",
      category: "motorcycle",
      specs: {
        "Motor": "249cc Çift Silindir",
        "Güç": "35.5 HP",
        "Ağırlık": "166 kg",
        "Sele": "780mm"
      },
      colors: ["Racing Blue", "Midnight Black"],
      stock: 10
    });

    await storage.createProduct({
      name: "Honda CBR650R",
      description: "4 silindirli safkan sporcu. Günlük kullanıma uygun konfor ve pist performansı bir arada. Showa süspansiyon ve HSTC çekiş kontrol sistemi.",
      price: 400000,
      image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=2070&auto=format&fit=crop",
      category: "motorcycle",
      specs: {
        "Motor": "649cc 4 Silindir",
        "Güç": "95 HP",
        "Tork": "63 Nm",
        "Ağırlık": "208 kg"
      },
      colors: ["Grand Prix Red", "Matte Black"],
      stock: 3
    });

    await storage.createProduct({
      name: "KTM 390 Duke",
      description: "Viraj canavarı. Sınıfının en hafif ve en teknolojik modeli. Supermoto modu, viraj ABS'si ve Quickshifter standart.",
      price: 250000,
      image: "https://images.unsplash.com/photo-1622185135505-2d795043906a?q=80&w=2071&auto=format&fit=crop",
      category: "motorcycle",
      specs: {
        "Motor": "373cc Tek Silindir",
        "Güç": "44 HP",
        "Ağırlık": "149 kg (Kuru)",
        "Ekran": "TFT Renkli"
      },
      colors: ["Electronic Orange", "Silver Metallic"],
      stock: 8
    });
    
    // Some equipment/parts
    await storage.createProduct({
      name: "Shoei NXR2 Kask",
      description: "Aerodinamik tasarım, sessiz sürüş ve maksimum güvenlik. ECE 22.06 sertifikalı.",
      price: 18000,
      image: "https://images.unsplash.com/photo-1557577266-2244299e5258?q=80&w=2070&auto=format&fit=crop",
      category: "equipment",
      specs: { "Ağırlık": "1350g", "Malzeme": "AIM Kompozit" },
      colors: ["Mat Siyah", "Parlak Beyaz", "Grafik"],
      stock: 20
    });
  }
}
