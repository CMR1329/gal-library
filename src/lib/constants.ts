export const MEDIA_TYPES = {
  ANIME: "ANIME",
  VISUAL_NOVEL: "VISUAL_NOVEL",
} as const;

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  ANIME: "Anime",
  VISUAL_NOVEL: "Galgame",
};

export const ENTRY_STATUSES = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type EntryStatus = keyof typeof ENTRY_STATUSES;

const STATUS_LABELS: Record<string, Record<EntryStatus, string>> = {
  ANIME: { PLANNED: "想看", IN_PROGRESS: "正在看", COMPLETED: "看过" },
  VISUAL_NOVEL: { PLANNED: "想玩", IN_PROGRESS: "正在玩", COMPLETED: "玩过" },
};

const NEUTRAL_STATUS_LABELS: Record<EntryStatus, string> = {
  PLANNED: "计划中",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
};

export function getStatusLabel(status: string, mediaType?: string) {
  if (status in ENTRY_STATUSES) return (mediaType ? STATUS_LABELS[mediaType]?.[status as EntryStatus] : undefined) ?? NEUTRAL_STATUS_LABELS[status as EntryStatus];
  return status === "ON_HOLD" ? "历史状态：搁置" : status === "DROPPED" ? "历史状态：已放弃" : status;
}

export function getStatusOptions(mediaType?: string) {
  return (Object.keys(ENTRY_STATUSES) as EntryStatus[]).map((value) => ({ value, label: getStatusLabel(value, mediaType) }));
}

export const DEFAULT_COVER = "/cover-placeholder.svg";
