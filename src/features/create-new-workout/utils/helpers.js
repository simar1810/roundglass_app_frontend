import { META_REQUIRED_FIELDS, WORKOUT_EXERCISE, WORKOUT_WEEKLY_DAYS } from "./config";

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
    case "NEW":
      return [
        ...exercises,
        {
          id: Date.now(),
          ...WORKOUT_EXERCISE,
          ...exercise,
        }
      ]
  }
}

export function buildDaysListForDaysMenu(state) {
  switch (state.mode) {
    case "weekly":
      return WORKOUT_WEEKLY_DAYS;
    case "monthly":
      return Object.keys(state.exercises);
    default:
      return [];
  }
}