import { format } from "date-fns"
import { WORKOUT_WEEKLY_DAYS } from "../utils/config"

const meta = {
  stage: 1, // 1 = meta, 2 = selecting exercises
  title: "",
  description: "",
  guidelines: "",
  file: "",
  category: "",
  subcategory: "",
}

export function newWorkoutInitState(type, config, workout) {
  if (config.creationType === "edit") {
    return {
      meta: {
        stage: 1,
        title: workout.title,
        description: workout.description,
        guidelines: workout.guidelines,
        file: workout.file,
        category: workout.category,
        subcategory: workout.subcategory,
        image: workout.image,
      },
      config,
      mode: workout.mode,
      exercises: buildDefaultExercises(workout.exercises),
    }
  }
  switch (type) {
    case "daily":
      return {
        meta,
        config,
        mode: "daily",
        exercises: {
          day: []
        },
      }
    case "weekly":
      return {
        meta,
        config,
        mode: "weekly",
        exercises: WORKOUT_WEEKLY_DAYS.reduce((acc, day) => {
          acc[day] = [];
          return acc;
        }, {}),
      }
    case "monthly":
      return {
        meta,
        config,
        mode: "monthly",
        exercises: {
          [format(new Date(), 'dd-MM-yyyy')]: []
        },
      }
    default:
      throw new Error("invalid type of the new workout!")
  }
}

function buildDefaultExercises(exercises) {
  const result = {}
  const keys = Object.keys(exercises)
  for (const key of keys) {
    result[key] = exercises[key].map(exercise => ({
      _id: exercise.exercise._id,
      id: exercise._id,
      name: exercise.exercise.name,
      description: exercise.exercise.description,
      guidelines: exercise.exercise.guidelines,
      category: exercise.exercise.category,
      restTime: exercise.restTime,
      sets: exercise.sets
    }));
  }
  return result;
}