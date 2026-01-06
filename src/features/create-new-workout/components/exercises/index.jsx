import ListDays from "./ListDays";
import { Tabs, TabsList } from "@/components/ui/tabs";
import ListDayExercises from "./ListDayExercises";

export default function WorkoutCreationExercises() {
  return <div className="w-1/2">
    <Tabs>
      <TabsList className="bg-transparent">
        <ListDays />
      </TabsList>
      <ListDayExercises />
    </Tabs>
  </div>
}