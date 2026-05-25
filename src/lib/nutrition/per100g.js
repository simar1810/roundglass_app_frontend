/** Backend macro fields are per 100g. Scale to a serving with: value * (grams / 100). */

export function toNutritionNum(value) {
	const n = parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}

/** Per-100g macro values from API / saved recipe. */
export function extractPer100gNutrition(recipe) {
	if (!recipe) {
		return { calories: 0, protein: 0, carbohydrates: 0, fats: 0 };
	}

	const per100 = recipe.per_100g;
	if (per100 && typeof per100 === "object") {
		return {
			calories: toNutritionNum(per100.calories),
			protein: toNutritionNum(per100.protein),
			carbohydrates: toNutritionNum(per100.carbohydrates ?? per100.carbs),
			fats: toNutritionNum(per100.fats),
			dietary_fibre: toNutritionNum(per100.dietary_fibre),
			sodium: toNutritionNum(per100.sodium),
		};
	}

	return {
		calories: toNutritionNum(recipe?.calories?.total ?? recipe?.calories),
		protein: toNutritionNum(recipe?.protein ?? recipe?.calories?.proteins),
		carbohydrates: toNutritionNum(
			recipe?.carbohydrates ?? recipe?.calories?.carbs
		),
		fats: toNutritionNum(recipe?.fats ?? recipe?.calories?.fats),
		dietary_fibre: toNutritionNum(recipe?.dietary_fibre),
		sodium: toNutritionNum(recipe?.sodium),
	};
}

export function buildPer100gSnapshot(recipe) {
	const macros = extractPer100gNutrition(recipe);
	return {
		calories: macros.calories,
		protein: macros.protein,
		carbohydrates: macros.carbohydrates,
		fats: macros.fats,
		...(macros.dietary_fibre ? { dietary_fibre: macros.dietary_fibre } : {}),
		...(macros.sodium ? { sodium: macros.sodium } : {}),
	};
}

export function resolveRecipeMeasure(recipe, measureName) {
	const measures = Array.isArray(recipe?.measures) ? recipe.measures : [];
	if (measureName) {
		const match = measures.find((item) => item.name === measureName);
		if (match) return match;
	}
	if (recipe?.default_measure?.name) {
		const match = measures.find(
			(item) => item.name === recipe.default_measure.name
		);
		if (match) return match;
		if (getMeasureGrams(recipe.default_measure)) {
			return recipe.default_measure;
		}
	}
	return measures[0] || recipe?.default_measure || null;
}

export function getMeasureGrams(measure) {
	if (!measure) return null;
	const candidates = [
		measure.grams,
		measure.gram,
		measure.weight,
		measure.quantityInGrams,
	];
	for (const candidate of candidates) {
		const n = Number(candidate);
		if (Number.isFinite(n) && n > 0) return n;
	}
	return null;
}

export function getServingTotalGrams(measure, quantity = 1) {
	const grams = getMeasureGrams(measure);
	const qty = Number(quantity) > 0 ? Number(quantity) : 1;
	if (!grams) return null;
	return grams * qty;
}

export function parseGramsFromServingSize(servingSize) {
	if (typeof servingSize !== "string") return null;
	const match = servingSize.match(/\((\d+(?:\.\d+)?)\s*g\)/i);
	if (!match) return null;
	const grams = parseFloat(match[1]);
	return Number.isFinite(grams) && grams > 0 ? grams : null;
}

export function resolveServingGrams(recipe, options = {}) {
	const quantity = Number(options.quantity ?? recipe?.quantity) > 0
		? Number(options.quantity ?? recipe?.quantity)
		: 1;
	const measureName =
		options.measureName ??
		recipe?.selected_measure_name ??
		recipe?.default_measure?.name;
	const measure =
		options.measure ?? resolveRecipeMeasure(recipe, measureName);

	const fromMeasure = getServingTotalGrams(measure, quantity);
	if (fromMeasure) return fromMeasure;

	return parseGramsFromServingSize(recipe?.serving_size);
}

/** Scale per-100g macros to a serving weight in grams. */
export function scaleNutritionFromPer100g(per100g, totalGrams, { decimals = 1 } = {}) {
	const grams = Number(totalGrams);
	const factor = Number.isFinite(grams) && grams > 0 ? grams / 100 : 1;
	const format = (value) => (toNutritionNum(value) * factor).toFixed(decimals);

	return {
		totalGrams: Number.isFinite(grams) && grams > 0 ? grams : 100,
		factor,
		calories: format(per100g?.calories),
		protein: format(per100g?.protein),
		carbohydrates: format(per100g?.carbohydrates),
		fats: format(per100g?.fats),
		...(per100g?.dietary_fibre !== undefined
			? { dietary_fibre: format(per100g.dietary_fibre) }
			: {}),
		...(per100g?.sodium !== undefined ? { sodium: format(per100g.sodium) } : {}),
	};
}

