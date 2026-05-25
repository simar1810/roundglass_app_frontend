import { addDays, format, isBefore, isValid, parse } from "date-fns";
import { DAYS } from "../data/ui";
import { customMealInitialState } from "../state-data/custom-meal";
import { checkArray } from "@/lib/formatter";
import {
  buildPer100gSnapshot,
  normalizeRecipeForMealPlan,
} from "@/lib/nutrition/per100g";

const BASE_MEAL_TYPES = [
  "Breakfast",
  "Morning Snacks",
  "Lunch",
  "Evening Snacks",
  "Dinner",
];

export const defaultMealTypes = BASE_MEAL_TYPES.map((mealType) => ({
  mealType,
  meals: [],
  defaultMealTiming: "",
}));

export const createDefaultMealTypes = () =>
  defaultMealTypes.map(({ mealType, defaultMealTiming }) => ({
    mealType,
    meals: [],
    defaultMealTiming: defaultMealTiming ?? "",
  }));

export function getMealsFromPlan(planValue) {
  if (Array.isArray(planValue)) return planValue;
  if (planValue && typeof planValue === "object" && Array.isArray(planValue.meals)) {
    return planValue.meals;
  }
  return [];
}

export function resolveMealTime(recipe, defaultTiming = "") {
  if (!recipe || typeof recipe !== "object") {
    return typeof defaultTiming === "string" ? defaultTiming : "";
  }

  const time = typeof recipe.time === "string" ? recipe.time.trim() : "";
  if (time) return time;

  const mealTime = typeof recipe.meal_time === "string" ? recipe.meal_time.trim() : "";
  if (mealTime) {
    if (/[ap]m$/i.test(mealTime)) {
      try {
        return format(parse(mealTime.toUpperCase(), "hh:mm a", new Date()), "HH:mm");
      } catch {
        return mealTime;
      }
    }
    if (/^\d{1,2}:\d{2}$/.test(mealTime)) return mealTime;
  }

  return typeof defaultTiming === "string" ? defaultTiming : "";
}

export function getMealTypeDefaultTiming(selectedPlans, selectedDay, selectedMealType) {
  if (!selectedPlans || selectedDay == null || !selectedMealType) return "";

  const getExplicitDefault = (planValue) => {
    const meals = getMealsFromPlan(planValue);
    const entry = meals.find((mealType) => mealType?.mealType === selectedMealType);
    if (
      typeof entry?.defaultMealTiming === "string" &&
      entry.defaultMealTiming.length > 0
    ) {
      return entry.defaultMealTiming;
    }
    return "";
  };

  const currentDefault = getExplicitDefault(selectedPlans[selectedDay]);
  if (currentDefault) return currentDefault;

  for (const planKey of Object.keys(selectedPlans)) {
    if (planKey === selectedDay) continue;
    const explicitDefault = getExplicitDefault(selectedPlans[planKey]);
    if (explicitDefault) return explicitDefault;
  }

  return "";
}

