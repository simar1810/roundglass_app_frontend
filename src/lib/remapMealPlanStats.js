/**
 * Nutrition aggregation for PDF layouts (ported from wz_remap_web meal-plan stats).
 * Expects `plans` as an object: { [planKey]: { meals: [{ mealType, meals: [dish, ...] }] } }.
 */

const sanitizeNumericInput = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

const parseGrams = (value) => sanitizeNumericInput(value);
const parseMg = (value) => sanitizeNumericInput(value);
const parseKcal = (value) => sanitizeNumericInput(value);

const TAG_RULES = {
  "High Protein": (m) => parseGrams(m.protein) >= 10,
  "Low Protein": (m) => parseGrams(m.protein) < 5,
  "High Carb": (m) => parseGrams(m.carbohydrates) >= 20,
  "Low Carb": (m) => parseGrams(m.carbohydrates) < 10,
  "High Fat": (m) => parseGrams(m.fats) >= 15,
  "Low Fat": (m) => parseGrams(m.fats) < 5,
  "Medium Fat": (m) => {
    const fat = parseGrams(m.fats);
    return fat > 5 && fat < 15;
  },
  "High Fibre": (m) => parseGrams(m.dietary_fibre) >= 4,
  "Low Fibre": (m) => parseGrams(m.dietary_fibre) < 2,
  "High Calorie": (m) => parseKcal(m.calories) >= 300,
  "Low Calorie": (m) => parseKcal(m.calories) < 150,
  "High Sodium": (m) => parseMg(m.sodium) >= 300,
  "Low Sodium": (m) => parseMg(m.sodium) < 140,
  "Low Sugar": (m) => parseGrams(m.added_sugars) < 5,
  "High Sugar": (m) => parseGrams(m.added_sugars) >= 10,
  "Low Saturated Fat": (m) => parseGrams(m.saturated_fat) < 2,
  "High Saturated Fat": (m) => parseGrams(m.saturated_fat) >= 5,
  "Low Cholesterol": (m) => parseMg(m.cholestrol) < 20,
  "Low Glycemic Index": (m) => Number(m.estimated_glycemic_index) < 55,
  "High Glycemic Index": (m) => Number(m.estimated_glycemic_index) >= 70,
  "Vegan": (m) => /vegan/i.test(String(m.dish_name || "") + String(m.description || "")),
  "Gluten-Free": (m) => /gluten[- ]?free/i.test(String(m.food_tags || "") + String(m.description || "")),
  "Dairy-Free": (m) => /dairy[- ]?free/i.test(String(m.food_tags || "") + String(m.description || "")),
  "Keto-Friendly": (m) => parseGrams(m.carbohydrates) < 10 && parseGrams(m.fats) >= 15,
  "Balanced Meal": (m) =>
    parseGrams(m.protein) >= 7 &&
    parseGrams(m.carbohydrates) >= 15 &&
    parseGrams(m.fats) >= 7,
};

