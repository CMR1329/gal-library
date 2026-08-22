import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentSession } from "@/lib/auth/current-user";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentSession()) redirect("/");
  return <div className="grid min-h-[calc(100vh-10rem)] place-items-center py-8"><Suspense><AuthForm /></Suspense></div>;
}
