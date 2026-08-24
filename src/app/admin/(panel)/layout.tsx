import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/admin-authorization";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireAdminPage();
  return <AdminShell principal={principal}>{children}</AdminShell>;
}
