import "dotenv/config";

export const environment = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? "local-development-only-secret",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:admin@localhost:5432/gamehub"
};
