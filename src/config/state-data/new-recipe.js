export const newRecipeInitialState = {
  // Recipe basics
  title: "",
  ingredients: "",
  method: "",

  // Legacy calories fields
  proteins: "",
  carbs: "",
  fats: "",
  fibers: "",
  total: "",

  // Image/file fields
  file: null,
  image: "",

  // For edit flow
  _id: "",

  // Ingredient-to-recipe fields
  // mode: \"legacy\" (manual ingredients/calories) or \"lineItems\" (ingredient line items)
  // Default to Option B (ingredientLineItems) to match backend validation.
  mode: "lineItems",
  // When in lineItems mode, frontend will build ingredientLineItems payload from this
  lineItems: [],
}