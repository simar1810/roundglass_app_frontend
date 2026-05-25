/** Stable IDs persisted on each saved TDEE snapshot (backend + client). */
export const GOAL_IDS = {
  CUT_MILD: "cut_mild",
  CUT_AGGRESSIVE: "cut_aggressive",
  MAINTAIN: "maintain",
  BULK_MILD: "bulk_mild",
  BULK_LEAN: "bulk_lean",
  BULK_AGGRESSIVE: "bulk_aggressive",
};

export const GOAL_OPTIONS = [
  {
    value: GOAL_IDS.CUT_MILD,
    label: "Weight loss — mild (~0.25 kg/week)",
    key: "loss-mild"
  },
  {
    value: GOAL_IDS.CUT_AGGRESSIVE,
    label: "Weight loss — faster (~0.5 kg/week)",
    key: "loss-faster"
  },
  {
    value: GOAL_IDS.MAINTAIN,
    label: "Maintain weight",
    key: "maintain"
  },
  {
    value: GOAL_IDS.BULK_MILD,
    label: "Weight gain — mild (~0.25 kg/week)",
    key: "gain-mild"
  },
  {
    value: GOAL_IDS.BULK_LEAN,
    label: "Weight gain — lean (~0.5 kg/week)",
    key: "gain-lean"
  },
  {
    value: GOAL_IDS.BULK_AGGRESSIVE,
    label: "Weight gain — fast (~1 kg/week)",
    key: "gain-fast"
  },
];

const GOAL_SHORT_LABEL = {
  [GOAL_IDS.CUT_MILD]: "Mild weight loss",
  [GOAL_IDS.CUT_AGGRESSIVE]: "Weight loss",
  [GOAL_IDS.MAINTAIN]: "Maintenance",
  [GOAL_IDS.BULK_MILD]: "Mild weight gain",
  [GOAL_IDS.BULK_LEAN]: "Weight gain",
  [GOAL_IDS.BULK_AGGRESSIVE]: "Fast weight gain",
};

/**
 * @param {object | null} data — shape from `calculateTdee` (bmr, tdee, cut, bulk, maintain)
 * @param {string} goalId
 */
export function getTargetForGoal(data, goalId) {
  if (!data) return null;
  switch (goalId) {
    case GOAL_IDS.CUT_MILD:
      return {
        ...data.cut.mild,
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.CUT_MILD],
        section: "cut",
      };
    case GOAL_IDS.CUT_AGGRESSIVE:
      return {
        ...data.cut.aggressive,
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.CUT_AGGRESSIVE],
        section: "cut",
      };
    case GOAL_IDS.MAINTAIN:
      return {
        calories: data.maintain.calories,
        percent: data.maintain.percent,
        change: "",
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.MAINTAIN],
        section: "maintain",
      };
    case GOAL_IDS.BULK_MILD:
      return {
        ...data.bulk.mild,
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.BULK_MILD],
        section: "bulk",
      };
    case GOAL_IDS.BULK_LEAN:
      return {
        ...data.bulk.lean,
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.BULK_LEAN],
        section: "bulk",
      };
    case GOAL_IDS.BULK_AGGRESSIVE:
      return {
        ...data.bulk.aggressive,
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.BULK_AGGRESSIVE],
        section: "bulk",
      };
    default:
      return {
        calories: data.maintain.calories,
        percent: data.maintain.percent,
        change: "",
        shortLabel: GOAL_SHORT_LABEL[GOAL_IDS.MAINTAIN],
        section: "maintain",
      };
  }
}

/**
 * Saved snapshot: prefer explicit fields; else derive from full cut/maintain/bulk; else legacy `tdee`.
 * @param {Record<string, unknown>} entry
 */
/**
 * Internal GOAL_IDS value for filtering/UI. Accepts API slug on `goal` or
 * `tdeeConfig.goal`, or legacy internal ids (e.g. cut_mild).
 */