/** Display macros for a recipe at the given (or default) serving. */
export function getServingNutrition(recipe, options = {}) {
	const per100g = extractPer100gNutrition(recipe);
	const totalGrams = resolveServingGrams(recipe, options);

	if (!totalGrams) {
		return {
			...per100g,
			totalGrams: 100,
			factor: 1,
			per100gOnly: true,
		};
	}

	return scaleNutritionFromPer100g(per100g, totalGrams, options);
}

/** Apply default-measure serving macros to a recipe object (for forms / saved meals). */
export function applyDefaultServingNutrition(recipe) {
	const per100gSnapshot = recipe?.per_100g || buildPer100gSnapshot(recipe);
	const per100 = extractPer100gNutrition({ ...recipe, per_100g: per100gSnapshot });
	const quantity = Number(recipe?.quantity) > 0 ? Number(recipe.quantity) : 1;
	const measureName =
		recipe?.selected_measure_name || recipe?.default_measure?.name;
	const measure = resolveRecipeMeasure(recipe, measureName);
	const totalGrams = getServingTotalGrams(measure, quantity);

	const base = {
		quantity,
		per_100g: per100gSnapshot,
		selected_measure_name: measure?.name || measureName || "",
	};

	if (!totalGrams || !measure?.name) {
		return {
			...base,
			calories: per100.calories,
			protein: per100.protein,
			carbohydrates: per100.carbohydrates,
			fats: per100.fats,
			...(per100.dietary_fibre ? { dietary_fibre: per100.dietary_fibre } : {}),
			...(per100.sodium ? { sodium: per100.sodium } : {}),
		};
	}

	const scaled = scaleNutritionFromPer100g(per100, totalGrams);

	return {
		...base,
		serving_size: `${quantity} ${measure.name} (${totalGrams}g)`,
		calories: scaled.calories,
		protein: scaled.protein,
		carbohydrates: scaled.carbohydrates,
		fats: scaled.fats,
		...(scaled.dietary_fibre ? { dietary_fibre: scaled.dietary_fibre } : {}),
		...(scaled.sodium ? { sodium: scaled.sodium } : {}),
	};
}

function formatMacroField(value) {
	if (value === undefined || value === null || value === "") return "";
	const n = parseFloat(value);
	return Number.isFinite(n) ? String(n) : String(value);
}

/** Map catalog/search recipe shapes to meal-plan form fields (dish_name, flat macros). */
export function normalizeRecipeForMealPlan(recipe) {
	if (!recipe || typeof recipe !== "object") return {};

	const per100gSnapshot = recipe.per_100g || buildPer100gSnapshot(recipe);
	const enriched = { ...recipe, per_100g: per100gSnapshot };
	const servingNutrition = getServingNutrition(enriched);

	return {
		...enriched,
		dish_name: recipe.dish_name || recipe.title || recipe.name || "",
		description: recipe.description || "",
		ingredients: typeof recipe.ingredients === "string" ? recipe.ingredients : "",
		method:
			recipe.method ||
			(Array.isArray(recipe.recipe) ? recipe.recipe.join("\n") : ""),
		calories: formatMacroField(servingNutrition.calories),
		protein: formatMacroField(servingNutrition.protein),
		carbohydrates: formatMacroField(servingNutrition.carbohydrates),
		fats: formatMacroField(servingNutrition.fats),
		...(servingNutrition.dietary_fibre !== undefined
			? { dietary_fibre: formatMacroField(servingNutrition.dietary_fibre) }
			: {}),
		...(servingNutrition.sodium !== undefined
			? { sodium: formatMacroField(servingNutrition.sodium) }
			: {}),
	};
}

export function formatServingSizeLabel(recipe, options = {}) {
	const quantity = Number(options.quantity ?? recipe?.quantity) > 0
		? Number(options.quantity ?? recipe?.quantity)
		: 1;
	const measureName =
		options.measureName ??
		recipe?.selected_measure_name ??
		recipe?.default_measure?.name;
	const measure =
		options.measure ?? resolveRecipeMeasure(recipe, measureName);
	const totalGrams = resolveServingGrams(recipe, { ...options, quantity, measure });

	if (measure?.name && totalGrams) {
		return `${quantity} ${measure.name} (${totalGrams}g)`;
	}
	if (recipe?.serving_size) return recipe.serving_size;
	if (totalGrams) return `${totalGrams}g`;
	return "100g";
}
