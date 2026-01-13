import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCartItem } from "@shared/routes";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Helper to get or create session ID
export function getSessionId() {
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = nanoid();
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
}

export function useCart() {
  const sessionId = getSessionId();

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

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sessionId = getSessionId();

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

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

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

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

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
