import { TabsContent } from "@/components/ui/tabs"
import useCurrentStateContext from "@/providers/CurrentStateContext"
import ListDayExercisesForDay from "./ListDayExercisesForDay"

export default function ListDayExercises() {
  const { exercises } = useCurrentStateContext()
  console.log("THIS IS EXERCISES", exercises)

  const keys = Object.keys(exercises || {})

  return <div>
    {keys.map((day) => <TabsContent
      value={day}
      key={day}
    >
      <ListDayExercisesForDay day={day} />
    </TabsContent>)}
  </div>
}