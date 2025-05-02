export function newRecipeeReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
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

export function generateRequestPayload(state) {
  const payload = new FormData();
  for (const field in state) {
    payload.append(field, state[field]);
  }
  return payload;
}