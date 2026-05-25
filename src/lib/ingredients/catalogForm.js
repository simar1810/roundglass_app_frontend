import { parseMeasurementWithUncertainty } from "../formatter";

const NUTRITION_FIELDS = [
	"moisture",
	"protein",
	"ash",
	"totalFat",
	"carbohydrate",
	"energyKJ",
];

export function emptyIngredientForm() {
	return {
		foodCode: "",
		foodName: "",
		category: "",
		moisture: "",
		protein: "",
		ash: "",
		totalFat: "",
		carbohydrate: "",
		energyKJ: "",
		fiberTotal: "",
		noOfRegions: "",
	};
}

export function ingredientToFormValues(ingredient) {
	if (!ingredient || typeof ingredient !== "object") {
		return emptyIngredientForm();
	}
	const fibre = ingredient.dietaryFibre;
	const fiberTotal =
		fibre && typeof fibre === "object" && fibre.total != null
			? parseMeasurementWithUncertainty(fibre.total)?.number
			: "";
	return {
		foodCode: ingredient.foodCode != null ? String(ingredient.foodCode) : "",
		foodName: ingredient.foodName != null ? String(ingredient.foodName) : "",
		category: ingredient.category != null ? String(ingredient.category) : "",
		moisture: ingredient.moisture != null ? parseMeasurementWithUncertainty(ingredient.moisture)?.number : "",
		ash: ingredient.ash != null ? parseMeasurementWithUncertainty(ingredient.ash)?.number : "",
		totalFat: ingredient.totalFat != null ? parseMeasurementWithUncertainty(ingredient.totalFat)?.number : "",
		protein: ingredient.protein != null ? parseMeasurementWithUncertainty(ingredient.protein)?.number : "",
		carbohydrate:
			ingredient.carbohydrate != null ? parseMeasurementWithUncertainty(ingredient.carbohydrate)?.number : "",
		energyKJ: ingredient.energyKJ != null ? parseMeasurementWithUncertainty(ingredient.energyKJ)?.number : "",
		fiberTotal,
		noOfRegions:
			ingredient.noOfRegions != null ? String(ingredient.noOfRegions) : "",
	};
}

export function parseIngredientNumber(rawValue) {
	if (rawValue === "" || rawValue == null) return undefined;
	const parsed = parseFloat(String(rawValue));
	return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildIngredientMutationBody(form) {
	const body = {
		foodCode: String(form.foodCode || "").trim(),
		foodName: String(form.foodName || "").trim(),
	};
	const category = String(form.category || "").trim();
	if (category) body.category = category;
	const noOfRegions = parseIngredientNumber(form.noOfRegions);
	if (noOfRegions !== undefined) body.noOfRegions = noOfRegions;

	for (const key of NUTRITION_FIELDS) {
		const parsed = parseIngredientNumber(form[key]);
		if (parsed !== undefined) body[key] = parsed;
	}
	const fiberTotal = parseIngredientNumber(form.fiberTotal);
	if (fiberTotal !== undefined) {
		body.dietaryFibre = { total: fiberTotal };
	}
	return body;
}

export function hasAtLeastOneNutritionValue(form) {
	if (parseIngredientNumber(form.fiberTotal) !== undefined) return true;
	return NUTRITION_FIELDS.some(
		(field) => parseIngredientNumber(form[field]) !== undefined,
	);
}
