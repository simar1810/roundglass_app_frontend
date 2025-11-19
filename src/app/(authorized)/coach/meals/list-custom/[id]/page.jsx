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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  const planKeys = useMemo(() => {
    const plans = customPlan?.plans || {};
    const keys = Object.keys(plans);

    if (keys.length === 0) return keys;

    if (customPlan?.mode === "monthly") {
      const toTime = (value) => {
        if (!value) return Number.MAX_SAFE_INTEGER;
        const [day, month, year] = value.split("-").map(Number);
        if ([day, month, year].every(Number.isFinite)) {
          const time = new Date(year, month - 1, day).getTime();
          if (Number.isFinite(time)) return time;
        }
        const fallback = new Date(value).getTime();
        return Number.isFinite(fallback) ? fallback : Number.MAX_SAFE_INTEGER;
      };

      return [...keys].sort((a, b) => toTime(a) - toTime(b));
    }

    if (customPlan?.mode === "weekly") {
      const weekOrder = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      return [...keys].sort((a, b) => {
        const ia = weekOrder.indexOf(String(a).toLowerCase());
        const ib = weekOrder.indexOf(String(b).toLowerCase());
        if (ia === -1 || ib === -1 || ia === ib) {
          return String(a).localeCompare(String(b));
        }
        return ia - ib;
      });
    }

    return keys;
  }, [customPlan?.mode, customPlan?.plans]);

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

  return <main>
    <DisplayMealStats meals={{ plans: { [selectedPlan]: customPlan.plans[selectedPlan] } }} />
    <div className="content-container content-height-screen mt-4 grid grid-cols-2 divide-x-1">
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

  const defaultVariant = useMemo(() => {
    if (customPlan?.mode === "weekly") return "landscape";
    if (customPlan?.mode === "monthly") return "compact";
    return "portrait";
  }, [customPlan?.mode]);

  const [selectedPdfVariant, setSelectedPdfVariant] = useState(defaultVariant);
  const [includeMacros, setIncludeMacros] = useState(true);

  useEffect(() => {
    setSelectedPdfVariant(defaultVariant);
  }, [defaultVariant]);

  const pdfData = useMemo(() => {
    if (!hasPlanData || !selectedPlan) return null;
    return customMealDailyPDFData(customPlan, selectedPlan, { name: coachName }, { includeMacros });
  }, [coachName, customPlan, hasPlanData, includeMacros, selectedPlan]);

  const pdfTemplateMap = {
    portrait: "PDFCustomMealPortrait",
    landscape: "PDFCustomMealLandscape",
    compact: "PDFCustomMealCompactLandscape",
    compactPortrait: "PDFCustomMealCompactPortrait",
  };

  const pdfDisabled = !pdfData || !pdfData?.plans?.some(plan => Array.isArray(plan?.meals) && plan.meals.length > 0);
  const pdfTemplateKey = pdfTemplateMap[selectedPdfVariant] || "PDFDailyMealSchedule";
  return <div className="p-4 pr-8">
    <h4 className="mr-auto mb-4">{customPlan.title}</h4>
    <div className="flex items-center gap-2">
      {!isNaN(customPlan.noOfDays) && <div className="font-bold">
        {customPlan.noOfDays} Days
      </div>}
      <Link
        href={`/coach/meals/add-custom?creationType=copy_edit&mode=${customPlan.mode}&mealId=${customPlan._id}`}
        className="ml-auto px-4 py-2 rounded-[10px] border-1 border-[var(--accent-1)] text-[var(--accent-1)] font-bold leading-[1] text-[14px]"
        variant="wz"
      >
        Copy & Edit
      </Link>
      <AssignMealModal planId={customPlan._id} type="custom" />
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
    <div className="flex flex-wrap items-center gap-4 mt-4">
      <PDFRenderer pdfTemplate={pdfTemplateKey} data={pdfData || {}}>
        <DialogTrigger
          className="px-4 py-2 rounded-[10px] border-1 border-[var(--accent-1)] text-[var(--accent-1)] font-bold leading-[1] text-[14px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={pdfDisabled}
        >
          <FileDown size={16} />
          Plan PDF
        </DialogTrigger>
      </PDFRenderer>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          id="custom-plan-macros-toggle"
          checked={includeMacros}
          onCheckedChange={setIncludeMacros}
          disabled={pdfDisabled}
        />
        <label
          htmlFor="custom-plan-macros-toggle"
          className="cursor-pointer select-none text-sm text-muted-foreground"
        >
          Show macro nutrients
        </label>
      </div>
      <div className="ml-auto">
        <Select
          value={selectedPdfVariant}
          onValueChange={setSelectedPdfVariant}
          disabled={pdfDisabled}
        >
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Select PDF Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Portrait Overview</SelectItem>
            <SelectItem value="landscape">Landscape Matrix</SelectItem>
            <SelectItem value="compact">Compact Landscape</SelectItem>
            <SelectItem value="compactPortrait">Compact Portrait</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <Image
      alt=""
      src={customPlan.image || "/not-found.png"}
      height={500}
      width={500}
      className="w-full max-h-[200 px] my-4 rounded-[10px] object-cover aspect-video"
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

