import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (has real values), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct URL (port 5432) for migrations — pooler (6543) doesn't support DDL
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
  },
});
