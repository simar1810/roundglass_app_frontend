import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import NamedPdfViewer from "@/components/pdf/NamedPdfViewer";
import { pickDishPrimaryImageUrl } from "@/lib/mealPdfImageUrl";
import { sanitizeTextForReactPdf } from "@/lib/pdfTextSanitize";
import { getMealPDFData } from "@/lib/remapMealPlanStats";
import { signatureSlotToDishesList, wellnessPdfPlansToRemapObject } from "@/lib/wellnessSignaturePdfAdapter";

/**
 * Latin + Gujarati (merged). Use `*-nolayout.ttf`: full merged fonts trip fontkit
 * (`getAnchor` / null `xCoordinate`) during GPOS/GSUB for @react-pdf layout.
 */
Font.register({
  family: "SignatureIndicGujarati",
  fonts: [
    { src: "/fonts/NotoSansGujarati-Merged-400-nolayout.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansGujarati-Merged-700-nolayout.ttf", fontWeight: 700 },
  ],
});

/** Hindi / Marathi / other Devanagari script (Gujarati block excluded — use merged above). */
Font.register({
  family: "SignatureIndicDevanagari",
  fonts: [
    { src: "/fonts/Noto-Sans-Devnagiri.ttf", fontWeight: 400 },
    { src: "/fonts/Noto-Sans-Devnagiri.ttf", fontWeight: 700 },
  ],
});

const PDF_FONT_GUJARATI = "SignatureIndicGujarati";
const PDF_FONT_DEVANAGARI = "SignatureIndicDevanagari";

/** Default body font: merged Latin + Gujarati; English labels match other meal PDFs. */
const PDF_FONT = PDF_FONT_GUJARATI;

const RE_GUJARATI_SCRIPT = /[\u0A80-\u0AFF]/;
const RE_DEVANAGARI_SCRIPT = /[\u0900-\u097F]/;

/** Pick a font that contains glyphs for this string (react-pdf has no automatic script fallback). */
function pdfScriptFontStyleForText(text) {
  const s = String(text);
  if (RE_GUJARATI_SCRIPT.test(s)) return { fontFamily: PDF_FONT_GUJARATI };
  if (RE_DEVANAGARI_SCRIPT.test(s)) return { fontFamily: PDF_FONT_DEVANAGARI };
  return {};
}

/** Avoid awkward mid-word breaks (e.g. "com-" / "bined") in narrow columns. */
const PDF_TEXT_NO_HYPHEN = { hyphenationCallback: (word) => [word] };

/** Cover “Nutrition” line — design accent (react-pdf has no backdrop-filter). */
const COVER_NUTRITION_ORANGE = "#FF7A00";

/** Frosted card: neutral dark glass (avoids green cast from food photo bleeding through a light tint). */
const COVER_GLASS_FILL = "rgba(12, 12, 14, 0.58)";
/** Outer rim reads as glass edge — light, not green. */
const COVER_GLASS_RIM = "rgba(255, 255, 255, 0.34)";

/** Static assets under `public/Mealplan/` */
const COVER_PAGE_BACKGROUND_SRC = "/Mealplan/Page1CoverImage.png";
const OVERVIEW_HEADER_BACKGROUND_SRC = "/Mealplan/Page2RectangleBox.png";

function createCoverStyles() {
  return StyleSheet.create({
    coverPage: {
      fontFamily: PDF_FONT,
      position: "relative",
      width: "100%",
      height: "100%",
    },
    coverSection: { position: "relative", width: "100%", height: "100%" },
    headerBgImage: {
      position: "absolute",
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    dimOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.44)",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    /** Thin light halo — simulates frosted edge; inner card has no border (avoids green fringe on kale). */
    cardFrame: {
      width: "78%",
      maxWidth: 362,
      borderRadius: 16,
      padding: 2,
      backgroundColor: COVER_GLASS_RIM,
      alignItems: "stretch",
    },
    card: {
      width: "100%",
      minHeight: 340,
      borderRadius: 14,
      backgroundColor: COVER_GLASS_FILL,
      alignItems: "center",
      paddingTop: 44,
      paddingBottom: 36,
      paddingHorizontal: 22,
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    },
    /** Soft top highlight — suggests light on glass (not a blur, but reads “frosted”). */
    cardGlassSheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      backgroundColor: "rgba(255,255,255,0.07)",
    },
    cardTop: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    titleContainer: { alignItems: "center", marginBottom: 4 },
    titleWhite: {
      fontFamily: PDF_FONT,
      color: "#FFFFFF",
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 1.08,
      maxWidth: "100%",
    },
    titleOrange: {
      fontFamily: PDF_FONT,
      color: COVER_NUTRITION_ORANGE,
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 1.08,
      maxWidth: "100%",
    },
    divider: {
      width: 48,
      height: 1,
      backgroundColor: "rgba(200,200,200,0.55)",
      marginTop: 14,
      marginBottom: 22,
    },
    preparedBy: {
      color: "#CCCCCC",
      fontSize: 8,
      letterSpacing: 2.5,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    authorName: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold", textAlign: "center" },
    cardFooter: {
      marginTop: 36,
      alignItems: "center",
      width: "100%",
    },
    protocolText: {
      color: "#FFFFFF",
      fontSize: 7,
      letterSpacing: 4,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    chevron: { color: "#FFFFFF", fontSize: 14 },
  });
}

/** Shared A4 page shell (optimization page, etc.). */
const portraitStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    padding: 22,
    fontSize: 10,
    backgroundColor: "#fff",
    color: "#1a1a1a",
  },
});

const OVERVIEW_GREEN = "#004D40";
const OVERVIEW_ORANGE = "#F39C12";

function formatClientIdForPdf(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  const s = String(raw).trim();
  return s.startsWith("#") ? s : `#${s}`;
}

/** Page 3 — grams from `nutritionalInformation`; calories total from macro breakdown. */
function formatGramTokenFromNutritionField(field) {
  if (!field || typeof field !== "string") return "—";
  const m = field.match(/([\d.]+)\s*g/i);
  if (!m) return field.trim().slice(0, 14);
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
  return `${rounded}g`;
}

function mealScheduleSubtitle(meal) {
  const items = Array.isArray(meal?.items) ? meal.items : [];
  if (!items.length) return "—";
  const first = items[0];
  if (typeof first === "string") {
    const t = first.trim();
    const line = t.length > 88 ? `${t.slice(0, 85)}…` : t;
    return sanitizeTextForReactPdf(line);
  }
  const details = String(first.details || "").trim();
  if (details) {
    const line = details.length > 88 ? `${details.slice(0, 85)}…` : details;
    return sanitizeTextForReactPdf(line);
  }
  const title = String(first.title || "").trim();
  return sanitizeTextForReactPdf(title || "—");
}

function pickHighlightScheduleIndex(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return -1;
  const byName = meals.findIndex((m) =>
    /lunch|protein|plate|main|midday/i.test(String(m?.name || "")),
  );
  if (byName >= 0) return byName;
  return Math.min(meals.length - 1, Math.max(0, Math.floor(meals.length / 2)));
}

function buildCuratorInsightLine(meals) {
  if (!Array.isArray(meals) || meals.length === 0) {
    return sanitizeTextForReactPdf(
      "Use the windows in this schedule as anchors—your coach can fine-tune portions and timing to match your day.",
    );
  }
  const anchor =
    meals.find((m) => /lunch|protein|plate|main/i.test(String(m?.name || ""))) ||
    meals.find((m) => String(m?.timeWindow || "").trim()) ||
    meals[0];
  const tw = String(anchor?.timeWindow || "").trim() || "your coach-set window";
  const label = String(anchor?.name || "this meal").trim();
  return sanitizeTextForReactPdf(
    `Prioritize the ${tw} slot around ${label} to align calorie density with your most active part of the day.`,
  );
}

