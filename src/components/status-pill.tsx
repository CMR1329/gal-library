import { getStatusLabel } from "@/lib/constants";

export function StatusPill({ status, mediaType }: { status: string; mediaType?: string }) {
  return <span className={`status-pill status-${status.toLowerCase()} inline-flex rounded-full border px-2.5 py-1 text-xs`}>{getStatusLabel(status, mediaType)}</span>;
}