export function getTopTagsFromMeals(meals, topN = 8) {
  const tagCounts = {};
  meals.forEach((meal) => {
    Object.entries(TAG_RULES).forEach(([tag, ruleFn]) => {
      if (ruleFn(meal)) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
  });
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([tag]) => tag);
}

export function getUniqueMeals(plans) {
  if (!plans || typeof plans !== "object") return [];
  const allMeals = Object.keys(plans).reduce((acc, plan) => {
    const groups = plans[plan]?.meals;
    if (!Array.isArray(groups)) return acc;
    return [...acc, ...groups.map((mealType) => mealType?.meals || [])];
  }, []).flat(1);
  const uniqueMealIds = new Set();
  const uniqueMeals = [];
  for (const meal of allMeals) {
    if (!meal) continue;
    if (meal.mealId && uniqueMealIds.has(meal.mealId)) continue;
    if (meal.mealId) uniqueMealIds.add(meal.mealId);
    uniqueMeals.push(meal);
  }
  return uniqueMeals;
}

export function getGlycemicIndex(meals) {
  if (!meals?.length) return 0;
  const total = meals.reduce((sum, item) => sum + Number(item?.estimated_glycemic_index || 0), 0);
  return Math.round(total / meals.length) || 0;
}

const parseValue = (val) => sanitizeNumericInput(val);

export function getNutritionInformation(meals) {
  const result = {
    serving_size: 0,
    calories: 0,
    fats: 0,
    saturated_fat: 0,
    trans_fat: 0,
    monosaturate_fat: 0,
    polysaturate_fat: 0,
    cholestrol: 0,
    carbohydrates: 0,
    dietary_fibre: 0,
    natural_sugars: 0,
    added_sugars: 0,
    protein: 0,
    sodium: 0,
  };
  for (const meal of meals) {
    result.serving_size += parseValue(meal.serving_size);
    result.calories += parseValue(meal.calories);
    result.fats += parseValue(meal.fats);
    result.saturated_fat += parseValue(meal.saturated_fat);
    result.trans_fat += parseValue(meal.trans_fat);
    result.monosaturate_fat += parseValue(meal.monosaturate_fat);
    result.polysaturate_fat += parseValue(meal.polysaturate_fat);
    result.cholestrol += parseValue(meal.cholestrol);
    result.carbohydrates += parseValue(meal.carbohydrates);
    result.dietary_fibre += parseValue(meal.dietary_fibre);
    result.natural_sugars += parseValue(meal.natural_sugars);
    result.added_sugars += parseValue(meal.added_sugars);
    result.protein += parseValue(meal.protein);
    result.sodium += parseValue(meal.sodium);
  }
  return {
    serving_size: `${result.serving_size.toFixed(1)} g`,
    calories: `${Math.round(result.calories)} Kcal`,
    fats: `${result.fats.toFixed(1)} g`,
    saturated_fat: `${result.saturated_fat.toFixed(1)} g`,
    trans_fat: `${result.trans_fat.toFixed(1)} g`,
    monosaturate_fat: `${result.monosaturate_fat.toFixed(1)} g`,
    polysaturate_fat: `${result.polysaturate_fat.toFixed(1)} g`,
    cholestrol: `${result.cholestrol.toFixed(0)} mg`,
    carbohydrates: `${result.carbohydrates.toFixed(1)} g`,
    dietary_fibre: `${result.dietary_fibre.toFixed(1)} g`,
    natural_sugars: `${result.natural_sugars.toFixed(1)} g`,
    added_sugars: `${result.added_sugars.toFixed(1)} g`,
    protein: `${result.protein.toFixed(1)} g`,
    sodium: `${result.sodium.toFixed(0)} mg`,
  };
}

export function getMacroBreakdown(meals) {
  if (!meals?.length) {
    return { calories: "0", fat: "0%", carbs: "0%", protein: "0%" };
  }
  let totalCalories = 0;
  let fatCalories = 0;
  let carbCalories = 0;
  let proteinCalories = 0;
  for (const meal of meals) {
    const fatG = parseGrams(meal.fats);
    const carbG = parseGrams(meal.carbohydrates);
    const proteinG = parseGrams(meal.protein);
    const mealFatCalories = fatG * 9;
    const mealCarbCalories = carbG * 4;
    const mealProteinCalories = proteinG * 4;
    fatCalories += mealFatCalories;
    carbCalories += mealCarbCalories;
    proteinCalories += mealProteinCalories;
    const macroCalories = mealFatCalories + mealCarbCalories + mealProteinCalories;
    const calorieFallback = macroCalories || 0;
    totalCalories += parseKcal(meal.calories) || calorieFallback;
  }
  const macroCaloriesTotal = fatCalories + carbCalories + proteinCalories || 1;
  const toPercent = (value) => `${Math.max(0, Math.round((value / macroCaloriesTotal) * 100))}%`;
  return {
    calories: `${Math.max(0, Math.round(totalCalories))}`,
    fat: toPercent(fatCalories),
    carbs: toPercent(carbCalories),
    protein: toPercent(proteinCalories),
  };
}

export function getMealPDFData(plans) {
  const meals = getUniqueMeals(plans);
  return {
    meals,
    estimatedGlycemicIndex: getGlycemicIndex(meals),
    foodTags: getTopTagsFromMeals(meals),
    nutritionalInformation: getNutritionInformation(meals),
    macrosBreakDown: getMacroBreakdown(meals),
  };
}
