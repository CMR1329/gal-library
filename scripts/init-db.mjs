import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function envFileValue(name) {
  for (const file of [".env.local", ".env"]) {
    try {
      const line = readFileSync(resolve(file), "utf8").split(/\r?\n/).find((item) => item.trim().startsWith(`${name}=`));
      if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
    } catch {
      // Continue to the next environment file.
    }
  }
  return undefined;
}

const databaseUrl = process.env.DATABASE_URL || envFileValue("DATABASE_URL");
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

if (/^(postgres|postgresql):\/\//i.test(databaseUrl)) {
  const prismaCommand = resolve("node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
  const result = spawnSync(prismaCommand, ["migrate", "deploy", "--schema", "prisma/postgresql/schema.prisma"], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

if (!/^file:/i.test(databaseUrl)) throw new Error("DATABASE_URL must use file: for SQLite or postgresql:// for PostgreSQL.");
const configuredPath = decodeURIComponent(databaseUrl.slice(databaseUrl.indexOf(":") + 1));
const databasePath = configuredPath.startsWith("/") ? resolve(configuredPath) : resolve("prisma", configuredPath);
const database = new DatabaseSync(databasePath);
database.exec("PRAGMA foreign_keys = ON;");
database.exec('CREATE TABLE IF NOT EXISTS "_YoruMigration" ("name" TEXT NOT NULL PRIMARY KEY, "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');

const hasMedia = database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'Media'").get();
if (hasMedia) database.prepare('INSERT OR IGNORE INTO "_YoruMigration" ("name") VALUES (?)').run("20260822000000_init");

const migrationRoot = resolve("prisma/migrations-sqlite");
const migrationNames = readdirSync(migrationRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(migrationRoot, entry.name, "migration.sql")))
  .map((entry) => entry.name)
  .sort();

for (const name of migrationNames) {
  const applied = database.prepare('SELECT 1 FROM "_YoruMigration" WHERE "name" = ?').get(name);
  if (applied) continue;
  const sql = readFileSync(resolve(migrationRoot, name, "migration.sql"), "utf8");
  database.exec("BEGIN");
  try {
    database.exec(sql);
    database.prepare('INSERT INTO "_YoruMigration" ("name") VALUES (?)').run(name);
    database.exec("COMMIT");
    console.log(`Applied migration ${name}`);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

database.close();
console.log(`SQLite database ready at ${databasePath}`);
