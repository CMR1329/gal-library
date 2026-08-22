import { getCurrentUserId } from "@/lib/auth/current-user";
import { apiError } from "@/lib/http";
import { exportUserCollection } from "@/lib/repositories/collection";

export async function GET() {
  try {
    const payload = await exportUserCollection(await getCurrentUserId());
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="yoru-library-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
