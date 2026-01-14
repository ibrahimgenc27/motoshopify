
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

import fs from "fs";
import { insertOrderNoteSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

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

  // Image Upload
  app.post("/api/upload", upload.single("image"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Return the URL path to the uploaded image
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Error uploading file" });
    }
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
      console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
      const { items, ...orderData } = req.body;

      // If user is logged in, force use their email to ensure linking
      if (req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          console.log(`Overriding order email with logged in user email: ${user.email}`);
          orderData.customerEmail = user.email;
        }
      }

      console.log("Order data:", orderData);
      console.log("Order items:", items);
      const { id, orderCode } = await storage.createOrder(orderData, items);
      console.log("Order created successfully with ID:", id);

      // Auto-clear cart after successful order
      if (orderData.sessionId) {
        await storage.clearCart(orderData.sessionId);
      }

      res.status(201).json({ id, orderCode });
    } catch (err) {
      console.error("Order creation error:", err);
      res.status(400).json({ message: "Sipariş oluşturulamadı", error: String(err) });
    }
  });

  // Get user's orders
  app.get("/api/orders", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      const orders = await storage.getOrdersByEmail(user.email);
      res.json(orders);
    } catch (err) {
      console.error("Get user orders error:", err);
      res.status(500).json({ message: "Siparişler alınırken bir hata oluştu" });
    }
  });

  app.post("/api/track-order", async (req, res) => {
    try {
      const { code, email } = req.body;
      if (!code || !email) {
        return res.status(400).json({ message: "Sipariş kodu ve e-posta adresi gereklidir." });
      }

      const result = await storage.getOrderByCodeAndEmail(code, email);
      if (!result) {
        return res.status(404).json({ message: "Sipariş bulunamadı veya bilgiler hatalı." });
      }

      res.json(result);
    } catch (err) {
      console.error("Tracking error:", err);
      res.status(500).json({ message: "Sorgulama sırasında bir hata oluştu." });
    }
  });

  // ==================== AUTH ROUTES ====================

  // Register
  app.post(api.auth.register.path, async (req: Request, res: Response) => {
    try {
      const { email, password, name, privacyAccepted, commercialConsent } = req.body;

      // Check if privacy is accepted
      if (!privacyAccepted) {
        return res.status(400).json({ message: "Aydınlatma metnini kabul etmelisiniz" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "user",
        privacyAccepted,
        commercialConsent: commercialConsent || false,
      });

      // Set session
      req.session.userId = newUser.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  // Login
  app.post(api.auth.login.path, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "E-posta veya şifre hatalı" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "E-posta veya şifre hatalı" });
      }

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
    }
  });

  // Logout
  app.post(api.auth.logout.path, (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Çıkış sırasında bir hata oluştu" });
      }
      res.json({ message: "Başarıyla çıkış yapıldı" });
    });
  });

  // Get current user
  app.get(api.auth.me.path, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.json({ user: null });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.json({ user: null });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Get me error:", err);
      res.json({ user: null });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // Middleware to check if user is admin
  const requireAdmin = async (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    next();
  };

  // Create product (admin only)
  app.post(api.admin.createProduct.path, async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const product = await storage.createProduct(req.body);
        res.status(201).json(product);
      } catch (err) {
        console.error("Create product error:", err);
        res.status(500).json({ message: "Ürün eklenirken bir hata oluştu" });
      }
    });
  });

  // Update product (admin only)
  app.put(api.admin.updateProduct.path, async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const product = await storage.updateProduct(Number(req.params.id), req.body);
        res.json(product);
      } catch (err) {
        console.error("Update product error:", err);
        res.status(500).json({ message: "Ürün güncellenirken bir hata oluştu" });
      }
    });
  });

  // Delete product (admin only)
  app.delete(api.admin.deleteProduct.path, async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        await storage.deleteProduct(Number(req.params.id));
        res.status(204).end();
      } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).json({ message: "Ürün silinirken bir hata oluştu" });
      }
    });
  });

  // Get all orders (admin only)
  app.get("/api/admin/orders", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const ordersList = await storage.getOrders();
        res.json(ordersList);
      } catch (err) {
        console.error("Get orders error:", err);
        res.status(500).json({ message: "Siparişler alınırken bir hata oluştu" });
      }
    });
  });

  // Get single order with items (admin only)
  app.get("/api/admin/orders/:id", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const orderData = await storage.getOrderWithItems(Number(req.params.id));
        if (!orderData) {
          return res.status(404).json({ message: "Sipariş bulunamadı" });
        }
        res.json(orderData);
      } catch (err) {
        console.error("Get order error:", err);
        res.status(500).json({ message: "Sipariş alınırken bir hata oluştu" });
      }
    });
  });

  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const { status, statusDetail } = req.body;
        const order = await storage.updateOrderStatus(Number(req.params.id), status, statusDetail);
        res.json(order);
      } catch (err) {
        console.error("Update order status error:", err);
        res.status(500).json({ message: "Sipariş durumu güncellenirken bir hata oluştu" });
      }
    });
  });


  // Order Notes Management (admin only)
  app.get("/api/admin/orders/:id/notes", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const notes = await storage.getOrderNotes(Number(req.params.id));
        res.json(notes);
      } catch (err) {
        console.error("Get order notes error:", err);
        res.status(500).json({ message: "Sipariş notları alınırken bir hata oluştu" });
      }
    });
  });

  app.post("/api/admin/orders/:id/notes", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const orderId = Number(req.params.id);
        const noteData = insertOrderNoteSchema.parse({ ...req.body, orderId });
        const note = await storage.createOrderNote(noteData);
        res.status(201).json(note);
      } catch (err) {
        console.error("Create order note error:", err);
        res.status(500).json({ message: "Sipariş notu eklenirken bir hata oluştu" });
      }
    });
  });

  app.put("/api/admin/orders/notes/:noteId", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const { note } = req.body;
        const updated = await storage.updateOrderNote(Number(req.params.noteId), note);
        res.json(updated);
      } catch (err) {
        console.error("Update order note error:", err);
        res.status(500).json({ message: "Sipariş notu güncellenirken bir hata oluştu" });
      }
    });
  });

  app.delete("/api/admin/orders/notes/:noteId", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        await storage.deleteOrderNote(Number(req.params.noteId));
        res.status(204).end();
      } catch (err) {
        console.error("Delete order note error:", err);
        res.status(500).json({ message: "Sipariş notu silinirken bir hata oluştu" });
      }
    });
  });

  // ===== PAYMENT NOTIFICATION ROUTES =====

  // Create payment notification (user submits payment info)
  app.post("/api/payment-notification", async (req: Request, res: Response) => {
    try {
      const { orderId, senderName, bankName, amount, transferDate } = req.body;

      if (!orderId || !senderName || !bankName || !amount || !transferDate) {
        return res.status(400).json({ message: "Tüm alanları doldurunuz" });
      }

      // Update order payment status to pending_approval
      await storage.updateOrderPaymentStatus(orderId, "pending_approval");

      const notification = await storage.createPaymentNotification({
        orderId,
        senderName,
        bankName,
        amount: Number(amount),
        transferDate
      });

      res.status(201).json(notification);
    } catch (err) {
      console.error("Create payment notification error:", err);
      res.status(500).json({ message: "Ödeme bildirimi oluşturulurken bir hata oluştu" });
    }
  });

  // Get all payment notifications (admin only)
  app.get("/api/admin/payment-notifications", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const notifications = await storage.getPaymentNotifications();

        // Get order details for each notification
        const notificationsWithOrders = await Promise.all(
          notifications.map(async (notification) => {
            const orderData = await storage.getOrderWithItems(notification.orderId);
            return {
              ...notification,
              order: orderData?.order || null
            };
          })
        );

        res.json(notificationsWithOrders);
      } catch (err) {
        console.error("Get payment notifications error:", err);
        res.status(500).json({ message: "Ödeme bildirimleri alınırken bir hata oluştu" });
      }
    });
  });

  // Approve payment notification (admin only)
  app.post("/api/admin/payment-notifications/:id/approve", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const { adminNote } = req.body;
        const result = await storage.approvePaymentNotification(Number(req.params.id), adminNote);
        res.json(result);
      } catch (err) {
        console.error("Approve payment notification error:", err);
        res.status(500).json({ message: "Ödeme bildirimi onaylanırken bir hata oluştu" });
      }
    });
  });

  // Reject payment notification (admin only)
  app.post("/api/admin/payment-notifications/:id/reject", async (req: Request, res: Response) => {
    await requireAdmin(req, res, async () => {
      try {
        const { adminNote } = req.body;
        if (!adminNote) {
          return res.status(400).json({ message: "Red sebebi gereklidir" });
        }
        const notification = await storage.rejectPaymentNotification(Number(req.params.id), adminNote);
        res.json(notification);
      } catch (err) {
        console.error("Reject payment notification error:", err);
        res.status(500).json({ message: "Ödeme bildirimi reddedilirken bir hata oluştu" });
      }
    });
  });

  // ===== REVIEW ROUTES (PostgreSQL) =====

  // Get product reviews
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(Number(req.params.id));
      res.json(reviews);
    } catch (err) {
      console.error("Get reviews error:", err);
      res.status(500).json({ message: "Yorumlar alınırken bir hata oluştu" });
    }
  });

  // Create review (requires auth)
  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Yorum yapmak için giriş yapmalısınız" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      const reviewData = {
        ...req.body,
        userId: user.id,
        productId: Number(req.params.id),
        userName: user.name, // Yorumda görünecek isim
        isApproved: true, // Şimdilik onaylı
      };

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (err) {
      console.error("Create review error:", err);
      res.status(500).json({ message: "Yorum eklenirken bir hata oluştu" });
    }
  });

  // Delete review (admin or owner)
  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }

    try {
      const reviewId = Number(req.params.id);
      const existingReview = await storage.getReview(reviewId);

      if (!existingReview) {
        return res.status(404).json({ message: "Yorum bulunamadı" });
      }

      const user = await storage.getUserById(req.session.userId);

      // Check if user is the owner or admin
      if (existingReview.userId !== req.session.userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      await storage.deleteReview(reviewId);
      res.status(204).end();
    } catch (err) {
      console.error("Delete review error:", err);
      res.status(500).json({ message: "Yorum silinirken bir hata oluştu" });
    }
  });

  // Update review (owner or admin)
  app.put("/api/reviews/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }

    try {
      const reviewId = Number(req.params.id);
      const existingReview = await storage.getReview(reviewId);

      if (!existingReview) {
        return res.status(404).json({ message: "Yorum bulunamadı" });
      }

      const user = await storage.getUserById(req.session.userId);

      // Check if user is the owner or admin
      if (existingReview.userId !== req.session.userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      const updatedReview = await storage.updateReview(reviewId, req.body);
      res.json(updatedReview);
    } catch (err) {
      console.error("Update review error:", err);
      res.status(500).json({ message: "Yorum güncellenirken bir hata oluştu" });
    }
  });

  // Seed data (including admin user)
  await seedDatabase();

  return httpServer;
}


