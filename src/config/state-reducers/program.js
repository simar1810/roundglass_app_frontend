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
    defaultImage: data.image || "",
    order: data.order || 0
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
  for (const field of ["file", "name", "link", "order"]) {
    if (state[field] || state[field] === 0) formData.append(field, state[field])
  }
  formData.append("programId", state.id);
  return formData;
}