/** Page 2 — client overview */
const overviewStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    backgroundColor: "#FFFFFF",
    color: "#1a1a1a",
    padding: 0,
    fontSize: 9,
  },
  headerSection: { position: "relative", width: "100%", height: 208 },
  headerBgImage: { position: "absolute", width: "100%", height: "100%", objectFit: "cover" },
  headerDim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  headerGrid: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 20,
    bottom: 20,
    justifyContent: "center",
  },
  profileRow: { flexDirection: "row", marginBottom: 10 },
  profileRowLast: { flexDirection: "row", marginBottom: 0 },
  profileCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 11,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "rgba(0,77,64,0.06)",
    borderRightColor: "rgba(0,77,64,0.06)",
    borderBottomColor: "rgba(0,77,64,0.06)",
  },
  profileCardLabel: {
    fontSize: 6.5,
    color: "#5C5C5C",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  profileCardValue: { fontSize: 11.5, fontWeight: "bold", color: "#0D0D0D", lineHeight: 1.2 },
  profileCardValueMuted: { fontSize: 10, fontWeight: "bold", color: OVERVIEW_GREEN, lineHeight: 1.2 },
  sectionBody: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 18 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: OVERVIEW_GREEN,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  orangeRule: {
    borderBottomWidth: 2,
    borderBottomColor: OVERVIEW_ORANGE,
    marginBottom: 8,
    width: "100%",
  },
  descBody: { fontSize: 8.5, color: "#555555", lineHeight: 1.5, marginBottom: 12 },
  guidelinesPanel: {
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    padding: 10,
    marginTop: 4,
  },
  guidelineBlock: { marginBottom: 8 },
  guidelineBlockLast: { marginBottom: 0 },
  guidelineTitle: { fontSize: 8.5, fontWeight: "bold", color: OVERVIEW_GREEN, marginBottom: 2 },
  guidelineItem: { fontSize: 7.5, color: "#666666", lineHeight: 1.4 },
  supplementsBody: { fontSize: 7.5, color: "#666666", lineHeight: 1.45 },
  footerRule: { borderBottomWidth: 2, borderBottomColor: OVERVIEW_ORANGE, marginTop: 10, marginBottom: 8 },
  footerPrepared: { fontSize: 9, color: OVERVIEW_GREEN, fontWeight: "bold", textAlign: "right" },
});

const DIGEST_GREEN = "#0A3D2E";
const DIGEST_ORANGE = "#A14F11";

/** Page 3 — macro summary + daily schedule (portrait). */
const digestStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    padding: 22,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    fontSize: 8,
    color: "#1a1a1a",
  },
  macroTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: DIGEST_GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  macroIntro: {
    fontSize: 8,
    color: "#6B7280",
    lineHeight: 1.45,
    marginBottom: 10,
  },
  macroRow: { flexDirection: "row", marginBottom: 4 },
  macroCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#F7F8F9",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
  },
  macroLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  macroValue: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  split: { flexDirection: "row", marginTop: 12, alignItems: "flex-start" },
  colLeft: { width: "34%", paddingRight: 8 },
  colRight: { width: "62%" },
  scheduleTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: DIGEST_GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  scheduleIntro: {
    fontSize: 7.5,
    color: "#6B7280",
    lineHeight: 1.45,
    marginBottom: 8,
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 9,
    marginTop: 4,
  },
  insightRule: { width: 36, height: 2, backgroundColor: DIGEST_GREEN, marginBottom: 6 },
  insightLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: DIGEST_GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  insightQuote: { fontSize: 7.5, fontWeight: "bold", color: "#374151", lineHeight: 1.4 },
  schedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 4,
    backgroundColor: "#F7F8F9",
  },
  schedRowHi: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 4,
    backgroundColor: DIGEST_ORANGE,
  },
  schedTime: { width: "22%", fontSize: 8, fontWeight: "bold", color: DIGEST_GREEN },
  schedTimeHi: { width: "22%", fontSize: 8, fontWeight: "bold", color: "#FFFFFF" },
  schedDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6, marginLeft: 2 },
  schedMain: { flex: 1, minWidth: 0 },
  schedTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: DIGEST_GREEN,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  schedTitleHi: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  schedSub: { fontSize: 6.5, color: "#6B7280" },
  schedSubHi: { fontSize: 6.5, color: "rgba(255,255,255,0.88)" },
  schedEmpty: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#F7F8F9",
    fontSize: 7.5,
    color: "#6B7280",
  },
  footerRule: { borderBottomWidth: 1.5, borderBottomColor: DIGEST_ORANGE, marginTop: 10, marginBottom: 6 },
  footerPrepared: { fontSize: 8.5, fontWeight: "bold", color: DIGEST_GREEN, textAlign: "right" },
});

/** Final page — optimisation tips + aggregated nutrition (uses export totals; no fabricated targets). */
const OPT_GREEN = "#0A3D2E";
const OPT_GREEN_SOFT = "#1B5E20";
const OPT_CARD_BG = "#F3F4F6";
const OPT_PILL_BG = "#C8E6C9";
const OPT_PILL_TEXT = "#0A3D2E";
const OPT_WARN_BG = "#FFEBEE";
const OPT_WARN_BORDER = "#FFCDD2";
const OPT_WARN_TEXT = "#C62828";
const OPT_TABLE_HEAD = "#E8EEF2";

const optimizationStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    padding: 22,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 8,
    color: "#1a1a1a",
  },
  pageTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: OPT_GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  leftCol: { width: "38%", paddingRight: 10 },
  rightCol: { width: "62%", paddingLeft: 4 },
  card: {
    backgroundColor: OPT_CARD_BG,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap" },
  pill: {
    backgroundColor: OPT_PILL_BG,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  pillText: { fontSize: 6.5, fontWeight: "bold", color: OPT_PILL_TEXT },
  energyBig: { fontSize: 22, fontWeight: "bold", color: "#111827", lineHeight: 1.1 },
  energyUnit: { fontSize: 7, color: "#6B7280", marginTop: 2 },
  energySide: { marginLeft: 10, flex: 1 },
  energySideLine: { fontSize: 7.5, color: "#374151", lineHeight: 1.35 },
  energySideGreen: { fontSize: 7, color: OPT_GREEN_SOFT, marginTop: 4, lineHeight: 1.35 },
  energyRow: { flexDirection: "row", alignItems: "flex-start" },
  tipRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start" },
  tipBadge: {
    width: 18,
    height: 16,
    backgroundColor: OPT_GREEN,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  tipBadgeText: { fontSize: 6.5, fontWeight: "bold", color: "#FFFFFF" },
  tipTitle: { fontSize: 7.5, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  tipBody: { fontSize: 7, color: "#4B5563", lineHeight: 1.45 },
  warnBox: {
    marginTop: 4,
    padding: 8,
    backgroundColor: OPT_WARN_BG,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: OPT_WARN_BORDER,
  },
  warnText: {
    fontSize: 7,
    fontWeight: "bold",
    color: OPT_WARN_TEXT,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    lineHeight: 1.4,
  },
  tableWrap: {
    marginTop: 6,
    backgroundColor: OPT_CARD_BG,
    borderRadius: 8,
    padding: 0,
    overflow: "hidden",
  },
  tableHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: OPT_TABLE_HEAD,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  tableHeadLeft: { fontSize: 7.5, fontWeight: "bold", color: OPT_GREEN, textTransform: "uppercase" },
  tableHeadRight: { fontSize: 6.5, fontWeight: "bold", color: "#546E7A", textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  colParam: { width: "36%", fontSize: 7.5, color: "#374151" },
  colParamSub: { width: "80%", fontSize: 7, color: "#6B7280", paddingLeft: 10 },
  colValue: { width: "44%", fontSize: 7.5, color: "#111827" },
  colValueBold: { width: "44%", fontSize: 7.5, fontWeight: "bold", color: "#111827" },
  colDot: { width: "20%", alignItems: "flex-end" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  footerRule: { borderBottomWidth: 2, borderBottomColor: OPT_GREEN, marginTop: 12, marginBottom: 6 },
  footerPrepared: { fontSize: 8.5, fontWeight: "bold", color: OPT_GREEN, textAlign: "right" },
});

const MEAL_PAGE_GREEN = "#0A3D2E";
const MEAL_PAGE_ORANGE = "#E5912E";

const mealDetailStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    padding: 18,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 7.5,
  },
  planContext: { fontSize: 6.5, color: "#6B7280", marginBottom: 5 },
  /** One meal-type block (banner + spaced dishes). Use wrap={false} only on inner pairs (banner + first dish), not here. */
  sectionGroupOuter: { width: "100%", marginBottom: 14 },
  cardOuter: { marginBottom: 10 },
  /** Weekly / monthly: one heading per calendar day, then section groups below. */
  dayGroupOuter: { width: "100%", marginBottom: 12 },
  dayGroupHeading: {
    fontSize: 9,
    fontWeight: "bold",
    color: MEAL_PAGE_GREEN,
    backgroundColor: "#E8F5F3",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: MEAL_PAGE_GREEN,
  },
  sectionBanner: {
    backgroundColor: MEAL_PAGE_GREEN,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 6,
    overflow: "hidden",
    width: "100%",
  },
  /** Normal weight avoids faux-bold “double” glyph draw in some PDF engines. */
  sectionBannerText: {
    fontFamily: PDF_FONT,
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "normal",
    lineHeight: 1.25,
    letterSpacing: 0.2,
  },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 },
  dishTitle: {
    fontFamily: PDF_FONT,
    fontSize: 11,
    fontWeight: "bold",
    color: MEAL_PAGE_GREEN,
    flex: 1,
    paddingRight: 6,
  },
  timeRange: { fontFamily: PDF_FONT, fontSize: 8, fontWeight: "bold", color: "#111827", maxWidth: "40%" },
  descLine: { fontFamily: PDF_FONT, fontSize: 7, color: "#6B7280", lineHeight: 1.35, marginBottom: 5 },
  mainSplit: { flexDirection: "row", alignItems: "stretch", width: "100%" },
  grayPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  macroRow: { flexDirection: "row", marginBottom: 6 },
  miniCard: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#E5E7EB",
    borderRightColor: "#E5E7EB",
    borderBottomColor: "#E5E7EB",
  },
  miniLabel: {
    fontFamily: PDF_FONT,
    fontSize: 5,
    fontWeight: "bold",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  miniValue: { fontFamily: PDF_FONT, fontSize: 11, fontWeight: "bold", color: "#111827", lineHeight: 1.2 },
  lowerSplit: { flexDirection: "row", alignItems: "flex-start", marginTop: 4, width: "100%" },
  lowerLeft: { flex: 1, minWidth: 0, paddingRight: 6 },
  lowerRight: { flex: 1, minWidth: 0, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" },
  dividerThin: { borderBottomWidth: 1, borderBottomColor: "#D1D5DB", marginVertical: 5 },
  blockTitle: {
    fontFamily: PDF_FONT,
    fontSize: 7,
    fontWeight: "bold",
    color: MEAL_PAGE_GREEN,
    marginBottom: 3,
    marginTop: 4,
  },
  blockTitleFirst: {
    fontFamily: PDF_FONT,
    fontSize: 7,
    fontWeight: "bold",
    color: MEAL_PAGE_GREEN,
    marginBottom: 3,
    marginTop: 0,
  },
  blockBody: {
    fontFamily: PDF_FONT,
    fontSize: 7,
    color: "#4B5563",
    lineHeight: 1.5,
    marginBottom: 3,
  },
  ingredientLine: { fontFamily: PDF_FONT, fontSize: 7, color: "#4B5563", lineHeight: 1.5, marginBottom: 2 },
  prepRow: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start", width: "100%" },
  prepCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: MEAL_PAGE_GREEN,
    marginRight: 6,
    marginTop: 1,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  prepCircleText: { fontFamily: PDF_FONT, fontSize: 5.5, color: "#FFFFFF", fontWeight: "bold" },
  prepStepTextWrap: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "100%",
    paddingLeft: 4,
  },
  prepStepText: { fontFamily: PDF_FONT, fontSize: 6.5, color: "#374151", lineHeight: 1.5 },
  /** Visual separation between multiple dishes under the same section banner. */
  mealSubCardShell: { width: "100%", marginBottom: 2 },
  mealSubCardShellFollows: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
  },
  servingLabel: { fontSize: 7, fontWeight: "bold", color: MEAL_PAGE_GREEN, marginTop: 4, marginBottom: 2 },
  servingValue: { fontFamily: PDF_FONT, fontSize: 7, color: "#374151", lineHeight: 1.35 },
  rightVisual: { width: "32%", minWidth: 0, flexShrink: 0 },
  imageShell: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ECEFF1",
  },
  imageFull: { position: "absolute", width: "100%", height: "100%", objectFit: "cover" },
  imagePlaceholder: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  imagePlaceholderText: { fontSize: 6, color: "#78909C", textAlign: "center" },
  footerLines: { flexDirection: "row", height: 2, marginTop: 8, marginBottom: 5 },
  footerLineOrange: { flex: 1, backgroundColor: MEAL_PAGE_ORANGE, height: 2 },
  footerLineGreen: { flex: 1, backgroundColor: MEAL_PAGE_GREEN, height: 2 },
  footerPrepared: { fontSize: 8, fontWeight: "bold", color: MEAL_PAGE_GREEN, textAlign: "right" },
});

function resolveRemoteImageUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  let t = raw.trim();
  if (!t) return null;
  if (t.startsWith("//")) t = `https:${t}`;
  if (/^www\./i.test(t)) t = `https://${t}`;
  if (t.startsWith("data:") || t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}${t}`;
    }
    return t;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/${t.replace(/^\/+/, "")}`;
  }
  return t;
}

/** Prefer server-fetched `data:` URLs from `PDFRenderer`; else resolve remote/relative. */
function dishImageSrcForPdf(dish, imageUrlMap = {}) {
  const candidates = [dish?.image, dish?.thumbnail, dish?.photo].filter((x) => x && typeof x === "string");
  for (const raw of candidates) {
    const key = raw.trim();
    if (!key) continue;
    if (key.startsWith("data:")) return key;
    const resolved = resolveRemoteImageUrl(key);
    const embedded = imageUrlMap[key] || (resolved ? imageUrlMap[resolved] : null);
    if (embedded) return embedded;
    if (resolved) return resolved;
  }
  return null;
}

/** Returns display string or `null` if macro should be hidden. */
function isZeroishNumber(n) {
  return typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 0.0001;
}

function dishCaloriesMacroValue(dish) {
  const v = dish?.calories;
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const r = Math.round(v);
    if (r === 0) return null;
    return String(r);
  }
  if (typeof v === "string") {
    const s = v.replace(/\s*kcal/gi, "").trim();
    if (!s) return null;
    const n = parseFloat(s.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n) && n === 0) return null;
    return s;
  }
  if (v && typeof v === "object") {
    const t = v.total ?? v.calories;
    if (typeof t === "number" && Number.isFinite(t)) {
      const r = Math.round(t);
      if (r === 0) return null;
      return String(r);
    }
    if (typeof t === "string" && t.trim()) {
      const s = t.replace(/\s*kcal/gi, "").trim();
      const n = parseFloat(String(s).replace(/[^\d.-]/g, ""));
      if (Number.isFinite(n) && n === 0) return null;
      return s;
    }
  }
  return null;
}

function dishGramMacroValue(dish, key) {
  const v = dish?.[key];
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    if (isZeroishNumber(v)) return null;
    const r = Math.round(v * 10) / 10;
    const s = Math.abs(r - Math.round(r)) < 0.05 ? String(Math.round(r)) : String(r);
    return `${s}g`;
  }
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    const n = parseFloat(t.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n) && n === 0) return null;
    if (/g$/i.test(t)) return t;
    return `${t}g`;
  }
  return null;
}

function buildMacroMiniCards(dish) {
  const accents = ["#00897B", "#E65100"];
  const out = [];
  let i = 0;
  const push = (label, value) => {
    if (value == null) return;
    out.push({ label, value, border: accents[i % accents.length] });
    i += 1;
  };
  push("CALORIES", dishCaloriesMacroValue(dish));
  push("PROTEIN", dishGramMacroValue(dish, "protein"));
  push("CARBS", dishGramMacroValue(dish, "carbohydrates"));
  push("FATS", dishGramMacroValue(dish, "fats"));
  return out;
}

function servingSizeLine(dish) {
  const ss = dish?.serving_size ?? dish?.servingSize;
  if (ss != null && String(ss).trim() !== "" && String(ss) !== "0") return sanitizeTextForReactPdf(String(ss).trim());
  const parts = [dish?.measure, dish?.quantity].filter(Boolean);
  return parts.length ? sanitizeTextForReactPdf(parts.join(" ")) : "";
}

/** Map fullwidth digits (common in pasted recipes) to ASCII. */
function normalizeAsciiDigitsInString(s) {
  return String(s || "").replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
}

/** Strip duplicated list indices (e.g. "1 Take…" next to PDF circle "01") including NBSP after digits. */
function stripLeadingStepNumbersFromLine(line) {
  let s = normalizeAsciiDigitsInString(String(line || "").replace(/^\uFEFF/, "")).trim();
  let prev;
  do {
    prev = s;
    s = s
      .replace(/^[\s•\u2022·\-–\u00A0]+/u, "")
      .replace(/^[\*＊]+\s*/u, "")
      .replace(/^(?:step\s*)?\d{1,3}[\.\)\:\-–][\s\u00A0]*/i, "")
      .replace(/^\(\s*\d{1,3}\s*\)\s*/, "")
      .replace(/^\d{1,3}[\s\u00A0]+(?=[A-Za-z])/i, "")
      .replace(/^\d{1,3}(?=[A-Za-z])/i, "")
      .replace(/^\.+\s*/, "")
      .trim();
  } while (s !== prev && s.length);
  return s;
}

