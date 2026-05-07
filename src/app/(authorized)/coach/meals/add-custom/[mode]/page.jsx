"use client"
import ContentError from "@/components/common/ContentError";
import Stage2 from "@/components/pages/coach/meal-plan/add/Stage2";
import { customMealIS, customMealReducer, selectWorkoutType } from "@/config/state-reducers/custom-meal";
import {
  SAVED_MEAL_PLAN_STORAGE_KEY,
  AI_MEAL_PLAN_STORAGE_KEY,
  getMealPlanStorageKey,
} from "@/config/state-data/custom-meal";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const coachId = useAppSelector((s) => s.coach?.data?._id) ?? null;
  const { dispatch } = useCurrentStateContext();
  const [mealContext, setMealContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function () {
    if (["daily", "weekly", "monthly"].includes(mode)) {
      dispatch(selectWorkoutType(mode));
    }

    const sourceAi = searchParams.get("source") === "ai";
    const mealIdParam = searchParams.get("mealId");
    const aiKey = getMealPlanStorageKey(AI_MEAL_PLAN_STORAGE_KEY, coachId);
    const savedKey = getMealPlanStorageKey(SAVED_MEAL_PLAN_STORAGE_KEY, coachId);
    const aiData = typeof window !== "undefined" ? localStorage.getItem(aiKey) : null;
    const savedData = typeof window !== "undefined" ? localStorage.getItem(savedKey) : null;

    if (sourceAi && aiData) {
      try {
        const parsed = JSON.parse(aiData);
        dispatch({ type: "LOAD_AI_MEAL_PLAN", payload: parsed });
        const params = new URLSearchParams(searchParams.toString());
        params.delete("source");
        params.delete("mealId");
        const q = params.toString();
        router.replace(q ? `/coach/meals/add-custom/${mode}?${q}` : `/coach/meals/add-custom/${mode}`, { scroll: false });
      } catch (e) {
        console.error("Error parsing aiMealPlan", e);
      }
      setIsLoading(false);
      return;
    }

    if (sourceAi && mealIdParam && !aiData) {
      getCustomMealPlans("coach", mealIdParam).then((response) => {
        if (response?.status_code === 200 && response?.data) {
          const mealPlan = response.data;
          const payload = {
            ...mealPlan,
            plan: mealPlan.plans,
            id: mealPlan._id,
          };
          dispatch({ type: "LOAD_AI_MEAL_PLAN", payload });
          const params = new URLSearchParams(searchParams.toString());
          params.delete("source");
          params.delete("mealId");
          const q = params.toString();
          router.replace(q ? `/coach/meals/add-custom/${mode}?${q}` : `/coach/meals/add-custom/${mode}`, { scroll: false });
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
      return;
    }

    if (!sourceAi && savedData) {
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