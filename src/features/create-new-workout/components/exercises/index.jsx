import ListDays from "./ListDays";
import { Tabs, TabsList } from "@/components/ui/tabs";
import ListExercises from "./ListExercises";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import ListExerciseToSelectFrom, { ExerciseCardVisual } from "./ListExerciseToSelectFrom";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { saveExercisePayload } from "../../utils/helpers";
import { useState } from "react";
import SaveNewWorkoutButton from "../SaveNewWorkoutButton";

export default function WorkoutCreationExercises() {
  const { exercises, dispatch } = useCurrentStateContext()
  const [activeExercise, setActiveExercise] = useState(null);

  function handleDragStart(event) {
    setActiveExercise(event.active.data.current);
  }

  function handleDragEnd(event) {
    setActiveExercise(null);
    const { active: { data }, collisions } = event;
    if (collisions.length === 0) return;
    const day = collisions[0].id
    const newExercises = saveExercisePayload("NEW", exercises[day], data.current);
    dispatch({
      type: "SAVE_EXERCISE",
      payload: {
        day,
        exercises: newExercises,
      },
    });
  }

  function handleDragCancel() {
    setActiveExercise(null);
  }

  return <DndContext
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    onDragCancel={handleDragCancel}
  >
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Tabs defaultValue={Object.keys(exercises)[0]} className="w-full">
          <TabsList className="bg-transparent w-full justify-start h-auto flex">
            <ListDays />
          </TabsList>
          <ListExercises />
        </Tabs>
      </div>
      <ListExerciseToSelectFrom />
    </div>

    <DragOverlay dropAnimation={null}>
      {activeExercise ? (
        <div className="w-[150px] pointer-events-none opacity-80 shadow-xl">
          <ExerciseCardVisual exercise={activeExercise} />
        </div>
      ) : null}
    </DragOverlay>

    <SaveNewWorkoutButton />
  </DndContext>
}
