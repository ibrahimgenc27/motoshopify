import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCartItem } from "@shared/routes";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";

// Helper to get or create session ID - now user-specific
export function getSessionId(userId?: number) {
  // If user is logged in, use user-specific session key
  const storageKey = userId ? `cart_session_id_user_${userId}` : "cart_session_id_guest";

  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = nanoid();
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

// Clear guest cart when user logs in (to prevent cart sharing)
export function clearGuestSession() {
  localStorage.removeItem("cart_session_id_guest");
}

// Get current user from localStorage or session
function getCurrentUserId(): number | undefined {
  // We'll check this from the auth state passed as parameter
  return undefined;
}

export function useCart(userId?: number) {
  const sessionId = getSessionId(userId);

  const query = useQuery({
    queryKey: [api.cart.list.path, sessionId],
    queryFn: async () => {
      const url = buildUrl(api.cart.list.path, { sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch cart");
      return api.cart.list.responses[200].parse(await res.json());
    },
  });

  return { ...query, sessionId };
}

export function useAddToCart(userId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sessionId = getSessionId(userId);

  return useMutation({
    mutationFn: async (data: Omit<InsertCartItem, "sessionId">) => {
      const payload = { ...data, sessionId };
      const validated = api.cart.add.input.parse(payload);

      const res = await fetch(api.cart.add.path, {
        method: api.cart.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Failed to add to cart");
      return api.cart.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, sessionId] });
      toast({
        title: "Sepete Eklendi",
        description: "Ürün başarıyla sepetinize eklendi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ürün sepete eklenirken bir sorun oluştu.",
        variant: "destructive",
      });
    }
  });
}

export function useRemoveFromCart(userId?: number) {
  const queryClient = useQueryClient();
  const sessionId = getSessionId(userId);

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cart.remove.path, { id });
      const res = await fetch(url, { method: api.cart.remove.method });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, sessionId] });
    },
  });
}

export function useUpdateCartQuantity(userId?: number) {
  const queryClient = useQueryClient();
  const sessionId = getSessionId(userId);

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const url = buildUrl(api.cart.update.path, { id });
      const res = await fetch(url, {
        method: api.cart.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      return api.cart.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, sessionId] });
    },
  });
}
