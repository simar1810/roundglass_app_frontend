
export function reminderReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.field]: action.payload.value
      }

    case "UPDATE_CLIENT_SEARCH_QUERY":
      return {
        ...state,
        other: action.payload
      }

    case "UPDATE_VIEW":
      return {
        ...state,
        view: action.payload ? action.payload : state.attendeeType === "wz_client" ? 2 : 1
      }

    case "SET_ATTENDEE_TYPE":
      return {
        ...state,
        attendeeType: action.payload
      }

    default:
      return state;
  }
}

export function changeFieldValue(field, value) {
  return {
    type: "UPDATE_FIELD_VALUE",
    payload: {
      field,
      value
    }
  }
}

export function changeClientQuery(value) {
  return { type: "UPDATE_CLIENT_SEARCH_QUERY", payload: value }
}

export function changeView(type) {
  return { type: "UPDATE_VIEW", payload: type }
}

export function setAttendeeType(type) {
  return { type: "SET_ATTENDEE_TYPE", payload: type }
}

export function generateReminderPayload(state) {
  const payload = {}
  for (const field in state) {
    payload[field] = state[field];
  }
  if (payload.attendeeType === "wz_client") {
    delete payload.other;
  } else {
    delete payload.client;
  }
  delete payload.attendeeType;
  return payload;
}