/** kJ → kcal (nutrition labels) */
const KJ_TO_KCAL = 0.239006;

/**
 * Whether we can render the catalog line-item table (populated `ingredient` objects).
 * @param {Record<string, unknown> | null | undefined} recipe
 */
export function shouldShowIngredientLineTable(recipe) {
	const lines = recipe?.ingredientLineItems;
	if (!Array.isArray(lines) || lines.length === 0) return false;
	return lines.some((line) => {
		const ing = line?.ingredient;
		return (
			ing &&
			typeof ing === "object" &&
			!Array.isArray(ing) &&
			(ing.foodName != null || ing._id != null)
		);
	});
}

/**
 * Scale per-100g numbers to the row portion.
 * @param {Record<string, unknown>} ing
 * @param {number} quantityGrams
 */
export function scaledPortionFromPer100g(ing, quantityGrams) {
	const q = Number(quantityGrams);
	const factor = Number.isFinite(q) && q > 0 ? q / 100 : 0;
	const protein = (Number(ing.protein) || 0) * factor;
	const carbs = (Number(ing.carbohydrate) || 0) * factor;
	const fat = (Number(ing.totalFat) || 0) * factor;
	const fiber =
		ing.dietaryFibre && typeof ing.dietaryFibre === "object"
			? (Number(ing.dietaryFibre.total) || 0) * factor
			: 0;
	const kJ = (Number(ing.energyKJ) || 0) * factor;
	const kcal = kJ * KJ_TO_KCAL;
	return { protein, carbs, fat, fiber, kcal };
}

/**
 * Rows for web `<table>` / lists.
 * @param {Record<string, unknown> | null | undefined} recipe
 * @returns {Array<{ name: string, foodCode: string, grams: number, kcal: number | null, protein: number | null }>}
 */
export function getIngredientLineTableRows(recipe) {
	if (!shouldShowIngredientLineTable(recipe)) return [];
	const lines = recipe.ingredientLineItems;
	return lines
		.map((line) => {
			const ing = line?.ingredient;
			if (!ing || typeof ing !== "object") return null;
			const name = String(ing.foodName || "—");
			const foodCode =
				ing.foodCode != null && ing.foodCode !== ""
					? String(ing.foodCode)
					: "—";
			const grams = Number(line.quantityGrams);
			const g = Number.isFinite(grams) ? grams : 0;
			const { kcal, protein } = scaledPortionFromPer100g(ing, g);
			return {
				name,
				foodCode,
				grams: g,
				kcal: Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : null,
				protein:
					Number.isFinite(protein) && protein > 0
						? Math.round(protein * 10) / 10
						: null,
			};
		})
		.filter(Boolean);
}

/**
 * Single string for PDFs / snippets: catalog lines formatted, else legacy `ingredients`.
 * @param {Record<string, unknown> | null | undefined} recipeLike
 */
export function getRecipeIngredientsDisplayText(recipeLike) {
	if (!recipeLike || typeof recipeLike !== "object") return "";
	const legacy = String(recipeLike.ingredients ?? "").trim();
	if (shouldShowIngredientLineTable(recipeLike)) {
		const parts = [];
		for (const line of recipeLike.ingredientLineItems) {
			const ing = line?.ingredient;
			if (!ing || typeof ing !== "object") continue;
			const name = String(ing.foodName || "Ingredient").trim() || "Ingredient";
			const g = Number(line.quantityGrams);
			const grams = Number.isFinite(g) && g > 0 ? g : 0;
			parts.push(grams > 0 ? `${name} (${grams} g)` : name);
		}
		if (parts.length) return parts.join("\n");
	}
	return legacy;
}

/**
 * True if recipe has catalog lines (even when not populated for table — e.g. card badge).
 * @param {Record<string, unknown> | null | undefined} recipe
 */
export function hasIngredientLineItems(recipe) {
	const lines = recipe?.ingredientLineItems;
	return Array.isArray(lines) && lines.length > 0;
}
