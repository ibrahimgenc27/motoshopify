
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

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const orderId = await storage.createOrder(orderData, items);
      res.status(201).json({ orderId });
    } catch (err) {
      res.status(400).json({ message: "Sipariş oluşturulamadı" });
    }
  });

  // Seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length < 5) { // Seed if we don't have enough motors
    console.log("Seeding database with more motorcycles...");
    
    // Existing ones (re-check/add)
    const existingNames = products.map(p => p.name);

    const newMotors = [
      {
        name: "Yamaha MT-07 2024",
        description: "CP2 motor teknolojisi ile sınıfının lideri. 689cc, 73 HP, sıvı soğutmalı. Şehir içi ve virajlı yolların hakimi. LED farlar ve yeni TFT ekran.",
        price: 350000,
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "689cc CP2", "Güç": "73.4 HP", "Tork": "67 Nm", "Ağırlık": "184 kg" },
        colors: ["Cyan Storm", "Icon Blue", "Tech Black"],
        stock: 5
      },
      {
        name: "Ducati Panigale V4",
        description: "Pistlerin kralı. MotoGP teknolojisi sokaklarda. 1103cc Desmosedici Stradale motor, elektronik süspansiyon ve karbon detaylar.",
        price: 1200000,
        image: "https://images.unsplash.com/photo-1515777315835-281b94c9589f?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1103cc V4", "Güç": "214 HP", "Tork": "124 Nm", "Ağırlık": "175 kg" },
        colors: ["Ducati Red"],
        stock: 2
      },
      {
        name: "BMW R 1250 GS",
        description: "Maceranın adı. ShiftCam teknolojisi ile her devirde güç. Uzun yol konforu ve arazi yeteneği bir arada.",
        price: 850000,
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1254cc Boxer", "Güç": "136 HP", "Tork": "143 Nm", "Ağırlık": "249 kg" },
        colors: ["Triple Black", "Rallye Style"],
        stock: 4
      },
      {
        name: "Kawasaki Ninja H2",
        description: "Supercharged efsanesi. Havacılık teknolojisi ile üretilen eşsiz motor. Hız ve aerodinamiğin zirvesi.",
        price: 1500000,
        image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "998cc Supercharged", "Güç": "231 HP", "Tork": "141.7 Nm", "Ağırlık": "238 kg" },
        colors: ["Mirror Coated Spark Black"],
        stock: 1
      },
      {
        name: "Honda CBR650R",
        description: "Dört silindirli performansın en saf hali. Hem günlük kullanım hem de sportif sürüş için ideal denge.",
        price: 480000,
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "649cc 4-Silindir", "Güç": "95 HP", "Tork": "63 Nm", "Ağırlık": "208 kg" },
        colors: ["Grand Prix Red", "Mat Gunpowder Black Metallic"],
        stock: 6
      },
      {
        name: "KTM 1290 Super Adventure R",
        description: "Sınır tanımayan arazi performansı. En zorlu koşullarda bile üstün kontrol ve güç.",
        price: 920000,
        image: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=987&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1301cc V-Twin", "Güç": "160 HP", "Tork": "138 Nm", "Ağırlık": "221 kg" },
        colors: ["Orange/White"],
        stock: 3
      },
      {
        name: "Yamaha YZF-R1",
        description: "MotoGP mirası. Crossplane motor teknolojisi ile benzersiz ses ve performans.",
        price: 1100000,
        image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "998cc CP4", "Güç": "200 HP", "Tork": "113 Nm", "Ağırlık": "201 kg" },
        colors: ["Icon Blue", "Midnight Black"],
        stock: 2
      }
    ];

    for (const motor of newMotors) {
      if (!existingNames.includes(motor.name)) {
        await storage.createProduct(motor);
      }
    }
  }
}
