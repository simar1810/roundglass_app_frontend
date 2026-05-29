/**
 * Strip characters that @react-pdf + built-in PDF fonts cannot render reliably.
 * @react-pdf's layout uses `emoji-regex-xs` for `embedEmojis`; when emoji images
 * fail to load, emoji are still passed through Helvetica and can corrupt nearby
 * Latin text — so we remove the same emoji ranges *before* layout.
 */

import emojiRegex from "emoji-regex-xs";

/** Same engine as `@react-pdf/layout` embedEmojis — keep in sync when upgrading. */
const stripEmojiSequences = (s) => s.replace(emojiRegex(), "");

/** Invisible / direction / line-separator controls that often ride along emoji-rich paste. */
const INVISIBLE_AND_BIDI = /[\u200B-\u200F\u2028\u2029\u2060\u2066-\u2069\uFEFF]/g;

/** Object replacement (substitution glyph from failed emoji embedding) + BOM. */
const SUBS_AND_BOM = /\uFFFC|\uFEFF/g;

export function sanitizeTextForReactPdf(text) {
  if (text == null) return "";
  let s = String(text);
  try {
    s = s.normalize("NFKC");
  } catch {
    s = String(text);
  }
  s = stripEmojiSequences(s);
  s = s.replace(/\uFE0F/g, "");
  s = s.replace(/\u200D/g, "");
  s = s.replace(INVISIBLE_AND_BIDI, "");
  s = s.replace(SUBS_AND_BOM, "");
  return s;
}
