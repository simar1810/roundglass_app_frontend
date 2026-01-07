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

export function newWorkoutInitState(type, config) {
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