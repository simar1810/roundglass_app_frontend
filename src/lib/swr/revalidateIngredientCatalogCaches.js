import { mutate } from "swr";

export const INGREDIENTS_CATALOG_KEY = "ingredients-catalog";
export const INGREDIENTS_ADMIN_KEY = "ingredients-admin";

export function isIngredientCatalogKey(key) {
	if (typeof key === "string") {
		return (
			key.startsWith("ingredients-admin|") ||
			key.startsWith(`${INGREDIENTS_CATALOG_KEY}|`)
		);
	}
	if (Array.isArray(key) && key.length > 0) {
		return (
			key[0] === INGREDIENTS_CATALOG_KEY || key[0] === INGREDIENTS_ADMIN_KEY
		);
	}
	return false;
}

export function revalidateIngredientCatalogCaches() {
	return mutate((key) => isIngredientCatalogKey(key));
}
