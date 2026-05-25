"use client"
import ContentError from "@/components/common/ContentError";
import Stage2 from "@/components/pages/coach/meal-plan/add/Stage2";
import { customMealIS, customMealReducer, selectWorkoutType } from "@/config/state-reducers/custom-meal";
import {
  SAVED_MEAL_PLAN_STORAGE_KEY,
  getMealPlanStorageKey,
} from "@/config/state-data/custom-meal";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  return (
    <CurrentStateProvider
      state={customMealIS("new")}
      reducer={customMealReducer}
      localStorageHydrateKey={SAVED_MEAL_PLAN_STORAGE_KEY}
    >
      <CustomMealPlanContainer />
    </CurrentStateProvider>
  );
}

function CustomMealPlanContainer() {
  const { mode } = useParams();
  const coachId = useAppSelector((s) => s.coach?.data?._id) ?? null;
  const { dispatch } = useCurrentStateContext();
  const [mealContext, setMealContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function () {
    if (["daily", "weekly", "monthly"].includes(mode)) {
      dispatch(selectWorkoutType(mode));
    }

    const savedKey = getMealPlanStorageKey(SAVED_MEAL_PLAN_STORAGE_KEY, coachId);
    const savedData = typeof window !== "undefined" ? localStorage.getItem(savedKey) : null;

    if (savedData) {
      try {
        const saved = JSON.parse(savedData);
        if (saved && typeof saved === "object" && Object.keys(saved).length > 0 && saved.mode === mode) {
          setMealContext(saved);
        }
      } catch (e) {
        console.error("Error parsing saved meal plan", e);
      }
    }

    setIsLoading(false);
  }, [mode, dispatch, coachId]);

  if (!["daily", "weekly", "monthly"].includes(mode)) {
    return <ContentError title="Invalid Creation Mode selected " />;
  }
  if (isLoading) {
    return (
      <div className="content-container content-height-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="content-container content-height-screen">
      <Stage2 context={mealContext} />
    </div>
  );
}
