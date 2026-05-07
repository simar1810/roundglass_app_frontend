"use client";
export const mapFeatureCategories = function (categories) {
  return categories?.reduce((acc, curr) => {
    if (curr.level === "category") {
      return [
        [...acc[0], curr.name],
        acc[1]
      ]
    }
    if (curr.level === "sub-category") {
      return [
        acc[0],
        [...acc[1], curr.name]
      ]
    }
    return acc
  }, [[], []])
}