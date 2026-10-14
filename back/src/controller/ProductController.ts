import type { Request, Response } from "express";
import { createProductSchema } from "../dto/CreateProductDTO";
import { ProductService } from "../../infra/services/ProductService";

export class ProductController {
  constructor(private readonly service = new ProductService()) {}

  list = async (request: Request, response: Response) => {
    const requestedPage = Number(request.query.page ?? 1);
    const requestedLimit = Number(request.query.limit ?? 24);
    const sort = String(request.query.sort ?? "name");
    const products = await this.service.list({
      search: String(request.query.search ?? "").trim().slice(0, 100),
      category: String(request.query.category ?? "").trim().slice(0, 80),
      sort: sort === "price" || sort === "price_desc" ? sort : "name",
      inStock: request.query.inStock === "true",
      page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
      limit: Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 24
    });
    response.json(products);
  };

  create = async (request: Request, response: Response) => {
    const parsed = createProductSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        message: "Dados inválidos.",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const product = await this.service.create(parsed.data);
    response.status(201).json(product);
  };

  remove = async (request: Request, response: Response) => {
    await this.service.remove(Number(request.params.id));
    response.json({ message: "Produto excluído com sucesso." });
  };

  dashboard = async (_request: Request, response: Response) => {
    response.json(await this.service.dashboard());
  };
}
