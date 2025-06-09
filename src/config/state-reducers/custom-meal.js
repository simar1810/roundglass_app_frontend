import { format, parse } from "date-fns";
import { customMealInitialState } from "../state-data/custom-meal";

export function customMealReducer(state, action) {
  switch (action.type) {
    case "SELECT_MEAL_TYPE":
      return {
        ...state,
        mode: action.payload,
        stage: 2
      }
    case "CUSTOM_MEAL_UPDATE_FIELD":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    case "CHANGE_MEAL_PLAN":
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
    case "REMOVE_MEAL_TO_PLAN":
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
    type: "SELECT_MEAL_TYPE",
    payload
  }
}

export function customWorkoutUpdateField(name, value) {
  return {
    type: "CUSTOM_MEAL_UPDATE_FIELD",
    payload: {
      name,
      value
    }
  }
}

export function changeWorkoutPlans(day, plan) {
  return {
    type: "CHANGE_MEAL_PLAN",
    payload: {
      day,
      plan
    }
  }
}

export function removeWorkoutFromPlans(payload) {
  return {
    type: "REMOVE_MEAL_TO_PLAN",
    payload
  }
}

export function customMealIS(type, state) {
  if (type === "new") {
    return customMealInitialState;
  } else {
    return {
      ...customMealInitialState
    }
  }
}

export function dailyMealRP(state) {
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: state.plans
  }
}

export function weeklyMealRP(state) {
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: state.plans
  }
}

export function monthlyMealRP(state) {
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