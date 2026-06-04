import { getServingNutrition } from "@/lib/nutrition/per100g";

function parseNum(val) {
	if (typeof val === "number") return Number.isFinite(val) ? val : 0;
	if (typeof val === "string") {
		const n = parseFloat(String(val).replace(/,/g, ""));
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}

/** Nutrition for one meal recall row (recipe or stored macros). */
export function getMealRecallMealNutrition(meal) {
	if (!meal) {
		return { calories: 0, protein: 0, carbohydrates: 0, fats: 0 };
	}

	if (meal.entryMode === "recipe") {
		if (
			meal.calories != null ||
			meal.protein != null ||
			meal.carbohydrates != null ||
			meal.fats != null
		) {
			return {
				calories: parseNum(meal.calories),
				protein: parseNum(meal.protein),
				carbohydrates: parseNum(meal.carbohydrates),
				fats: parseNum(meal.fats),
			};
		}
		const nutrition = getServingNutrition(meal);
		return {
			calories: parseNum(nutrition.calories),
			protein: parseNum(nutrition.protein),
			carbohydrates: parseNum(nutrition.carbohydrates),
			fats: parseNum(nutrition.fats),
		};
	}

	return { calories: 0, protein: 0, carbohydrates: 0, fats: 0 };
}

export function computeMealRecallTotals(meals) {
	return (Array.isArray(meals) ? meals : []).reduce(
		(acc, meal) => {
			const n = getMealRecallMealNutrition(meal);
			acc.calories += n.calories;
			acc.protein += n.protein;
			acc.carbohydrates += n.carbohydrates;
			acc.fats += n.fats;
			return acc;
		},
		{ calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
	);
}

function formatMacroValue(value) {
	if (!Number.isFinite(value) || value <= 0) return "";
	return String(Math.round(value * 10) / 10);
}

export function totalsToPractitionerNotes(totals) {
	return {
		totalEnergyIntake: formatMacroValue(totals.calories),
		proteinG: formatMacroValue(totals.protein),
		carbohydrateG: formatMacroValue(totals.carbohydrates),
		fatG: formatMacroValue(totals.fats),
	};
}

export function normalizeRecipeId(id) {
	if (!id) return "";
	if (typeof id === "object" && id.$oid) return String(id.$oid);
	return String(id);
}

/** Map a configured recipe + recall fields into a persisted meal row. */
export function buildRecipeMealRecallRow(recipe, fields = {}) {
	const id = normalizeRecipeId(recipe?._id?.$oid || recipe?._id);
	const dishName =
		recipe?.dish_name || recipe?.title || recipe?.name || fields.foodBeverage || "";
	const servingLabel =
		recipe?.serving_size || recipe?.quantity || fields.quantity || "";

	return {
		entryMode: "recipe",
		recipeId: id,
		mealType: fields.mealType || "",
		foodBeverage: dishName,
		quantity: servingLabel,
		location: fields.location || "",
		comments: fields.comments || "",
		serving_size: recipe?.serving_size || servingLabel,
		servingQuantity: Number(recipe?.quantity) > 0 ? Number(recipe.quantity) : 1,
		selected_measure_name: recipe?.selected_measure_name || "",
		per_100g: recipe?.per_100g,
		measures: recipe?.measures,
		default_measure: recipe?.default_measure,
		image: recipe?.image,
		dish_name: dishName,
		calories: recipe?.calories != null ? String(recipe.calories) : "",
		protein: recipe?.protein != null ? String(recipe.protein) : "",
		carbohydrates:
			recipe?.carbohydrates != null ? String(recipe.carbohydrates) : "",
		fats: recipe?.fats != null ? String(recipe.fats) : "",
	};
}

export function buildManualMealRecallRow(fields = {}) {
	return {
		entryMode: "manual",
		mealType: fields.mealType || "",
		foodBeverage: fields.foodBeverage || "",
		quantity: fields.quantity || "",
		location: fields.location || "",
		comments: fields.comments || "",
	};
}
