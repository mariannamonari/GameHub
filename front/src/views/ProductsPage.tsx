"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import type { ProductDTO } from "@/dto/ProductDTO";
import { createProduct, deleteProduct, getProducts, type ProductPageDTO } from "@/fetch/productRequests";
import { measurePerformance } from "@/utils/measurePerformance";

export function ProductsPage() {
  const [products, setProducts] = useState<ProductPageDTO>({ items: [], total: 0, page: 1, limit: 24 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"name" | "price" | "price_desc">("name");
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const token = window.localStorage.getItem("gamehub-token");
    if (!token) return;
    try {
      const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(encoded));
      setIsAdmin(payload.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const result = await measurePerformance(
        "carregamento de produtos",
        () => getProducts({ search: debouncedSearch, category, sort, inStock, page, limit: 24 }, signal)
      );
      if (!signal?.aborted) {
        setProducts(result);
        if (result.items.length === 0 && result.total > 0 && page > Math.ceil(result.total / result.limit)) {
          setPage(Math.ceil(result.total / result.limit));
        }
      }
    } catch (requestError) {
      if (!signal?.aborted) setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [debouncedSearch, category, sort, inStock, page]);

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts, refreshKey]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setCreating(true);
    setCreateMessage("");
    setError("");
    try {
      await createProduct({
        name: String(data.get("name") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(),
        category: String(data.get("category") ?? "Jogos") as ProductDTO["category"],
        price: Number(data.get("price")),
        stock: Number(data.get("stock"))
      });
      setCreateMessage("Produto cadastrado. Catálogo atualizado.");
      form.reset();
      setPage(1);
      if (page === 1) setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível cadastrar o produto.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja excluir este produto?")) return;

    try {
      await deleteProduct(id);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível excluir.");
    }
  }

  const visibleProducts = products.items;
  const firstItem = products.total === 0 ? 0 : (products.page - 1) * products.limit + 1;
  const lastItem = Math.min(products.page * products.limit, products.total);

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CATÁLOGO</span>
          <h1>Produtos</h1>
          <p>Pesquise e consulte o estoque da loja.</p>
        </div>
        <span className="result-count">{firstItem}–{lastItem} de {products.total} produtos</span>
      </div>

      {isAdmin && (
        <form className="product-create-form" onSubmit={handleCreate}>
          <h2>Cadastrar produto</h2>
          <div className="product-create-form__grid">
            <label>Nome<input name="name" required minLength={2} maxLength={100} placeholder="Nome do produto" /></label>
            <label>Descrição<input name="description" required minLength={3} maxLength={500} placeholder="Descrição curta" /></label>
            <label>Categoria<select name="category" defaultValue="Jogos"><option value="Consoles">Consoles</option><option value="Jogos">Jogos</option><option value="Acessórios">Acessórios</option><option value="Periféricos">Periféricos</option><option value="Hardware">Hardware</option></select></label>
            <label>Preço<input name="price" type="number" min="0.01" step="0.01" required defaultValue="199.90" /></label>
            <label>Estoque<input name="stock" type="number" min="0" step="1" required defaultValue="10" /></label>
            <button className="button" disabled={creating}>{creating ? "Cadastrando..." : "Cadastrar produto"}</button>
          </div>
          {createMessage && <p className="form-success" role="status">{createMessage}</p>}
        </form>
      )}

      <div className="filters">
        <label>
          Buscar
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nome, descrição ou categoria..." />
        </label>
        <label>
          Categoria
          <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
            <option value="">Todas</option>
            <option value="Consoles">Consoles</option>
            <option value="Jogos">Jogos</option>
            <option value="Acessórios">Acessórios</option>
            <option value="Periféricos">Periféricos</option>
            <option value="Hardware">Hardware</option>
          </select>
        </label>
        <label>
          Ordenar
          <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }}>
            <option value="name">Nome</option>
            <option value="price">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </label>
        <label className="filter-checkbox">
          <input type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setPage(1); }} />
          Somente disponíveis
        </label>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            setSearch("");
            setCategory("");
            setSort("name");
            setInStock(false);
            setPage(1);
          }}
        >
          Limpar filtros
        </button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={loadProducts} /> : (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={handleDelete} />
          ))}
          {visibleProducts.length === 0 && <p>Nenhum produto encontrado.</p>}
        </div>
      )}
      {!loading && !error && products.total > 0 && (
        <nav className="pagination" aria-label="Paginação do catálogo">
          <button className="button button--secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Anterior</button>
          <span>Página {products.page} de {Math.ceil(products.total / products.limit)}</span>
          <button className="button button--secondary" onClick={() => setPage((current) => current + 1)} disabled={lastItem >= products.total}>Próxima</button>
        </nav>
      )}
    </section>
  );
}