/** localStorage key for auto-saved meal plan draft (used by add-custom flow only) */
export const SAVED_MEAL_PLAN_STORAGE_KEY = "SavedMealPlan";
/** localStorage key for the server draft plan id (set after first auto-save to draft API) */
export const DRAFT_PLAN_ID_STORAGE_KEY = "mealPlanDraftId";
/** localStorage key for the mode of the draft plan (daily/weekly/monthly) */
export const DRAFT_PLAN_MODE_STORAGE_KEY = "mealPlanDraftMode";

/** Base key for AI-generated meal plan in localStorage */
export const AI_MEAL_PLAN_STORAGE_KEY = "aiMealPlan";

/**
 * Returns coach-scoped storage key so another coach doesn't see this one's autosave/draft.
 * Use whenever reading or writing meal plan autosave/draft in localStorage.
 */
export function getMealPlanStorageKey(baseKey, coachId) {
	return coachId ? `${baseKey}_${coachId}` : baseKey;
}

export const customMealInitialState = {
  stage: 1,
  mode: "daily", // e.g. daily, weekly, monthly, 
  title: "",
  id: undefined,
  creationType: "new",
  originalPlanId: undefined,
  file: "",
  image: "",
  description: "",
  guidelines: "",
  supplements: "",
  selectedDate: "",
  selectedPlan: "daily",
  selectedMealType: "Breakfast",
  plans: {},
  noOfDays: 0,
  selectedPlans: {
    daily: [
      {
        mealType: "Breakfast",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Morning Snacks",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Lunch",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Evening Snacks",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Dinner",
        meals: [],
        defaultMealTiming: ""
      },
    ]
  }, // { daily: [{ mealType: "Breakfast", meals: [] }
}