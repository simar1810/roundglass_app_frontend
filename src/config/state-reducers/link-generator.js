import FormControl from "@/components/FormControl";
import { MeetingDescription, MeetingRepeat, MeetingType } from "@/components/modals/club/LinkGenerator";
import { linkGeneratorFields } from "../data/ui";
import { format, parse } from "date-fns";
import { linkGeneratorInitialState } from "../state-data/link-generator";

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

    default:
      break;
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

const meetingTypeFieldsMap = {
  quick: [1, 2, 6, 7],
  scheduled: [1, 2, 3, 4, 6, 7],
  reocurr: [1, 2, 3, 4, 5, 6, 7],
  event: [1, 2, 3, 4, 6, 7, 8]
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
  const payload = {};
  for (const field of formControls) {
    payload[field.name] = state[field.name];
  }
  if (state.data && state.time) {
    const scheduleDate = format(parse(`${state.date} ${state.time}`, 'yyyy-MM-dd HH:mm', new Date()), 'dd-MM-yyyy HH:mm:ss');
    payload.scheduleDate = scheduleDate;
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
  }
}