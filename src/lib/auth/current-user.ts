import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export class AuthenticationError extends Error {
  constructor() {
    super("请先登录后再访问私人收藏。");
    this.name = "AuthenticationError";
  }
}

export function assertAuthenticatedUserId(userId: string | null | undefined) {
  if (!userId) throw new AuthenticationError();
  return userId;
}

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** API 与业务层使用：没有可信会话时直接拒绝，绝不回退到固定用户。 */
export async function getCurrentUserId() {
  const session = await getCurrentSession();
  return assertAuthenticatedUserId(session?.user?.id);
}

/** 页面使用：未登录时跳转到登录页，不执行任何私人数据查询。 */
export async function requirePageUser(callbackPath: string) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect(`/login?callbackURL=${encodeURIComponent(callbackPath)}`);
  return session.user;
}
