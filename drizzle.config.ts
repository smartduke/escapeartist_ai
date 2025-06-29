import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'dinakar',
    password: process.env.DB_PASSWORD || 'dina',
    database: process.env.DB_NAME || 'ea_ai',
    ssl: false,
  },
});
