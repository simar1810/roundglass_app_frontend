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
            questions: [...state.sections[action.payload].questions,
            {
              id: `Q${Date.now()}`,
              name: `Question ${state.sections[action.payload].questions.length + 1}`,
              type: "shortAnswer",
              text: "",
              options: [],
              isMandatory: false,
              minScale: null,
              maxScale: null,
              label1: null,
              label2: null,
              dateTime: null,
              imagePath: null,
              filePath: null,
              answerText: null,
              answer: null
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
    case "UPDATE_QUESTION": {
      const { sectionKey, questionIndex, questionData } = action.payload;
      return {
        ...state,
        sections: {
          ...state.sections,
          [sectionKey]: {
            ...state.sections[sectionKey],
            questions: state.sections[sectionKey].questions.map((question, index) =>
              index === questionIndex ? { ...question, ...questionData } : question
            )
          }
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

export function updateQuestion(payload) {
  return {
    type: "UPDATE_QUESTION",
    payload
  }
}
