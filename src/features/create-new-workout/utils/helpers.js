import { META_REQUIRED_FIELDS, WORKOUT_EXERCISE } from "./config";

export function validateMetaPayload(payload) {
  const errors = {};

  META_REQUIRED_FIELDS.forEach(field => {
    const value = payload[field];
    if (!value || (typeof value === "string" && !value.trim())) {
      errors[field] = "This field is required";
    }
  });

  return errors;
}

export function saveExercisePayload(action, exercises, exercise = {}) {
  switch (action) {
    case "ADD":
      return [
        ...exercises,
        {
          id: Date.now(),
          ...WORKOUT_EXERCISE
        }
      ]
    case "UPDATE":
      return exercises.map(prevExercise => prevExercise.id === exercise.id
        ? {
          ...prevExercise,
          ...exercise
        }
        : prevExercise
      )
    case "DELETE":
      return exercises.filter(prevExercise => prevExercise.id !== exercise.id)
  }
}