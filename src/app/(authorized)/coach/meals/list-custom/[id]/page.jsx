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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAYS } from "@/config/data/ui";
import { sendData } from "@/lib/api";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import { checkArray } from "@/lib/formatter";
import { customMealDailyPDFData } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { ChevronsUpDown, CopyPlus, FileDown, ListCollapse, MoreVertical, SquarePen, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { ChevronDown, Zap, ShieldCheck, Droplets, Wheat } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";

export default function Page() {
  const [viewType, setViewType] = useState("horizontal") // horizontal, vertical
  const { id } = useParams();
  return <Suspense>
    <MealPlanDetailsContainer
      viewType={viewType}
      onToggleViewType={() => setViewType(prev => prev === "horizontal" ? "vertical" : "horizontal")}
      id={id}
    />
  </Suspense>
}

function MealPlanDetailsContainer({
  viewType,
  onToggleViewType,
  id
}) {
  const { isLoading, error, data } = useSWR(`custom-meal-plans/${id}`, () => getCustomMealPlans("coach", id), {
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

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
      // Order by DAYS (sun..sat); support both short (sun,mon) and full (sunday,monday) keys.
      const shortToIndex = Object.fromEntries(DAYS.map((d, i) => [d, i]));
      const fullToShort = { sunday: "sun", monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu", friday: "fri", saturday: "sat" };
      const getIndex = (k) => {
        const lower = String(k).toLowerCase();
        const short = fullToShort[lower] ?? lower;
        return shortToIndex[short];
      };
      return [...keys].sort((a, b) => {
        const ia = getIndex(a);
        const ib = getIndex(b);
        if (ia === undefined || ib === undefined) return String(a).localeCompare(String(b));
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
    <div className={cn("flex items-center justify-between")}>
      <DisplayMealStats
        meals={{ plans: { [selectedPlan]: customPlan.plans[selectedPlan] } }}
      />
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-gray-200 gap-2">
            <button
              onClick={() => onToggleViewType("horizontal")}
              className={`p-2 rounded-[8px] transition-all duration-200 ${viewType === 'horizontal'
                ? 'bg-white shadow-sm border border-gray-100'
                : 'opacity-50 hover:opacity-100'
                }`}
            >
              <img
                src="/horizontal.svg"
                alt="Horizontal"
                className="w-5 h-5 object-contain"
              />
            </button>
            <button
              onClick={() => onToggleViewType("vertical")}
              className={`p-2 rounded-[8px] transition-all duration-200 ${viewType === 'vertical'
                ? 'bg-white shadow-sm border border-gray-100'
                : 'opacity-50 hover:opacity-100'
                }`}
            >
              <img
                src="/vertical.svg"
                alt="Vertical"
                className="w-5 h-5 object-contain"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className={cn("content-container content-height-screen mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:divide-x-1", viewType === "vertical" && "md:grid-cols-1")}>
      <CustomMealMetaData
        customPlan={customPlan}
        selectedPlan={selectedPlan}
        hasPlanData={planKeys.length > 0}
        viewType={viewType}
      />
      <CustomMealsListing
        customPlan={customPlan}
        days={planKeys}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
        viewType={viewType}
      />
    </div>
  </main>
}

function CustomMealMetaData({
  viewType,
  customPlan,
  selectedPlan,
  hasPlanData,
}) {
  const coach = useAppSelector((state) => state.coach.data);
  const coachName = coach?.name || "";

  const defaultVariant = useMemo(() => "signatureLandscape", []);

  const [selectedPdfVariant, setSelectedPdfVariant] =
    useState(defaultVariant);

  const [includeMacros, setIncludeMacros] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeGuidelines, setIncludeGuidelines] = useState(true);
  const [includeSupplements, setIncludeSupplements] = useState(true);

  useEffect(() => {
    setSelectedPdfVariant(defaultVariant);
  }, [defaultVariant]);

  const pdfData = useMemo(() => {
    if (!hasPlanData || !selectedPlan) return null;

    return customMealDailyPDFData(
      customPlan,
      selectedPlan,
      { name: coachName },
      {
        includeMacros,
        includeDescription,
        includeGuidelines,
        includeSupplements,
      }
    );
  }, [
    coachName,
    customPlan,
    hasPlanData,
    includeMacros,
    includeDescription,
    includeGuidelines,
    includeSupplements,
    selectedPlan,
  ]);

  const pdfTemplateMap = {
    portrait: "PDFCustomMealPortrait",
    landscape: "PDFCustomMealLandscape",
    compact: "PDFCustomMealCompactLandscape",
    compactPortrait: "PDFCustomMealCompactPortrait",
    signatureLandscape: "PDFSignatureLandscapeRemap",
  };

  const pdfDisabled =
    !pdfData ||
    !pdfData?.plans?.some(
      (plan) => Array.isArray(plan?.meals) && plan.meals.length > 0
    );

  const pdfTemplateKey =
    pdfTemplateMap[selectedPdfVariant] || "PDFDailyMealSchedule";

  const modeParam = customPlan.mode || "daily";

  const links = {
    continue: `/coach/meals/add-custom?creationType=edit&mode=${modeParam}&mealId=${customPlan._id}`,
    copy: `/coach/meals/add-custom?creationType=copy_edit&mode=${modeParam}&mealId=${customPlan._id}`,
    edit: `/coach/meals/add-custom?creationType=edit&mode=${modeParam}&mealId=${customPlan._id}`,
  };

  return (
    <div className="rounded-2xl border-1 bg-slate-50/20 p-5">
      <div
        className={cn(
          "gap-5",
          viewType === "vertical"
            ? "flex items-start"
            : "flex flex-col"
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-xl border bg-gray-100 shrink-0",
            viewType === "vertical"
              ? "w-[400px] aspect-video"
              : "w-full h-[200px]"
          )}
        >
          <Image
            alt=""
            src={customPlan.image || "/not-found.png"}
            height={500}
            width={500}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = "/not-found.png")}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {customPlan.title}
              </h4>

              {!isNaN(customPlan.noOfDays) && (
                <p className="text-sm text-gray-500">
                  {customPlan.noOfDays} Days
                </p>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {customPlan.draft ? (
                <>
                  <Link
                    href={links.continue}
                    className="btn-primary"
                  >
                    Continue
                  </Link>
                  {!customPlan.admin && (
                    <DeleteCustomMealPlan id={customPlan._id} />
                  )}
                </>
              ) : (
                <>
                    <Link
                      href={links.copy}
                      className="group inline-flex items-center gap-2.5 px-6 py-2 border-1 border-[var(--accent-1)] rounded-lg text-sm font-bold text-[var(--accent-1)] hover:text-white shadow-lg transition-all duration-200 hover:bg-[var(--accent-1)] hover:border-slate-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    >
                      <CopyPlus
                        size={16}
                        className="transition-transform group-hover:scale-110 group-hover:rotate-6"
                      />
                      <span className="tracking-tight">Copy & Edit</span>
                    </Link>
                  <AssignMealModal
                    plan={customPlan}
                    planId={customPlan._id}
                    type="custom"
                  />

                  {!customPlan.admin && (
                    <>
                      <Link
                        href={links.edit}
                        className="btn-primary"
                      >
                        Edit
                      </Link>
                      <DeleteCustomMealPlan id={customPlan._id} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PDFRenderer
              pdfTemplate={pdfTemplateKey}
              data={pdfData || {}}
            >
              <DialogTrigger
                disabled={pdfDisabled}
                className="btn-primary flex items-center gap-2"
              >
                <FileDown size={16} />
                Download
              </DialogTrigger>
            </PDFRenderer>

            <Select
              value={selectedPdfVariant}
              onValueChange={setSelectedPdfVariant}
              disabled={pdfDisabled}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="signatureLandscape">Signature landscape</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="compactPortrait">
                  Compact Portrait
                </SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {[
                  ["Macros", includeMacros, setIncludeMacros],
                  ["Recipe", includeDescription, setIncludeDescription],
                  ["Guidelines", includeGuidelines, setIncludeGuidelines],
                  ["Supplements", includeSupplements, setIncludeSupplements],
                ].map(([label, state, setter]) => (
                  <DropdownMenuCheckboxItem
                    key={label}
                    checked={state}
                    onCheckedChange={(v) => setter(v === true)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            {customPlan.description && (
              <Section title="Description">
                {customPlan.description}
              </Section>
            )}

            {customPlan.guidelines && (
              <Section title="Guidelines">
                {customPlan.guidelines}
              </Section>
            )}

            {customPlan.supplements && (
              <Section title="Supplements">
                {customPlan.supplements}
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h5 className="text-sm font-semibold text-gray-900 mb-1">
        {title}
      </h5>
      <p className="text-sm text-gray-600 leading-relaxed">
        {children}
      </p>
    </div>
  );
}


function CustomMealsListing({
  customPlan,
  days = [],
  selectedPlan,
  onPlanChange,
  viewType,
}) {
	const [isExpanded, setIsExpanded] = useState(false)
  const filteredDays = days.filter(day => viewType === "vertical" || day === selectedPlan)

	const handleToggle = function() {
		setIsExpanded(prev => !prev)
	}

  return <div className={cn(viewType === "horizontal" && "p-4 relative bg-slate-50/20 border-1 rounded-xl")}>
    {customPlan.draft && <Badge className="absolute top-2 right-2">
      <SquarePen />
      Draft
    </Badge>}
    {customPlan?.mode !== "daily" &&
      viewType !== "vertical" && <>
        <div className="flex gap-4 overflow-x-auto">
          {days.map(day => <Button
            key={day}
            variant={day === selectedPlan ? "wz" : "wz_outline"}
            onClick={() => onPlanChange?.(day)}
          >
            {/^\d{2}-\d{2}-\d{4}$/.test(day) ? day : day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}
          </Button>)}
        </div>
      </>}
    {viewType === "vertical" && (
      <button
        onClick={handleToggle}
        className="group flex items-center gap-2 px-2.5 py-1.5 
                      text-[13px] font-medium text-slate-500 
                      bg-transparent rounded-md mb-4
                      hover:bg-slate-100 hover:text-slate-800 
                      transition-all duration-150 active:scale-95"
      >
        {isExpanded ? (
          <>
            <ListCollapse className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span>Collapse All</span>
          </>
        ) : (
          <>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span>Expand All</span>
          </>
        )}
      </button>
    )}
    {filteredDays.map(day => <MealDayDetails
      customPlan={customPlan}
      key={day}
      selectedPlan={selectedPlan}
      onPlanChange={onPlanChange}
      day={day}
      viewType={viewType}
      isExpanded={isExpanded}
    />)}
  </div>
}

function MealDayDetails({ customPlan, selectedPlan, day, viewType, isExpanded }) {
  const [isOpen, setIsOpen] = useState(true);
  const dayLabel = useMemo(() => {
    if (customPlan?.mode === "daily") return "DAILY";
    if (/^\d{2}-\d{2}-\d{4}$/.test(day)) return day;
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }, [customPlan?.mode, day]);

  useEffect(() => {
    if (viewType === "vertical" && isExpanded !== undefined) {
      setIsOpen(isExpanded);
    }
  }, [isExpanded, viewType]);

  const planForDay = selectedPlan ? customPlan.plans?.[day] : undefined;
  const selectedMealTypes = Array.isArray(planForDay)
    ? planForDay
    : Array.isArray(planForDay?.meals)
      ? planForDay.meals
      : [];
  
  const [selectedMealType, onMealTypeChange] = useState(selectedMealTypes?.at(0)?.mealType);
  const isVertical = viewType === "vertical";

  return (
    <Collapsible
      open={isVertical ? isOpen : true}
      onOpenChange={setIsOpen}
      className={cn(
        "w-full transition-all duration-200 mb-2 ",
        viewType === "horizontal" && "mt-8 p-6 rounded-[10px] bg-slate-50/50 border border-slate-200",
        viewType === "vertical" && "bg-slate-50 border-1 rounded-[10px] overflox-clip",
      )}
    >
      <CollapsibleTrigger asChild disabled={!isVertical}>
        <div className={cn(
          "flex items-center justify-between group !p-4",
          isVertical ? "cursor-pointer hover:bg-slate-200 bg-slate-100 rounded-lg px-2 transition-colors rounded-b-none border-1" : ""
        )}>
          {viewType === "vertical" && (
            <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              {dayLabel}
            </h3>
          )}
          {isVertical && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {isOpen ? "Collapse" : "Expand"}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-300 ease-in-out",
                !isOpen && "-rotate-90"
              )} />
            </div>
          )}
        </div>
      </CollapsibleTrigger>
      {viewType === "horizontal" && (
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {selectedMealTypes.map((mealType, index) => (
            <Button
              key={index}
              variant={mealType.mealType === selectedMealType ? "wz" : "wz_outline"}
              onClick={() => onMealTypeChange?.(mealType.mealType)}
              className="h-9 px-4"
            >
              {mealType.mealType}
            </Button>
          ))}
        </div>
      )}
      <CollapsibleContent className="p-4 space-y-4 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {selectedMealTypes
          .filter(item => isVertical || item.mealType === selectedMealType)
          .map(({ mealType, meals }) => (
            <MealTypeMealsListing
              key={mealType}
              meal={{ mealType, meals }}
              viewType={viewType}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function MealTypeMealsListing({ viewType, meal }) {
  const mealTypeTotals = useMemo(() => {
    const parseNum = (val) => {
      if (typeof val === "number") return Number.isFinite(val) ? val : 0;
      if (typeof val === "string") {
        const n = parseFloat(val.replace(/,/g, ""));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    return meal.meals.reduce(
      (acc, m) => {
        const caloriesVal = typeof m?.calories === "object" ? m?.calories?.total : m?.calories;
        const proteinVal = m?.protein ?? m?.calories?.proteins;
        const carbsVal = m?.carbohydrates ?? m?.calories?.carbs;
        const fatsVal = m?.fats ?? m?.calories?.fats;

        acc.calories += parseNum(caloriesVal);
        acc.protein += parseNum(proteinVal);
        acc.carbohydrates += parseNum(carbsVal);
        acc.fats += parseNum(fatsVal);
        return acc;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
    );
  }, [meal.meals]);

  const Content = (
    <>
      <div className={cn(
        "grid gap-4",
        viewType === "vertical" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2"
      )}>
        {checkArray(meal.meals).length > 0 ? (
          checkArray(meal.meals).map((mealItem, index) => (
            <MealDetails key={index} viewType={viewType} meal={mealItem} />
          ))
        ) : (
          <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
            No dishes added to this section
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border px-4 py-2 text-sm text-muted-foreground grid grid-cols-4 gap-6">
        <div>{mealTypeTotals.calories.toFixed(2)} Calories</div>
        <div>{mealTypeTotals.protein.toFixed(2)} Protein</div>
        <div>{mealTypeTotals.fats.toFixed(2)} Fats</div>
        <div>{mealTypeTotals.carbohydrates.toFixed(2)} Carbs</div>
      </div>
    </>
  );

  if (viewType === "vertical") {
    return (
      <Collapsible defaultOpen={true} className="bg-white group mb-8 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/30 transition-all hover:border-slate-300">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-5 hover:bg-slate-50/80 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-400 group-data-[state=open]:text-blue-500 group-data-[state=open]:border-blue-100 transition-all">
              <ChevronDown size={20} className="transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{meal.mealType}</h3>
              <p className="text-xs text-slate-400 font-medium">{meal.meals.length} items scheduled</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
            <span className="text-orange-600">{mealTypeTotals.calories.toFixed(0)} kcal</span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="text-blue-600">{mealTypeTotals.protein.toFixed(0)}g Protein</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-6 pt-2 overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
          {Content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="mb-8">
      {Content}
    </div>
  );
}

function MealDetails({ meal, viewType }) {
  return <div className="border-1 rounded-[10px] overflow-clip">
    <Image
      alt=""
      src={meal.image || "/not-found.png"}
      height={200}
      width={200}
      className="w-full max-h-[180px] object-cover border-b-1"
    />
    <div className="p-3 text-md">
      <h3>{meal.name || meal.dish_name}</h3>
      {meal.description && (
        <p className="leading-[1.2] text-[14px] text-black/60 mt-2 line-clamp-3">{meal.description}</p>
      )}
      <p className="text-[14px] text-[#808080] mt-2">{meal.meal_time}</p>
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

export function DisplayMealStats({
  meals: { plans = {} } = {},
  tdee = null,
}) {
  const allMeals = useMemo(() => {
    const arr = []
    for (const plan in plans) {
      const p = plans[plan];
      if (!p) continue;

      // Handle array format (used during creation for monthly plans)
      if (Array.isArray(p)) {
        for (const mealType of p) {
          if (Array.isArray(mealType?.meals)) {
            arr.push(...mealType.meals);
          }
        }
        continue;
      }

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

      // Handle object format with meal types
      if (p.meals && Array.isArray(p.meals)) {
        for (const mealType of p.meals) {
          if (Array.isArray(mealType?.meals)) {
            arr.push(...mealType.meals);
          }
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

  const calorieTarget = parseNum(tdee?.targetCalories);
  const macroTargets = tdee?.macroTargets || {};
  const showTdeeProgress = calorieTarget > 0;

  if (showTdeeProgress) {
    const cards = [
      {
        key: "calories",
        label: "Cal",
        current: totals.calories,
        target: calorieTarget,
        unit: "cal",
      },
      {
        key: "protein",
        label: "Protein",
        current: totals.protein,
        target: parseNum(macroTargets?.proteins),
        unit: "g",
      },
      {
        key: "fats",
        label: "Fats",
        current: totals.fats,
        target: parseNum(macroTargets?.fats),
        unit: "g",
      },
      {
        key: "carbs",
        label: "Carbs",
        current: totals.carbohydrates,
        target: parseNum(macroTargets?.carbohydrates),
        unit: "g",
      },
    ];

    return <div className="grow bg-white rounded-[10px] border px-3 py-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <MetricRingCard
            key={card.key}
            label={card.label}
            current={card.current}
            target={card.target}
            unit={card.unit}
          />
        ))}
      </div>
    </div>
  }

  return <div className="grow bg-white rounded-[10px]">
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

function MetricRingCard({ label, current, target, unit }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const hasTarget = target > 0;
  const clampedProgress = hasTarget ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <div className="rounded-xl border bg-slate-50/70 p-2.5">
      <div className="flex items-center gap-2">
        <div className="relative h-[62px] w-[62px] shrink-0">
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-200"
              fill="transparent"
            />
            {hasTarget && (
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                className={current > target ? "text-red-500" : "text-emerald-500"}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
            {hasTarget ? `${Math.round(Math.min((current / target) * 100, 999))}%` : "NA"}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          {hasTarget ? (
            <p className="text-sm font-black text-slate-800 tabular-nums">
              {Math.round(current)}/{Math.round(target)} {unit}
            </p>
          ) : (
            <p className="text-sm font-black text-slate-800 tabular-nums">
              {Math.round(current)} {unit}
            </p>
          )}
          {!hasTarget && (
            <p className="text-[10px] text-slate-400">No target</p>
          )}
        </div>
      </div>
    </div>
  );
}