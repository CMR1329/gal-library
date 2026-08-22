/**
 * The single title policy used by search, library, dashboard and detail views.
 * Provider adapters may retain their source-specific fields, but UI code should
 * never choose between them independently.
 */
export type TitleFields = {
  title?: string | null;
  titleCn?: string | null;
  titleCnSource?: string | null;
  originalTitle?: string | null;
  romanizedTitle?: string | null;
  englishTitle?: string | null;
  alternateTitles?: string[] | string | null;
};

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function getDisplayTitle(fields: TitleFields) {
  // A title is Chinese only when a trusted provider explicitly identified it
  // as such. Never infer this from CJK characters in an alias or original title.
  const explicitChinese = ["bangumi", "manual"].includes(fields.titleCnSource ?? "") ? clean(fields.titleCn) : null;
  if (explicitChinese) return explicitChinese;
  return clean(fields.originalTitle) || clean(fields.romanizedTitle) || clean(fields.englishTitle) || clean(fields.title) || "未命名作品";
}

export function getDisplaySubtitle(fields: TitleFields) {
  const title = getDisplayTitle(fields);
  return [clean(fields.originalTitle), clean(fields.romanizedTitle), clean(fields.englishTitle)]
    .find((value) => Boolean(value && value !== title)) || null;
}