async function seedDatabase() {
  // Seed admin user if not exists
  const adminEmail = "admin@motoshop.com";
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  if (!existingAdmin) {
    console.log("Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      email: adminEmail,
      password: hashedPassword,
      name: "Admin",
      role: "admin",
      privacyAccepted: true,
      commercialConsent: false,
    });
    console.log("Admin user created: admin@motoshop.com / admin123");
  }

  const products = await storage.getProducts();
  const existingNames = products.map(p => p.name);
  const hasEquipment = products.some(p => p.category === 'equipment');
  const hasParts = products.some(p => p.category === 'parts');

  // Always seed if we don't have equipment or parts
  if (products.length < 5 || !hasEquipment || !hasParts) {
    console.log("Seeding database with products...");


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
      },
      {
        name: "Honda CB1000R",
        description: "Neo Sports Cafe konseptinin öncüsü. Agresif tasarım, güçlü motor ve modern teknoloji bir arada.",
        price: 520000,
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "998cc 4-Silindir", "Güç": "143 HP", "Tork": "104 Nm", "Ağırlık": "212 kg" },
        colors: ["Candy Chromosphere Red", "Matt Gunpowder Black"],
        stock: 4
      },
      {
        name: "Honda Africa Twin",
        description: "Efsanevi macera motosikleti. Çöllerde, ormanlarda ve her yerde güvenle sürüş keyfi.",
        price: 780000,
        image: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=987&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1084cc Paralel Twin", "Güç": "102 HP", "Tork": "105 Nm", "Ağırlık": "226 kg" },
        colors: ["Grand Prix Red", "Pearl Glare White"],
        stock: 3
      },
      {
        name: "Suzuki GSX-R1000R",
        description: "Pist ve yol için mükemmel denge. MotoGP teknolojisi ile donatılmış superbike.",
        price: 950000,
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "999cc 4-Silindir", "Güç": "202 HP", "Tork": "117 Nm", "Ağırlık": "203 kg" },
        colors: ["Metallic Triton Blue", "Glass Sparkle Black"],
        stock: 2
      },
      {
        name: "Suzuki V-Strom 1050",
        description: "Uzun yol konforu ve arazi yeteneği. DR-Z mirasını taşıyan adventure tourer.",
        price: 650000,
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1037cc V-Twin", "Güç": "107 HP", "Tork": "100 Nm", "Ağırlık": "247 kg" },
        colors: ["Champion Yellow", "Glass Sparkle Black"],
        stock: 5
      },
      {
        name: "Triumph Street Triple RS",
        description: "Şehrin hakimi. Hafif, çevik ve güçlü. Virajların efendisi naked roadster.",
        price: 580000,
        image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "765cc 3-Silindir", "Güç": "123 HP", "Tork": "79 Nm", "Ağırlık": "166 kg" },
        colors: ["Crystal White", "Matt Jet Black"],
        stock: 4
      },
      {
        name: "Triumph Tiger 900 Rally Pro",
        description: "Her türlü arazide üstün performans. Rally proven teknoloji ile donatıldı.",
        price: 720000,
        image: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=987&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "888cc 3-Silindir", "Güç": "95 HP", "Tork": "87 Nm", "Ağırlık": "201 kg" },
        colors: ["Sandstorm", "Sapphire Black"],
        stock: 3
      },
      {
        name: "Aprilia RSV4",
        description: "İtalyan mühendisliğinin şaheseri. WSBK şampiyonluk DNA'sı taşıyan superbike.",
        price: 1100000,
        image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1099cc V4", "Güç": "217 HP", "Tork": "125 Nm", "Ağırlık": "202 kg" },
        colors: ["Aprilia Black", "Lava Red"],
        stock: 2
      },
      {
        name: "Aprilia Tuono V4",
        description: "RSV4'ün naked versiyonu. Pist performansı sokak kullanımıyla buluşuyor.",
        price: 890000,
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1077cc V4", "Güç": "175 HP", "Tork": "121 Nm", "Ağırlık": "209 kg" },
        colors: ["Atomica Red", "Shark Grey"],
        stock: 3
      },
      {
        name: "MV Agusta F3 800",
        description: "Sanat eseri motosiklet. İtalyan zanaatkarlığı ve yarış teknolojisinin birleşimi.",
        price: 850000,
        image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "798cc 3-Silindir", "Güç": "148 HP", "Tork": "88 Nm", "Ağırlık": "173 kg" },
        colors: ["AGO Red", "Pearl White"],
        stock: 1
      },
      {
        name: "Harley-Davidson Sportster S",
        description: "Yeni nesil Sportster. Revolution Max motor ile Amerikan ruhu yeniden tanımlandı.",
        price: 750000,
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop",
        category: "motorcycle",
        specs: { "Motor": "1252cc Revolution Max", "Güç": "121 HP", "Tork": "127 Nm", "Ağırlık": "228 kg" },
        colors: ["Vivid Black", "Stone Washed White Pearl"],
        stock: 4
      }
    ];

    // Ekipmanlar
    const equipmentItems = [
      {
        name: "AGV Pista GP RR Kask",
        description: "MotoGP pilotlarının tercihi. Karbon fiber yapı, yarış aerodinamiği ve üstün koruma.",
        price: 28000,
        image: "/products/kask.jpg",
        category: "equipment",
        specs: { "Malzeme": "Karbon Fiber", "Ağırlık": "1350g", "Sertifika": "ECE 22.06", "Havalandırma": "5 giriş" },
        colors: ["Glossy Carbon", "Rossi Winter Test"],
        stock: 8
      },
      {
        name: "Dainese Racing 4 Deri Mont",
        description: "S1 sınıfı deri yarış montu. D-Air uyumlu, titanyum omuz koruyucular.",
        price: 18500,
        image: "/products/mont.jpg",
        category: "equipment",
        specs: { "Malzeme": "Tutu Deri", "Koruma": "CE Level 2", "Astar": "Nano Feel" },
        colors: ["Black/White", "Black/Red"],
        stock: 12
      },
      {
        name: "Alpinestars GP Pro R3 Eldiven",
        description: "Profesyonel yarış eldiveni. Keçi derisi, karbon fiber eklemler.",
        price: 4200,
        image: "/products/eldiven.jpg",
        category: "equipment",
        specs: { "Malzeme": "Keçi Derisi", "Koruma": "Karbon Fiber", "Dokunmatik": "Evet" },
        colors: ["Black", "Black/White/Red"],
        stock: 20
      },
      {
        name: "TCX RT-Race Pro Air Bot",
        description: "Hava kanallı yarış botu. Mikrofibra ve deri kombinasyonu, D3O koruma.",
        price: 8900,
        image: "/products/bot.jpg",
        category: "equipment",
        specs: { "Malzeme": "Mikrofibra/Deri", "Taban": "Yarış Kauçuk", "Koruma": "D3O" },
        colors: ["Black", "White"],
        stock: 15
      },
      {
        name: "Forcefield Pro Sırt Koruyucu",
        description: "CE Level 2 onaylı sırt koruyucu. Esnek ve nefes alabilir yapı.",
        price: 3500,
        image: "/products/sirtlik.jpg",
        category: "equipment",
        specs: { "Koruma": "CE Level 2", "Ağırlık": "450g", "Kalınlık": "18mm" },
        colors: ["Black"],
        stock: 25
      },
      {
        name: "Kriega US-30 Drypack Çanta",
        description: "Su geçirmez saddlebag. Modüler sistem, hızlı montaj.",
        price: 2800,
        image: "/products/canta.jpg",
        category: "equipment",
        specs: { "Kapasite": "30L", "Malzeme": "420D Naylon", "Su Geçirmezlik": "IP64" },
        colors: ["Black", "Black/Orange"],
        stock: 18
      }
    ];

    // Yedek Parçalar
    const partsItems = [
      {
        name: "Pirelli Diablo Rosso IV Lastik Seti",
        description: "Yol ve pist performansını bir arada sunan spor lastik. Dual compound teknolojisi.",
        price: 6500,
        image: "/products/lastik.jpg",
        category: "parts",
        specs: { "Ön": "120/70 ZR17", "Arka": "180/55 ZR17", "Tip": "Dual Compound" },
        colors: [],
        stock: 30
      },
      {
        name: "Brembo M4 Fren Kaliper Takımı",
        description: "Radyal montaj fren kaliperleri. MotoGP derived teknoloji.",
        price: 14500,
        image: "/products/fren.jpg",
        category: "parts",
        specs: { "Tip": "Radyal", "Piston": "4 Adet", "Malzeme": "Alüminyum" },
        colors: ["Gold", "Titanium"],
        stock: 10
      },
      {
        name: "DID 520 ERV7 X-Ring Zincir",
        description: "Yarış kalitesinde X-Ring zincir. Altın kaplama, yüksek dayanıklılık.",
        price: 2200,
        image: "/products/zincir.jpg",
        category: "parts",
        specs: { "Tip": "520", "Bakla": "120", "Kaplama": "Gold" },
        colors: [],
        stock: 35
      },
      {
        name: "Rizoma Stealth Ayna Seti",
        description: "CNC işlenmiş billet alüminyum aynalar. Aerodinamik tasarım.",
        price: 3800,
        image: "/products/ayna.jpg",
        category: "parts",
        specs: { "Malzeme": "Billet Alüminyum", "Montaj": "Bar End", "Renk": "Eloksal" },
        colors: ["Black", "Silver"],
        stock: 22
      },
      {
        name: "LED Far Kiti Universal",
        description: "Yüksek lümen LED far dönüşüm kiti. Plug & play montaj.",
        price: 1800,
        image: "/products/far.jpg",
        category: "parts",
        specs: { "Lümen": "6000", "Renk Isısı": "6000K", "Ömür": "50000 saat" },
        colors: [],
        stock: 40
      },
      {
        name: "Yuasa YTZ14S Akü",
        description: "Yüksek performanslı AGM akü. Fabrika aktif, bakım gerektirmez.",
        price: 1450,
        image: "/products/aku.jpg",
        category: "parts",
        specs: { "Kapasite": "11.8Ah", "Voltaj": "12V", "Tip": "AGM" },
        colors: [],
        stock: 50
      }
    ];

    for (const motor of newMotors) {
      if (!existingNames.includes(motor.name)) {
        await storage.createProduct(motor);
      }
    }

    for (const equipment of equipmentItems) {
      if (!existingNames.includes(equipment.name)) {
        await storage.createProduct(equipment as any);
      }
    }

    for (const part of partsItems) {
      if (!existingNames.includes(part.name)) {
        await storage.createProduct(part as any);
      }
    }
  }
}
