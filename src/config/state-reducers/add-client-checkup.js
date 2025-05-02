import { format, parse } from "date-fns";
import { addClientCheckupInitialState } from "../state-data/add-client-checkup";

export function addClientCheckupReducer(state, action) {
  switch (action.type) {
    case "SET_CURRENT_STAGE":
      return {
        ...state,
        stage: action.payload
      }
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    case "CHANGE_HEIGHT_UNIT":
      return {
        ...state,
        heightUnit: action.payload,
        height: action.payload.toLowerCase() === "cm"
          ? (state.height / 30.48).toFixed(2)
          : (state.height * 30.48).toFixed(2)
      }
    case "CHANGE_WEIGHT_UNIT":
      return {
        ...state,
        weightUnit: action.payload,
        weight: action.payload.toLowerCase() === "kg"
          ? state.weight
          : state.weight
      }
    case "UPDATE_MATRICES":
      return {
        ...state,
        ...action.payload
      }
    case "CLIENT_CREATION_DONE":
      return {
        ...addClientCheckupInitialState,
        clientId: action.payload
      }

    default:
      return state;
  }
}

export function setCurrentStage(stage) {
  return {
    type: "SET_CURRENT_STAGE",
    payload: stage
  }
}

export function createdClient(clientId) {
  return {
    type: "CLIENT_CREATION_DONE",
    payload: clientId
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

export function changeHeightUnit(unit) {
  return {
    type: "CHANGE_HEIGHT_UNIT",
    payload: unit
  }
}

export function changeWeightUnit(unit) {
  return {
    type: "CHANGE_WEIGHT_UNIT",
    payload: unit
  }
}

export function updateMatrices(matrices, values) {
  const payload = {};
  for (const matrix of matrices) {
    if (values[matrix.name]) payload[matrix.name] = values[matrix.name];
  }
  return {
    type: "UPDATE_MATRICES",
    payload
  }
}

const fields = {
  stage1: ["name", "dob", "gender", "joiningDate", "height", "heightUnit", "weight", "weightUnit", "bodyComposition"],
  requestFields: ["name", "email", "mobileNumber", "age", "notes", "dob", "gender", "height", "heightUnit", "weight", "weightUnit", "bodyComposition", "file", "bmi", "visceral_fat", "followUpDate", "activeType", "rm", "muscle", "fat", "bodyComposition", "ideal_weight", "bodyAge", "pendingCustomer", "existingClientID", "nextFollowup"],
}

export function stage1Completed(state, stage) {
  for (const field of fields[stage]) {
    if (!state[field]) return { success: false, field };
  }
  return { success: true };
}

export function generateRequestPayload(state, coachId) {
  const formData = new FormData();
  for (const field of fields.requestFields) {
    formData.append(field, state[field]);
  }
  const joiningDate = format(parse(state.joiningDate, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy');
  formData.append("coachId", coachId);
  formData.append("joiningDate", joiningDate);
  return formData;
}