export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly retryAfter?: string | null,
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (response.status === 429) {
      throw new ExternalApiError("第三方资料库请求过于频繁，请稍后再试。", 429, response.headers.get("retry-after"));
    }
    if (!response.ok) {
      throw new ExternalApiError(`第三方资料库暂时无法响应（${response.status}）。`, 502);
    }
    return response;
  } catch (error) {
    if (error instanceof ExternalApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ExternalApiError("第三方资料库响应超时，请检查网络后重试。", 504);
    }
    throw new ExternalApiError("无法连接第三方资料库，请检查网络连接。", 502);
  } finally {
    clearTimeout(timer);
  }
}
