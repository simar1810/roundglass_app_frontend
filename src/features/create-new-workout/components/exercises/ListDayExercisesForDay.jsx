import { Button } from "@/components/ui/button";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Plus } from "lucide-react";
import { saveExercisePayload } from "../../utils/helpers";
import SelectExercise from "./SelectExercise";
import { Card } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";

export default function ListDayExercisesForDay({ day }) {
  const { exercises, dispatch } = useCurrentStateContext();
  const exercisesForDay = exercises[day] || [];

  function saveExercisesForDay(action, exercise) {
    const newExercises = saveExercisePayload(action, exercisesForDay, exercise);
    dispatch({
      type: "SAVE_EXERCISE",
      payload: {
        day,
        exercises: newExercises
      }
    })
  }

  return <div>
    {exercisesForDay.length} Exercises for {day}
    <Button
      variant="icon"
      size="icon"
      onClick={() => saveExercisesForDay("ADD")}
    >
      <Plus />
    </Button>
    <div className="mt-4 grid grid-cols-2 gap-4">
      {exercisesForDay.map((exercise, index) => <ExerciseDetails
        key={index}
        exercise={exercise}
        saveExercisesForDay={(exercise) => saveExercisesForDay("UPDATE", exercise)}
      />)}
    </div>
  </div>
}

function ExerciseDetails({ exercise, saveExercisesForDay }) {
  return (
    <Card className="bg-[var(--comp-1)] flex items-center gap-5 p-4 shadow-none border-1 rounded-[4px]">
      <div className="h-20 w-20 shrink-0 rounded-md bg-muted flex items-center justify-center">
        {exercise?.gifUrl ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="h-full w-full object-cover rounded-md"
          />
        ) : (
          <Dumbbell className="text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">
          {exercise.name}
        </h4>

        <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
          <span>{exercise.bodyPart}</span>
          <span>•</span>
          <span>{exercise.target}</span>
          <span>•</span>
          <span>{exercise.equipment}</span>
        </div>
      </div>
      <SelectExercise
        saveExercisesForDay={newExercises => saveExercisesForDay({
          ...newExercises,
          id: exercise.id
        })
        }
      />
      <Button
        size="sm"
        onClick={() => saveExercisesForDay(exercise)}
      >
        Save
      </Button>
    </Card>
  );
}
