import { getRecipeMutationErrorMessage } from "@/lib/swr/revalidateRecipeCaches";

const DEFAULT_DELETE_CONFLICT_MESSAGE =
	"This ingredient is used in a recipe and cannot be deleted.";

export function getIngredientMutationErrorMessage(response, operation) {
	if (response instanceof Error) {
		return response.message || `${operation} failed.`;
	}
	if (!response || typeof response !== "object") {
		return `${operation} failed.`;
	}
	if (response.status_code === 200) return "";
	if (operation === "Delete" && response.status_code === 409) {
		return response.message || DEFAULT_DELETE_CONFLICT_MESSAGE;
	}
	return getRecipeMutationErrorMessage(response) || `${operation} failed.`;
}

export function getIngredientMutationSuccessMessage(response, operation) {
	if (response && typeof response === "object" && response.message) {
		return String(response.message);
	}
	if (operation === "Create") return "Ingredient created.";
	if (operation === "Update") return "Ingredient updated.";
	return "Ingredient deleted.";
}
