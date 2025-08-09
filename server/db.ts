import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool using individual environment variables with SSL
const port = process.env.PGPORT && !isNaN(parseInt(process.env.PGPORT)) ? parseInt(process.env.PGPORT, 10) : 5432;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: port,
  database: 'laabobo', // Use database name directly instead of PGDATABASE which contains full URL
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }, // Required for external databases like Render
});

export const db = drizzle({ client: pool, schema });