export function getResolvedGoalId(entry) {
  const raw =
    (typeof entry?.goal === "string" && entry.goal) ||
    (typeof entry?.tdeeConfig?.goal === "string" && entry.tdeeConfig.goal) ||
    "";
  const g = raw.trim();
  if (!g) return GOAL_IDS.MAINTAIN;
  const bySlug = GOAL_OPTIONS.find((o) => o.key === g);
  if (bySlug) return bySlug.value;
  const byValue = GOAL_OPTIONS.find((o) => o.value === g);
  if (byValue) return byValue.value;
  return GOAL_IDS.MAINTAIN;
}

/**
 * @param {Record<string, unknown>} entry
 */
export function getDisplayCaloriesForSavedEntry(entry) {
  if (entry == null) return null;
  if (entry.targetCalories != null && Number.isFinite(Number(entry.targetCalories))) {
    return Number(entry.targetCalories);
  }
  const gid = getResolvedGoalId(entry);
  const hasBreakdown =
    entry.cut &&
    entry.bulk &&
    entry.maintain &&
    typeof entry.maintain === "object";
  if (hasBreakdown) {
    const t = getTargetForGoal(
      {
        cut: entry.cut,
        bulk: entry.bulk,
        maintain: entry.maintain,
        bmr: entry.bmr,
        tdee: entry.tdee,
      },
      gid
    );
    if (t?.calories != null) return t.calories;
  }
  if (entry.tdee != null && Number.isFinite(Number(entry.tdee))) {
    return Number(entry.tdee);
  }
  return null;
}

/**
 * @param {Record<string, unknown>[]} entries
 * @param {string} goalId
 */
export function filterSavedEntriesByGoal(entries, goalId) {
  if (!Array.isArray(entries)) return [];
  return entries.filter((e) => getResolvedGoalId(e) === goalId);
}

/** Human-readable label for UI (filters, history, cards). */
export function goalOptionLabel(goalId) {
  const opt = GOAL_OPTIONS.find((o) => o.value === goalId);
  return opt?.label ?? GOAL_SHORT_LABEL[goalId] ?? goalId;
}

/**
 * Validator slug for POST /api/app/tdee-calculations/:clientId
 * (loss-mild | loss-faster | maintain | gain-mild | gain-lean | gain-fast).
 */
export function apiGoalSlugFromInternalId(goalId) {
  const opt = GOAL_OPTIONS.find((o) => o.value === goalId);
  return opt?.key ?? "maintain";
}

