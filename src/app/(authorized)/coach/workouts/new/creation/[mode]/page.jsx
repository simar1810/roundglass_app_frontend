"use client";

import ContentLoader from "@/components/common/ContentLoader";
import WorkoutCreationContainer from "@/features/create-new-workout/components";
import { newWorkoutInitState } from "@/features/create-new-workout/state/init";
import newWorkoutReducer from "@/features/create-new-workout/state/newWorkoutReducer";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false)
  const { mode } = useParams();
  const [config, setConfig] = useState({
    creationType: "new",
    // extra will be the workout id if the creation type is edit or copy_edit
  });

  useEffect(function () {
    if (loading) return;
    // if the url search params has the creation type,
    // and mongo object id then fetch the workout data and set the config
  }, [loading])

  if (loading) return <ContentLoader />

  return <CurrentStateProvider
    state={newWorkoutInitState(mode, config)}
    reducer={newWorkoutReducer}
  >
    <div className="content-container content-height-screen mt-0">
      <WorkoutCreationContainer />
    </div>
  </CurrentStateProvider>
}