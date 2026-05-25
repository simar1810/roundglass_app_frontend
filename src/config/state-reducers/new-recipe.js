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

/** @param {Record<string, unknown> | undefined} recipe */
export function normalizeIngredientLineItemsFromRecipe(recipe) {
  const raw = recipe?.ingredientLineItems;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((line) => {
      const ing = line?.ingredient;
      let ingredientId = "";
      if (typeof ing === "object" && ing !== null && ing._id != null) {
        ingredientId = String(ing._id);
      } else if (line?.ingredientId != null) {
        ingredientId = String(line.ingredientId);
      } else if (typeof line?.ingredient === "string") {
        ingredientId = line.ingredient;
      }
      const foodName =
        typeof ing === "object" && ing !== null && ing.foodName
          ? ing.foodName
          : line?.foodName || "";
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
    .filter((row) => row.ingredientId);
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

/** Non-empty `ingredientLineItems` ⇒ Mode A (catalog line items). */
export function isLineItemMode(state) {
  return Array.isArray(state.ingredientLineItems) && state.ingredientLineItems.length > 0;
}

/**
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateRecipeForm(state) {
  if (!String(state.title || "").trim()) {
    return { ok: false, message: "Meal name is required." };
  }

  if (isLineItemMode(state)) {
    for (const row of state.ingredientLineItems) {
      const id = safeText(row?.ingredientId).trim();
      if (!OBJECT_ID_HEX.test(id)) {
        return {
          ok: false,
          message: "Each row must use a catalog ingredient (valid id).",
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
    return { ok: true };
  }

  if (!String(state.ingredients || "").trim()) {
    // return { ok: false, message: "Ingredients are required." };
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
        const rawRows = Array.isArray(value) ? value : [];
        const lines = rawRows
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
    return { ...newRecipeInitialState, ingredientLineItems: [] };
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
  payload.file = null;
  return payload
}
