import { newRecipeInitialState } from "../state-data/new-recipe";

const OBJECT_ID_HEX = /^[a-f\d]{24}$/i;
const MACRO_FIELD_NAMES = ["total", "proteins", "carbs", "fats", "fibers"];

function safeText(value) {
  return value == null ? "" : String(value);
}

function normalizeQuantity(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return num;
}

function extractIngredientIdFromLine(line) {
  if (!line || typeof line !== "object") return "";
  if (line.ingredientId != null && String(line.ingredientId).trim()) {
    return String(line.ingredientId).trim();
  }
  const ing = line.ingredient;
  if (typeof ing === "string" && ing.trim()) return ing.trim();
  if (ing && typeof ing === "object") {
    const id = ing._id ?? ing.$oid ?? ing.id;
    if (id != null && String(id).trim()) return String(id).trim();
  }
  return "";
}

function extractDishIdFromLine(line) {
  if (!line || typeof line !== "object") return "";
  if (line.dishId != null && String(line.dishId).trim()) {
    return String(line.dishId).trim();
  }
  const dish = line.dish;
  if (typeof dish === "string" && dish.trim()) return dish.trim();
  if (dish && typeof dish === "object") {
    const id = dish._id ?? dish.$oid ?? dish.id;
    if (id != null && String(id).trim()) return String(id).trim();
  }
  return "";
}

/** @param {Record<string, unknown> | undefined} recipe */
export function normalizeIngredientLineItemsFromRecipe(recipe) {
  const raw = recipe?.ingredientLineItems;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((line) => {
      const ing = line?.ingredient;
      const ingredientId = extractIngredientIdFromLine(line);
      const foodName =
        typeof ing === "object" && ing !== null && ing.foodName
          ? String(ing.foodName)
          : line?.foodName
            ? String(line.foodName)
            : "";
      const foodCode =
        typeof ing === "object" && ing !== null && ing.foodCode != null
          ? String(ing.foodCode)
          : line?.foodCode != null
            ? String(line.foodCode)
            : "";
      const quantityGrams = Number(line?.quantityGrams);
      return {
        ingredientId: safeText(ingredientId).trim(),
        quantityGrams: normalizeQuantity(quantityGrams),
        ...(foodName ? { foodName } : {}),
        ...(foodCode ? { foodCode } : {}),
      };
    })
    .filter((row) => row.ingredientId && OBJECT_ID_HEX.test(row.ingredientId));
}

/** @param {Record<string, unknown> | undefined} recipe */
export function normalizeMealLineItemsFromRecipe(recipe) {
  const raw = recipe?.mealLineItems;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((line) => {
      const dish = line?.dish;
      const dishId = extractDishIdFromLine(line);
      const dishName =
        typeof dish === "object" && dish !== null && dish.dish_name
          ? String(dish.dish_name)
          : line?.dishName
            ? String(line.dishName)
            : "";
      const quantityGrams = Number(line?.quantityGrams);
      return {
        dishId: safeText(dishId).trim(),
        quantityGrams: normalizeQuantity(quantityGrams),
        ...(dishName ? { dishName } : {}),
      };
    })
    .filter((row) => row.dishId && OBJECT_ID_HEX.test(row.dishId));
}

export function newRecipeeReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }

    default:
      return state;
  }
}

export function changeFieldvalue(name, value) {
  return {
    type: "CHANGE_FIELD_VALUE",
    payload: {
      name,
      value
    }
  }
}

/** Catalog line items (ingredients and/or meals) ⇒ server computes macros. */
export function isLineItemMode(state) {
  const hasIngredients =
    Array.isArray(state.ingredientLineItems) && state.ingredientLineItems.length > 0;
  const hasMeals =
    Array.isArray(state.mealLineItems) && state.mealLineItems.length > 0;
  return hasIngredients || hasMeals;
}