function parsePercentToOptionalNumber(percent) {
  if (percent == null || percent === "") return undefined;
  if (typeof percent === "number" && Number.isFinite(percent)) return percent;
  const m = String(percent).match(/-?[\d.]+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeBranchForApi(node) {
  if (!node || typeof node !== "object") {
    return { calories: 0, percent: "", change: "" };
  }
  return {
    calories: Math.max(0, Math.round(Number(node.calories) || 0)),
    percent: node.percent != null ? String(node.percent) : "",
    change: node.change != null ? String(node.change) : "",
  };
}

/**
 * Body for POST `app/tdee-calculations/:clientId` — matches API validator
 * (goal slugs, full cut/maintain/bulk trees, numeric targetCalories & breakdown).
 */
export function buildTdeeCalculationPayload(base, selectedGoal) {
  if (!base || typeof base !== "object") {
    throw new Error("Invalid TDEE data");
  }
  const target = getTargetForGoal(base, selectedGoal);
  const apiGoal = apiGoalSlugFromInternalId(selectedGoal);

  const cut = {
    mild: normalizeBranchForApi(base.cut?.mild),
    aggressive: normalizeBranchForApi(base.cut?.aggressive),
  };
  const bulk = {
    mild: normalizeBranchForApi(base.bulk?.mild),
    lean: normalizeBranchForApi(base.bulk?.lean),
    aggressive: normalizeBranchForApi(base.bulk?.aggressive),
  };
  const maintain = {
    calories: Math.max(
      0,
      Math.round(Number(base.maintain?.calories ?? base.tdee) || 0),
    ),
    percent: base.maintain?.percent != null ? String(base.maintain.percent) : "100%",
    change: base.maintain?.change != null ? String(base.maintain.change) : "",
  };

  const bd = base.breakdown && typeof base.breakdown === "object" ? base.breakdown : {};
  const breakdown = {};
  for (const k of ["calories", "proteins", "fats", "carbohydrates"]) {
    if (bd[k] != null && bd[k] !== "") {
      const n = Number(bd[k]);
      if (Number.isFinite(n)) breakdown[k] = n;
    }
  }

  const targetCals = Math.max(0, Math.round(Number(target?.calories ?? base.tdee) || 0));
  const targetPercentNum = parsePercentToOptionalNumber(target?.percent);

  return {
    goal: apiGoal,
    bmr: Math.round(Number(base.bmr) || 0),
    tdee: Math.round(Number(base.tdee) || 0),
    cut,
    maintain,
    bulk,
    ...(Object.keys(breakdown).length ? { breakdown } : {}),
    tdeeConfig: {
      goal: apiGoal,
      targetCalories: targetCals,
      ...(targetPercentNum !== undefined ? { targetPercent: targetPercentNum } : {}),
      ...(target?.change ? { targetPace: String(target.change) } : {}),
    },
  };
}

/**
 * Display fields for a saved snapshot (new fields or legacy full breakdown).
 * @param {Record<string, unknown>} entry
 */
export function getSavedEntryDisplay(entry) {
  if (!entry) return null;
  const gid = getResolvedGoalId(entry);
  const goalLabel = entry.goalLabel ?? goalOptionLabel(gid);
  const calories = getDisplayCaloriesForSavedEntry(entry);
  let percent = entry.targetPercent;
  let pace = entry.targetPace ?? "";

  const hasBreakdown =
    entry.cut &&
    entry.bulk &&
    entry.maintain &&
    typeof entry.maintain === "object";

  if ((percent == null || pace === "") && hasBreakdown) {
    const t = getTargetForGoal(
      {
        cut: entry.cut,
        bulk: entry.bulk,
        maintain: entry.maintain,
        tdee: entry.tdee,
        bmr: entry.bmr,
      },
      gid
    );
    if (percent == null) percent = t?.percent;
    if (pace === "") pace = t?.change ?? "";
  }

  return {
    goalLabel,
    calories,
    percent: percent ?? "—",
    pace: pace || "—",
    maintenanceTdee: entry.tdee,
    bmr: entry.bmr,
  };
}

/**
 * Optional per-save macro breakdown (from TDEE tool "Nutrition breakdown").
 * Reads top-level `breakdown` or nested `tdeeConfig.breakdown` from API.
 * @param {Record<string, unknown>} entry
 * @returns {{ proteins: number, fats: number, carbohydrates: number, calories: number } | null}
 */
export function getMacroBreakdownFromEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const raw =
    (entry.breakdown && typeof entry.breakdown === "object" && entry.breakdown) ||
    (entry.tdeeConfig?.breakdown &&
      typeof entry.tdeeConfig.breakdown === "object" &&
      entry.tdeeConfig.breakdown) ||
    null;
  if (!raw) return null;

  const num = (k) => {
    const v = raw[k];
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const hasData = ["proteins", "fats", "carbohydrates", "calories"].some((k) => {
    const v = raw[k];
    if (v == null || v === "") return false;
    return Number.isFinite(Number(v));
  });
  if (!hasData) return null;

  const proteins = num("proteins") ?? 0;
  const fats = num("fats") ?? 0;
  const carbohydrates = num("carbohydrates") ?? 0;
  const calories = num("calories") ?? 0;

  return { proteins, fats, carbohydrates, calories };
}
