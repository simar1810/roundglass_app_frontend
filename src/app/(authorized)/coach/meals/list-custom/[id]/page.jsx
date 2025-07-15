"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { selectMealPlanType } from "@/config/state-reducers/custom-meal";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useState } from "react";
import useSWR from "swr";

export default function Page() {
  const { id } = useParams();
  return <Suspense>
    <MealPlanDetailsContainer id={id} />
  </Suspense>
}

function MealPlanDetailsContainer({ id }) {
  const { isLoading, error, data } = useSWR(`custom-meal-plans/${id}`, () => getCustomMealPlans("coach", id));
  if (isLoading) return <ContentLoader />
  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const customPlan = data.data;
  return <main className="content-container">
    <div className="content-height-screen grid grid-cols-2 divide-x-1">
      <CustomMealMetaData customPlan={customPlan} />
      <CustomMealsListing customPlan={customPlan} />
    </div>
  </main>
}

function CustomMealMetaData({ customPlan }) {
  return <div className="p-4 pr-8">
    <div className="flex items-center gap-4">
      <h4 className="mr-auto">{customPlan.title}</h4>
      <Link
        href={`/coach/meals/add-custom?creationType=edit&mode=${customPlan.mode}&mealId=${customPlan._id}`}
        className="px-4 py-2 rounded-[10px] bg-[var(--accent-1)] text-white font-bold leading-[1] text-[14px]"
        variant="wz_outline"
      >
        Edit
      </Link>
      <Link
        href={`/coach/meals/add-custom?creationType=copy_edit&mode=${customPlan.mode}&mealId=${customPlan._id}`}
        className="px-4 py-2 rounded-[10px] border-1 border-[var(--accent-1)] text-[var(--accent-1)] font-bold leading-[1] text-[14px]"
        variant="wz"
      >
        Copy & Edit
      </Link>
    </div>
    <Image
      alt=""
      src={customPlan.image || "/not-found.png"}
      height={500}
      width={500}
      className="w-full max-h-[200px] my-4 rounded-[10px] object-cover"
      onError={e => e.target.src = "/not-found.png"}
    />
    <p>{customPlan.description}</p>
  </div >
}

function CustomMealsListing({ customPlan }) {
  const days = Object.keys(customPlan.plans || []);
  const [selectedPlan, setSelectedplan] = useState(days?.at(0));
  const [selectedMealType, setSelectedMealType] = useState(days?.at(0));

  const selectedMealTypes = customPlan.plans[selectedPlan]?.meals || [];
  const selectedMealsForMealType = (customPlan.plans[selectedPlan]?.meals || [])
    ?.find(type => type.mealType === selectedMealType)
    ?.meals || [];

  useEffect(function () {
    setSelectedMealType(customPlan.plans[selectedPlan]?.meals?.at(0)?.mealType || "");
  }, [selectedPlan]);

  return <div className="p-4 pl-8">
    <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar">
      {days.map(day => <Button
        key={day}
        variant={day === selectedPlan ? "wz" : "wz_outline"}
        onClick={() => setSelectedplan(day)}
      >
        {day}
      </Button>)}
    </div>
    <Separator />
    <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar">
      {selectedMealTypes.map((mealType, index) => <Button
        key={index}
        variant={mealType.mealType === selectedMealType ? "wz" : "wz_outline"}
        onClick={() => setSelectedMealType(mealType.mealType)}
      >
        {mealType.mealType}
      </Button>)}
    </div>
    <div className="mt-8 grid grid-cols-2 gap-4">
      {selectedMealsForMealType.map((meal, index) => <MealDetails
        key={index}
        meal={meal}
      />)}
    </div>
  </div>
}

function MealDetails({ meal }) {
  return <div className="border-1 rounded-[10px] overflow-clip">
    <Image
      alt=""
      src={meal.image || "/not-found.png"}
      height={200}
      width={200}
      className="w-full max-h-[180px] object-cover border-b-1"
    />
    <div className="p-3 text-md">
      <h3>{meal.dish_name}</h3>
      <p className="text-black/60 text-xs mt-1">{meal.description}</p>
    </div>
  </div>
}