/**
 * Normalize meal/dish image fields for PDF and server fetch.
 * Backend may return a string URL, `{ url }`, or `{ s3Key }` (only expanded URLs are usable here).
 */

export function resolveMealImageUrlString(val) {
  if (val == null) return "";
  if (typeof val === "string") {
    const t = val.trim();
    if (!t || t === "[object Object]") return "";
    return t;
  }
  if (typeof val === "object") {
    const url = val.url ?? val.href ?? val.src;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  return "";
}

/** Prefer dish fields, then first line-item image on the slot. */
export function pickDishPrimaryImageUrl(dish, slot) {
  const fromDish =
    resolveMealImageUrlString(dish?.image) ||
    resolveMealImageUrlString(dish?.thumbnail) ||
    resolveMealImageUrlString(dish?.photo);
  if (fromDish) return fromDish;
  const items = Array.isArray(slot?.items) ? slot.items : [];
  for (const it of items) {
    if (it && typeof it === "object") {
      const u = resolveMealImageUrlString(it.image);
      if (u) return u;
    }
  }
  return "";
}
