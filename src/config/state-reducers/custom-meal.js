import { format, parse } from "date-fns";
import { customMealInitialState } from "../state-data/custom-meal";
import { DAYS } from "../data/ui";

export const defaultMealTypes = [
  {
    mealType: "Breakfast",
    meals: []
  },
  {
    mealType: "Morning Snacks",
    meals: []
  },
  {
    mealType: "Lunch",
    meals: []
  },
  {
    mealType: "Evening Snacks",
    meals: []
  },
  {
    mealType: "Dinner",
    meals: []
  },
]

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
          daily: defaultMealTypes
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
          acc[curr] = defaultMealTypes;
          return acc;
        }, {})
      }
      return {
        ...state,
        stage: 2,
        mode: "monthly",
        creationType: "new",
        selectedPlan: format(new Date(), 'dd-MM-yyyy'),
        selectedMealType: "Breakfast",
        selectedPlans: {
          [format(new Date(), 'dd-MM-yyyy')]: defaultMealTypes
        }
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
      const currentPlan = state.selectedPlans[state.selectedPlan];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];

      if (action.payload.type === "new") {
        const updatedMeals = [
          ...currentMeals,
          { mealType: action.payload.mealType, meals: [] },
        ];

        return {
          ...state,
          selectedPlans: {
            ...state.selectedPlans,
            [state.selectedPlan]: isArray
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
            [state.selectedPlan]: isArray
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
          [state.selectedPlan]: isArray
            ? updatedMeals
            : { ...currentPlan, meals: updatedMeals },
        },
        selectedMealType: newSelectedMealType,
      };
    }
    case "SAVE_RECIPE": {
      const { recipe, index, isNew } = action.payload;
      const currentPlan = state.selectedPlans[state.selectedPlan];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];
      const defaultMealTiming = currentMeals
        ?.find(mealType => mealType.mealType === state.selectedMealType)
        ?.meals
        ?.at(0)
        ?.time || ""
      const dishesPayload = !isNew
        ? {
          ...recipe,
          dish_name: recipe.dish_name || recipe.title,
          image: recipe.image || recipe.image,
          fats: recipe.fats || recipe?.calories?.fats,
          calories: recipe?.calories?.total || recipe.calories,
          protein: recipe.protein || recipe?.calories?.proteins,
          carbohydrates: recipe.carbohydrates || recipe?.calories?.carbs,
          measure: recipe.measure,
          isNew: !recipe.time || false,
        }
        : {
          time: recipe.time || defaultMealTiming,
          isNew: false,
        };

      if (index || index === 0) {
        const updatedMeals = currentMeals.map((mealType) =>
          mealType.mealType === state.selectedMealType
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
            [state.selectedPlan]: isArray
              ? updatedMeals
              : { ...currentPlan, meals: updatedMeals },
          },
        };
      }

      const updatedMeals = currentMeals.map((mealType) =>
        mealType.mealType === state.selectedMealType
          ? {
            ...mealType,
            meals: [
              ...(mealType.meals || []),
              {
                ...recipe,
                dish_name: recipe.dish_name || recipe.name,
                fats: recipe.fats || recipe?.calories?.fats,
                calories: recipe.calories || recipe?.calories?.total,
                protein: recipe.protein || recipe?.calories?.proteins,
                carbohydrates: recipe.carbohydrates || recipe?.calories?.carbs,
                measure: recipe.measure,
                isNew: true,
              },
            ],
          }
          : mealType
      );

      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [state.selectedPlan]: isArray
            ? updatedMeals
            : { ...currentPlan, meals: updatedMeals },
        },
      };
    }
    case "DELETE_RECIPE": {
      const currentPlan = state.selectedPlans[state.selectedPlan];
      const isArray = Array.isArray(currentPlan);
      const currentMeals = isArray ? currentPlan : currentPlan?.meals || [];

      const updatedMeals = currentMeals.map((mealType) =>
        mealType.mealType === state.selectedMealType
          ? {
            ...mealType,
            meals: mealType.meals.filter((_, index) => index !== action.payload),
          }
          : mealType
      );

      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [state.selectedPlan]: isArray
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
      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [formatted]: defaultMealTypes
        },
        selectedPlan: formatted,
        selectedMealType: "Breakfast"
      }

    case "COPY_ALL_MEAL_PLANS":
      return {
        ...state,
        selectedPlans: {
          ...state.selectedPlans,
          [action.payload.to]: state.selectedPlans[action.payload.from]
        }
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

        const targetPlan = updatedPlans[toPlan] || [];
        const targetIsArray = Array.isArray(targetPlan);
        const targetMealsArray = targetIsArray ? targetPlan : targetPlan?.meals || [];

        const targetIndex = targetMealsArray.findIndex((meal) => meal.mealType === normalizedMealType);

        const nextMealsArray = targetIndex >= 0
          ? targetMealsArray.map((meal, index) =>
            index === targetIndex
              ? { ...meal, mealType: normalizedMealType, meals: mealsToCopy }
              : meal,
          )
          : [...targetMealsArray, { mealType: normalizedMealType, meals: mealsToCopy }];

        updatedPlans[toPlan] = targetIsArray
          ? nextMealsArray
          : {
            ...targetPlan,
            meals: nextMealsArray,
          };
        console.log(updatedPlans)
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
          ...selectedPlans
        },
        ...rest
      } = state;
      return {
        ...rest,
        selectedPlans: {
          ...selectedPlans,
          [action.payload.new]: previous
        },
        selectedPlan: action.payload.new,
      };
    case "LOAD_AI_MEAL_PLAN": {
      const ai = action.payload.mealPlan;

      return {
        ...state,
        title: ai.title,
        description: ai.description,
        mode: ai.mode || "daily",
        creationType: "new",
        stage: 2,
        selectedPlan: "daily",
        selectedMealType:
          ai.plan?.day_1?.meals?.[0]?.mealType || "Breakfast",
        selectedPlans: Object.fromEntries(
          Object.entries(ai.plan || {}).map(([day, data]) => [
            day,
            {
              ...data,
              meals: Array.isArray(data.meals) ? data.meals : [],
            },
          ])
        ),
        isAiGenerated: true,
      };
    }
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

export function saveMealType(mealType, type, index) {
  return {
    type: "SAVE_MEAL_TYPE",
    payload: {
      mealType,
      type,
      index
    }
  }
}

export function saveRecipe(recipe, index, isNew) {
  return {
    type: "SAVE_RECIPE",
    payload: {
      recipe,
      index,
      isNew
    }
  }
}

export function exportRecipe(payload) {
  return {
    type: "DELETE_RECIPE",
    payload
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