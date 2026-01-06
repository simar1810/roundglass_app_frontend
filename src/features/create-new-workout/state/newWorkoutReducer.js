export default function newWorkoutReducer(state, action) {
  switch (action.type) {
    case "UPDATE_META":
      return {
        ...state,
        meta: action.payload,
      };
    case "SAVE_EXERCISE":
      return {
        ...state,
        exercises: {
          ...state.exercises,
          [action.payload.day]: action.payload.exercises
        }
      };
    default:
      return state
  }
}

