/**
 * Maps API responses to user-facing error messages for ingredient and recipe flows.
 * Use for 400, 404, 409; 401 is handled by the existing api layer (redirect/login).
 *
 * @param {{ success?: boolean, status_code?: number, message?: string }} response - API response body
 * @param {string} context - One of: "ingredient_create" | "ingredient_update" | "ingredient_delete" | "recipe_add" | "recipe_edit" | "recipe_get" | "ingredient_get"
 * @returns {string} Message to show (e.g. in toast.error)
 */
export function getIngredientRecipeErrorMessage(response, context) {
  if (!response || response.success) return "";

  const code = response.status_code;
  const backendMessage = response.message || "";

  switch (code) {
    case 400:
      // Show backend message (e.g. validation, "ingredientLineItems: could not resolve...")
      return backendMessage.trim() || "Invalid request.";
    case 404:
      if (context === "ingredient_get" || context === "ingredient_update") return "Ingredient not found.";
      if (context === "recipe_get" || context === "recipe_edit") return "Recipe not found.";
      return backendMessage.trim() || "Not found.";
    case 409:
      if (context === "ingredient_delete") return "Cannot delete ingredient: it is used in one or more recipes.";
      if (context === "ingredient_create" || context === "ingredient_update") return "An ingredient with this foodCode already exists.";
      return backendMessage.trim() || "Conflict.";
    default:
      return backendMessage.trim() || "Something went wrong.";
  }
}
