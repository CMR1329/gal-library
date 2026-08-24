import { BackgroundUploadForm } from "@/components/admin/background-upload-form";
import { requireSuperAdminPage } from "@/lib/auth/admin-authorization";
import { getSiteSettingsForAdmin } from "@/lib/site-settings";

export const metadata = { title: "网站设置" };

export default async function AdminSettingsPage() {
  await requireSuperAdminPage();
  const settings = await getSiteSettingsForAdmin();
  return <div className="space-y-6">
    <div><p className="text-sm text-violet-300">Site settings</p><h1 className="mt-2 text-3xl font-semibold">网站背景图片</h1><p className="mt-2 text-sm text-slate-500">只有超级管理员可以上传和替换全局背景。</p></div>
    <section className="surface p-6">
      <h2 className="text-lg font-semibold">当前背景</h2>
      {settings?.backgroundImageUrl ? <div className="mt-4 aspect-[16/7] rounded-xl border border-white/8 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(settings.backgroundImageUrl)})` }} aria-label="当前网站背景图片预览" /> : <div className="mt-4 grid aspect-[16/7] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 text-sm text-slate-500">尚未设置，网站继续使用当前主题默认背景</div>}
      <div className="mt-6"><BackgroundUploadForm /></div>
    </section>
  </div>;
}
