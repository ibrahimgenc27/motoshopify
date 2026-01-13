
import { db } from "./db";
import {
  products,
  cartItems,
  orders,
  orderItems,
  users,
  type InsertProduct,
  type InsertCartItem,
  type InsertOrder,
  type InsertUser,
  type Product,
  type CartItem,
  type Order,
  type User
} from "@shared/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

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
  getOrdersByEmail(email: string): Promise<{ order: Order, items: any[] }[]>;
  getOrderByCodeAndEmail(code: string, email: string): Promise<{ order: Order, items: any[] } | null>;
  getOrderWithItems(orderId: number): Promise<{ order: Order, items: any[] } | null>;
  updateOrderStatus(orderId: number, status: string): Promise<Order>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
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

      return { id: newOrder.id, orderCode: newOrder.orderCode };
    });
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByEmail(email: string): Promise<{ order: Order, items: any[] }[]> {
    const userOrders = await db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(desc(orders.createdAt));

    const results = [];
    for (const order of userOrders) {
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

      results.push({ order, items });
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

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ status })
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
}

export const storage = new DatabaseStorage();

