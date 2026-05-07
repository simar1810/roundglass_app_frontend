import { useEffect, useRef, useState } from "react";

const AUTO_SAVE_DEBOUNCE_MS = 2000;

export default function useMealPlanAutoSave({
  state,
  isFirstMountRef,
  mealPlanAutosaveEnabled,
  stateRef,
  savedKey,
  setLastSavedAt
}) {
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "pending" | "saved"
  const debounceTimerRef = useRef(null);
  useEffect(() => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      if (!mealPlanAutosaveEnabled) return;
      const isAiPlan = Boolean(state.isAiGenerated || state.aiMealPlanId);
      if (isAiPlan) return;
  
      // setSaveStatus("pending");
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const stateToSave = stateRef.current;
        if (!stateToSave) return;
        try {
          if (typeof localStorage === "undefined") return;
          localStorage.setItem(savedKey, JSON.stringify(stateToSave));
          // setSaveStatus("saved");
          // setLastSavedAt(new Date());
        } catch (e) {
          if (e?.name === "QuotaExceededError") {
            toast.error("Storage full. Free some space to keep auto-saving.");
          }
          console.warn("[MealPlan AutoSave] localStorage write failed", e);
        }
      }, AUTO_SAVE_DEBOUNCE_MS);
      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, [state, savedKey, isFirstMountRef, stateRef, mealPlanAutosaveEnabled]);
}