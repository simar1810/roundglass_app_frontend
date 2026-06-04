/** kJ → kcal (nutrition labels) */
const KJ_TO_KCAL = 0.239006;

function toNum(value) {
	const n = parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}

export function shouldShowIngredientLineTable(recipe) {
	return getCompositionTableRows(recipe).length > 0;
}

function ingredientKcalPer100g(ing) {
	const kj = Number(ing?.energyKJ);
	if (Number.isFinite(kj) && kj > 0) return kj * KJ_TO_KCAL;
	const protein = Number(ing?.protein) || 0;
	const carbs = Number(ing?.carbohydrate) || 0;
	const fat = Number(ing?.totalFat) || 0;
	return protein * 4 + carbs * 4 + fat * 9;
}

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
	const kcal = ingredientKcalPer100g(ing) * factor;
	return { protein, carbs, fat, fiber, kcal };
}

export function scaledPortionFromDishPer100g(dish, quantityGrams) {
	const q = Number(quantityGrams);
	const factor = Number.isFinite(q) && q > 0 ? q / 100 : 0;
	return {
		protein: toNum(dish.protein) * factor,
		carbs: toNum(dish.carbohydrates) * factor,
		fat: toNum(dish.fats) * factor,
		fiber: toNum(dish.dietary_fibre) * factor,
		kcal: toNum(dish.calories) * factor,
	};
}

/**
 * @returns {Array<{ kind: string, name: string, code: string, grams: number, kcal: number | null, protein: number | null }>}
 */
export function getCompositionTableRows(recipe) {
	if (!recipe || typeof recipe !== "object") return [];
	const rows = [];

	for (const line of recipe.ingredientLineItems || []) {
		const ing = line?.ingredient;
		if (!ing || typeof ing !== "object") continue;
		const grams = Number(line.quantityGrams);
		const g = Number.isFinite(grams) ? grams : 0;
		const { kcal, protein } = scaledPortionFromPer100g(ing, g);
		rows.push({
			kind: "Ingredient",
			name: String(ing.foodName || "—"),
			code:
				ing.foodCode != null && ing.foodCode !== ""
					? String(ing.foodCode)
					: "—",
			grams: g,
			kcal: Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : null,
			protein:
				Number.isFinite(protein) && protein > 0
					? Math.round(protein * 10) / 10
					: null,
		});
	}

	for (const line of recipe.mealLineItems || []) {
		const dish = line?.dish;
		if (!dish || typeof dish !== "object") continue;
		const grams = Number(line.quantityGrams);
		const g = Number.isFinite(grams) ? grams : 0;
		const { kcal, protein } = scaledPortionFromDishPer100g(dish, g);
		rows.push({
			kind: "Meal",
			name: String(dish.dish_name || "—"),
			code: "—",
			grams: g,
			kcal: Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : null,
			protein:
				Number.isFinite(protein) && protein > 0
					? Math.round(protein * 10) / 10
					: null,
		});
	}

	return rows;
}

export function getIngredientLineTableRows(recipe) {
	return getCompositionTableRows(recipe);
}

export function getRecipeIngredientsDisplayText(recipeLike) {
	if (!recipeLike || typeof recipeLike !== "object") return "";
	const rows = getCompositionTableRows(recipeLike);
	if (rows.length > 0) {
		return rows
			.map((row) =>
				row.grams > 0 ? `${row.name} (${row.grams} g)` : row.name
			)
			.join("\n");
	}
	return String(recipeLike.ingredients ?? "").trim();
}

export function hasIngredientLineItems(recipe) {
	const ing = recipe?.ingredientLineItems;
	const meals = recipe?.mealLineItems;
	return (
		(Array.isArray(ing) && ing.length > 0) ||
		(Array.isArray(meals) && meals.length > 0)
	);
}

/**
 * Merge form state (grams + ids) with populated recipe refs for live totals in edit modal.
 */
export function buildRecipeForCompositionTotals(populatedRecipe, state) {
	if (!populatedRecipe || !state) return populatedRecipe;

	const ingredientLineItems = (state.ingredientLineItems || [])
		.map((row) => {
			const pop = (populatedRecipe.ingredientLineItems || []).find(
				(line) => String(line?.ingredient?._id) === String(row.ingredientId),
			);
			if (!pop?.ingredient) return null;
			return {
				quantityGrams: row.quantityGrams,
				ingredient: pop.ingredient,
			};
		})
		.filter(Boolean);

	const mealLineItems = (state.mealLineItems || [])
		.map((row) => {
			const pop = (populatedRecipe.mealLineItems || []).find(
				(line) => String(line?.dish?._id) === String(row.dishId),
			);
			if (!pop?.dish) return null;
			return {
				quantityGrams: row.quantityGrams,
				dish: pop.dish,
			};
		})
		.filter(Boolean);

	return { ingredientLineItems, mealLineItems };
}

/** Sum macros from populated composition lines (matches save-time logic). */
export function computeCompositionTotalsFromRecipe(recipe) {
	const totals = { total: 0, proteins: 0, carbs: 0, fats: 0, fibers: 0 };

	for (const line of recipe?.ingredientLineItems || []) {
		const ing = line?.ingredient;
		if (!ing || typeof ing !== "object") continue;
		const g = Number(line.quantityGrams);
		if (!Number.isFinite(g) || g <= 0) continue;
		const scaled = scaledPortionFromPer100g(ing, g);
		totals.proteins += scaled.protein;
		totals.carbs += scaled.carbs;
		totals.fats += scaled.fat;
		totals.fibers += scaled.fiber;
		totals.total += scaled.kcal;
	}

	for (const line of recipe?.mealLineItems || []) {
		const dish = line?.dish;
		if (!dish || typeof dish !== "object") continue;
		const g = Number(line.quantityGrams);
		if (!Number.isFinite(g) || g <= 0) continue;
		const scaled = scaledPortionFromDishPer100g(dish, g);
		totals.proteins += scaled.protein;
		totals.carbs += scaled.carbs;
		totals.fats += scaled.fat;
		totals.fibers += scaled.fiber;
		totals.total += scaled.kcal;
	}

	const round1 = (n) => Math.round(n * 10) / 10;
	return {
		total: Math.round(totals.total),
		proteins: round1(totals.proteins),
		carbs: round1(totals.carbs),
		fats: round1(totals.fats),
		fibers: round1(totals.fibers),
	};
}
