"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { initializeWorkoutCreation } from "@/features/create-new-workout/api";
import WorkoutCreationContainer from "@/features/create-new-workout/components";
import { newWorkoutInitState } from "@/features/create-new-workout/state/init";
import newWorkoutReducer from "@/features/create-new-workout/state/newWorkoutReducer";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const { mode } = useParams();
  const [errors, setErrors] = useState([]);
  const [workout, setWorkout] = useState(null)
  const [config, setConfig] = useState({
    creationType: "new",
    // extra will be the workout id if the creation type is edit or copy_edit
  });
  const searchParams = useSearchParams()

  useEffect(function () {
    ; (async function () {
      // if the url search params has the creation type,
      // and mongo object id then fetch the workout data and set the config
      const { errors, config, workout } = await initializeWorkoutCreation(searchParams);
      setConfig(config)
      setErrors(errors)
      setWorkout(workout)
      setLoading(false);
    })()
  }, [loading])

  if (loading) return <ContentLoader />

  if (errors.length > 0) return <ContentError title={errors.join(", ")} />

  return <CurrentStateProvider
    state={newWorkoutInitState(mode, config, workout)}
    reducer={newWorkoutReducer}
  >
    <div className="content-container content-height-screen mt-0">
      <WorkoutCreationContainer />
    </div>
  </CurrentStateProvider>
}