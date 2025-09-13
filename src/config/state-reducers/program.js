import { buildClickableUrl } from "@/lib/formatter";

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
    availability: data.availability
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
  for (const field of ["file", "name", "order"]) {
    if (state[field] || state[field] === 0) formData.append(field, state[field])
  }
  formData.append("link", buildClickableUrl(state.link))
  formData.append("availability", JSON.stringify(state.availability || "[]"))
  formData.append("programId", state.id);
  return formData;
}