export function DisplayMealStats({ meals: { plans = {} } = {} }) {
  const allMeals = useMemo(() => {
    const arr = []
    for (const plan in plans) {
      const p = plans[plan];
      if (!p) continue;
      if (p.daily && typeof p.daily === "object") {
        const d = p.daily;
        if (Array.isArray(d.breakfast)) arr.push(...d.breakfast);
        if (Array.isArray(d.lunch)) arr.push(...d.lunch);
        if (Array.isArray(d.dinner)) arr.push(...d.dinner);
        if (Array.isArray(d.snacks)) arr.push(...d.snacks);
        continue;
      }
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const isWeekly = Object.keys(p).some(k => days.includes(k.toLowerCase()));

      if (isWeekly) {
        for (const day of days) {
          const dayPlan = p[day];
          if (!dayPlan) continue;

          if (Array.isArray(dayPlan.breakfast)) arr.push(...dayPlan.breakfast);
          if (Array.isArray(dayPlan.lunch)) arr.push(...dayPlan.lunch);
          if (Array.isArray(dayPlan.dinner)) arr.push(...dayPlan.dinner);
          if (Array.isArray(dayPlan.snacks)) arr.push(...dayPlan.snacks);
        }
        continue;
      }
      if (Array.isArray(p.breakfast)) arr.push(...p.breakfast);
      if (Array.isArray(p.lunch)) arr.push(...p.lunch);
      if (Array.isArray(p.dinner)) arr.push(...p.dinner);
      if (Array.isArray(p.snacks)) arr.push(...p.snacks);
    }
    return arr;
  }, [plans])

  const totals = useMemo(() => {
    return allMeals.reduce(
      (acc, meal) => {
        const caloriesVal =
          typeof meal?.calories === "object"
            ? meal?.calories?.total
            : meal?.calories;
        const proteinVal = meal?.protein ?? meal?.calories?.proteins;
        const carbsVal = meal?.carbohydrates ?? meal?.calories?.carbs;
        const fatsVal = meal?.fats ?? meal?.calories?.fats;

        acc.calories += parseNum(caloriesVal);
        acc.protein += parseNum(proteinVal);
        acc.carbohydrates += parseNum(carbsVal);
        acc.fats += parseNum(fatsVal);
        return acc;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
    );
  }, [allMeals]);

  return <div className="bg-white rounded-[10px]">
    <div className="rounded-lg border px-4 py-2 text-sm text-muted-foreground grid grid-cols-4 gap-6">
      <div>{totals.calories.toFixed(2)} Calories</div>
      <div>{totals.protein.toFixed(2)} Protein</div>
      <div>{totals.fats.toFixed(2)} Fats</div>
      <div>{totals.carbohydrates.toFixed(2)} Carbs</div>
    </div>
  </div>
}

function parseNum(val) {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}