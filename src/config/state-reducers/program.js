export function programReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }

    default:
      state;
  }
}

export function generateProgramIS(data = {}) {
  return {
    id: data._id,
    name: data.name || "",
    link: data.link || "",
    defaultImage: data.image || ""
  }
}

export function changeProgramFieldValue(name, value) {
  return {
    type: "CHANGE_FIELD_VALUE",
    payload: {
      name,
      value
    }
  }
}

export function generateProgramRP(state) {
  const formData = new FormData();
  for (const field of ["file", "name", "link"]) {
    if (state[field]) formData.append(field, state[field])
  }
  return formData;
}