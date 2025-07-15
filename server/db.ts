import dotenv from 'dotenv';
dotenv.config();

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "definida" : "NÃO DEFINIDA");

import pg from 'pg';
const { Pool } = pg;

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
