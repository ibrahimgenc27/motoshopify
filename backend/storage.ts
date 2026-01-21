
import { db } from "./db";
import {
  products,
  cartItems,
  orders,
  orderItems,
  users,
  paymentNotifications,
  type InsertProduct,
  type InsertCartItem,
  type InsertOrder,
  type InsertUser,
  type InsertPaymentNotification,
  type Product,
  type CartItem,
  type Order,
  type User,
  type PaymentNotification,
  type InsertReview,
  type Review,
  reviews,
  type InsertOrderNote,
  type OrderNote,
  orderNotes,
  // Chat imports
  chatSessions,
  chatMessages,
  type ChatSession,
  type ChatMessage,
  type InsertChatSession,
  type InsertChatMessage,
} from "@shared/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  createOrder(order: InsertOrder, items: { productId: number, quantity: number, price: number, selectedColor?: string | null }[]): Promise<{ id: number, orderCode: string }>;
  getOrders(): Promise<Order[]>;
  getOrdersByEmail(email: string): Promise<{ order: Order & { latestPaymentNote?: string | null }, items: any[] }[]>;
  getOrderByCodeAndEmail(code: string, email: string): Promise<{ order: Order, items: any[] } | null>;
  getOrderWithItems(orderId: number): Promise<{ order: Order, items: any[] } | null>;
  updateOrderStatus(orderId: number, status: string, statusDetail?: string): Promise<Order>;
  updateOrderPaymentStatus(orderId: number, paymentStatus: string): Promise<Order>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Payment notification methods
  createPaymentNotification(notification: InsertPaymentNotification): Promise<PaymentNotification>;
  getPaymentNotifications(): Promise<PaymentNotification[]>;
  getPaymentNotificationById(id: number): Promise<PaymentNotification | undefined>;
  approvePaymentNotification(id: number, adminNote?: string): Promise<{ notification: PaymentNotification, order: Order }>;
  rejectPaymentNotification(id: number, adminNote: string): Promise<PaymentNotification>;

  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getProductReviews(productId: number): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  updateReview(id: number, review: Partial<InsertReview>): Promise<Review>;
  deleteReview(id: number): Promise<void>;

  // Order Notes methods
  createOrderNote(note: InsertOrderNote): Promise<OrderNote>;
  getOrderNotes(orderId: number): Promise<OrderNote[]>;
  updateOrderNote(id: number, note: string): Promise<OrderNote>;
  deleteOrderNote(id: number): Promise<void>;

  // Chat Session methods
  createChatSession(sessionId: string, userId?: number, customerName?: string, customerEmail?: string): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionBySessionId(sessionId: string, userId?: number): Promise<ChatSession | undefined>;
  getActiveChatSessions(): Promise<ChatSession[]>;
  getWaitingChatSessions(): Promise<ChatSession[]>;
  updateChatSessionStatus(id: string, status: string, agentId?: number): Promise<ChatSession>;
  closeChatSession(id: string): Promise<ChatSession>;

  // Chat Message methods
  createChatMessage(message: Omit<InsertChatMessage, 'id'>): Promise<ChatMessage>;
  getChatMessages(chatSessionId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(chatSessionId: string, sender: string): Promise<void>;
  getUnreadMessageCount(chatSessionId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.sessionId, sessionId));

    return result.map(({ cart_items, products }) => ({
      ...cart_items,
      product: products
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const colorCondition = item.selectedColor
      ? eq(cartItems.selectedColor, item.selectedColor)
      : isNull(cartItems.selectedColor);

    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.sessionId, item.sessionId),
          eq(cartItems.productId, item.productId),
          colorCondition
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async createOrder(order: InsertOrder, items: { productId: number, quantity: number, price: number, selectedColor?: string | null }[]): Promise<{ id: number, orderCode: string }> {
    const orderCode = 'MS-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values({ ...order, orderCode }).returning();

      await tx.insert(orderItems).values(
        items.map(item => ({
          orderId: newOrder.id,
          ...item
        }))
      );

      // Reduce stock for each product
      for (const item of items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await tx.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
        }
      }

      return { id: newOrder.id, orderCode: newOrder.orderCode };
    });
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByEmail(email: string): Promise<{ order: Order & { latestPaymentNote?: string | null, notes?: OrderNote[] }, items: any[] }[]> {
    const userOrders = await db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(desc(orders.createdAt));

    const results = [];
    for (const order of userOrders) {
      const dbItems = await db
        .select()
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      const [notification] = await db
        .select()
        .from(paymentNotifications)
        .where(eq(paymentNotifications.orderId, order.id))
        .orderBy(desc(paymentNotifications.notificationDate))
        .limit(1);

      // Get order notes
      const notes = await db
        .select()
        .from(orderNotes)
        .where(eq(orderNotes.orderId, order.id))
        .orderBy(desc(orderNotes.createdAt));

      const items = dbItems.map(row => ({
        ...row.order_items,
        name: row.products?.name || "Ürün Silinmiş",
        image: row.products?.image || "",
        description: row.products?.description || "",
      }));

      results.push({
        order: { ...order, latestPaymentNote: notification?.adminNote || null, notes },
        items
      });
    }
    return results;
  }

  async getOrderByCodeAndEmail(code: string, email: string): Promise<{ order: Order, items: any[] } | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderCode, code), eq(orders.customerEmail, email)));

    if (!order) return null;

    const dbItems = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const items = dbItems.map(row => ({
      ...row.order_items,
      name: row.products?.name || "Ürün Silinmiş",
      image: row.products?.image || "",
      description: row.products?.description || "",
    }));

    return { order, items };
  }

  async getOrderWithItems(orderId: number): Promise<{ order: Order, items: any[] } | null> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return {
      order,
      items: items.map(({ order_items, products }) => ({
        ...order_items,
        product: products
      }))
    };
  }

  async updateOrderStatus(orderId: number, status: string, statusDetail?: string): Promise<Order> {
    const updateData: any = { status, updatedAt: new Date() };
    if (statusDetail !== undefined) {
      updateData.statusDetail = statusDetail;
    }
    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  async updateOrderPaymentStatus(orderId: number, paymentStatus: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Payment notification methods
  async createPaymentNotification(notification: InsertPaymentNotification): Promise<PaymentNotification> {
    const [newNotification] = await db.insert(paymentNotifications).values(notification).returning();
    return newNotification;
  }

  async getPaymentNotifications(): Promise<PaymentNotification[]> {
    return await db.select().from(paymentNotifications).orderBy(desc(paymentNotifications.notificationDate));
  }

  async getPaymentNotificationById(id: number): Promise<PaymentNotification | undefined> {
    const [notification] = await db.select().from(paymentNotifications).where(eq(paymentNotifications.id, id));
    return notification;
  }

  async approvePaymentNotification(id: number, adminNote?: string): Promise<{ notification: PaymentNotification, order: Order }> {
    return await db.transaction(async (tx) => {
      // Get notification
      const [notification] = await tx.select().from(paymentNotifications).where(eq(paymentNotifications.id, id));
      if (!notification) throw new Error("Bildirim bulunamadı");

      // Update notification status
      const [updatedNotification] = await tx
        .update(paymentNotifications)
        .set({ status: "approved", adminNote })
        .where(eq(paymentNotifications.id, id))
        .returning();

      // Update order payment status and order status
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: "processing", // Ödeme onaylandı, sipariş hazırlanmaya alındı
          updatedAt: new Date()
        })
        .where(eq(orders.id, notification.orderId))
        .returning();

      return { notification: updatedNotification, order: updatedOrder };
    });
  }

  async rejectPaymentNotification(id: number, adminNote: string): Promise<PaymentNotification> {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(paymentNotifications)
        .set({ status: "rejected", adminNote })
        .where(eq(paymentNotifications.id, id))
        .returning();

      if (updated) {
        await tx.update(orders)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(eq(orders.id, updated.orderId));
      }

      return updated;
    });
  }

  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getProductReviews(productId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review> {
    const [updatedReview] = await db.update(reviews).set({ ...review, createdAt: undefined }).where(eq(reviews.id, id)).returning();
    return updatedReview;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Order Notes methods
  async createOrderNote(note: InsertOrderNote): Promise<OrderNote> {
    let orderStatus = note.orderStatus;

    // If orderStatus is not provided, fetch current order status
    if (!orderStatus) {
      console.log(`[createOrderNote] Fetching status for orderId: ${note.orderId}`);
      const [order] = await db.select().from(orders).where(eq(orders.id, note.orderId));
      if (order) {
        orderStatus = order.status; // status is not null in DB definition
        console.log(`[createOrderNote] Found order status: ${orderStatus}`);
      } else {
        console.log(`[createOrderNote] Order not found for id: ${note.orderId}`);
      }
    } else {
      console.log(`[createOrderNote] orderStatus provided in note: ${orderStatus}`);
    }

    const [newNote] = await db.insert(orderNotes).values({ ...note, orderStatus }).returning();
    return newNote;
  }

  async getOrderNotes(orderId: number): Promise<OrderNote[]> {
    return await db.select().from(orderNotes).where(eq(orderNotes.orderId, orderId)).orderBy(desc(orderNotes.createdAt));
  }

  async updateOrderNote(id: number, note: string): Promise<OrderNote> {
    const [updated] = await db.update(orderNotes).set({ note, updatedAt: new Date() }).where(eq(orderNotes.id, id)).returning();
    return updated;
  }

  async deleteOrderNote(id: number): Promise<void> {
    await db.delete(orderNotes).where(eq(orderNotes.id, id));
  }

  // ============================================
  // CHAT SESSION METHODS
  // ============================================

  async createChatSession(
    sessionId: string,
    userId?: number,
    customerName?: string,
    customerEmail?: string,
    category?: string
  ): Promise<ChatSession> {
    const id = randomUUID();
    const [session] = await db.insert(chatSessions).values({
      id,
      sessionId,
      userId: userId || null,
      customerName: customerName || null,
      customerEmail: customerEmail || null,
      category: category || null,
      status: 'BOT_MODE',
    }).returning();
    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  }

  async getChatSessionBySessionId(sessionId: string, userId?: number): Promise<ChatSession | undefined> {
    // Kullanıcıya özgü en son aktif oturumu getir
    const conditions = [eq(chatSessions.sessionId, sessionId)];

    // Eğer userId verilmişse, sadece o kullanıcının session'larını getir
    if (userId !== undefined) {
      if (userId === null) {
        // Misafir kullanıcı - userId null olanları getir
        conditions.push(isNull(chatSessions.userId));
      } else {
        // Giriş yapmış kullanıcı - userId eşleşenlerini getir
        conditions.push(eq(chatSessions.userId, userId));
      }
    }

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(...conditions))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(1);

    // Eğer session CLOSED ise undefined döndür (yeni session oluşturulsun)
    if (session && session.status === 'CLOSED') {
      return undefined;
    }
    return session;
  }

  async getActiveChatSessions(): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.status, 'AGENT_MODE'),
        )
      )
      .orderBy(desc(chatSessions.updatedAt));
  }

  async getWaitingChatSessions(): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.status, 'WAITING_FOR_AGENT'))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async updateChatSessionStatus(
    id: string,
    status: string,
    agentId?: number
  ): Promise<ChatSession> {
    const updateData: Partial<ChatSession> = {
      status,
      updatedAt: new Date(),
    };

    if (agentId !== undefined) {
      updateData.agentId = agentId;
    }

    const [updated] = await db
      .update(chatSessions)
      .set(updateData)
      .where(eq(chatSessions.id, id))
      .returning();
    return updated;
  }

  async closeChatSession(id: string): Promise<ChatSession> {
    const [closed] = await db
      .update(chatSessions)
      .set({ status: 'CLOSED', updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return closed;
  }

  async updateChatSessionUser(
    id: string,
    userId: number,
    customerName?: string,
    customerEmail?: string
  ): Promise<ChatSession> {
    const [updated] = await db
      .update(chatSessions)
      .set({
        userId,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // CHAT MESSAGE METHODS
  // ============================================

  async createChatMessage(
    message: Omit<InsertChatMessage, 'id'>
  ): Promise<ChatMessage> {
    const id = randomUUID();
    const [newMessage] = await db.insert(chatMessages).values({
      id,
      ...message,
    }).returning();

    // Session'ın updatedAt'ini güncelle
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, message.chatSessionId));

    return newMessage;
  }

  async getChatMessages(chatSessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatSessionId, chatSessionId))
      .orderBy(chatMessages.createdAt); // Eskiden yeniye sırala
  }

  async markMessagesAsRead(chatSessionId: string, sender: string): Promise<void> {
    // Belirtilen sender'dan GELMEYEŇ mesajları okundu olarak işaretle
    // Örn: USER mesajları okundu yapmak için sender='USER' gönder
    // Bu, o sender'ın gönderdiği mesajları değil, o sender'ın ALDIĞI mesajları işaretler
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.chatSessionId, chatSessionId),
          // sender'ın kendisi DIŞINDA gönderilmiş mesajlar
        )
      );
  }

  async getUnreadMessageCount(chatSessionId: string): Promise<number> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatSessionId, chatSessionId),
          eq(chatMessages.isRead, false)
        )
      );
    return messages.length;
  }
}

export const storage = new DatabaseStorage();

