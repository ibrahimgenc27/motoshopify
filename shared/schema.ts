
import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Store in cents or smallest unit, but user used TL so simple integer
  originalPrice: integer("original_price"), // For discounts
  image: text("image").notNull(),
  images: text("images").array(), // Additional images
  category: text("category").notNull(), // 'motorcycle', 'equipment', 'parts'
  specs: jsonb("specs").$type<Record<string, string>>(), // e.g. { "Motor": "689cc", "Güç": "73 HP" }
  stock: integer("stock").notNull().default(10),
  colors: text("colors").array(), // Available colors
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: text("selected_color"),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
