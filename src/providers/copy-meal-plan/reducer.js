import initialState from "./state"

const ACTIONS = {
  SET_SOURCE_PLAN: "COPY_MEAL/SET_SOURCE_PLAN",
  UPDATE_SLOT_SOURCE_PLAN: "COPY_MEAL/UPDATE_SLOT_SOURCE_PLAN",
  UPDATE_SLOT_SOURCE_MEAL: "COPY_MEAL/UPDATE_SLOT_SOURCE_MEAL",
  UPDATE_SLOT_MEAL: "COPY_MEAL/UPDATE_SLOT_MEAL",
  UPDATE_SLOT_DATE: "COPY_MEAL/UPDATE_SLOT_DATE",
  ADD_DUPLICATE_SLOT: "COPY_MEAL/ADD_DUPLICATE_SLOT",
  ADD_SOURCE_SLOT: "COPY_MEAL/ADD_SOURCE_SLOT",
  REMOVE_SLOT: "COPY_MEAL/REMOVE_SLOT",
  RESET: "COPY_MEAL/RESET",
}

function generateSlotId(plan) {
  return `${plan ?? "plan"}-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

function extractMealType(meal) {
  return typeof meal === "string"
    ? meal
    : meal?.mealType ?? meal?.fromMealType ?? ""
}

function resolveMealMeta(planMeals = [], mealIndex = 0, mealOverride) {
  const mealsArray = Array.isArray(planMeals) ? planMeals : [];

  if (mealOverride) {
    return {
      meal: mealOverride,
      mealIndex: typeof mealIndex === "number" ? mealIndex : 0,
      mealType: extractMealType(mealOverride),
    }
  }

  if (!mealsArray.length) {
    return {
      meal: null,
      mealIndex: 0,
      mealType: "",
    }
  }

  const boundedIndex = typeof mealIndex === "number"
    ? Math.min(Math.max(mealIndex, 0), mealsArray.length - 1)
    : 0;

  const meal = mealsArray[boundedIndex];

  return {
    meal,
    mealIndex: boundedIndex,
    mealType: extractMealType(meal),
  }
}

function createSlot({ planKey = "", planMeals = [], mealIndex = 0, overrides = {} }) {
  const meta = resolveMealMeta(planMeals, overrides.sourceMealIndex ?? mealIndex, overrides.meal);

  return {
    id: overrides.id ?? generateSlotId(planKey),
    sourcePlan: overrides.sourcePlan ?? planKey ?? "",
    sourceMealIndex: overrides.sourceMealIndex ?? meta.mealIndex,
    fromMealType: overrides.fromMealType ?? meta.mealType,
    toMealType: overrides.toMealType ?? "",
    toDate: overrides.toDate ?? "",
    isDerived: overrides.isDerived ?? false,
  }
}

function buildSlotsFromMeals(planKey, planMeals = []) {
  const updatedPlanMeals = Array.isArray(planMeals) ? planMeals : planMeals.meals;
  return updatedPlanMeals.map((_, index) => createSlot({ planKey, updatedPlanMeals, mealIndex: index }))
}

export default function reducer(state, action) {
  switch (action.key) {
    case ACTIONS.SET_SOURCE_PLAN: {
      const { plan, meals } = action.payload;
      const selectedMeals = buildSlotsFromMeals(plan, meals);
      return {
        ...state,
        selectedPlan: plan,
        selectedMeals,
      }
    }

    case ACTIONS.UPDATE_SLOT_SOURCE_PLAN: {
      const { id, plan, planMeals } = action.payload;
      return {
        ...state,
        selectedMeals: state.selectedMeals.map((slot) => {
          if (slot.id !== id) return slot;

          const updated = createSlot({
            planKey: plan,
            planMeals,
            overrides: {
              id: slot.id,
              toDate: slot.toDate,
            },
          });

          return {
            ...slot,
            ...updated,
            toMealType: "",
          }
        }),
      }
    }

    case ACTIONS.UPDATE_SLOT_SOURCE_MEAL: {
      const { id, mealIndex, planMeals } = action.payload;
      const meta = resolveMealMeta(planMeals, mealIndex);

      return {
        ...state,
        selectedMeals: state.selectedMeals.map((slot) =>
          slot.id === id
            ? {
              ...slot,
              sourceMealIndex: meta.mealIndex,
              fromMealType: meta.mealType,
            }
            : slot,
        ),
      }
    }

    case ACTIONS.UPDATE_SLOT_MEAL: {
      const { id, mealType } = action.payload;
      return {
        ...state,
        selectedMeals: state.selectedMeals.map((slot) =>
          slot.id === id
            ? { ...slot, toMealType: mealType }
            : slot,
        ),
      }
    }

    case ACTIONS.UPDATE_SLOT_DATE: {
      const { id, date } = action.payload;
      return {
        ...state,
        selectedMeals: state.selectedMeals.map((slot) =>
          slot.id === id
            ? {
              ...slot,
              toDate: date,
              toMealType: "",
            }
            : slot,
        ),
      }
    }

    case ACTIONS.ADD_DUPLICATE_SLOT: {
      const { afterId, sourcePlan, sourceMealIndex, meal } = action.payload;
      const baseIndex = state.selectedMeals.findIndex((slot) => slot.id === afterId);
      if (baseIndex === -1) return state;

      const newSlot = createSlot({
        planKey: sourcePlan,
        planMeals: [],
        overrides: {
          meal,
          sourcePlan,
          sourceMealIndex,
          fromMealType: state.selectedMeals[baseIndex]?.fromMealType ?? "",
          isDerived: true,
        },
      });

      const updated = [...state.selectedMeals];
      updated.splice(baseIndex + 1, 0, newSlot);

      return {
        ...state,
        selectedMeals: updated,
      }
    }

    case ACTIONS.ADD_SOURCE_SLOT: {
      const { plan, planMeals } = action.payload;
      const planKey = plan ?? "";
      const newSlot = createSlot({
        planKey,
        planMeals,
      });

      return {
        ...state,
        selectedMeals: [...state.selectedMeals, newSlot],
      }
    }

    case ACTIONS.REMOVE_SLOT: {
      const { id } = action.payload;
      return {
        ...state,
        selectedMeals: state.selectedMeals.filter((slot) => slot.id !== id),
      }
    }

    case ACTIONS.RESET:
      return {
        ...action.payload,
        selectedMeals: (action.payload.selectedMeals || []).map((slot) => ({ ...slot })),
      }

    default:
      return state
  }
}

export function initCopyPayload(state) {
  const selectedPlan = state.selectedPlan ?? "";
  const meals = state.selectedMeals ?? [];

  return {
    ...initialState,
    selectedPlan,
    selectedMeals: buildSlotsFromMeals(selectedPlan, meals),
  }
}

export const setCopySourcePlan = (plan, meals) => ({
  key: ACTIONS.SET_SOURCE_PLAN,
  payload: { plan, meals },
})

export const updateSlotSourcePlan = ({ id, plan, planMeals }) => ({
  key: ACTIONS.UPDATE_SLOT_SOURCE_PLAN,
  payload: { id, plan, planMeals },
})

export const updateSlotSourceMeal = ({ id, mealIndex, planMeals }) => ({
  key: ACTIONS.UPDATE_SLOT_SOURCE_MEAL,
  payload: { id, mealIndex, planMeals },
})

export const updateSlotMealType = (id, mealType) => ({
  key: ACTIONS.UPDATE_SLOT_MEAL,
  payload: { id, mealType },
})

export const updateSlotDate = (id, date) => ({
  key: ACTIONS.UPDATE_SLOT_DATE,
  payload: { id, date },
})

export const duplicateCopySlot = ({ afterId, sourcePlan, sourceMealIndex, meal }) => ({
  key: ACTIONS.ADD_DUPLICATE_SLOT,
  payload: { afterId, sourcePlan, sourceMealIndex, meal },
})

export const addCopySourceSlot = ({ plan, planMeals }) => ({
  key: ACTIONS.ADD_SOURCE_SLOT,
  payload: { plan, planMeals },
})

export const removeCopySlot = (id) => ({
  key: ACTIONS.REMOVE_SLOT,
  payload: { id },
})

export const resetCopySelections = (payload) => ({
  key: ACTIONS.RESET,
  payload,
})