import { initialActiveCategory } from ".";

export const featureCategoriesReducer = function (state, action) {
  switch (action.type) {
    case "EDIT_CATEGORY":
      return {
        ...state,
        activeCategory: {
          name: action.payload.name,
          level: action.payload.level,
          categoryId: action.payload._id,
        }
      }
    case "OPEN_FORM":
      return {
        ...state,
        state: {
          ...state.state,
          isAdding: true,
        }
      }
    case "CLOSE_FORM":
      return {
        ...state,
        state: {
          ...state.state,
          isAdding: false,
        },
        activeCategory: null
      }
    default:
      return state;
  }
}