export function customMealReducer(state, action) {
  switch (action.type) {
    case "SELECT_MEAL_TYPE":
      if (action.payload === "daily") return {
        ...state,
        stage: 2,
        mode: "daily",
        creationType: "new",
        selectedPlan: "daily",
        selectedMealType: "Breakfast",
        selectedPlans: {
          daily: createDefaultMealTypes(),
        },
      }
      else if (action.payload === "weekly") return {
        ...state,
        stage: 2,
        mode: "weekly",
        creationType: "new",
        selectedPlan: "sun",
        selectedMealType: "Breakfast",
        selectedPlans: DAYS.reduce((acc, curr) => {
          acc[curr] = createDefaultMealTypes();
          return acc;
        }, {}),
      }
      return {
        ...state,
        stage: 2,
        mode: "monthly",
        creationType: "new",
        selectedPlan: format(new Date(), 'dd-MM-yyyy'),
        selectedMealType: "Breakfast",
        selectedPlans: {
          [format(new Date(), 'dd-MM-yyyy')]: createDefaultMealTypes(),
        },
      }

    case "INITIAL_STATE_DIFFERENT_CREATION":
      return {
        ...state,
        ...action.payload,
        stage: 2,
        mode: action.payload.mode,
        creationType: action.payload.creationType,
        selectedPlan: action.payload.selectedPlan,
        selectedPlans: action.payload.selectedPlans,
        editPlans: action.payload.editPlans
      }
    case "CUSTOM_MEAL_UPDATE_FIELD":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    case "GENERATE_MONTHLY_DAYS": {
      const noOfDays = action.payload;
      if (!noOfDays || noOfDays <= 0) {
        return {
          ...state,
          selectedPlans: {},
          selectedPlan: "",
        };
      }
    
      const existingDates = Object.keys(state.selectedPlans);
      const defaultTimingsMap = {};
    
      existingDates.forEach(date => {
        const plan = state.selectedPlans[date];
        const meals = Array.isArray(plan) ? plan : plan?.meals || [];
        meals.forEach(meal => {
      if (meal.defaultMealTiming && !defaultTimingsMap[meal.mealType]) {
        defaultTimingsMap[meal.mealType] = meal.defaultMealTiming;
      }
        });
      });

      // Determine start date: use the earliest existing date if available, otherwise use today
      let startDate = new Date();
      if (existingDates.length > 0) {
        // Parse and sort existing dates to find the earliest (first) date
        const parsedDates = existingDates
          .map(date => {
            try {
              const parsed = parse(date, "dd-MM-yyyy", new Date());
              return isValid(parsed) ? { original: date, parsed } : null;
            } catch {
              return null;
            }
          })
          .filter(item => item !== null)
          .sort((a, b) => isBefore(a.parsed, b.parsed) ? -1 : 1);
        
        // Use the earliest date as start date
        if (parsedDates.length > 0) {
          startDate = parsedDates[0].parsed;
        }
      }
    
      const newPlans = {};
      const existingPlans = state.selectedPlans || {};

      for (let i = 0; i < noOfDays; i++) {
        const dateKey = format(addDays(startDate, i), "dd-MM-yyyy");
        const existingPlan = existingPlans[dateKey];

        if (existingPlan) {
          // Preserve existing meal data for this date (meals, defaultMealTiming)
          newPlans[dateKey] = existingPlan;
        } else {
          // New date: use default meal types with saved default timings
          newPlans[dateKey] = createDefaultMealTypes().map(meal => ({
            ...meal,
            defaultMealTiming:
              defaultTimingsMap[meal.mealType] || meal.defaultMealTiming,
          }));
        }
      }

      return {
        ...state,
        selectedPlans: newPlans,
        selectedPlan: Object.keys(newPlans)[0],
        selectedMealType: "Breakfast",
      };
    }

    case "CHANGE_MEAL_PLAN":
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.payload.day]: action.payload.plan._id
        },
        selectedPlans: {
          ...state.selectedPlans,
          [action.payload.day]: action.payload.plan
        }
      }
    case "REMOVE_MEAL_TO_PLAN":
      delete state.plans[action.payload]
      delete state.selectedPlans[action.payload]
      return {
        ...state
      };
    case "SELECT_PLAN_TYPE":
      return {
        ...state,
        selectedPlan: action.payload
      }
    case "SELECT_MEAL_PLAN_TYPE":
      return {
        ...state,
        selectedMealType: action.payload,
      }
    case "CHANGE_SELECTED_PLAN":
      const plan = state.selectedPlans[action.payload];
      const selectMeal = Array.isArray(plan) ? plan.at(0)?.mealType : plan?.meals?.at(0)?.mealType;
      return {
        ...state,
        selectedPlan: action.payload,
        selectedMealType: selectMeal
      }
    case "SAVE_MEAL_TYPE": {
      const selectedPlan = action.payload.selectedPlan
      const currentPlan = state.selectedPlans[selectedPlan];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];

      if (action.payload.type === "new") {
        const updatedMeals = [
          ...currentMeals,
          { mealType: action.payload.mealType, meals: [], defaultMealTiming: "" },
        ];

        return {
          ...state,
          selectedPlans: {
            ...state.selectedPlans,
            [selectedPlan]: isArray
              ? updatedMeals
              : { ...currentPlan, meals: updatedMeals },
          },
          selectedMealType: action.payload.mealType,
        };
      }

      if (action.payload.type === "edit") {
        const updatedMeals = currentMeals.map((mealPlan, index) =>
          index === action.payload.index
            ? { ...mealPlan, mealType: action.payload.mealType }
            : mealPlan
        );

        return {
          ...state,
          selectedPlans: {
            ...state.selectedPlans,
            [selectedPlan]: isArray
              ? updatedMeals
              : { ...currentPlan, meals: updatedMeals },
          },
          selectedMealType: action.payload.mealType,
        };
      }
      const updatedMeals = currentMeals.filter(
        (_, index) => index !== action.payload.index
      );
      const newSelectedMealType =
        updatedMeals.at(updatedMeals.length - 1)?.mealType || "";

      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [selectedPlan]: isArray
            ? updatedMeals
            : { ...currentPlan, meals: updatedMeals },
        },
        selectedMealType: newSelectedMealType,
      };
    }
    case "SAVE_RECIPE": {
      const { recipe, index, selectedDay, selectedMealType } = action.payload;
      const currentPlan = state.selectedPlans[selectedDay];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];
      const defaultMealTiming = getMealTypeDefaultTiming(
        state.selectedPlans,
        selectedDay,
        selectedMealType
      );
      const normalizedRecipe = normalizeRecipeForMealPlan(recipe);
      const resolvedTime = resolveMealTime(normalizedRecipe, defaultMealTiming);
      const dishesPayload = {
        ...normalizedRecipe,
        per_100g: normalizedRecipe.per_100g || buildPer100gSnapshot(normalizedRecipe),
        time: resolvedTime,
        isNew: !resolvedTime,
      };

      if (index || index === 0) {
        const updatedMeals = currentMeals.map((mealType) =>
          mealType.mealType === selectedMealType
            ? {
              ...mealType,
              meals: mealType.meals.map((meal, i) =>
                i === index ? { ...meal, ...dishesPayload } : meal
              ),
            }
            : mealType
        );

        return {
          ...state,
          selectedPlans: {
            ...state.selectedPlans,
            [selectedDay]: isArray
              ? updatedMeals
              : { ...currentPlan, meals: updatedMeals },
          },
        };
      }

      const updatedMeals = currentMeals.map((mealType) =>
        mealType.mealType === selectedMealType
          ? {
            ...mealType,
            meals: [
              ...(mealType.meals || []),
              {
                ...dishesPayload,
                isNew: false,
              },
            ],
          }
          : mealType
      );

      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [selectedDay]: isArray
            ? updatedMeals
            : { ...currentPlan, meals: updatedMeals },
        },
      };
    }
    case "DELETE_RECIPE": {
      const { idx, selectedDay, selectedMealType } = action.payload
      const currentPlan = state.selectedPlans[selectedDay];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];

      const updatedMeals = currentMeals.map((mealType) =>
        mealType.mealType === selectedMealType
          ? {
            ...mealType,
            meals: mealType.meals.filter((_, index) => index !== idx),
          }
          : mealType
      );

      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [selectedDay]: isArray
            ? updatedMeals
            : { ...currentPlan, meals: updatedMeals },
        },
      };
    }
    case "MEAL_PLAN_CREATED":
      return {
        ...state,
        plans: {
          [action.payload.type]: action.payload.value
        }
      }

    case "ADD_NEW_PLAN_TYPE":
      const formatted = format(parse(action.payload, "yyyy-MM-dd", new Date()), "dd-MM-yyyy");
      
      // Find default timings from existing dates
      // Collect all default timings for each meal type across all dates
      const defaultTimingsMap = {};
      const existingDates = Object.keys(state.selectedPlans);
      
      if (existingDates.length > 0) {
        // Collect default timings from all existing dates
        existingDates.forEach(date => {
          const plan = state.selectedPlans[date];
          const meals = Array.isArray(plan) ? plan : plan?.meals || [];
          
          meals.forEach(meal => {
            if (meal?.mealType && typeof meal?.defaultMealTiming === "string" && meal.defaultMealTiming.length > 0) {
              const mealType = meal.mealType;
              // Use the first non-empty default timing found for each meal type
              // This ensures we get the default timing that was set via SetMealTimingsDialog
              if (!defaultTimingsMap[mealType]) {
                defaultTimingsMap[mealType] = meal.defaultMealTiming;
              }
            }
          });
        });
      }
      
      // Create meal types with default timings if available
      const newMealTypes = createDefaultMealTypes().map(mealType => ({
        ...mealType,
        defaultMealTiming: defaultTimingsMap[mealType.mealType] || mealType.defaultMealTiming
      }));
      
      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [formatted]: newMealTypes
        },
        selectedPlan: formatted,
        selectedMealType: "Breakfast"
      }

    case "COPY_ALL_MEAL_PLANS": {
      const fromPlan = state.selectedPlans[action.payload.from];
      if (fromPlan == null) {
        return { ...state, selectedPlans: { ...state.selectedPlans } };
      }
      let cloned;
      try {
        cloned = structuredClone(fromPlan);
      } catch {
        cloned = JSON.parse(JSON.stringify(fromPlan));
      }
      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [action.payload.to]: cloned,
        },
      };
    }

    case "COPY_MEAL_REPLACE_DESTINATIONS": {
      const { replacements = [] } = action.payload || {};
      if (!Array.isArray(replacements) || replacements.length === 0) return state;

      const updatedPlans = { ...state.selectedPlans };

      replacements.forEach(({ fromPlan, fromMealIndex, toPlan, toMealType }) => {
        if (!fromPlan || typeof fromMealIndex !== "number" || !toPlan) return;

        const sourcePlan = state.selectedPlans[fromPlan];
        const sourceMealsArray = Array.isArray(sourcePlan)
          ? sourcePlan
          : sourcePlan?.meals || [];

        const sourceMealEntry = sourceMealsArray[fromMealIndex];
        if (!sourceMealEntry) return;

        const normalizedMealType = toMealType || sourceMealEntry?.mealType || sourceMealEntry?.fromMealType;
        if (!normalizedMealType) return;

        const mealsToCopy = Array.isArray(sourceMealEntry?.meals)
          ? sourceMealEntry.meals.map((meal) => ({ ...meal }))
          : [];

        let targetPlan = updatedPlans[toPlan] || [];
        const targetIsArray = Array.isArray(targetPlan);
        let targetMealsArray = targetIsArray ? targetPlan : targetPlan?.meals || [];
        if (targetMealsArray.length === 0) {
          targetMealsArray = createDefaultMealTypes();
          targetPlan = targetMealsArray;
        }
        const targetIndex = targetMealsArray.findIndex((meal) => meal.mealType === normalizedMealType);

        const nextMealsArray = targetIndex >= 0
          ? targetMealsArray.map((meal, index) =>
            index === targetIndex
              ? {
                ...meal,
                mealType: normalizedMealType,
                meals: mealsToCopy,
              }
              : meal,
          )
          : [
            ...targetMealsArray,
            {
              mealType: normalizedMealType,
              meals: mealsToCopy,
              defaultMealTiming:
                (typeof sourceMealEntry?.defaultMealTiming === "string" &&
                  sourceMealEntry.defaultMealTiming.length > 0
                  ? sourceMealEntry.defaultMealTiming
                  : undefined) ?? "",
            },
          ];

        updatedPlans[toPlan] = targetIsArray
          ? nextMealsArray
          : {
            ...targetPlan,
            meals: nextMealsArray,
          };
      });
      // return state
      return {
        ...state,
        selectedPlans: updatedPlans,
      }
    }

    case "DELETE_MONTHLY_DATE":
      delete state.selectedPlans[action.payload]
      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
        }
      }
    case "CHANGE_MONTHLY_DATE":
      const {
        selectedPlans: {
          [action.payload.prev]: previous,
          ...remainingPlans
        },
        ...rest
      } = state;

      // Get all current dates and sort them to find the earliest (start date)
      const allDates = Object.keys(state.selectedPlans).sort((dateA, dateB) => {
        return isBefore(
          parse(dateA, "dd-MM-yyyy", new Date()),
          parse(dateB, "dd-MM-yyyy", new Date())
        ) ? -1 : 1;
      });

      const currentStartDate = allDates[0];
      const isChangingStartDate = action.payload.prev === currentStartDate;

      // If changing the start date, regenerate the entire date range
      if (isChangingStartDate) {
        const numberOfDays = allDates.length;
        const newStartDate = parse(action.payload.new, "dd-MM-yyyy", new Date());
        const newPlans = {};
        const sortedOldPlans = allDates.map(date => ({
          date,
          plan: state.selectedPlans[date]
        }));

        // Generate new dates from the new start date
        for (let i = 0; i < numberOfDays; i++) {
          const newDateKey = format(addDays(newStartDate, i), "dd-MM-yyyy");
          // Map existing meal data to new dates, preserving order
          // If we have data for the old date at index i, use it; otherwise use empty structure
          const oldPlanData = sortedOldPlans[i]?.plan;
          if (oldPlanData) {
            newPlans[newDateKey] = oldPlanData;
          } else {
            // If no data exists for this index, create default structure
            newPlans[newDateKey] = createDefaultMealTypes();
          }
        }

        return {
          ...rest,
          selectedPlans: newPlans,
          selectedPlan: action.payload.new,
        };
      }

      // If not changing start date, just update that specific date (original behavior)
      return {
        ...rest,
        selectedPlans: {
          ...remainingPlans,
          [action.payload.new]: previous
        },
        selectedPlan: action.payload.new,
      };
    case "REORDER_MEAL_TYPES": {
      const { oldIndex, newIndex } = action.payload;
      const currentPlan = state.selectedPlans[state.selectedPlan];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];

      if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= currentMeals.length || newIndex >= currentMeals.length) {
        return state;
      }

      const reorderedMeals = [...currentMeals];
      const [movedMeal] = reorderedMeals.splice(oldIndex, 1);
      reorderedMeals.splice(newIndex, 0, movedMeal);

      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [state.selectedPlan]: isArray
            ? reorderedMeals
            : { ...currentPlan, meals: reorderedMeals },
        },
      };
    }

    case "REORDER_MEAL_TYPES_ALL_PLANS": {
      const { activeMealType, overMealType } = action.payload ?? {};
      if (!activeMealType || !overMealType || activeMealType === overMealType) {
        return state;
      }

      const reorderByMealType = (meals) => {
        if (!Array.isArray(meals)) return meals;
        const oldIndex = meals.findIndex((meal) => meal?.mealType === activeMealType);
        const newIndex = meals.findIndex((meal) => meal?.mealType === overMealType);

        if (
          oldIndex === -1 ||
          newIndex === -1 ||
          oldIndex === newIndex ||
          oldIndex < 0 ||
          newIndex < 0 ||
          oldIndex >= meals.length ||
          newIndex >= meals.length
        ) {
          return meals;
        }

        const reordered = [...meals];
        const [movedMeal] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, movedMeal);
        return reordered;
      };

      const updatedPlans = Object.entries(state.selectedPlans || {}).reduce((acc, [planKey, planValue]) => {
        if (Array.isArray(planValue)) {
          acc[planKey] = reorderByMealType(planValue);
          return acc;
        }

        if (Array.isArray(planValue?.meals)) {
          acc[planKey] = {
            ...planValue,
            meals: reorderByMealType(planValue.meals),
          };
          return acc;
        }

        acc[planKey] = planValue;
        return acc;
      }, {});

      return {
        ...state,
        selectedPlans: updatedPlans,
      };
    }

    case "SET_MEAL_TYPE_ORDER_ALL_PLANS": {
      const { mealTypeOrder = [] } = action.payload ?? {};
      if (!Array.isArray(mealTypeOrder) || mealTypeOrder.length === 0) {
        return state;
      }

      const positionMap = new Map(mealTypeOrder.map((mealType, index) => [mealType, index]));

      const sortMealsByOrder = (meals) => {
        if (!Array.isArray(meals)) return meals;
        return [...meals].sort((a, b) => {
          const indexA = positionMap.get(a?.mealType);
          const indexB = positionMap.get(b?.mealType);
          if (indexA === undefined && indexB === undefined) return 0;
          if (indexA === undefined) return 1;
          if (indexB === undefined) return -1;
          return indexA - indexB;
        });
      };

      const updatedPlans = Object.entries(state.selectedPlans || {}).reduce((acc, [planKey, planValue]) => {
        if (Array.isArray(planValue)) {
          acc[planKey] = sortMealsByOrder(planValue);
          return acc;
        }

        if (Array.isArray(planValue?.meals)) {
          acc[planKey] = {
            ...planValue,
            meals: sortMealsByOrder(planValue.meals),
          };
          return acc;
        }

        acc[planKey] = planValue;
        return acc;
      }, {});

      return {
        ...state,
        selectedPlans: updatedPlans,
      };
    }

    case "START_FROM_TODAY": {
      if (state.mode !== "monthly") return state

      const totalAddedDays = Object
        .keys(state.selectedPlans)

      const sortedDateKeys = sortDatesByKeys(totalAddedDays)

      const newPlans = {}
      let current = 0;
      const now = new Date();

      for (const date of sortedDateKeys) {
        newPlans[format(
          addDays(now, current),
          "dd-MM-yyyy"
        )] = state.selectedPlans[date]
        current++;
      }
      return {
        ...state,
        selectedPlans: newPlans,
        selectedPlan: format(now, "dd-MM-yyyy"),
        selectedMealType: newPlans[
          format(now, "dd-MM-yyyy")
        ][0].mealType
      }
    }

    case "DELETE_MEAL_TYPE_RECIPES": {
      const { selectedDay, mealType } = action.payload
      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [selectedDay]: state
          .selectedPlans[selectedDay]
          // .map(type => type.mealType === mealType ? { mealType, meals: [] } : type)
          .map(type => type.mealType === mealType ? { ...type, meals: [] } : type)
        }
      }
    }

    case "BULK_DELETE_MEAL_TYPES": {
      const { mealTypes } = action.payload
      const mealTypesSet = new Set(mealTypes)
      const availableKeys = Object.keys(state.selectedPlans)
      return {
        ...state,
        selectedPlans: checkArray(availableKeys)
          .reduce((acc, day) => {
            // const currentMeals = state.selectedPlans[day].map(({ mealType, meals }) => mealTypesSet.has(mealType)
            //   ? { mealType, meals: [] }
            //   : { mealType, meals })
             const currentDay = state.selectedPlans[day];

             const filteredMeals = currentDay.filter(
               ({ mealType }) => !mealTypesSet.has(mealType)
             );

            return {
              ...acc,
              // [day]: currentMeals
              [day]: filteredMeals
            }
          }, {})
      }
    }
    case "IMPORT_MEALS": {
      return {
        ...state,
        selectedPlans: action.payload
      }
    }
    default:
      return state;
  }
}

