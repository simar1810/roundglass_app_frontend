export function idealWeightReducer(state, action) {
  switch (action.type) {
    case "CHANGE_GENDER":
      return {
        ...state,
        gender: action.payload
      }

    default:
      return state;
  }
}

export function changeGender(gender) {
  return {
    type: "CHANGE_GENDER",
    payload: gender
  }
}