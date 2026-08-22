import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "../src/generated/prisma/index.js";

const sourcePath = process.env.SOURCE_SQLITE_PATH || "prisma/dev.db";
const targetUrl = process.env.DATABASE_URL || "";
if (!/^(postgres|postgresql):\/\//i.test(targetUrl)) {
  throw new Error("DATABASE_URL must point to PostgreSQL before running this migration.");
}

const source = new DatabaseSync(sourcePath, { readOnly: true });
const target = new PrismaClient();

const tableRows = (table) => source.prepare(`SELECT * FROM "${table}"`).all();
const asDate = (value) => value == null ? value : new Date(value);
const asBool = (value) => value == null ? value : Boolean(value);
const rows = {
  Media: tableRows("Media"),
  User: tableRows("User"),
  ExternalMetadata: tableRows("ExternalMetadata"),
  ExternalReference: tableRows("ExternalReference"),
  Session: tableRows("Session"),
  Account: tableRows("Account"),
  Verification: tableRows("Verification"),
  UserEntry: tableRows("UserEntry"),
  Tag: tableRows("Tag"),
  UserEntryTag: tableRows("UserEntryTag"),
  RouteProgress: tableRows("RouteProgress"),
};

const counts = Object.fromEntries(Object.entries(rows).map(([table, values]) => [table, values.length]));
console.log("Source SQLite counts:", JSON.stringify(counts));

async function targetCounts() {
  return {
    Media: await target.media.count(),
    User: await target.user.count(),
    ExternalMetadata: await target.externalMetadata.count(),
    ExternalReference: await target.externalReference.count(),
    Session: await target.session.count(),
    Account: await target.account.count(),
    Verification: await target.verification.count(),
    UserEntry: await target.userEntry.count(),
    Tag: await target.tag.count(),
    UserEntryTag: await target.userEntryTag.count(),
    RouteProgress: await target.routeProgress.count(),
  };
}

if (process.env.INSPECT_ONLY === "1") {
  console.log("Target PostgreSQL counts:", JSON.stringify(await targetCounts()));
  source.close();
  await target.$disconnect();
  process.exit(0);
}

try {
  await target.$transaction(async (tx) => {
    await tx.media.createMany({ data: rows.Media.map((row) => ({ ...row, createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
    await tx.user.createMany({ data: rows.User.map((row) => ({ ...row, emailVerified: asBool(row.emailVerified), createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
    await tx.externalMetadata.createMany({ data: rows.ExternalMetadata.map((row) => ({ ...row, syncedAt: asDate(row.syncedAt) })), skipDuplicates: true });
    await tx.externalReference.createMany({ data: rows.ExternalReference.map((row) => ({ ...row, createdAt: asDate(row.createdAt) })), skipDuplicates: true });
    await tx.session.createMany({ data: rows.Session.map((row) => ({ ...row, expiresAt: asDate(row.expiresAt), createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
    await tx.account.createMany({ data: rows.Account.map((row) => ({ ...row, accessTokenExpiresAt: asDate(row.accessTokenExpiresAt), refreshTokenExpiresAt: asDate(row.refreshTokenExpiresAt), createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
    await tx.verification.createMany({ data: rows.Verification.map((row) => ({ ...row, expiresAt: asDate(row.expiresAt), createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
    await tx.userEntry.createMany({ data: rows.UserEntry.map((row) => ({ ...row, plannedRewatch: asBool(row.plannedRewatch), completedAllRoutes: asBool(row.completedAllRoutes), addedAt: asDate(row.addedAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
    await tx.tag.createMany({ data: rows.Tag.map((row) => ({ ...row, createdAt: asDate(row.createdAt) })), skipDuplicates: true });
    await tx.userEntryTag.createMany({ data: rows.UserEntryTag, skipDuplicates: true });
    await tx.routeProgress.createMany({ data: rows.RouteProgress.map((row) => ({ ...row, completed: asBool(row.completed), createdAt: asDate(row.createdAt), updatedAt: asDate(row.updatedAt) })), skipDuplicates: true });
  }, { maxWait: 30_000, timeout: 120_000 });

  const actual = await targetCounts();
  console.log("Target PostgreSQL counts:", JSON.stringify(actual));
  const mismatches = Object.keys(counts).filter((table) => counts[table] !== actual[table]);
  if (mismatches.length) throw new Error(`Count mismatch: ${mismatches.join(", ")}`);
  console.log("Migration completed: all table counts match.");
} finally {
  source.close();
  await target.$disconnect();
}
