import FormControl from "@/components/FormControl";
import { MeetingBanner, MeetingDescription, MeetingRepeat, MeetingType } from "@/components/modals/club/LinkGenerator";
import { linkGeneratorFields } from "../data/ui";
import { formatISO, parse } from "date-fns";
import { linkGeneratorInitialState } from "../state-data/link-generator";
import SelectControl from "@/components/Select";
import SelectMultiple from "@/components/SelectMultiple";

export function linkGeneratorReducer(state, action) {
  switch (action.type) {
    case "CHANGE_FIELD_VALUE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }

    case "SET_CURRENT_VIEW":
      return {
        ...state,
        view: action.payload
      }

    case "SET_WELLNESSZ_LINK":
      return {
        ...state,
        wellnessZLink: action.payload,
        view: 3
      }
    case "RESET_STATE":
      return {
        linkGeneratorInitialState,
        view: 2
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

export function setCurrentView(payload) {
  return {
    type: "SET_CURRENT_VIEW",
    payload
  }
}

export function setWellnessZLink(link) {
  return {
    type: "SET_WELLNESSZ_LINK",
    payload: link
  }
}

export function resetCurrentState() {
  return { type: "RESET_STATE" }
}

const meetingTypeFieldsMap = {
  quick: [1, 2, 6, 7, 9, 10],
  scheduled: [1, 2, 3, 4, 6, 7, 9, 10],
  reocurr: [1, 2, 3, 4, 6, 7, 9, 10],
  event: [1, 2, 3, 4, 6, 7, 8, 9, 10]
}

export function selectFields(meetingType) {
  const fields = meetingTypeFieldsMap[meetingType];
  return linkGeneratorFields.filter(field => fields.includes(field.id));
}

export function init(withZoom) {
  if (!withZoom) return {
    ...linkGeneratorInitialState,
    view: 2
  }
  return linkGeneratorInitialState
}

export function generateRequestPayload(state) {
  const formControls = selectFields(state.meetingType)

  const payload = new FormData;
  for (const field of formControls) {
    payload.append(field.name, state[field.name]);
  }
  if (state.meetingType === "reocurr") {
    payload.append("reOcurred", JSON.stringify(state["reOcurred"]));
  }
  if (state.date && state.time) {
    const scheduleDate = formatISO(parse(`${state.date} ${state.time}`, 'yyyy-MM-dd HH:mm', new Date()));
    payload.append("scheduleDate", scheduleDate);
  } else {
    payload.append("scheduleDate", new Date().toISOString());
  }
  payload.delete("allowed_client_type");
  for (const type of state.allowed_client_type) {
    payload.append("allowed_client_type", type);
  }
  return payload;
}

export function selectMeetingFormField(field, formData, dispatch) {
  switch (field.inputtype) {
    case 1:
      return <FormControl
        key={field.id}
        className="text-[14px] [&_.label]:font-[400] block mb-4"
        value={formData[field.name]}
        onChange={e => dispatch(changeFieldvalue(field.name, e.target.value))}
        {...field}
      />
    case 2:
      return <MeetingType
        key={field.id}
        field={field}
      />
    case 3:
      return <MeetingDescription
        key={field.id}
        field={field}
      />
    case 4:
      return <MeetingRepeat
        key={field.id}
        field={field}
      />
    case 5:
      return <MeetingBanner
        key={field.id}
        field={field}
      />
    case 6:
      return <SelectMultiple
        key={field.id}
        className="[&_.option]:px-4 [&_.option]:py-2 mb-4"
        label={field.label}
        options={field.options}
        value={formData.allowed_client_type}
        onChange={(newValues) => dispatch(changeFieldvalue("allowed_client_type", newValues))}
      />
  }
}