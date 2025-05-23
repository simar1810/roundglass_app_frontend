export function workoutReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD":
      return { ...state, [action.payload.name]: action.payload.value };
    default:
      return state;
  }
}

export function changeFieldValue(name, value) {
  return {
    type: "CHANGE_FIELD",
    payload: { name, value }
  }
}

export function generateRequestPayload(state) {
  const formData = new FormData();
  for (const field of ["title", "thumbnail", "instructions"]) {
    if (state[field]) {
      formData.append(field, state[field]);
    }
  }
  for (const workout of state.workouts) {
    formData.append("workouts", workout);
  }
  return formData;
}