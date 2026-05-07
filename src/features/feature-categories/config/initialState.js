import { featuresList, initialActiveCategory } from "."

export const buildFeatureCategoryInitialState = function ({ feature, mutate, categories }) {
  if (!Object.keys(featuresList).includes(feature)) throw new Error(
    `${feature} should be either of ${Object.keys(featuresList).join(", ")}`
  )
  return {
    meta: featuresList[feature],
    state: {
      isAdding: false,
      status: "loading", // loading, data-listed
    },
    categories,
    activeCategory: null,
    mutate
  }
}