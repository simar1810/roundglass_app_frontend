"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import AssignMealModal from "@/components/modals/Assignmealmodal";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import PDFRenderer from "@/components/modals/PDFRenderer";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { sendData } from "@/lib/api";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import { customMealDailyPDFData } from "@/lib/pdf";
import { useAppSelector } from "@/providers/global/hooks";
import { FileDown, SquarePen, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

export default function Page() {
  const { id } = useParams();
  return <Suspense>
    <MealPlanDetailsContainer id={id} />
  </Suspense>
}

function MealPlanDetailsContainer({ id }) {
  const { isLoading, error, data } = useSWR(`custom-meal-plans/${id}`, () => getCustomMealPlans("coach", id));

  const responseData = data?.data;
  const hasNoPlan = Array.isArray(responseData) ? responseData.length === 0 : !responseData;
  const customPlan = Array.isArray(responseData) ? responseData[0] : responseData;
  const planKeys = useMemo(() => Object.keys(customPlan?.plans || {}), [customPlan?.plans]);

  const [selectedPlan, setSelectedPlan] = useState(() => planKeys.at(0) || "");
  const [selectedMealType, setSelectedMealType] = useState("");

  useEffect(() => {
    if (planKeys.length === 0) {
      if (selectedPlan) setSelectedPlan("");
      return;
    }

    if (!planKeys.includes(selectedPlan)) {
      setSelectedPlan(planKeys[0]);
    }
  }, [planKeys, selectedPlan]);

  useEffect(() => {
    if (!selectedPlan) {
      if (selectedMealType) setSelectedMealType("");
      return;
    }

    const planForDay = customPlan?.plans?.[selectedPlan];
    const mealsForPlan = Array.isArray(planForDay)
      ? planForDay
      : Array.isArray(planForDay?.meals)
        ? planForDay.meals
        : [];

    if (mealsForPlan.length === 0) {
      if (selectedMealType) setSelectedMealType("");
      return;
    }

    const hasSelected = mealsForPlan.some(entry => entry?.mealType === selectedMealType);
    if (!hasSelected) {
      setSelectedMealType(mealsForPlan[0]?.mealType || "");
    }
  }, [customPlan?.plans, selectedPlan, selectedMealType]);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200 || hasNoPlan) {
    return <ContentError
      title={error || data?.message || "No Such Plan Found!"}
    />
  }

  return <main className="content-container">
    <div className="content-height-screen grid grid-cols-2 divide-x-1">
      <CustomMealMetaData
        customPlan={customPlan}
        selectedPlan={selectedPlan}
        hasPlanData={planKeys.length > 0}
      />
      <CustomMealsListing
        customPlan={customPlan}
        days={planKeys}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
        selectedMealType={selectedMealType}
        onMealTypeChange={setSelectedMealType}
      />
    </div>
  </main>
}

function CustomMealMetaData({ customPlan, selectedPlan, hasPlanData }) {
  const coach = useAppSelector(state => state.coach.data);
  const coachName = coach?.name || "";

  const pdfData = useMemo(() => {
    if (!hasPlanData || !selectedPlan) return null;
    return customMealDailyPDFData(customPlan, selectedPlan, { name: coachName });
  }, [coachName, customPlan, hasPlanData, selectedPlan]);

  const pdfDisabled = !pdfData || !pdfData.meals?.length;

  return <div className="p-4 pr-8">
    <div className="flex items-center gap-2">
      <h4 className="mr-auto">{customPlan.title}</h4>
      <PDFRenderer pdfTemplate="PDFDailyMealSchedule" data={pdfData || {}}>
        <DialogTrigger
          className="px-4 py-2 rounded-[10px] border-1 border-[var(--accent-1)] text-[var(--accent-1)] font-bold leading-[1] text-[14px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={pdfDisabled}
        >
          <FileDown size={16} />
          Plan PDF
        </DialogTrigger>
      </PDFRenderer>
      <Link
        href={`/coach/meals/add-custom?creationType=copy_edit&mode=${customPlan.mode}&mealId=${customPlan._id}`}
        className="px-4 py-2 rounded-[10px] border-1 border-[var(--accent-1)] text-[var(--accent-1)] font-bold leading-[1] text-[14px]"
        variant="wz"
      >
        Copy & Edit
      </Link>
      {!customPlan.admin && <>
        <Link
          href={`/coach/meals/add-custom?creationType=edit&mode=${customPlan.mode}&mealId=${customPlan._id}`}
          className="px-4 py-2 rounded-[10px] bg-[var(--accent-1)] text-white font-bold leading-[1] text-[14px]"
          variant="wz_outline"
        >
          Edit
        </Link>
        <DeleteCustomMealPlan id={customPlan._id} />
      </>}
    </div>
    <AssignMealModal planId={customPlan._id} type="custom" />
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

function CustomMealsListing({
  customPlan,
  days = [],
  selectedPlan,
  onPlanChange,
  selectedMealType,
  onMealTypeChange,
}) {
  const planForDay = selectedPlan ? customPlan.plans?.[selectedPlan] : undefined;
  const selectedMealTypes = Array.isArray(planForDay)
    ? planForDay
    : Array.isArray(planForDay?.meals)
      ? planForDay.meals
      : [];

  const selectedMealsForMealType = selectedMealTypes
    .find(type => type?.mealType === selectedMealType)?.meals || [];

  return <div className="p-4 pl-8 relative">
    {customPlan.draft && <Badge className="absolute top-2 right-2">
      <SquarePen />
      Draft
    </Badge>}
    <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
      {days.map(day => <Button
        key={day}
        variant={day === selectedPlan ? "wz" : "wz_outline"}
        onClick={() => onPlanChange?.(day)}
      >
        {day}
      </Button>)}
    </div>
    <Separator />
    <div className="flex gap-4 mt-8 overflow-x-auto pb-4">
      {selectedMealTypes.map((mealType, index) => <Button
        key={index}
        variant={mealType.mealType === selectedMealType ? "wz" : "wz_outline"}
        onClick={() => onMealTypeChange?.(mealType.mealType)}
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
      <p className="text-[14px] text-[#808080]">{meal.meal_time}</p>
    </div>
  </div>
}

export function DeleteCustomMealPlan({ id }) {
  const { cache } = useSWRConfig()
  const router = useRouter();
  async function deleteCustomPlan(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData(`app/meal-plan/custom?id=${id}`, {}, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      cache.delete("custom-meal-plans")
      router.push("/coach/meals/list-custom")
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    description="Are you sure to delete this custom meal plan?"
    action={(setLoading, closeBtnRef) => deleteCustomPlan(setLoading, closeBtnRef)}
  >
    <AlertDialogTrigger>
      <Trash2 className="text-[var(--accent-2)]" />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}