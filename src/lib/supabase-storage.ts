import "server-only";

const MAX_BACKGROUND_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class StorageConfigurationError extends Error {}
export class BackgroundFileError extends Error {}

function storageConfiguration() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BACKGROUND_BUCKET || "site-backgrounds";
  if (!url || !serviceRoleKey) {
    throw new StorageConfigurationError("Supabase Storage 服务端环境变量尚未配置。");
  }
  return { url, serviceRoleKey, bucket };
}

function objectUrl(baseUrl: string, bucket: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export async function validateBackgroundFile(file: File) {
  if (!file.size) throw new BackgroundFileError("请选择背景图片。");
  if (file.size > MAX_BACKGROUND_SIZE) throw new BackgroundFileError("背景图片不能超过 10 MB。");
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) throw new BackgroundFileError("背景图片仅支持 JPG、PNG、WebP 或 AVIF。");
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  const valid = file.type === "image/jpeg" ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === "image/png" ? bytes.length >= 8 && bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])
    : file.type === "image/webp" ? bytes.length >= 12 && ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP"
    : bytes.length >= 12 && ascii.slice(4, 8) === "ftyp" && (ascii.includes("avif") || ascii.includes("avis"));
  if (!valid) throw new BackgroundFileError("文件内容与图片格式不匹配。");
  return extension;
}

export async function uploadBackgroundImage(file: File) {
  const extension = await validateBackgroundFile(file);
  const config = storageConfiguration();
  const path = `backgrounds/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(objectUrl(config.url, config.bucket, path), {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": file.type,
      "Cache-Control": "3600",
      "x-upsert": "false",
    },
    body: file,
  });
  if (!response.ok) throw new Error(`上传背景图片失败（Storage ${response.status}）。`);

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return {
    path,
    publicUrl: `${config.url}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${encodedPath}`,
  };
}

export async function deleteManagedBackground(publicUrl: string | null | undefined) {
  if (!publicUrl) return;
  const config = storageConfiguration();
  const publicPrefix = `${config.url}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/`;
  if (!publicUrl.startsWith(publicPrefix)) return;
  const encodedPath = publicUrl.slice(publicPrefix.length).split("?")[0];
  if (!encodedPath) return;
  await fetch(`${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodedPath}`, {
    method: "DELETE",
    headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
  });
}
