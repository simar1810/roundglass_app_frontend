export function addMealPlanReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    case "SET_CURRENT_STAGE":
      return {
        ...state,
        stage: action.payload
      }
    case "ADD_MEAL_TYPE":
      return {
        ...state,
        meals: [
          ...state.meals,
          {
            mealType: action.payload,
            meals: []
          },
        ],
        selectedMealType: state.meals.length === 0 ? action.payload : state.selectedMealType
      }
    case "ADD_NEW_RECIPE":
      return {
        ...state,
        meals: state.meals.map(item => item.mealType === state.selectedMealType
          ? { ...item, meals: [...item.meals, action.payload] }
          : item
        )
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

export function setCurrentStage(payload) {
  return {
    type: "SET_CURRENT_STAGE",
    payload
  }
}

export function addMealType(payload) {
  return {
    type: "ADD_MEAL_TYPE",
    payload
  }
}

export function addNewRecipe(payload) {
  return {
    type: "ADD_NEW_RECIPE",
    payload
  }
}

const fields = {
  stage1: ["title", "description", "file"]
}

export function stage1Completed(state) {
  for (const field of fields.stage1) {
    if (!state[field]) return { success: false, field };
  }
  return { success: true }
}