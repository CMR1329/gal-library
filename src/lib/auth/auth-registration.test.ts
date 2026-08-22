import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@/generated/prisma";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "./auth";

const directory = mkdtempSync(join(tmpdir(), "yoru-auth-"));
const databasePath = join(directory, "test.db");
let client: PrismaClient;

beforeAll(() => {
  const sqlite = new DatabaseSync(databasePath);
  try {
    sqlite.exec("PRAGMA foreign_keys = ON;");
    const migrationRoot = resolve("prisma/migrations-sqlite");
    for (const name of readdirSync(migrationRoot).sort()) {
      const migration = join(migrationRoot, name, "migration.sql");
      if (existsSync(migration)) sqlite.exec(readFileSync(migration, "utf8"));
    }
  } finally {
    sqlite.close();
  }
  client = new PrismaClient({ datasources: { db: { url: `file:${databasePath.replaceAll("\\", "/")}` } } });
});

afterAll(async () => {
  await client?.$disconnect();
  rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});

describe("Better Auth registration", () => {
  it("creates an authenticated account with an empty library", async () => {
    const localAuth = createAuth(client);
    const result = await localAuth.api.signUpEmail({ body: {
      name: "测试账号",
      email: "registration@test.invalid",
      password: "safe-test-password",
      username: "registration@test.invalid",
    } });

    expect(result.user.email).toBe("registration@test.invalid");
    expect(await client.userEntry.count({ where: { userId: result.user.id } })).toBe(0);
  });
});