export function selectWorkoutType(payload) {
  return {
    type: "SELECT_MEAL_TYPE",
    payload
  }
}

export function customWorkoutUpdateField(name, value) {
  return {
    type: "CUSTOM_MEAL_UPDATE_FIELD",
    payload: {
      name,
      value
    }
  }
}
export function generateMonthlyDays(noOfDays) {
  return {
    type: "GENERATE_MONTHLY_DAYS",
    payload: Number(noOfDays),
  };
}
export function changeWorkoutPlans(day, plan) {
  return {
    type: "CHANGE_MEAL_PLAN",
    payload: {
      day,
      plan
    }
  }
}

export function removeWorkoutFromPlans(payload) {
  return {
    type: "REMOVE_MEAL_TO_PLAN",
    payload
  }
}

export function selectMealPlanType(payload) {
  return {
    type: "SELECT_MEAL_PLAN_TYPE",
    payload
  }
}

export function changeSelectedPlan(payload) {
  return {
    type: "CHANGE_SELECTED_PLAN",
    payload
  }
}

export function saveMealType(mealType, type, index, selectedPlan) {
  return {
    type: "SAVE_MEAL_TYPE",
    payload: {
      mealType,
      type,
      index,
      selectedPlan
    }
  }
}

export function saveRecipe(recipe, index, isNew, selectedDay, selectedMealType) {
  return {
    type: "SAVE_RECIPE",
    payload: {
      recipe,
      index,
      isNew,
      selectedDay,
      selectedMealType
    }
  }
}

