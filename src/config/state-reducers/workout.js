import { workoutInitialState } from "../state-data/workout";

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

export function init(state) {
  if (Boolean(state)) {
    const data = {
      title: state.title,
      instructions: state.instructions,
      thumbnail: state.thumbnail,
      workouts: state.workouts.map(workout => workout._id),
      id: state._id,
      type: "update"
    }
    return data;
  }
  return workoutInitialState;
}

export function generateRequestPayload(state, thumbnail) {
  const formData = {}
  for (const field of ["title", "instructions", "workouts"]) {
    if (state[field]) {
      formData[field] = state[field];
    }
  }
  if (state.type === "update") {
    formData.id = state.id
  }
  formData.thumbnail = thumbnail;
  return formData;
}