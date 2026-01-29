import { Button } from "@/components/ui/button";
import ExerciseCard from "./ExerciseCard";
import { useRef } from "react";
import { DialogClose } from "@/components/ui/dialog";

export default function ExerciseList({
  exercises,
  selectedExercise,
  onSelect,
  saveExercisesForDay,
}) {
  const closeRef = useRef(null);
  return (
    <div className="flex flex-col h-full">
      <DialogClose ref={closeRef} />
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {exercises.map(exercise => (
          <ExerciseCard
            key={exercise._id}
            exercise={exercise}
            isSelected={selectedExercise === exercise._id}
            onClick={() => onSelect(exercise._id)}
          />
        ))}
      </div>

      <div className="border-t p-4 bg-white sticky bottom-0">
        <Button
          className="w-full"
          disabled={!selectedExercise}
          onClick={() => {
            saveExercisesForDay()
            closeRef.current.click()
          }}
        >
          Save Exercise
        </Button>
      </div>
    </div>
  );
}
