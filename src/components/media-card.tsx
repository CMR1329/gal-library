import Link from "next/link";
import { Star } from "lucide-react";
import { CoverImage } from "./cover-image";
import { StatusPill } from "./status-pill";
import { MEDIA_TYPE_LABELS } from "@/lib/constants";
import { getDisplayTitle } from "@/lib/media-title";

type CardEntry = {
  id: string;
  status: string;
  score: number | null;
  progressCurrent: number | null;
  progressTotal: number | null;
  progressText: string | null;
  playtimeMinutes: number | null;
  media: { id: string; mediaType: string; title: string; titleCn: string | null; titleCnSource?: string | null; originalTitle: string | null; alternateTitles?: string | null; coverUrl: string | null; releaseYear: number | null };
};

export function MediaCard({ entry, href = `/media/${entry.media.id}`, showProgress = true }: { entry: CardEntry; href?: string; showProgress?: boolean }) {
  const displayTitle = getDisplayTitle(entry.media);
  const progress = entry.media.mediaType === "ANIME"
    ? entry.progressCurrent != null ? `${entry.progressCurrent}${entry.progressTotal ? ` / ${entry.progressTotal}` : ""} 集` : "未记录进度"
    : entry.progressText || (entry.playtimeMinutes ? `${Math.round(entry.playtimeMinutes / 6) / 10} 小时` : "未记录进度");
  return (
    <Link href={href} className="group min-w-0">
      <div className="media-card-cover relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/8 bg-[#141925]">
        <CoverImage src={entry.media.coverUrl} alt={displayTitle} className="size-full transition duration-500 group-hover:scale-[1.035]" />
        <span className="media-type-badge absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px]">{MEDIA_TYPE_LABELS[entry.media.mediaType]}</span>
        {entry.score != null && <span className="score-badge absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur"><Star className="size-3 fill-current" /> {entry.score.toFixed(1)}</span>}
      </div>
      <div className="px-1 pt-3">
        <h3 className="truncate font-medium text-slate-100 transition group-hover:text-violet-300">{displayTitle}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusPill status={entry.status} mediaType={entry.media.mediaType} />
           {showProgress && <span className="truncate text-xs text-slate-500">{progress}</span>}
        </div>
      </div>
    </Link>
  );
}
