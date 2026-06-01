import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const adapter = new PrismaPg({ connectionString: requireEnv("DATABASE_URL") });

export const prisma = new PrismaClient({ adapter });
