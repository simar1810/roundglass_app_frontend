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

const fields = {
  stage1: ["title", "description", "file"]
}

export function stage1Completed(state) {
  for (const field of fields.stage1) {
    if (!state[field]) return { success: false, field };
  }
  return { success: true }
}