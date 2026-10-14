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
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const parameter = `$${values.length}`;
      conditions.push(`(name ILIKE ${parameter} OR description ILIKE ${parameter} OR category ILIKE ${parameter})`);
    }

    if (filters.category) {
      values.push(filters.category);
      conditions.push(`category = $${values.length}`);
    }

    if (filters.inStock) conditions.push("stock > 0");

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 24;
    const offset = (page - 1) * limit;
    const orderBy = filters.sort === "price"
      ? "p.price ASC, p.id ASC"
      : filters.sort === "price_desc"
        ? "p.price DESC, p.id ASC"
        : "p.name ASC, p.id ASC";
    const queryValues = [...values, limit, offset];
    const limitParameter = `$${values.length + 1}`;
    const offsetParameter = `$${values.length + 2}`;
    const sql = `
      WITH filtered AS (
        SELECT id, name, description, category, price, stock
        FROM products ${where}
      ), page AS (
        SELECT * FROM filtered
        ORDER BY ${orderBy.replaceAll("p.", "")}
        LIMIT ${limitParameter} OFFSET ${offsetParameter}
      ), total AS (
        SELECT COUNT(*)::int AS value FROM filtered
      )
      SELECT p.id, p.name, p.description, p.category, p.price, p.stock, total.value AS total
      FROM total LEFT JOIN page p ON TRUE
      ORDER BY ${orderBy}`;

    const startedAt = performance.now();
    const result = await db.query(sql, queryValues);
    const duration = performance.now() - startedAt;
    if (duration > 250) {
      console.warn(`[SQL LENTO] catálogo: ${result.rows.length} linhas em ${duration.toFixed(2)} ms`);
    }

    const items = result.rows.filter((row) => row.id !== null).map(mapProduct);
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