function splitMethodSteps(method) {
  if (!method || typeof method !== "string") return [];
  let blob = sanitizeTextForReactPdf(normalizeAsciiDigitsInString(method.replace(/\r\n/g, "\n").trim()));
  let lines = blob.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  while (lines.length && /^(method|preparation\s*method|instructions)\s*:?$/i.test(lines[0])) {
    lines = lines.slice(1);
  }
  if (lines.length === 1) {
    const one = lines[0];
    const hasNumberedSteps = /\d[\.\)]\s*\S/.test(one) || /\s\d[\.\)]\s+/.test(one);
    if (hasNumberedSteps) {
      lines = one
        .split(/(?=\s+\d+[\.\)]\s+)/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  const out = [];
  for (const line of lines) {
    let cleaned = stripLeadingStepNumbersFromLine(line);
    cleaned = stripLeadingStepNumbersFromLine(cleaned);
    if (/^(method|ingredients|preparation)$/i.test(cleaned)) continue;
    if (/^\*?\s*method\s*$/i.test(cleaned)) continue;
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/** Drop a leading "Ingredients" line that duplicates the PDF section title. */
function stripRedundantIngredientHeading(text) {
  let t = String(text || "").trim();
  if (!t) return "";
  t = t.replace(/^\s*[\*•]+\s*ingredients\s*:?\s*/i, "");
  t = t.replace(/^ingredients\s*:?\s*/i, "");
  t = t.replace(/^ingredients\s*\n+/i, "");
  t = t.replace(/\n\s*ingredients\s*:?\s*\n/gi, "\n");
  return t.trim();
}

/** One `<Text>` per line avoids @react-pdf collapsing wrapped paragraphs in narrow columns. */
function splitPdfBodyLines(text) {
  const raw = sanitizeTextForReactPdf(String(text || "").trim());
  if (!raw) return [];
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeDishWithSlotImages(dish, slot) {
  const img = pickDishPrimaryImageUrl(dish, slot);
  return { ...dish, image: img || undefined };
}

function virtualDishFromSlot(slot) {
  const items = Array.isArray(slot?.items) ? slot.items : [];
  if (!items.length) return null;
  let ingredients = "";
  let method = "";
  const titles = [];
  for (const it of items) {
    if (typeof it === "string") {
      titles.push(it);
      continue;
    }
    if (it?.title) titles.push(it.title);
    if (it?.details) ingredients += (ingredients ? "\n" : "") + String(it.details);
    if (it?.recipeDetails?.ingredients) {
      ingredients += (ingredients ? "\n\n" : "") + String(it.recipeDetails.ingredients);
    }
    if (it?.recipeDetails?.method && !method) method = String(it.recipeDetails.method);
  }
  return {
    dish_name: sanitizeTextForReactPdf(titles[0] || slot.mealType || "Meal"),
    description: sanitizeTextForReactPdf(ingredients.trim()),
    ingredients: sanitizeTextForReactPdf(ingredients.trim()),
    method: sanitizeTextForReactPdf(method),
    serving_size: "",
    measure: "",
    quantity: "",
  };
}

/** One row per dish for the active plan; dishes inherit line-item images when needed. */
function expandMealDetailRows(activePlan) {
  const meals = Array.isArray(activePlan?.meals) ? activePlan.meals : [];
  const rows = [];
  for (const slot of meals) {
    const category = slot.mealType || "Meal";
    const timeWindow = String(slot.timeWindow || "").trim();
    const list = signatureSlotToDishesList(slot);
    if (list.length) {
      for (const dish of list) {
        rows.push({ category, timeWindow, dish: mergeDishWithSlotImages(dish, slot) });
      }
    } else {
      const v = virtualDishFromSlot(slot);
      if (v) rows.push({ category, timeWindow, dish: mergeDishWithSlotImages(v, slot) });
    }
  }
  return rows;
}

function isMultiDaySignatureMode(mode) {
  return mode === "weekly" || mode === "monthly";
}

const WEEKDAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_LONG = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
};

function sortPlansForSignaturePdf(plansArr, mode) {
  if (!Array.isArray(plansArr) || plansArr.length < 2) return [...plansArr];
  const copy = [...plansArr];
  if (mode === "weekly") {
    copy.sort((a, b) => {
      const ka = String(a?.key ?? a?.label ?? "").toLowerCase();
      const kb = String(b?.key ?? b?.label ?? "").toLowerCase();
      const sa = WEEKDAY_LONG[ka] ?? ka;
      const sb = WEEKDAY_LONG[kb] ?? kb;
      const ia = WEEKDAY_ORDER.indexOf(sa);
      const ib = WEEKDAY_ORDER.indexOf(sb);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return ka.localeCompare(kb);
    });
    return copy;
  }
  if (mode === "monthly") {
    copy.sort((a, b) => {
      const ka = String(a?.key ?? a?.label ?? "");
      const kb = String(b?.key ?? b?.label ?? "");
      const pa = ka.split("-").map(Number);
      const pb = kb.split("-").map(Number);
      if (pa.length === 3 && pb.length === 3 && pa.every((n) => Number.isFinite(n)) && pb.every((n) => Number.isFinite(n))) {
        const ta = new Date(pa[2], pa[1] - 1, pa[0]).getTime();
        const tb = new Date(pb[2], pb[1] - 1, pb[0]).getTime();
        if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
      }
      return ka.localeCompare(kb);
    });
    return copy;
  }
  return copy;
}

/** Plans to render in the signature PDF: all days for weekly/monthly, otherwise the selected day only. */
function plansForSignatureMealCards(data) {
  const plansArr = Array.isArray(data?.plans) ? data.plans : [];
  if (!plansArr.length) return [];
  if (isMultiDaySignatureMode(data?.mode)) return sortPlansForSignaturePdf(plansArr, data.mode);
  const active = plansArr.find((p) => p.key === data?.selectedPlanKey) || plansArr[0];
  return active ? [active] : [];
}

/**
 * Flattened meal rows for the signature PDF (optional `dayLabel` for weekly/monthly).
 */
function expandMealDetailRowsForSignatureData(data) {
  const rows = [];
  for (const plan of plansForSignatureMealCards(data)) {
    const dayLabel = String(plan?.label || plan?.key || "").trim();
    const showDay = isMultiDaySignatureMode(data?.mode) && Boolean(dayLabel);
    for (const row of expandMealDetailRows(plan)) {
      rows.push({ ...row, dayLabel: showDay ? dayLabel : "" });
    }
  }
  return rows;
}

/**
 * Unique non–data-URL image strings on dishes for prefetching in `PDFRenderer`.
 */
export function collectDishImageSourceUrlsForSignaturePdf(pdfData) {
  const urls = new Set();
  for (const { dish } of expandMealDetailRowsForSignatureData(pdfData || {})) {
    for (const u of [dish?.image, dish?.thumbnail, dish?.photo]) {
      if (typeof u !== "string") continue;
      const t = u.trim();
      if (t && !t.startsWith("data:")) urls.add(t);
    }
  }
  return Array.from(urls);
}

/** Consecutive rows with the same day + meal section share one green banner. */
function groupMealDetailRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];
  const groups = [];
  for (const row of rows) {
    const dayLabel = String(row.dayLabel || "");
    const category = String(row.category || "Meal");
    const prev = groups[groups.length - 1];
    if (prev && prev.dayLabel === dayLabel && prev.category === category) {
      prev.meals.push({ timeWindow: row.timeWindow, dish: row.dish });
    } else {
      groups.push({
        dayLabel,
        category,
        meals: [{ timeWindow: row.timeWindow, dish: row.dish }],
      });
    }
  }
  return groups;
}

/**
 * Weekly / monthly: group all rows for one calendar day (or date label), then section-merge inside each day.
 * Daily: a single block with no day heading.
 */
function buildMealDayBlocks(mealDetailRows, mode) {
  if (!Array.isArray(mealDetailRows) || !mealDetailRows.length) return [];
  if (!isMultiDaySignatureMode(mode)) {
    return [{ dayHeading: "", sectionGroups: groupMealDetailRows(mealDetailRows) }];
  }
  const chunks = [];
  for (const row of mealDetailRows) {
    const h = String(row.dayLabel || "").trim();
    const last = chunks[chunks.length - 1];
    if (!last || String(last.dayHeading || "").trim() !== h) {
      chunks.push({ dayHeading: h, rows: [row] });
    } else {
      last.rows.push(row);
    }
  }
  return chunks.map((c) => ({
    dayHeading: c.dayHeading,
    sectionGroups: groupMealDetailRows(c.rows),
  }));
}

