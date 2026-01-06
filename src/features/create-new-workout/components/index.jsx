import useCurrentStateContext from "@/providers/CurrentStateContext";
import WorkoutCreationMeta from "./meta";
import WorkoutStageStepper from "./WorkoutStageStepper";
import WorkoutCreationExercises from "./exercises";

export default function WorkoutCreationContainer() {
  return <div>
    {/* <WorkoutStageStepper /> */}
    <Component />
  </div>
}

function Component() {
  const { meta: { stage } } = useCurrentStateContext()
  if (stage === 1) return <WorkoutCreationMeta />
  if (stage === 2) return <WorkoutCreationExercises />
  return <div>Invalid stage</div>
}