/**
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateRecipeForm(state) {
  if (!String(state.title || "").trim()) {
    return { ok: false, message: "Meal name is required." };
  }

  if (isLineItemMode(state)) {
    for (const row of state.ingredientLineItems || []) {
      const id = safeText(row?.ingredientId).trim();
      if (!OBJECT_ID_HEX.test(id)) {
        return {
          ok: false,
          message: "Each ingredient row must use a valid catalog ingredient.",
        };
      }
      const g = Number(row?.quantityGrams);
      if (!Number.isFinite(g) || g <= 0) {
        return {
          ok: false,
          message: "Each ingredient needs a quantity greater than 0 g.",
        };
      }
    }
    for (const row of state.mealLineItems || []) {
      const id = safeText(row?.dishId).trim();
      if (!OBJECT_ID_HEX.test(id)) {
        return {
          ok: false,
          message: "Each meal row must use a valid meal from the database.",
        };
      }
      const g = Number(row?.quantityGrams);
      if (!Number.isFinite(g) || g <= 0) {
        return {
          ok: false,
          message: "Each meal needs a quantity greater than 0 g.",
        };
      }
    }
    if (
      !(state.ingredientLineItems?.length > 0) &&
      !(state.mealLineItems?.length > 0)
    ) {
      return {
        ok: false,
        message: "Add at least one ingredient or meal from the database.",
      };
    }
    return { ok: true };
  }

  if (!String(state.ingredients || "").trim()) {
    // optional free-text when manual macros provided
  }
  for (const name of MACRO_FIELD_NAMES) {
    const v = state[name];
    if (v === "" || v === null || v === undefined) {
      return { ok: false, message: "All nutrition fields are required." };
    }
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, message: "Enter valid numbers for nutrition." };
    }
  }
  return { ok: true };
}

export function generateRequestPayload(state) {
  const payload = new FormData();
  const lineMode = isLineItemMode(state);

  for (const field in state) {
    const value = state[field];

    if (field === "file") {
      if (value instanceof File) {
        payload.append(field, value);
      }
      continue;
    }

    if (field === "ingredientLineItems") {
      if (lineMode) {
        const lines = (Array.isArray(value) ? value : [])
          .map((row) => ({
            ingredientId: safeText(row?.ingredientId).trim(),
            quantityGrams: normalizeQuantity(row?.quantityGrams),
          }))
          .filter(
            (row) =>
              OBJECT_ID_HEX.test(row.ingredientId) && Number(row.quantityGrams) > 0,
          );
        payload.append("ingredientLineItems", JSON.stringify(lines));
      }
      continue;
    }

    if (field === "mealLineItems") {
      if (lineMode) {
        const lines = (Array.isArray(value) ? value : [])
          .map((row) => ({
            dishId: safeText(row?.dishId).trim(),
            quantityGrams: normalizeQuantity(row?.quantityGrams),
          }))
          .filter(
            (row) => OBJECT_ID_HEX.test(row.dishId) && Number(row.quantityGrams) > 0,
          );
        payload.append("mealLineItems", JSON.stringify(lines));
      }
      continue;
    }

    if (lineMode) {
      if (MACRO_FIELD_NAMES.includes(field)) {
        continue;
      }
      if (
        field === "ingredients" &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        continue;
      }
    }

    if (value === null || value === undefined) {
      payload.append(field, "");
      continue;
    }

    if (typeof value === "object" && !(value instanceof File)) {
      payload.append(field, JSON.stringify(value));
      continue;
    }

    payload.append(field, value);
  }

  return payload;
}

export function init(type, recipe) {
  if (type === "new") {
    return { ...newRecipeInitialState, ingredientLineItems: [], mealLineItems: [] };
  }
  const source = recipe && typeof recipe === "object" ? recipe : {};
  const payload = {}
  for (const field of ["title", "ingredients", "method"]) {
    payload[field] = safeText(source[field])
  }
  const calories = source.calories && typeof source.calories === "object" ? source.calories : {};
  for (const field of MACRO_FIELD_NAMES) {
    payload[field] = calories[field] ?? "";
  }
  payload.image = safeText(source.image);
  payload._id = safeText(source._id);
  payload.category = safeText(source.category);
  payload.subCategory = safeText(source.subCategory);
  payload.defaultMeasure = source?.default_measure?.grams ?? 0;
  payload.ingredientLineItems = normalizeIngredientLineItemsFromRecipe(source);
  payload.mealLineItems = normalizeMealLineItemsFromRecipe(source);
  payload.file = null;
  return payload
}
