import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@/generated/prisma";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AdminMutationError, updateUserRole } from "./mutations";

const directory = mkdtempSync(join(tmpdir(), "yoru-admin-"));
const databasePath = join(directory, "test.db");
let client: PrismaClient;

beforeAll(async () => {
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
  await client.user.createMany({ data: [
    { id: "actor", username: "actor", role: "super_admin" },
    { id: "target", username: "target", role: "user" },
    { id: "protected", username: "protected", role: "super_admin" },
  ] });
});

afterAll(async () => {
  await client?.$disconnect();
  rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});

describe("administrator role mutations", () => {
  it("changes user/admin roles and writes an audit log in the same temporary database", async () => {
    const result = await updateUserRole("actor", "target", "admin", client);
    expect(result).toEqual({ id: "target", role: "admin", changed: true });
    expect((await client.user.findUniqueOrThrow({ where: { id: "target" } })).role).toBe("admin");
    expect(await client.adminLog.count({ where: { actorUserId: "actor", action: "UPDATE_USER_ROLE", targetId: "target" } })).toBe(1);
  });

  it("refuses to modify another super administrator", async () => {
    await expect(updateUserRole("actor", "protected", "user", client)).rejects.toEqual(expect.objectContaining<Partial<AdminMutationError>>({ status: 409 }));
    expect((await client.user.findUniqueOrThrow({ where: { id: "protected" } })).role).toBe("super_admin");
  });
});
