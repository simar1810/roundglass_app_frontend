export default function questionaireReducer(state, action) {
  switch (action.type) {
    case "ADD_NEW_SECTION": {
      const existingNames = Object.values(state.sections).map((sec) => sec.name)
      let count = 1
      let newSectionName = `Untitled Section ${count}`
      while (existingNames.includes(newSectionName)) {
        count++;
        newSectionName = `Untitled Section ${count}`;
      }
      const newSectionKey = `section-${Date.now()}`;
      return {
        ...state,
        sections: {
          ...state.sections,
          [newSectionKey]: {
            name: newSectionName,
            questions: [],
          },
        },
      }
    }

    case "REMOVE_SECTION": {
      delete state.sections[action.payload]
      return {
        ...state
      };
    }

    case "SAVE_SECTION": {
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionKey]: action.payload.values
        }
      }
    }

    case "ADD_NEW_QUESTION_SECTION": {
      return ({
        ...state,
        sections: {
          ...state.sections,
          [action.payload]: {
            ...state.sections[action.payload],
            questions: [
              ...state.sections[action.payload].questions,
              {
                name: `Question ${state.sections[action.payload].questions.length + 1}`
              }
            ]
          }
        }
      })
    }

    case "REMOVE_QUESTION":
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionKey]: {
            ...state.sections[action.payload.sectionKey],
            questions: state.sections[action.payload.sectionKey].questions.filter((_, index) => index !== action.payload.index)
          }
        }
      }
    default:
      return {
        ...state
      };
  }
}

export function newSection() {
  return {
    type: "ADD_NEW_SECTION"
  }
}

export function removeSection(payload) {
  return {
    type: "REMOVE_SECTION",
    payload
  }
}

export function saveSection(payload) {
  return {
    type: "SAVE_SECTION",
    payload
  }
}

export function addNewQuestionToSection(payload) {
  return {
    type: "ADD_NEW_QUESTION_SECTION",
    payload
  }
}

export function removeQuestion(payload) {
  return {
    type: "REMOVE_QUESTION",
    payload
  }
}
