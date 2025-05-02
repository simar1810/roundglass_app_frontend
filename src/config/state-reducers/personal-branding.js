export function personalBrandingReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.name]: action.payload.value
        }
      }
    case "SELECT_PERSONAL_BRAND_EDIT":
      return {
        ...state,
        selectedBrand: action.payload,
        formData: action.payload,
        type: "edit",
        stage: 2
      }
    case "PERSONAL_BRAND_UPDATED":
      return {
        ...state,
        selectedBrand: {},
        formData: {},
        type: "edit",
        stage: 1
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

export function selectPersonalBrandToEdit(brand) {
  return {
    type: "SELECT_PERSONAL_BRAND_EDIT",
    payload: brand
  }
}

export function personalBrandUpdated() {
  return { type: "PERSONAL_BRAND_UPDATED" }
}

const fields = ["file", "brandName", "primaryColor", "textColor"];
export function generateRequestPayload(state, id) {
  const payload = new FormData();
  for (const field of fields) {
    if (state[field]) payload.append(field, state[field]);
  }
  if (Boolean(id)) payload.append("id", id)
  return payload;
}