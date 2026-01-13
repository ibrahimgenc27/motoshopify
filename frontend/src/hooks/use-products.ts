import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
  });
}

export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: [api.products.getByCategory.path, category],
    queryFn: async () => {
      const url = buildUrl(api.products.getByCategory.path, { category });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch category");
      return api.products.getByCategory.responses[200].parse(await res.json());
    },
    enabled: !!category,
  });
}
