import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import type { PrismaClient } from "@/generated/prisma";
import { db } from "@/lib/db";

export function createAuth(database: PrismaClient) {
  return betterAuth({
  database: prismaAdapter(database, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      // 兼容现有 User.username 非空列；登录身份仍以唯一 email 为准。
      username: { type: "string", required: true, input: true, unique: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: { joins: true },
  },
  });
}

export const auth = createAuth(db);
