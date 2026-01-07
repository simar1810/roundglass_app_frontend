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
    case "ADD_NEW_DAY":
      return {
        ...state,
        exercises: {
          ...state.exercises,
          [action.payload]: []
        }
      };
    case "REMOVE_DAY":
      const { [action.payload]: _, ...rest } = state.exercises;
      return {
        ...state,
        exercises: rest
      };
    default:
      return state
  }
}

