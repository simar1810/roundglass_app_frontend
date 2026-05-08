import { newRecipeInitialState } from "../state-data/new-recipe";

export function newRecipeeReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }

    case "SET_LINE_ITEMS":
      return {
        ...state,
        lineItems: Array.isArray(action.payload) ? action.payload : [],
      }

    case "SET_MODE":
      return {
        ...state,
        mode: action.payload === "lineItems" ? "lineItems" : "legacy",
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

export function setLineItems(items) {
  return {
    type: "SET_LINE_ITEMS",
    payload: items,
  }
}

export function setMode(mode) {
  return {
    type: "SET_MODE",
    payload: mode,
  }
}

export function generateRequestPayload(state) {
  const formData = new FormData();
  const isLineItemsMode = state.mode === "lineItems" && Array.isArray(state.lineItems) && state.lineItems.length > 0;
  const toIngredientId = (item) => {
    const raw = item?.ingredientId ?? item?.ingredient;
    if (!raw) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "object") {
      if (typeof raw._id === "string") return raw._id;
      if (typeof raw.$oid === "string") return raw.$oid;
      if (raw._id && typeof raw._id === "object" && typeof raw._id.$oid === "string") return raw._id.$oid;
    }
    return "";
  };

  // Always send basic fields
  if (state.title) formData.append("title", state.title);
  if (state.method) formData.append("method", state.method);
  if (state.image) formData.append("image", state.image);
  if (state._id) formData.append("_id", state._id);

  if (state.file) {
    formData.append("file", state.file);
  }

  if (isLineItemsMode) {
    const ingredientLineItems = state.lineItems
      .map((item) => ({
        ingredientId: toIngredientId(item),
        quantityGrams: Number(item?.quantityGrams),
      }))
      .filter((item) => item.ingredientId && Number.isFinite(item.quantityGrams) && item.quantityGrams > 0)
      .map(item => ({
        ingredientId: item.ingredientId,
        quantityGrams: item.quantityGrams,
      }));

    if (ingredientLineItems.length > 0) {
      formData.append("ingredientLineItems", JSON.stringify(ingredientLineItems));
    }

    // In lineItems mode, we deliberately skip manual ingredients/calories
    // Backend will compute ingredients/description/calories from line items
  } else {
    // Legacy mode – maintain existing behaviour
    const legacyFields = ["ingredients", "proteins", "carbs", "fats", "fibers", "total"];
    for (const field of legacyFields) {
      if (state[field] !== undefined && state[field] !== null && state[field] !== "") {
        formData.append(field, state[field]);
      }
    }
  }

  return formData;
}

export function init(type, recipe) {
  if (type === "new") return newRecipeInitialState;

  const payload = {
    ...newRecipeInitialState,
  };

  for (const field of ["title", "ingredients", "method"]) {
    payload[field] = recipe[field];
  }

  for (const field of ["proteins", "carbs", "fats", "fibers", "total"]) {
    payload[field] = recipe?.calories?.[field];
  }

  payload.image = recipe.image;
  payload._id = recipe._id;

  if (Array.isArray(recipe.ingredientLineItems) && recipe.ingredientLineItems.length > 0) {
    payload.mode = "lineItems";
    payload.lineItems = recipe.ingredientLineItems.map((item) => ({
      ingredientId: item.ingredient?._id || item.ingredient,
      quantityGrams: item.quantityGrams,
      ...(item.ingredient && typeof item.ingredient === "object" && { ingredient: item.ingredient }),
    }));
  } else {
    payload.mode = "legacy";
    payload.lineItems = [];
  }

  return payload;
}