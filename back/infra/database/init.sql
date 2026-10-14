CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student'))
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES_START
CREATE INDEX IF NOT EXISTS idx_products_category_name_id
    ON products (category, name, id);
CREATE INDEX IF NOT EXISTS idx_products_category_price_id
    ON products (category, price, id);
CREATE INDEX IF NOT EXISTS idx_products_price_id
    ON products (price, id);
CREATE INDEX IF NOT EXISTS idx_products_name_id
    ON products (name, id);

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE INDEX IF NOT EXISTS idx_products_name_trgm
        ON products USING GIN (name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_products_description_trgm
        ON products USING GIN (description gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_products_category_trgm
        ON products USING GIN (category gin_trgm_ops);
EXCEPTION
    WHEN insufficient_privilege OR undefined_object THEN
        RAISE NOTICE 'pg_trgm indisponível; busca textual continuará funcional sem índices trigram.';
END $$;
