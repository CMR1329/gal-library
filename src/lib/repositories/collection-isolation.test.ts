import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@/generated/prisma";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const directory = mkdtempSync(join(tmpdir(), "yoru-isolation-"));
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
    { id: "test-user-a", username: "test-user-a", email: "a@test.invalid" },
    { id: "test-user-b", username: "test-user-b", email: "b@test.invalid" },
  ] });
  await client.media.create({ data: { id: "shared-media", mediaType: "ANIME", title: "隔离测试作品" } });
});

afterAll(async () => {
  await client?.$disconnect();
  rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});

describe("per-user collection isolation", () => {
  it("keeps a new user's library empty", async () => {
    expect(await client.userEntry.count({ where: { userId: "test-user-b" } })).toBe(0);
  });

  it("does not expose one user's entry to another user", async () => {
    await client.userEntry.create({ data: { userId: "test-user-a", mediaId: "shared-media", status: "IN_PROGRESS", score: 9 } });
    expect(await client.userEntry.count({ where: { userId: "test-user-a" } })).toBe(1);
    expect(await client.userEntry.count({ where: { userId: "test-user-b" } })).toBe(0);
  });

  it("stores independent records for the same shared media", async () => {
    await client.userEntry.create({ data: { userId: "test-user-b", mediaId: "shared-media", status: "PLANNED", score: 7 } });
    await client.userEntry.update({ where: { userId_mediaId: { userId: "test-user-a", mediaId: "shared-media" } }, data: { score: 9.5 } });
    const other = await client.userEntry.findUnique({ where: { userId_mediaId: { userId: "test-user-b", mediaId: "shared-media" } } });
    expect(other?.score).toBe(7);
    expect(other?.status).toBe("PLANNED");
  });

  it("deleting one collection entry preserves shared media and the other user's entry", async () => {
    await client.userEntry.delete({ where: { userId_mediaId: { userId: "test-user-a", mediaId: "shared-media" } } });
    expect(await client.media.count({ where: { id: "shared-media" } })).toBe(1);
    expect(await client.userEntry.count({ where: { userId: "test-user-b", mediaId: "shared-media" } })).toBe(1);
  });
});
