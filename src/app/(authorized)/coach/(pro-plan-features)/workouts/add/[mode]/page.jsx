"use client"
import ContentError from "@/components/common/ContentError";
import Stage2 from "@/components/pages/coach/workouts/add/Stage2";
import { customWorkoutIS, customWorkoutReducer, selectWorkoutType } from "@/config/state-reducers/custom-workout";
import useBlockNavigation from "@/hooks/useBlockNavigation";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  return <CurrentStateProvider
    state={customWorkoutIS("new")}
    reducer={customWorkoutReducer}
  >
    <CustomMealPlanContainer />
  </CurrentStateProvider>
}

function CustomMealPlanContainer() {
  const { mode } = useParams()
  const { dispatch } = useCurrentStateContext()
  const [dataSavedLocally, setDataSavedLocally] = useState(false)

  useBlockNavigation({
    shouldBlock: () => true,
    onAttemptToLeave: (e) => setDataSavedLocally(true)
  })

  useEffect(function () {
    if (["daily", "weekly", "monthly"].includes(mode)) {
      dispatch(selectWorkoutType(mode))
    }
  }, [])
  if (!["daily", "weekly", "monthly"].includes(mode)) return <ContentError title="Invalid Creation Mode selected" />
  return <div className="content-container content-height-screen">
    <Stage2 />
  </div>
}