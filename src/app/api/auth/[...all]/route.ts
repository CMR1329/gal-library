import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

// Better Auth uses the database adapter and must run on Node.js.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
  return handler.GET(request);
}

export async function POST(request: Request) {
  return handler.POST(request);
}
