import { sendDataWithFormData } from "@/lib/api";

export async function saveNewWorkoutBackend(state) {
  const creationType = state.config.creationType;

  const payload = generateRequestPayload(state)
  if (creationType === "edit") {
    const endpoint = buildUpdateEndpoint(
      "app/newWorkout/new-workout",
      { id: state.config.id },
      "PUT"
    )
    const response = await sendDataWithFormData(endpoint, payload);
    return {
      success: response.status_code === 200,
      message: response.message,
    };
  }


  if (creationType === "new") {
    const endpoint = "app/newWorkout/new-workout"
    const response = await sendDataWithFormData(endpoint, payload);
    return {
      success: response.status_code === 200,
      message: response.message,
    };
  }

  throw new Error("Invalid creation type");
}

async function creationTypeHandler(state) { }

function generateRequestPayload(state) {
  const exercises = buildExercisesPayload(state.exercises);
  const payload = new FormData();
  payload.append("exercises", exercises);
  payload.append("title", state.meta.title);
  payload.append("description", state.meta.description);
  payload.append("guidelines", state.meta.guidelines);
  payload.append("file", state.meta.file);
  payload.append("category", state.meta.category);
  payload.append("subcategory", state.meta.subcategory);
  payload.append("mode", state.mode);
  if (state.config.creationType === "edit" && state.config.image) {
    payload.append("image", state.config.image);
  }
  return payload;
}

function buildExercisesPayload(exercises) {
  const exerciseDays = Object.keys(exercises)
  const result = {}
  for (const day of exerciseDays) {
    result[day] = buildExercisesForDayPayload(exercises[day])
  }
  return JSON.stringify(result);
}

function buildExercisesForDayPayload(exercises) {
  // {"exercise":mongodb object._id,"reps":number,"sets":number,"restTime":number}
  return exercises.map(exercise => ({
    exercise: exercise._id,
    reps: exercise.reps,
    sets: exercise.sets,
    restTime: exercise.restTime
  }));
}