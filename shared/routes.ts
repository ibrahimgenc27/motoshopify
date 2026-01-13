
import { z } from 'zod';
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertUserSchema, products, cartItems, users } from './schema';

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    getByCategory: {
      method: 'GET' as const,
      path: '/api/products/category/:category',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    }
  },
  cart: {
    list: {
      method: 'GET' as const,
      path: '/api/cart/:sessionId',
      responses: {
        200: z.array(z.custom<typeof cartItems.$inferSelect & { product: typeof products.$inferSelect }>()),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/cart',
      input: insertCartItemSchema,
      responses: {
        201: z.custom<typeof cartItems.$inferSelect>(),
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/cart/:id',
      responses: {
        204: z.void(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/cart/:id',
      input: z.object({ quantity: z.number() }),
      responses: {
        200: z.custom<typeof cartItems.$inferSelect>(),
      },
    },
    clear: {
      method: 'POST' as const,
      path: '/api/cart/clear/:sessionId',
      responses: {
        204: z.void(),
      },
    }
  },
  checkout: {
    process: {
      method: 'POST' as const,
      path: '/api/checkout',
      input: insertOrderSchema,
      responses: {
        201: z.object({ orderId: z.number() }),
      },
    }
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: insertOrderSchema,
      responses: {
        201: z.object({ orderId: z.number() }),
      },
    }
  },
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        privacyAccepted: z.boolean(),
        commercialConsent: z.boolean().optional(),
      }),
      responses: {
        201: z.object({ user: z.custom<Omit<typeof users.$inferSelect, 'password'>>() }),
        400: z.object({ message: z.string() }),
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.object({ user: z.custom<Omit<typeof users.$inferSelect, 'password'>>() }),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({ user: z.custom<Omit<typeof users.$inferSelect, 'password'>>().nullable() }),
      },
    },
  },
  admin: {
    createProduct: {
      method: 'POST' as const,
      path: '/api/admin/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
    updateProduct: {
      method: 'PUT' as const,
      path: '/api/admin/products/:id',
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
    deleteProduct: {
      method: 'DELETE' as const,
      path: '/api/admin/products/:id',
      responses: {
        204: z.void(),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Re-export types from schema
export type { InsertCartItem, InsertUser, User } from './schema';