export function exportRecipe(payload, selectedDay, selectedMealType) {
  return {
    type: "DELETE_RECIPE",
    payload: {
      idx: payload,
      selectedDay,
      selectedMealType
    }
  }
}

export function mealPlanCreated(type, value) {
  return {
    type: "MEAL_PLAN_CREATED",
    payload: {
      type,
      value
    }
  }
}

export function addNewPlanType(payload) {
  return {
    type: "ADD_NEW_PLAN_TYPE",
    payload
  }
}

export function customMealIS(type, state) {
  if (type === "new") {
    return customMealInitialState;
  } else {
    return {
      ...customMealInitialState
    }
  }
}

export function changeStateDifferentCreationMeal(payload) {
  return {
    type: "INITIAL_STATE_DIFFERENT_CREATION",
    payload
  }
}

export function copyAllMealPlans(from, to) {
  return {
    type: "COPY_ALL_MEAL_PLANS",
    payload: {
      from, to
    }
  }
}

export function replaceMealPlanSelections(replacements) {
  return {
    type: "COPY_MEAL_REPLACE_DESTINATIONS",
    payload: {
      replacements,
    },
  }
}

export function mealPlanCreationRP(state) {
  return {
    name: undefined,
    description: undefined,
    joiningDate: undefined,
    // _id: undefined,
    notes: undefined,
    image: undefined,
    meals: state.map(item => ({ mealType: item.mealType, meals: item.meals }))
  }
}

