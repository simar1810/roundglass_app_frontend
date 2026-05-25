/**
 * Browser-side fetch → data URL for meal images when the server action cannot
 * reach the host (e.g. legacy S3 objects that allow browser CORS but block datacenter IPs).
 */

import { inferImageMimeFromBytes, inferImageMimeFromUrlPath } from "@/lib/imageMimeSniff";

export async function fetchImageAsDataUrlInBrowser(absoluteUrl) {
  if (typeof window === "undefined" || !absoluteUrl || typeof absoluteUrl !== "string") return "";
  const trimmed = absoluteUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return "";

  try {
    const res = await fetch(trimmed, { mode: "cors", credentials: "omit", cache: "no-store" });
    if (!res.ok) return "";
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.length) return "";

    const headerMime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    let mime = headerMime.startsWith("image/") ? headerMime : "";
    if (!mime) {
      mime = inferImageMimeFromBytes(buf) || inferImageMimeFromUrlPath(trimmed);
    }
    if (!mime || !mime.startsWith("image/")) return "";

    const blob = new Blob([buf], { type: mime });
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}
