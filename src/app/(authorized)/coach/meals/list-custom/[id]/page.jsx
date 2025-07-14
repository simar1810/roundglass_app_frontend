"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Button } from "@/components/ui/button";
import { selectMealPlanType } from "@/config/state-reducers/custom-meal";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import { useParams } from "next/navigation";
import { Suspense, useReducer, useState } from "react";
import useSWR from "swr";

export default function Page() {
  const { id } = useParams();
  return <Suspense>
    <MealPlanDetailsContainer id={id} />
  </Suspense>
}

function MealPlanDetailsContainer({ id }) {
  const { isLoading, error, data } = useSWR(`custom-meal-plans/${id}`, () => getCustomMealPlans(id));
  if (isLoading) return <ContentLoader />
  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const [customPlan] = data.data || [];
  return <main className="content-container content-height-screen">
    <h4>{customPlan.title}</h4>
    <p>{customPlan.description}</p>
    <Container customPlan={customPlan} />
  </main>
}

function reducer(state, action) {
  switch (action.type) {
    case "ON_CHANGE":
      return {
        ...state,
        [action.payload.name]: action.payload.value
      }
    default:
      state;
  }
}

function Container({ customPlan }) {
  const [state, dispatch] = useReducer(reducer, {
    ...customPlan,
    selectedPlan: Object.keys(customPlan.plans)?.at(0)
  })

  function changeFieldValue(name, value) {
    return dispatch({
      type: "ON_CHANGE",
      payload: {
        name,
        value
      }
    })
  }

  const selectedMeals = state.plans[state.selectedPlan]?.meals || []

  return <div>
    <div className="mt-4 flex items-center gap-4">
      {Object.keys(state.plans).map((plan, index) => <Button
        key={index}
        variant={state.selectedPlan === plan ? "wz" : "wz_outline"}
        onClick={() => changeFieldValue("selectedPlan", plan)}
      >
        {plan}
      </Button>)}
    </div>
    <MealPlanDetails meals={selectedMeals} />
  </div>
}

function MealPlanDetails({ meals }) {
  const [selectedMealPlan, setSelectedMealPlan] = useState(meals?.at(0).mealType)
  const recipees = meals.find(mealPlan => mealPlan.mealType === selectedMealPlan)?.meals || [];
  return <div>
    <div className="mt-4 flex items-center gap-4">
      {meals.map((mealType, index) => <Button
        key={index}
        variant={selectedMealPlan === mealType.mealType ? "wz" : "wz_outline"}
        onClick={() => setSelectedMealPlan(mealType.mealType)}
      >
        {mealType.mealType}
      </Button>)}
    </div>
    <div className="mt-10 flex items-start gap-4 overflow-x-auto no-scrollbar">
      {recipees.map((recipee, index) => <div
        key={index}
        className="border-1 rounded-[10px] p-4"
      >

      </div>)}
    </div>
  </div>
}