export function dailyMealRP(state) {
  return {
    title: state.title,
    description: state.description,
    guidelines: state.guidelines,
    supplements: state.supplements,
    mode: state.mode,
    image: state.image,
    ...(state.mode === "monthly" && { noOfDays: state.noOfDays })
  }
}

export function weeklyMealRP(state) {
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: state.plans
  }
}

export function monthlyMealRP(state) {
  return {
    title: state.title,
    description: state.description,
    mode: state.mode,
    plans: payload
  }
}

export function changeMonthlyDate(payload) {
  return {
    type: "CHANGE_MONTHLY_DATE",
    payload
  }
}

export function deleteMonthlyDate(payload) {
  return {
    type: "DELETE_MONTHLY_DATE",
    payload
  }
}

export function reorderMealTypes(oldIndex, newIndex) {
  return {
    type: "REORDER_MEAL_TYPES",
    payload: {
      oldIndex,
      newIndex
    }
  }
}

export function reorderMealTypesAllPlans(activeMealType, overMealType) {
  return {
    type: "REORDER_MEAL_TYPES_ALL_PLANS",
    payload: {
      activeMealType,
      overMealType,
    },
  };
}

export function setMealTypeOrderAllPlans(mealTypeOrder) {
  return {
    type: "SET_MEAL_TYPE_ORDER_ALL_PLANS",
    payload: {
      mealTypeOrder,
    },
  };
}

export function startFromToday() {
  return {
    type: "START_FROM_TODAY"
  }
}

function sortDatesByKeys(dates) {
  return dates
    .map(date => parse(date, "dd-MM-yyyy", new Date()))
    .sort((dateA, dateB) => isBefore(dateA, dateB) ? -1 : 1)
    .map(date => format(date, "dd-MM-yyyy"))
}

export function getRecipeId(recipe) {
  return recipe._id?.$oid ?? recipe._id
}