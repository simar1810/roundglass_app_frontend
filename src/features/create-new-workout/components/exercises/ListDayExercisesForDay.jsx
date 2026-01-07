import { Button } from "@/components/ui/button";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { saveExercisePayload } from "../../utils/helpers";
import ExerciseDetails from "./ExerciseDetails";
import { useDroppable } from "@dnd-kit/core";

export default function ListDayExercisesForDay({ day }) {
  const { exercises, dispatch } = useCurrentStateContext();
  const exercisesForDay = exercises[day] || [];
  const { setNodeRef } = useDroppable({
    id: day,
  });

  function saveExercisesForDay(action, exercise) {
    const newExercises = saveExercisePayload(action, exercisesForDay, exercise);
    dispatch({
      type: "SAVE_EXERCISE",
      payload: {
        day,
        exercises: newExercises,
      },
    });
  }

  return (
    <div ref={setNodeRef}>
      {/* <Button
        variant="icon"
        size="icon"
        onClick={() => saveExercisesForDay("ADD")}
      >
        <Plus />
      </Button> */}
      {exercisesForDay.length === 0 && <div>
        <div className="mt-4 border-1 flex flex-col items-center justify-center h-full bg-gray-50 rounded-md p-4">
          <Button
            variant="wz"
            size="sm"
            onClick={() => saveExercisesForDay("ADD")}
          >
            Add
          </Button>
          <div className="text-sm text-gray-500 mt-4">Get Started by Adding Exercises</div>
        </div>
      </div>}
      <div className="space-y-2 max-h-[80vh] overflow-y-auto">
        {exercisesForDay.map((exercise, index) => (
          <ExerciseDetails
            key={index}
            exercise={exercise}
            saveExercisesForDay={(exercise) => saveExercisesForDay("UPDATE", exercise)}
            sets={[{}]}
          />
        ))}
      </div>
    </div>
  );
}
