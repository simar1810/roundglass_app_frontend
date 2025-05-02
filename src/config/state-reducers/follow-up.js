import { addDays, format, parse } from "date-fns";
import { followUpInitialState } from "../state-data/follow-up";

export function followUpReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        healthMatrix: {
          ...state.healthMatrix,
          [action.payload.name]: action.payload.value
        }
      }
    case "SET_CURRENT_STAGE":
      return {
        ...state,
        stage: action.payload
      }
    case "SET_NEXT_FOLLOW_UP_DATE":
      return {
        ...state,
        nextFollowUpDate: action.payload
      }
    case "SET_HEALTH_MATRICES":
      return {
        ...state,
        healthMatrix: {
          ...state.healthMatrix,
          ...action.payload
        }
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

export function setNextFollowUpDate(payload) {
  return {
    type: "SET_NEXT_FOLLOW_UP_DATE",
    payload
  }
}

export function setHealthMatrices(payload) {
  return {
    type: "SET_HEALTH_MATRICES",
    payload
  }
}

export function init(data) {
  return {
    ...followUpInitialState,
    healthMatrix: {
      ...followUpInitialState.healthMatrix,
      height: data.healthMatrix.height,
      heightUnit: data.healthMatrix.heightUnit
    }
  }
}

const fields = ["weight", "weightUnit", "height", "heightUnit", "bmi", "body_composition", "visceral_fat", "rm", "muscle", "fat", "ideal_weight", "bodyAge"];
export function generateRequestPayload(state) {
  const payload = {};
  for (const field of fields) {
    if (Boolean(field)) payload[field] = state.healthMatrix[field];
  }
  payload.nextFollowUpDate = (state.healthMatrix.followUpType === "custom")
    ? format(parse(state.nextFollowUpDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy')
    : format(addDays(new Date(), 8), 'dd-MM-yyyy');
  payload.createdDate = format(parse(state.healthMatrix.date, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy');
  return payload;
}

const stage1fields = ["date", "weight", "weightUnit", "visceral_fat", "body_composition"];
export function stage1Completed(data) {
  for (const field of stage1fields) {
    if (!data.healthMatrix[field]) return { success: false, field }
  }
  if (!data.nextFollowUpDate && data.healthMatrix.followUpType === "custom") return { success: false, field: "nextFollowUpDate" }
  return { success: true };
}