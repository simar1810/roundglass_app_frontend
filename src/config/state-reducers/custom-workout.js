import { format, parse } from "date-fns";
import { customWorkoutInitialState } from "../state-data/custom-workout";

export function customWorkoutReducer(state, action) {
  switch (action.type) {
    case "SELECT_WORKOUT_TYPE":
      return {
        ...state,
        mode: action.payload,
        stage: 2
      }
    case "CUSTOM_WORKOUT_UPDATE_FIELD":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    case "CHANGE_WORKOUT_PLAN":
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.payload.day]: action.payload.plan._id
        },
        selectedPlans: {
          ...state.selectedPlans,
          [action.payload.day]: action.payload.plan
        }
      }
    case "REMOVE_WORKOUT_TO_PLAN":
      delete state.plans[action.payload]
      delete state.selectedPlans[action.payload]
      return {
        ...state
      };

    default:
      return state;
  }
}

export function selectWorkoutType(payload) {
  return {
    type: "SELECT_WORKOUT_TYPE",
    payload
  }
}

export function customWorkoutUpdateField(name, value) {
  return {
    type: "CUSTOM_WORKOUT_UPDATE_FIELD",
    payload: {
      name,
      value
    }
  }
}

export function changeWorkoutPlans(day, plan) {
  return {
    type: "CHANGE_WORKOUT_PLAN",
    payload: {
      day,
      plan
    }
  }
}

export function removeWorkoutFromPlans(payload) {
  return {
    type: "REMOVE_WORKOUT_TO_PLAN",
    payload
  }
}

export function customWorkoutIS(type, state) {
  if (type === "new") {
    return customWorkoutInitialState;
  } else {
    return {
      ...customWorkoutInitialState
    }
  }
}

export function dailyWorkoutRP(state) {
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: state.plans
  }
}

export function weeklyWorkoutRP(state) {
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: state.plans
  }
}

export function monthlyWorkoutRP(state) {
  const payload = {}
  for (const day in state.plans) {
    const ddMMyyyy = format(parse(day, "yyyy-MM-dd", new Date()), "dd-MM-yyyy")
    payload[ddMMyyyy] = state.selectedPlans[day]._id
  }
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: payload
  }
}