/** One dish block (title, macros, ingredients, image) — no section banner. */
function MealSubCard({ timeWindow, dish, imageUrlMap, showSubDivider }) {
  const name = sanitizeTextForReactPdf(String(dish?.dish_name || dish?.title || dish?.name || "Meal"));
  const ing = stripRedundantIngredientHeading(String(dish?.ingredients || "").trim());
  const desc = sanitizeTextForReactPdf(String(dish?.description || "").trim());
  const hasIngredients = Boolean(ing);
  const hasDescriptionOnly = !ing && Boolean(desc);
  const showIngredientsBlock = hasIngredients || hasDescriptionOnly;
  const ingredientsBody = hasIngredients ? ing : hasDescriptionOnly ? stripRedundantIngredientHeading(desc) : "";
  const ingredientLines = splitPdfBodyLines(ingredientsBody);
  const steps = splitMethodSteps(dish?.method || "");
  const hasMethod = steps.length > 0;
  const serving = servingSizeLine(dish);
  const hasServing = Boolean(serving);
  const imgSrc = dishImageSrcForPdf(dish, imageUrlMap);
  const macros = buildMacroMiniCards(dish);
  const timeDisplay = sanitizeTextForReactPdf(timeWindow || "—");
  const showDescUnderTitle = Boolean(desc) && desc !== ing;
  const showLeftCol = showIngredientsBlock || hasServing;
  const showRightCol = hasMethod;
  const twoColLower = showLeftCol && showRightCol;

  const shellStyle = showSubDivider
    ? [mealDetailStyles.mealSubCardShell, mealDetailStyles.mealSubCardShellFollows]
    : mealDetailStyles.mealSubCardShell;

  return (
    <View style={shellStyle}>
      <View style={mealDetailStyles.titleRow} wrap={false}>
        <Text style={[mealDetailStyles.dishTitle, pdfScriptFontStyleForText(name)]} {...PDF_TEXT_NO_HYPHEN}>
          {name}
        </Text>
        <Text style={[mealDetailStyles.timeRange, pdfScriptFontStyleForText(timeDisplay)]} {...PDF_TEXT_NO_HYPHEN}>
          {timeDisplay}
        </Text>
      </View>
      {showDescUnderTitle ? (
        <Text style={[mealDetailStyles.descLine, pdfScriptFontStyleForText(desc)]} wrap {...PDF_TEXT_NO_HYPHEN}>
          {desc}
        </Text>
      ) : null}
      <View style={mealDetailStyles.mainSplit} wrap={false}>
        <View style={mealDetailStyles.grayPanel}>
          {macros.length > 0 ? (
            <View wrap={false}>
              <View style={mealDetailStyles.macroRow} wrap={false}>
                {macros.map((m, i) => (
                  <View key={i} style={[mealDetailStyles.miniCard, { borderLeftColor: m.border }]} wrap={false}>
                    <Text style={mealDetailStyles.miniLabel} {...PDF_TEXT_NO_HYPHEN}>
                      {m.label}
                    </Text>
                    <Text
                      style={[mealDetailStyles.miniValue, pdfScriptFontStyleForText(m.value)]}
                      {...PDF_TEXT_NO_HYPHEN}
                    >
                      {m.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {twoColLower ? (
            <View style={mealDetailStyles.lowerSplit}>
              <View style={mealDetailStyles.lowerLeft}>
                {showIngredientsBlock ? (
                  <>
                    <Text style={mealDetailStyles.blockTitleFirst} {...PDF_TEXT_NO_HYPHEN}>
                      Precision Ingredients
                    </Text>
                    <View>
                      {ingredientLines.map((line, li) => (
                        <Text
                          key={li}
                          style={[mealDetailStyles.ingredientLine, pdfScriptFontStyleForText(line)]}
                          {...PDF_TEXT_NO_HYPHEN}
                        >
                          {line}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : null}
                {showIngredientsBlock && hasServing ? <View style={mealDetailStyles.dividerThin} /> : null}
                {hasServing ? (
                  <>
                    <Text
                      style={showIngredientsBlock ? mealDetailStyles.blockTitle : mealDetailStyles.blockTitleFirst}
                      {...PDF_TEXT_NO_HYPHEN}
                    >
                      Serving Size
                    </Text>
                    <Text
                      style={[mealDetailStyles.servingValue, pdfScriptFontStyleForText(serving)]}
                      wrap
                      {...PDF_TEXT_NO_HYPHEN}
                    >
                      {serving}
                    </Text>
                  </>
                ) : null}
              </View>
              <View style={mealDetailStyles.lowerRight}>
                <Text style={mealDetailStyles.blockTitleFirst} {...PDF_TEXT_NO_HYPHEN}>
                  Preparation Method
                </Text>
                {steps.map((step, i) => (
                  <View key={i} style={mealDetailStyles.prepRow} wrap={false}>
                    <View style={mealDetailStyles.prepCircle}>
                      <Text style={mealDetailStyles.prepCircleText} {...PDF_TEXT_NO_HYPHEN}>
                        {String(i + 1).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={mealDetailStyles.prepStepTextWrap}>
                      <Text
                        style={[mealDetailStyles.prepStepText, pdfScriptFontStyleForText(step)]}
                        wrap
                        {...PDF_TEXT_NO_HYPHEN}
                      >
                        {step}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View>
              {showLeftCol ? (
                <View>
                  {showIngredientsBlock ? (
                    <>
                      <Text style={mealDetailStyles.blockTitleFirst} {...PDF_TEXT_NO_HYPHEN}>
                        Precision Ingredients
                      </Text>
                      <View>
                        {ingredientLines.map((line, li) => (
                          <Text
                            key={li}
                            style={[mealDetailStyles.ingredientLine, pdfScriptFontStyleForText(line)]}
                            {...PDF_TEXT_NO_HYPHEN}
                          >
                            {line}
                          </Text>
                        ))}
                      </View>
                    </>
                  ) : null}
                  {showIngredientsBlock && hasServing ? <View style={mealDetailStyles.dividerThin} /> : null}
                  {hasServing ? (
                    <>
                      <Text
                        style={showIngredientsBlock ? mealDetailStyles.blockTitle : mealDetailStyles.blockTitleFirst}
                        {...PDF_TEXT_NO_HYPHEN}
                      >
                        Serving Size
                      </Text>
                      <Text
                        style={[mealDetailStyles.servingValue, pdfScriptFontStyleForText(serving)]}
                        wrap
                        {...PDF_TEXT_NO_HYPHEN}
                      >
                        {serving}
                      </Text>
                    </>
                  ) : null}
                </View>
              ) : null}
              {showRightCol ? (
                <View style={{ marginTop: showLeftCol ? 6 : 0 }}>
                  <Text style={mealDetailStyles.blockTitleFirst} {...PDF_TEXT_NO_HYPHEN}>
                    Preparation Method
                  </Text>
                  {steps.map((step, i) => (
                    <View key={i} style={mealDetailStyles.prepRow} wrap={false}>
                      <View style={mealDetailStyles.prepCircle}>
                        <Text style={mealDetailStyles.prepCircleText} {...PDF_TEXT_NO_HYPHEN}>
                          {String(i + 1).padStart(2, "0")}
                        </Text>
                      </View>
                      <View style={mealDetailStyles.prepStepTextWrap}>
                        <Text
                          style={[mealDetailStyles.prepStepText, pdfScriptFontStyleForText(step)]}
                          wrap
                          {...PDF_TEXT_NO_HYPHEN}
                        >
                          {step}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
        <View style={mealDetailStyles.rightVisual}>
          <View style={mealDetailStyles.imageShell}>
            {imgSrc ? (
              <Image src={imgSrc} style={mealDetailStyles.imageFull} />
            ) : (
              <View style={mealDetailStyles.imagePlaceholder}>
                <Text style={mealDetailStyles.imagePlaceholderText}>No image</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

/** One section (e.g. BREAKFAST) with one or more dishes stacked together. */
function MealSectionGroupCard({ category, meals, imageUrlMap, groupKey }) {
  const bannerLabel = sanitizeTextForReactPdf(String(category || "Meal").toUpperCase());
  const list = Array.isArray(meals) ? meals : [];
  const first = list[0];
  const rest = list.slice(1);
  return (
    <View style={mealDetailStyles.sectionGroupOuter}>
      <View wrap={false}>
        <View style={mealDetailStyles.sectionBanner}>
          <Text
            style={[mealDetailStyles.sectionBannerText, pdfScriptFontStyleForText(bannerLabel)]}
            {...PDF_TEXT_NO_HYPHEN}
          >
            {bannerLabel}
          </Text>
        </View>
        {first ? (
          <MealSubCard
            key={`${groupKey}-sub-0-${first.dish?.dish_name || 0}`}
            timeWindow={first.timeWindow}
            dish={first.dish}
            imageUrlMap={imageUrlMap}
            showSubDivider={false}
          />
        ) : null}
      </View>
      {rest.map((m, mi) => (
        <MealSubCard
          key={`${groupKey}-sub-${mi + 1}-${m.dish?.dish_name || mi}`}
          timeWindow={m.timeWindow}
          dish={m.dish}
          imageUrlMap={imageUrlMap}
          showSubDivider
        />
      ))}
    </View>
  );
}

const HYDRATION_TIPS = [
  {
    title: "Immediately after waking",
    body: "Start with water when you wake; your coach can suggest how much fits your routine and medications.",
  },
  {
    title: "Before meals",
    body: "A glass of water before eating can support digestion and fullness—adjust if your coach advises otherwise.",
  },
  {
    title: "During an afternoon slump",
    body: "Pair fluids with a planned snack from this plan rather than skipping fuel when energy dips.",
  },
  {
    title: "After physical activity",
    body: "Replace fluids lost in sweat; add electrolytes only if your coach or clinician recommends them.",
  },
];

function formatProfileTagUpper(tag) {
  return sanitizeTextForReactPdf(String(tag || "").replace(/-/g, " ").trim().toUpperCase());
}

function defaultProfileTags() {
  return ["EXPORT TOTALS", "COACH-ALIGNED", "PORTION GUIDE"].map((t) => sanitizeTextForReactPdf(t));
}

/** Simple row model for the closing “clinical breakdown” table (all strings already display-safe). */
function buildOptimizationClinicalRows(ni) {
  const n = ni && typeof ni === "object" ? ni : {};
  const dot = { neutral: "#B0BEC5", ok: "#2E7D32", warn: "#E65100" };
  const rows = [];
  rows.push({ key: "srv", label: "Serving size", value: sanitizeTextForReactPdf(n.serving_size || "—"), bold: false, dot: dot.neutral, sub: null });
  rows.push({ key: "cal", label: "Calories", value: sanitizeTextForReactPdf(n.calories || "—"), bold: true, dot: dot.ok, sub: null });
  rows.push({ key: "fat", label: "Total fat", value: sanitizeTextForReactPdf(n.fats || "—"), bold: false, dot: dot.warn, sub: `Saturated fat: ${sanitizeTextForReactPdf(n.saturated_fat || "—")}` });
  rows.push({ key: "chol", label: "Cholesterol", value: sanitizeTextForReactPdf(n.cholestrol || "—"), bold: false, dot: dot.warn, sub: null });
  rows.push({ key: "na", label: "Sodium", value: sanitizeTextForReactPdf(n.sodium || "—"), bold: false, dot: dot.ok, sub: null });
  rows.push({
    key: "carb",
    label: "Total carbohydrates",
    value: sanitizeTextForReactPdf(n.carbohydrates || "—"),
    bold: false,
    dot: dot.ok,
    sub: `Sugars (natural / added): ${sanitizeTextForReactPdf(n.natural_sugars || "—")} / ${sanitizeTextForReactPdf(n.added_sugars || "—")}`,
  });
  rows.push({ key: "pro", label: "Protein", value: sanitizeTextForReactPdf(n.protein || "—"), bold: false, dot: dot.ok, sub: null });
  return rows;
}

/** Last page: optimisation framing + totals from this export (no invented targets). */
function SignatureOptimizationClosingPage({ nutritionalInformation, macrosBreakDown, foodTags, coachDisplay }) {
  const ni = nutritionalInformation && typeof nutritionalInformation === "object" ? nutritionalInformation : {};
  const md = macrosBreakDown && typeof macrosBreakDown === "object" ? macrosBreakDown : {};
  const kcalNum = Math.max(0, Math.round(parseFloat(String(md?.calories ?? "0")) || 0));
  const tagSource = Array.isArray(foodTags) && foodTags.length ? foodTags.map((t) => formatProfileTagUpper(t)).filter(Boolean) : defaultProfileTags();
  const tags = tagSource.slice(0, 8);
  const clinicalRows = buildOptimizationClinicalRows(ni);

  return (
    <Page size="A4" style={optimizationStyles.page} wrap>
      <Text style={optimizationStyles.pageTitle} {...PDF_TEXT_NO_HYPHEN}>
        Optimization tips & macro intake
      </Text>

      <View style={optimizationStyles.topRow}>
        <View style={optimizationStyles.leftCol}>
          <View style={optimizationStyles.card}>
            <Text style={optimizationStyles.cardLabel}>Profile attributes</Text>
            <View style={optimizationStyles.pillRow}>
              {tags.map((t, i) => (
                <View key={`tag-${i}`} style={optimizationStyles.pill} wrap={false}>
                  <Text style={[optimizationStyles.pillText, pdfScriptFontStyleForText(t)]} {...PDF_TEXT_NO_HYPHEN}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={optimizationStyles.card}>
            <Text style={optimizationStyles.cardLabel}>Total energy intake</Text>
            <View style={optimizationStyles.energyRow}>
              <View>
                <Text style={optimizationStyles.energyBig} {...PDF_TEXT_NO_HYPHEN}>
                  {kcalNum || "—"}
                </Text>
                <Text style={optimizationStyles.energyUnit}>KCAL</Text>
              </View>
              <View style={optimizationStyles.energySide}>
                <Text style={optimizationStyles.energySideLine} {...PDF_TEXT_NO_HYPHEN}>
                  Plan total from dishes in this export (not a prescription).
                </Text>
                <Text style={optimizationStyles.energySideGreen} {...PDF_TEXT_NO_HYPHEN}>
                  Personal calorie target: confirm with your coach.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={optimizationStyles.rightCol}>
          {HYDRATION_TIPS.map((tip, i) => (
            <View key={`tip-${i}`} style={optimizationStyles.tipRow} wrap={false}>
              <View style={optimizationStyles.tipBadge}>
                <Text style={optimizationStyles.tipBadgeText} {...PDF_TEXT_NO_HYPHEN}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={optimizationStyles.tipTitle} {...PDF_TEXT_NO_HYPHEN}>
                  {sanitizeTextForReactPdf(tip.title)}
                </Text>
                <Text style={optimizationStyles.tipBody} wrap {...PDF_TEXT_NO_HYPHEN}>
                  {sanitizeTextForReactPdf(tip.body)}
                </Text>
              </View>
            </View>
          ))}
          <View style={optimizationStyles.warnBox}>
            <Text style={optimizationStyles.warnText} {...PDF_TEXT_NO_HYPHEN}>
              Avoid large fluid volumes immediately after a very heavy meal if your coach or clinician has raised
              reflux or comfort concerns.
            </Text>
          </View>
        </View>
      </View>

      <View style={optimizationStyles.tableWrap}>
        <View style={optimizationStyles.tableHeadRow} wrap={false}>
          <Text style={optimizationStyles.tableHeadLeft} {...PDF_TEXT_NO_HYPHEN}>
            Clinical breakdown
          </Text>
          <Text style={optimizationStyles.tableHeadRight} {...PDF_TEXT_NO_HYPHEN}>
            Units: metric (mg / g)
          </Text>
        </View>
        {clinicalRows.map((row, ri) => (
          <View key={row.key} wrap={false}>
            <View style={optimizationStyles.tableRow} wrap={false}>
              <Text style={optimizationStyles.colParam} {...PDF_TEXT_NO_HYPHEN}>
                {row.label}
              </Text>
              <Text
                style={[
                  row.bold ? optimizationStyles.colValueBold : optimizationStyles.colValue,
                  pdfScriptFontStyleForText(row.value),
                ]}
                {...PDF_TEXT_NO_HYPHEN}
              >
                {row.value}
              </Text>
              <View style={optimizationStyles.colDot}>
                <View style={[optimizationStyles.dot, { backgroundColor: row.dot }]} />
              </View>
            </View>
            {row.sub ? (
              <View style={[optimizationStyles.tableRow, { paddingTop: 0 }]} wrap={false}>
                <Text
                  style={[optimizationStyles.colParamSub, pdfScriptFontStyleForText(row.sub)]}
                  {...PDF_TEXT_NO_HYPHEN}
                >
                  {row.sub}
                </Text>
                <View style={{ width: "20%" }} />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={optimizationStyles.footerRule} />
      <Text style={[optimizationStyles.footerPrepared, pdfScriptFontStyleForText(coachDisplay)]}>
        Prepared by {coachDisplay}
      </Text>
    </Page>
  );
}

/**
 * Signature Landscape meal plan PDF:
 * cover → overview → digest → meal cards (wrapping) → optimisation closing page.
 */
export default function PDFSignatureLandscapeRemap({ data = {}, ...props }) {
  const brand = props?.brand
  const dishImageDataUrlMap = data._dishImageDataUrlMap && typeof data._dishImageDataUrlMap === "object" ? data._dishImageDataUrlMap : {};
  const coachName = data.coachName || "";
  const coachDisplay = sanitizeTextForReactPdf(coachName || "Coach");
  const clientDisplay = sanitizeTextForReactPdf(data.clientName || "Client");
  const clientIdLine = formatClientIdForPdf(data.clientId);
  const plansArr = Array.isArray(data.plans) ? data.plans : [];
  const plansRemap = wellnessPdfPlansToRemapObject(data);
  const stats = getMealPDFData(plansRemap);
  const coverS = createCoverStyles();

  const ni = stats.nutritionalInformation || {};
  const md = stats.macrosBreakDown || {};
  const digestMacrosRaw = [
    { label: "CALORIES", value: String(md?.calories ?? "0"), border: "#0A3D2E" },
    { label: "PROTEIN", value: formatGramTokenFromNutritionField(ni.protein), border: "#A14F11" },
    { label: "CARBS", value: formatGramTokenFromNutritionField(ni.carbohydrates), border: "#00897B" },
    { label: "FATS", value: formatGramTokenFromNutritionField(ni.fats), border: "#5C85C6" },
  ];
  const digestMacros = digestMacrosRaw.filter((row) => {
    const t = String(row?.value ?? "").trim();
    if (t === "" || t === "—") return true;
    const n = parseFloat(t.replace(/g/gi, "").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(n)) return true;
    return Math.abs(n) > 0.0001;
  });

  const scheduleMeals = Array.isArray(data.meals) ? data.meals : [];
  const highlightIdx = pickHighlightScheduleIndex(scheduleMeals);
  const curatorLine = buildCuratorInsightLine(scheduleMeals);

  const mealDetailRows = expandMealDetailRowsForSignatureData(data);
  const mealDayBlocks = buildMealDayBlocks(mealDetailRows, data.mode);
  const mealPlanContextLabel = isMultiDaySignatureMode(data.mode)
    ? sanitizeTextForReactPdf(data.durationLabel || data.dateLabel || "All days in this plan")
    : null;
  const showMonthlyPlanDates =
    data.mode === "monthly" &&
    data.monthlyPlanPeriod?.planStartLabel &&
    data.monthlyPlanPeriod?.planEndLabel;

  if (!plansArr.length) {
    return (
      <NamedPdfViewer className="w-full h-full" fileNameBase={data?.title} title={data?.title || "Meal plan"}>
        <Document>
          <Page size="A4" style={portraitStyles.page}>
            <Text>No meal data available</Text>
          </Page>
        </Document>
      </NamedPdfViewer>
    );
  }

  return (
    <NamedPdfViewer className="w-full h-full" fileNameBase={data?.title} title={sanitizeTextForReactPdf(data.title || "Meal Plan")}>
      <Document title={sanitizeTextForReactPdf(data.title || "Meal Plan")} author={coachDisplay}>
        {/* Cover — Personalized Nutrition Blueprint */}
        <Page size="A4" style={coverS.coverPage}>
          <View style={coverS.coverSection}>
            <Image src={COVER_PAGE_BACKGROUND_SRC} style={coverS.headerBgImage} />
            <View style={coverS.dimOverlay} />
            <View style={coverS.overlay}>
              <View style={coverS.cardFrame}>
                <View style={coverS.card}>
                  <View style={coverS.cardGlassSheen} />
                  <View style={coverS.cardTop}>
                    <View style={coverS.titleContainer}>
                      <Image
                        src={brand?.brandLogo ?? data?.brandLogo}
                        style={{ height: 40, width: 40, objectFit: "contain" }}
                      />
                      <Text style={coverS.titleWhite} wrap={false} {...PDF_TEXT_NO_HYPHEN}>
                        Personalized
                      </Text>
                      <Text style={coverS.titleOrange} wrap={false} {...PDF_TEXT_NO_HYPHEN}>
                        Nutrition
                      </Text>
                      <Text style={coverS.titleWhite} wrap={false} {...PDF_TEXT_NO_HYPHEN}>
                        Blueprint
                      </Text>
                    </View>
                    <View style={coverS.divider} />
                    <Text style={coverS.preparedBy}>Prepared By</Text>
                    <Text style={[coverS.authorName, pdfScriptFontStyleForText(coachDisplay)]}>{coachDisplay}</Text>
                  </View>
                  <View style={coverS.cardFooter}>
                    <Text style={coverS.protocolText}>Begin Protocol</Text>
                    <Text style={coverS.chevron}>︾</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Page>

        {/* Overview — page 2 */}
        <Page size="A4" style={overviewStyles.page}>
          <View style={overviewStyles.headerSection}>
            <Image src={OVERVIEW_HEADER_BACKGROUND_SRC} style={overviewStyles.headerBgImage} />
            <View style={overviewStyles.headerDim} />
            <View style={overviewStyles.headerGrid}>
              <View style={overviewStyles.profileRow}>
                <View style={[overviewStyles.profileCard, { borderLeftColor: OVERVIEW_GREEN }]}>
                  <Text style={overviewStyles.profileCardLabel}>Client Details</Text>
                  <Text style={[overviewStyles.profileCardValue, pdfScriptFontStyleForText(clientDisplay)]}>
                    {clientDisplay}
                  </Text>
                </View>
                <View style={[overviewStyles.profileCard, { borderLeftColor: OVERVIEW_ORANGE }]}>
                  <Text style={overviewStyles.profileCardLabel}>Client ID</Text>
                  <Text style={[overviewStyles.profileCardValueMuted, pdfScriptFontStyleForText(clientIdLine)]}>
                    {clientIdLine}
                  </Text>
                </View>
              </View>
              <View style={showMonthlyPlanDates ? overviewStyles.profileRow : overviewStyles.profileRowLast}>
                <View style={[overviewStyles.profileCard, { borderLeftColor: OVERVIEW_ORANGE }]}>
                  <Text style={overviewStyles.profileCardLabel}>Duration</Text>
                  <Text
                    style={[
                      overviewStyles.profileCardValue,
                      pdfScriptFontStyleForText(sanitizeTextForReactPdf(data.durationLabel || "—")),
                    ]}
                  >
                    {sanitizeTextForReactPdf(data.durationLabel || "—")}
                  </Text>
                </View>
                <View style={[overviewStyles.profileCard, { borderLeftColor: OVERVIEW_GREEN }]}>
                  <Text style={overviewStyles.profileCardLabel}>Coach Name</Text>
                  <Text style={[overviewStyles.profileCardValue, pdfScriptFontStyleForText(coachDisplay)]}>
                    {coachDisplay}
                  </Text>
                </View>
              </View>
              {showMonthlyPlanDates ? (
                <View style={overviewStyles.profileRowLast}>
                  <View style={[overviewStyles.profileCard, { borderLeftColor: OVERVIEW_GREEN }]}>
                    <Text style={overviewStyles.profileCardLabel}>Plan start</Text>
                    <Text
                      style={[
                        overviewStyles.profileCardValue,
                        pdfScriptFontStyleForText(
                          sanitizeTextForReactPdf(data.monthlyPlanPeriod.planStartLabel),
                        ),
                      ]}
                    >
                      {sanitizeTextForReactPdf(data.monthlyPlanPeriod.planStartLabel)}
                    </Text>
                  </View>
                  <View style={[overviewStyles.profileCard, { borderLeftColor: OVERVIEW_ORANGE }]}>
                    <Text style={overviewStyles.profileCardLabel}>Plan end</Text>
                    <Text
                      style={[
                        overviewStyles.profileCardValue,
                        pdfScriptFontStyleForText(sanitizeTextForReactPdf(data.monthlyPlanPeriod.planEndLabel)),
                      ]}
                    >
                      {sanitizeTextForReactPdf(data.monthlyPlanPeriod.planEndLabel)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={overviewStyles.sectionBody}>
            <Text style={overviewStyles.sectionTitle}>Description</Text>
            <Text
              style={[
                overviewStyles.descBody,
                pdfScriptFontStyleForText(
                  data.description?.trim() ? sanitizeTextForReactPdf(data.description) : "—",
                ),
              ]}
              wrap
            >
              {data.description?.trim() ? sanitizeTextForReactPdf(data.description) : "—"}
            </Text>

            {data.guidelines ? (
              <View style={{ marginBottom: 10 }}>
                <View style={overviewStyles.orangeRule} />
                <Text style={overviewStyles.sectionTitle}>Guidelines</Text>
                <View style={overviewStyles.guidelinesPanel}>
                  {String(data.guidelines)
                    .split(/\n\n+/)
                    .map((section, index, arr) => {
                      const lines = section.split("\n").filter(Boolean);
                      const head = sanitizeTextForReactPdf(lines[0] || "Guidelines");
                      const rest = sanitizeTextForReactPdf(lines.slice(1).join(" "));
                      const isLast = index === arr.length - 1;
                      return (
                        <View
                          key={index}
                          style={isLast ? overviewStyles.guidelineBlockLast : overviewStyles.guidelineBlock}
                        >
                          <Text style={[overviewStyles.guidelineTitle, pdfScriptFontStyleForText(head)]}>{head}</Text>
                          <Text
                            style={[
                              overviewStyles.guidelineItem,
                              pdfScriptFontStyleForText(rest || sanitizeTextForReactPdf(section)),
                            ]}
                          >
                            {rest || sanitizeTextForReactPdf(section)}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </View>
            ) : null}

            {data.supplements ? (
              <View style={{ marginBottom: 6 }}>
                <View style={overviewStyles.orangeRule} />
                <Text style={overviewStyles.sectionTitle}>Supplements</Text>
                <View style={overviewStyles.guidelinesPanel}>
                  <Text
                    style={[
                      overviewStyles.supplementsBody,
                      pdfScriptFontStyleForText(sanitizeTextForReactPdf(data.supplements)),
                    ]}
                    wrap
                  >
                    {sanitizeTextForReactPdf(data.supplements)}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={overviewStyles.footerRule} />
            <Text style={[overviewStyles.footerPrepared, pdfScriptFontStyleForText(coachDisplay)]}>
              Prepared by {coachDisplay}
            </Text>
          </View>
        </Page>

        {/* Page 3 — macro breakdown + daily schedule (portrait) */}
        <Page size="A4" style={digestStyles.page}>
          <Text style={digestStyles.macroTitle}>Macro Breakdown</Text>
          <Text style={digestStyles.macroIntro}>
            Totals aggregate nutrition parsed from dishes in this plan where data exists. They are planning guides,
            not clinical prescriptions—your coach may adjust portions and timing for your context.
          </Text>
          {digestMacros.length > 0 ? (
            <View style={digestStyles.macroRow} wrap={false}>
              {digestMacros.map((m, i) => (
                <View key={i} style={[digestStyles.macroCard, { borderLeftColor: m.border }]} wrap={false}>
                  <Text style={digestStyles.macroLabel}>{m.label}</Text>
                  <Text style={[digestStyles.macroValue, pdfScriptFontStyleForText(m.value)]}>{m.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 8 }}>No macro totals in this export.</Text>
          )}

          <View style={digestStyles.split}>
            <View style={digestStyles.colLeft}>
              <Text style={digestStyles.scheduleTitle}>Daily Schedule</Text>
              <Text style={digestStyles.scheduleIntro}>
                A simple map of how meals are sequenced for this day—use it with your coach to align intake with sleep,
                training, and work blocks.
              </Text>
              <View style={digestStyles.insightCard}>
                <View style={digestStyles.insightRule} />
                <Text style={digestStyles.insightLabel}>Curator insight</Text>
                <Text style={[digestStyles.insightQuote, pdfScriptFontStyleForText(curatorLine)]}>{curatorLine}</Text>
              </View>
            </View>
            <View style={digestStyles.colRight}>
              {scheduleMeals.length === 0 ? (
                <Text style={digestStyles.schedEmpty}>No timed meals for this day in the exported plan.</Text>
              ) : (
                scheduleMeals.map((meal, i) => {
                  const hi = i === highlightIdx;
                  const dotPalette = ["#2E7D32", "#E65100", "#9E9E9E"];
                  const dotColor = hi ? "#FFFFFF" : dotPalette[i % dotPalette.length];
                  const timeLabel = sanitizeTextForReactPdf(meal.timeWindow?.trim() ? meal.timeWindow : "—");
                  const title = sanitizeTextForReactPdf(String(meal.name || "Meal").toUpperCase());
                  const sub = mealScheduleSubtitle(meal);
                  return (
                    <View key={`${title}-${i}`} style={hi ? digestStyles.schedRowHi : digestStyles.schedRow}>
                      <Text
                        style={[
                          hi ? digestStyles.schedTimeHi : digestStyles.schedTime,
                          pdfScriptFontStyleForText(timeLabel),
                        ]}
                      >
                        {timeLabel}
                      </Text>
                      <View style={[digestStyles.schedDot, { backgroundColor: dotColor }]} />
                      <View style={digestStyles.schedMain}>
                        <Text
                          style={[
                            hi ? digestStyles.schedTitleHi : digestStyles.schedTitle,
                            pdfScriptFontStyleForText(title),
                          ]}
                        >
                          {title}
                        </Text>
                        <Text
                          style={[hi ? digestStyles.schedSubHi : digestStyles.schedSub, pdfScriptFontStyleForText(sub)]}
                        >
                          {sub}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <View style={digestStyles.footerRule} />
          <Text style={[digestStyles.footerPrepared, pdfScriptFontStyleForText(coachDisplay)]}>
            Prepared by {coachDisplay}
          </Text>
        </Page>

        {/* Meal detail cards — compact; multiple per page with wrap; active plan only */}
        <Page size="A4" wrap style={mealDetailStyles.page}>
          {mealPlanContextLabel ? (
            <Text style={[mealDetailStyles.planContext, pdfScriptFontStyleForText(mealPlanContextLabel)]}>
              {mealPlanContextLabel}
            </Text>
          ) : null}
          {!mealDayBlocks.some((b) => Array.isArray(b.sectionGroups) && b.sectionGroups.length > 0) ? (
            <Text style={{ fontSize: 9, color: "#6B7280" }}>No dishes in this plan.</Text>
          ) : (
            mealDayBlocks.map((block, bi) => {
              const groups = Array.isArray(block.sectionGroups) ? block.sectionGroups : [];
              const firstGroup = groups[0];
              const restGroups = groups.slice(1);
              return (
                <View key={`meal-day-${bi}-${block.dayHeading || "single"}`} style={mealDetailStyles.dayGroupOuter}>
                  {block.dayHeading || firstGroup ? (
                    <View wrap={false}>
                      {block.dayHeading ? (
                        <Text
                          style={[
                            mealDetailStyles.dayGroupHeading,
                            pdfScriptFontStyleForText(sanitizeTextForReactPdf(block.dayHeading)),
                          ]}
                          {...PDF_TEXT_NO_HYPHEN}
                        >
                          {sanitizeTextForReactPdf(block.dayHeading)}
                        </Text>
                      ) : null}
                      {firstGroup ? (
                        <MealSectionGroupCard
                          key={`meal-group-${bi}-${firstGroup.category}-0`}
                          category={firstGroup.category}
                          meals={firstGroup.meals}
                          imageUrlMap={dishImageDataUrlMap}
                          groupKey={`${bi}-${firstGroup.category}-0`}
                        />
                      ) : null}
                    </View>
                  ) : null}
                  {restGroups.map((g, gi) => (
                    <MealSectionGroupCard
                      key={`meal-group-${bi}-${g.category}-${gi + 1}`}
                      category={g.category}
                      meals={g.meals}
                      imageUrlMap={dishImageDataUrlMap}
                      groupKey={`${bi}-${g.category}-${gi + 1}`}
                    />
                  ))}
                </View>
              );
            })
          )}
          <View style={mealDetailStyles.footerLines}>
            <View style={mealDetailStyles.footerLineOrange} />
            <View style={mealDetailStyles.footerLineGreen} />
          </View>
          <Text style={[mealDetailStyles.footerPrepared, pdfScriptFontStyleForText(coachDisplay)]}>
            Prepared by {coachDisplay}
          </Text>
        </Page>

        <SignatureOptimizationClosingPage
          nutritionalInformation={stats.nutritionalInformation}
          macrosBreakDown={stats.macrosBreakDown}
          foodTags={stats.foodTags}
          coachDisplay={coachDisplay}
        />
      </Document>
    </NamedPdfViewer>
  );
}
