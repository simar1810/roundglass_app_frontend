import ListDays from "./ListDays";
import { Tabs, TabsList } from "@/components/ui/tabs";
import ListExercises from "./ListExercises";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import ListExerciseToSelectFrom from "./ListExerciseToSelectFrom";
import { DndContext } from "@dnd-kit/core";
import { saveExercisePayload } from "../../utils/helpers";

export default function WorkoutCreationExercises() {
  const { exercises, dispatch } = useCurrentStateContext()
  function handleDragEnd(event) {
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

  return <DndContext onDragEnd={handleDragEnd}>
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
  </DndContext>
}