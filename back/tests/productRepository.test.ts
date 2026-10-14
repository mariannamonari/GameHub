import test from "node:test";
import assert from "node:assert/strict";

import { buildProductQuery } from "../infra/repositories/ProductRepository";

test("category filter is case-insensitive and price sorting is numeric", () => {
  const { sql, values } = buildProductQuery({
    category: "Acessórios",
    sort: "price_desc",
    page: 2,
    limit: 10,
    inStock: true
  });

  assert.match(sql, /LOWER\(category\) = LOWER\(\$1\)/i);
  assert.match(sql, /ORDER BY price DESC, id ASC/i);
  assert.deepEqual(values, ["Acessórios", 10, 10]);
});

test("search query keeps a single parameter value and preserves sort order", () => {
  const { sql, values } = buildProductQuery({
    search: "console",
    sort: "price",
    page: 1,
    limit: 24
  });

  assert.match(sql, /LOWER\(name\) LIKE LOWER\(\$1\)/i);
  assert.match(sql, /ORDER BY price ASC, id ASC/i);
  assert.deepEqual(values, ["%console%", 24, 0]);
});
