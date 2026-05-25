export function calorieCounterReducer(state, action) {
  switch (action.type) {
    case "UPDATE_SEARCH_QUERY":
      return {
        ...state,
        query: action.payload
      }

    case "UPDATE_SELECTED_RECIPES": {
      // Prevent adding invalid IDs (null, undefined, empty string)
      if (!action.payload || action.payload === "" || action.payload === null || action.payload === undefined) {
        return state;
      }
      
      const isSelected = state.selected.includes(action.payload);
      let selected;
      let quantities = { ...state.quantities };
      let selectedMeasures = { ...state.selectedMeasures };

      if (isSelected) {
        selected = state.selected.filter(id => id !== action.payload);
        delete quantities[action.payload];
        delete selectedMeasures[action.payload];
      } else {
        selected = [...state.selected, action.payload];
        quantities[action.payload] = 1;
      }

      return {
        ...state,
        selected,
        quantities,
        selectedMeasures
      }
    }

    case "INCREASE_QUANTITY": {
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload]: (state.quantities[action.payload] || 1) + 1
        }
      }
    }

    case "DECREASE_QUANTITY": {
      const currentQty = state.quantities[action.payload] || 1;
      if (currentQty <= 1) return state;
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [action.payload]: currentQty - 1
        }
      }
    }

    case "UPDATE_VIEW":
      if (state.selected.length <= 0) return state;
      return {
        ...state,
        view: action.payload
      }

    case "UPDATE_CALORIE_RESULT":
      return {
        ...state,
        dishesData: action.payload,
        view: 2
      }

    case "UPDATE_MEASURE": {
      return {
        ...state,
        selectedMeasures: {
          ...state.selectedMeasures,
          [action.payload.recipeId]: action.payload.measure
        }
      }
    }

    default:
      return state;
  }
}

export function changeSearchQuery(value) {
  return {
    type: "UPDATE_SEARCH_QUERY",
    payload: value
  }
}

export function toggleRecipe(recipeId) {
  return {
    type: "UPDATE_SELECTED_RECIPES",
    payload: recipeId
  }
}

export function setView(view) {
  return {
    type: "UPDATE_VIEW",
    payload: view
  }
}

export function setCalorieResult(dishesData) {
  return {
    type: "UPDATE_CALORIE_RESULT",
    payload: dishesData
  }
}

export function increaseQuantity(recipeId) {
  return {
    type: "INCREASE_QUANTITY",
    payload: recipeId
  }
}

export function decreaseQuantity(recipeId) {
  return {
    type: "DECREASE_QUANTITY",
    payload: recipeId
  }
}

export function updateMeasure(recipeId, measure) {
  return {
    type: "UPDATE_MEASURE",
    payload: { recipeId, measure }
  }
}