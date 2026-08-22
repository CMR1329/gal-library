import { readFile } from "node:fs/promises";

const expectedAppPath = "/api/auth/[...all]/route";
const expectedRoute = "/api/auth/[...all]";

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read ${path}: ${detail}`);
  }
}

const appPaths = await readJson(".next/server/app-paths-manifest.json");
const routes = await readJson(".next/routes-manifest.json");
const functions = await readJson(".next/server/functions-config-manifest.json");

const appRouteGenerated = typeof appPaths[expectedAppPath] === "string";
const dynamicRouteGenerated = routes.dynamicRoutes?.some(
  (route) => route.page === expectedRoute,
);
const functionGenerated = Object.hasOwn(functions.functions ?? {}, expectedRoute);

if (!appRouteGenerated || !dynamicRouteGenerated || !functionGenerated) {
  console.error("Better Auth route is missing from the Next.js build output.");
  console.error(
    JSON.stringify(
      { appRouteGenerated, dynamicRouteGenerated, functionGenerated },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(`Verified Next.js server function: ${expectedRoute}`);
