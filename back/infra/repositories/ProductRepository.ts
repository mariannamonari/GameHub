import { db } from "../database/db";
import type { CreateProductDTO } from "../../src/dto/CreateProductDTO";
import type { Product } from "../../src/model/Product";

export interface ProductFilters {
  search?: string;
  category?: string;
  sort?: "name" | "price" | "price_desc";
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export function buildProductQuery(filters: ProductFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    values.push(search);
    const parameter = `$${values.length}`;
    conditions.push(`(LOWER(name) LIKE LOWER(${parameter}) OR LOWER(description) LIKE LOWER(${parameter}) OR LOWER(category) LIKE LOWER(${parameter}))`);
  }

  if (filters.category?.trim()) {
    values.push(filters.category.trim());
    const parameter = `$${values.length}`;
    conditions.push(`LOWER(category) = LOWER(${parameter})`);
  }

  if (filters.inStock) conditions.push("stock > 0");

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const page = Number.isInteger(filters.page) && Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number.isInteger(filters.limit) && Number(filters.limit) > 0 ? Math.min(Number(filters.limit), 100) : 24;
  const offset = (page - 1) * limit;
  const orderBy = filters.sort === "price"
    ? "price ASC, id ASC"
    : filters.sort === "price_desc"
      ? "price DESC, id ASC"
      : "name ASC, id ASC";
  const queryValues = [...values, limit, offset];
  const limitParameter = `$${values.length + 1}`;
  const offsetParameter = `$${values.length + 2}`;
  const sql = `
    WITH filtered AS (
      SELECT id, name, description, category, price, stock
      FROM products ${where}
    ), total AS (
      SELECT COUNT(*)::int AS total FROM filtered
    )
    SELECT f.id, f.name, f.description, f.category, f.price, f.stock, t.total
    FROM filtered f
    CROSS JOIN total t
    ORDER BY ${orderBy}
    LIMIT ${limitParameter} OFFSET ${offsetParameter}
  `;

  return { sql, values: queryValues, page, limit };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description),
    category: String(row.category),
    price: Number(row.price),
    stock: Number(row.stock)
  };
}

export class ProductRepository {
  async findAll(filters: ProductFilters): Promise<ProductPage> {
    const { sql, values, page, limit } = buildProductQuery(filters);

    const startedAt = performance.now();
    const result = await db.query(sql, values);
    const duration = performance.now() - startedAt;
    if (duration > 250) {
      console.warn(`[SQL LENTO] catálogo: ${result.rows.length} linhas em ${duration.toFixed(2)} ms`);
    }

    const items = result.rows.map(mapProduct);
    return {
      items,
      total: Number(result.rows[0]?.total ?? 0),
      page,
      limit
    };
  }

  async create(input: CreateProductDTO): Promise<Product> {
    const result = await db.query(
      `INSERT INTO products (name, description, category, price, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, category, price, stock`,
      [input.name, input.description, input.category, input.price, input.stock]
    );
    return mapProduct(result.rows[0]);
  }

  async delete(id: number): Promise<void> {
    await db.query("DELETE FROM products WHERE id = $1", [id]);
  }

  async getDashboard() {
    const dashboardStartedAt = performance.now();
    const result = await db.query(`
      SELECT
        COUNT(*)::int AS total_products,
        COUNT(*) FILTER (WHERE stock <= 5)::int AS low_stock,
        COUNT(*) FILTER (WHERE stock > 0)::int AS available_products,
        COALESCE(SUM(price * stock), 0) AS inventory_value,
        COUNT(DISTINCT category)::int AS categories
      FROM products
    `);
    const duration = performance.now() - dashboardStartedAt;
    if (duration > 250) console.warn(`[SQL LENTO] dashboard: consulta agregada em ${duration.toFixed(2)} ms`);
    const row = result.rows[0];

    return {
      totalProducts: Number(row.total_products),
      lowStock: Number(row.low_stock),
      availableProducts: Number(row.available_products),
      inventoryValue: Number(row.inventory_value),
      categories: Number(row.categories)
    };
  }
}
