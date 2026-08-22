import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const isVercel = process.env.VERCEL === "1";
const schema = isVercel
  ? "prisma/postgresql/schema.prisma"
  : "prisma/schema.prisma";
const prismaCommand = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));

if (isVercel && !/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? "")) {
  throw new Error("Vercel builds require DATABASE_URL to be a PostgreSQL connection string.");
}

console.log(`Generating Prisma Client from ${schema}`);
execFileSync(process.execPath, [prismaCommand, "generate", "--schema", schema], {
  stdio: "inherit",
});
