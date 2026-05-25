/** @typedef {{ ingredientId: string, quantityGrams: number, foodName?: string, foodCode?: string }} RecipeIngredientLineRow */

export const newRecipeInitialState = {
  title: "",
  proteins: "",
  carbs: "",
  fats: "",
  fibers: "",
  total: "",
  ingredients: "",
  method: "",
  file: null,
  category: "",
  subCategory: "",
  defaultMeasure: "",

  /** Mode A when non-empty: server computes macros + ingredients text from catalog lines. */
  ingredientLineItems: /** @type {RecipeIngredientLineRow[]} */ ([]),

  image: "",
  _id: ""
}