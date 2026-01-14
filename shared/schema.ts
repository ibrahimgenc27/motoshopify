
import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  image: text("image").notNull(),
  images: text("images").array(),
  category: text("category").notNull(),
  specs: jsonb("specs").$type<Record<string, string>>(),
  stock: integer("stock").notNull().default(10),
  colors: text("colors").array(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: text("selected_color"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  sessionId: text("session_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  address: text("address").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"),
  statusDetail: text("status_detail"),
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderNotes = pgTable("order_notes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  note: text("note").notNull(),
  noteType: text("note_type").notNull().default("status_detail"), // status_detail, cancellation, return
  orderStatus: text("order_status"), // The status of the order when the note was related (snapshot)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  selectedColor: text("selected_color"),
});

export const paymentNotifications = pgTable("payment_notifications", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  senderName: text("sender_name").notNull(),
  bankName: text("bank_name").notNull(),
  amount: integer("amount").notNull(),
  transferDate: text("transfer_date").notNull(),
  notificationDate: timestamp("notification_date").defaultNow().notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
});

// Kullanıcılar tablosu
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // 'user' veya 'admin'
  privacyAccepted: boolean("privacy_accepted").notNull().default(false),
  commercialConsent: boolean("commercial_consent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, status: true, createdAt: true, orderCode: true, paymentStatus: true, paymentMethod: true }).extend({
  customerEmail: z.string()
    .min(1, "E-posta adresi gereklidir")
    .email("Geçerli bir e-posta adresi giriniz (örn: ornek@email.com)"),
  customerPhone: z.preprocess(
    (val) => typeof val === 'string' ? val.replace(/\s/g, "") : val,
    z.string()
      .min(10, "Telefon numarası en az 10 hane olmalıdır")
      .max(11, "Telefon numarası en fazla 11 hane olmalıdır")
      .regex(/^(05\d{9}|5\d{9})$/, "Geçerli bir telefon numarası giriniz (05XX XXX XX XX formatında)")
  ),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPaymentNotificationSchema = createInsertSchema(paymentNotifications).omit({ id: true, notificationDate: true, status: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PaymentNotification = typeof paymentNotifications.$inferSelect;
export type InsertPaymentNotification = z.infer<typeof insertPaymentNotificationSchema>;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  userName: text("user_name").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull().default(5),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, isApproved: true });
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export const insertOrderNoteSchema = createInsertSchema(orderNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type OrderNote = typeof orderNotes.$inferSelect;
export type InsertOrderNote = z.infer<typeof insertOrderNoteSchema>;
