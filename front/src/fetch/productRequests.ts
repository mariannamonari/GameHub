import type { ProductDTO } from "@/dto/ProductDTO";
import { apiRequest } from "@/fetch/api";

export interface ProductFilters {
  search?: string;
  category?: string;
  sort?: "name" | "price" | "price_desc";
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductPageDTO {
  items: ProductDTO[];
  total: number;
  page: number;
  limit: number;
}

export function getProducts(filters: ProductFilters = {}, signal?: AbortSignal) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.inStock) params.set("inStock", "true");
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  return apiRequest<ProductPageDTO>(`/products?${params.toString()}`, { signal });
}

export function createProduct(product: Omit<ProductDTO, "id">) {
  return apiRequest<ProductDTO>("/products", {
    method: "POST",
    body: JSON.stringify(product)
  });
}

export function deleteProduct(id: number) {
  return apiRequest<{ message: string }>(`/products/${id}`, {
    method: "DELETE"
  });
}
