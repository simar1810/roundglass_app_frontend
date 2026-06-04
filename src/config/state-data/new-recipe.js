/** @typedef {{ ingredientId: string, quantityGrams: number, foodName?: string, foodCode?: string }} RecipeIngredientLineRow */
/** @typedef {{ dishId: string, quantityGrams: number, dishName?: string }} RecipeMealLineRow */

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

  /** Catalog ingredients (per 100g nutrition DB). */
  ingredientLineItems: /** @type {RecipeIngredientLineRow[]} */ ([]),

  /** Meals/dishes from meal database (per 100g in catalog). */
  mealLineItems: /** @type {RecipeMealLineRow[]} */ ([]),

  image: "",
  _id: ""
}
