import { mutate } from "swr";

/**
 * Revalidates SWR caches that list or search coach recipes (meal library, meal-plan picker, etc.).
 */
export function revalidateRecipeListCaches() {
	return mutate(
		(key) =>
			key === "getRecipes" ||
			key === "coach-recipes" ||
			key === "popular-meals" ||
			(typeof key === "string" && key.startsWith("recipees/")),
	);
}

/**
 * User-facing message from add/edit recipe API JSON (validation, line items, conflicts).
 * @param {unknown} response Parsed body from `sendDataWithFormData` / `parseApiResponse`
 */
export function getRecipeMutationErrorMessage(response) {
	if (!response || typeof response !== "object") return "Could not save meal.";
	if (response.success === false && response.message != null) {
		return String(response.message).trim() || "Could not save meal.";
	}
	const m = response.message;
	if (m != null && String(m).trim()) return String(m);
	const e = response.error;
	if (typeof e === "string" && e.trim()) return e;
	if (e && typeof e === "object" && e.message != null) return String(e.message);
	return "Could not save meal.";
}
