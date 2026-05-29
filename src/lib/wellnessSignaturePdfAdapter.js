/**
 * Adapts `customMealDailyPDFData` output into the `plans` object shape expected by
 * remap-style stats (`getMealPDFData`) and multi-page signature PDFs.
 */

import { resolveMealImageUrlString } from "./mealPdfImageUrl";

function parseMacroFromDetails(details, label) {
  if (!details || typeof details !== "string") return 0;
  const patterns = [
    new RegExp(`${label}\\s*[:\\s]*([\\d.]+)\\s*g`, "i"),
    new RegExp(`${label}\\s*([\\d.]+)`, "i"),
  ];
  for (const re of patterns) {
    const m = details.match(re);
    if (m) return parseFloat(m[1]) || 0;
  }
  return 0;
}

function parseKcalFromDetails(details) {
  if (!details || typeof details !== "string") return 0;
  const m = details.match(/([\d.]+)\s*kcal/i);
  return m ? parseFloat(m[1]) || 0 : 0;
}

function dishFromPdfItem(item) {
  if (typeof item === "string") {
    return {
      dish_name: item,
      description: "",
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      sodium: 0,
      cholestrol: 0,
      saturated_fat: 0,
      trans_fat: 0,
      monosaturate_fat: 0,
      polysaturate_fat: 0,
      dietary_fibre: 0,
      natural_sugars: 0,
      added_sugars: 0,
      serving_size: 0,
      food_tags: "",
      estimated_glycemic_index: 0,
      ingredients: "",
      method: "",
    };
  }
  const title = item?.title || "Item";
  const details = item?.details || "";
  const recipe = item?.recipeDetails || {};
  const itemImage =
    resolveMealImageUrlString(item?.image) ||
    resolveMealImageUrlString(item?.thumbnail) ||
    resolveMealImageUrlString(item?.photo);
  return {
    dish_name: title,
    description: details,
    image: itemImage || "",
    calories: parseKcalFromDetails(details),
    protein: parseMacroFromDetails(details, "Protein"),
    carbohydrates: parseMacroFromDetails(details, "Carbs"),
    fats: parseMacroFromDetails(details, "Fats"),
    sodium: 0,
    cholestrol: 0,
    saturated_fat: 0,
    trans_fat: 0,
    monosaturate_fat: 0,
    polysaturate_fat: 0,
    dietary_fibre: 0,
    natural_sugars: 0,
    added_sugars: 0,
    serving_size: 0,
    food_tags: "",
    estimated_glycemic_index: 0,
    ingredients: typeof recipe.ingredients === "string" ? recipe.ingredients : "",
    method: typeof recipe.method === "string" ? recipe.method : "",
  };
}

function mapRawDishesToPdfShape(dishes) {
  return dishes.map((d) => ({
    dish_name: d?.dish_name || d?.title || "Meal",
    image:
      resolveMealImageUrlString(d?.image) ||
      resolveMealImageUrlString(d?.thumbnail) ||
      resolveMealImageUrlString(d?.photo) ||
      "",
    description: d?.description || "",
    calories: d?.calories ?? 0,
    protein: d?.protein ?? 0,
    carbohydrates: d?.carbohydrates ?? 0,
    fats: d?.fats ?? 0,
    sodium: d?.sodium ?? 0,
    cholestrol: d?.cholestrol ?? 0,
    saturated_fat: d?.saturated_fat ?? 0,
    trans_fat: d?.trans_fat ?? 0,
    monosaturate_fat: d?.monosaturate_fat ?? 0,
    polysaturate_fat: d?.polysaturate_fat ?? 0,
    dietary_fibre: d?.dietary_fibre ?? 0,
    natural_sugars: d?.natural_sugars ?? 0,
    added_sugars: d?.added_sugars ?? 0,
    serving_size: d?.serving_size ?? d?.servingSize ?? 0,
    food_tags: d?.food_tags || "",
    estimated_glycemic_index: d?.estimated_glycemic_index ?? 0,
    ingredients: d?.ingredients || "",
    method: d?.method || "",
    meal_time: d?.meal_time || "",
  }));
}

/**
 * Prefer `items` from `customMealDailyPDFData` (respects includeMacros / includeDescription)
 * over raw `dishes`. Merge image URLs from the parallel raw dish when the line item has none.
 */
export function signatureSlotToDishesList(slot) {
  const items = Array.isArray(slot?.items) ? slot.items : [];
  const dishes = Array.isArray(slot?.dishes) ? slot.dishes : [];

  if (items.length > 0) {
    return items.map((item, i) => {
      const base = dishFromPdfItem(item);
      const raw = dishes[i];
      if (!raw) return base;
      const fromItem =
        resolveMealImageUrlString(base?.image) ||
        resolveMealImageUrlString(item?.image) ||
        resolveMealImageUrlString(item?.thumbnail) ||
        resolveMealImageUrlString(item?.photo) ||
        "";
      const fromRaw =
        resolveMealImageUrlString(raw?.image) ||
        resolveMealImageUrlString(raw?.thumbnail) ||
        resolveMealImageUrlString(raw?.photo) ||
        "";
      return { ...base, image: fromItem || fromRaw || "" };
    });
  }

  if (dishes.length) {
    return mapRawDishesToPdfShape(dishes);
  }

  return [];
}

function dishesFromMealGroup(group) {
  return signatureSlotToDishesList(group);
}

/** @param {Record<string, unknown>} pdfData */
export function wellnessPdfPlansToRemapObject(pdfData) {
  const out = {};
  const planArray = Array.isArray(pdfData?.plans) ? pdfData.plans : [];
  for (const p of planArray) {
    const key = String(p?.key ?? p?.label ?? "plan");
    out[key] = {
      key: p.key,
      label: p.label,
      meals: (p.meals || []).map((g) => ({
        mealType: g.mealType,
        meals: dishesFromMealGroup(g),
        timeWindow: g.timeWindow || "",
      })),
    };
  }
  return out;
}
