"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import { getClientMealPlanById } from "@/lib/fetchers/app";
import { useAppSelector } from "@/providers/global/hooks";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("")
  const clientId = useAppSelector(state => state.client.data._id)
  const { isLoading, error, data } = useSWR("getPlans", () => getClientMealPlanById(clientId));
  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  return <main className="content-container content-height-screen">
    <Header
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
    <MealPlanContainer
      allMealPlans={data.data}
      searchQuery={searchQuery}
    />
  </main>
}

function Header({
  searchQuery,
  setSearchQuery
}) {
  return <div className="mb-4 pb-4 flex flex-col  md:flex-row md:items-center gap-4 border-b-1">
    <h4>Meal Plans</h4>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] md:ml-auto"
      placeholder="Search Meal.."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
    />
  </div>
}

function MealPlanContainer({
  allMealPlans,
  searchQuery
}) {
  const plans = allMealPlans.filter(item => new RegExp(searchQuery, "i").test(item.title));
  if (plans.length === 0) return <ContentError
    className="font-bold"
    title="No Meals plans assigned to the client"
  />

  // For most clients there is usually one active plan.
  // Show all assigned plans stacked vertically in a centered layout.
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {plans.map(plan => (
        <MealDisplaySection
          plan={plan}
          key={plan._id}
        />
      ))}
    </div>
  );
}

  // return <Card className="p-0 rounded-[4px] shadow-none gap-2">
  //   <CardHeader className="relative aspect-video">
  //     <Link href={`/client/app/meals/${plan._id}`}>
  //       <Image
  //         fill
  //         src={plan.image || "/"}
  //         alt=""
  //         className="object-cover bg-black"
  //       />
  //     </Link>
  //     {/* <Badge variant="wz" className="text-[9px] font-semibold absolute top-2 left-2">{plan.tag}</Badge> */}
  //   </CardHeader>
  //   <CardContent className="p-2">
  //     <div className="flex items-start justify-between gap-1">
  //       {/* <Link href={`/coach/meals/list/${plan._id}`}> */}
  //       <h5 className="text-[12px]">{plan.name}</h5>
  //       {/* </Link> */}
  //     </div>
  //     <p className="text-[14px] text-[var(--dark-1)]/25 leading-tight mt-2">
  //       {plan.description}
  //     </p>
//   </CardContent>
// </Card>

// Main section for a single meal plan (no card wrapper, just content)
function MealDisplaySection({ plan }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [activeDate, setActiveDate] = useState(null);

  const isDaily = plan.mode === "daily";
  const isMonthly = plan.mode === "monthly";
  const isWeekly = plan.mode === "weekly";

  const dailyPlan = plan?.plans?.daily;
  const monthlyDates = isMonthly ? Object.keys(plan.plans) : [];
  const weeklyDays = isWeekly ? Object.keys(plan.plans) : [];

  useEffect(() => {
    if (isMonthly && monthlyDates.length > 0 && !activeDate) {
      setActiveDate(monthlyDates[0]);
    }
    if (isWeekly && weeklyDays.length > 0 && !activeDate) {
    setActiveDate(weeklyDays[0]);
    }
  }, [isMonthly, monthlyDates, isWeekly, weeklyDays]);

  const formattedUpdatedAt = plan.updatedAt ? formatDate(plan.updatedAt) : "—";

  const monthlyMeals = isMonthly && activeDate ? plan.plans[activeDate]?.meals : [];
  const weeklyMeals = isWeekly && activeDate ? plan.plans[activeDate]?.meals : [];

  // Get all meal blocks (grouped by mealType) for the currently selected date
  const mealBlocksForCurrentDate = useMemo(() => {
    if (isDaily) return dailyPlan?.meals || [];
    if (isMonthly) return monthlyMeals || [];
    if (isWeekly) return weeklyMeals || [];
    return [];
  }, [isDaily, isMonthly, isWeekly, dailyPlan?.meals, monthlyMeals, weeklyMeals]);

  // Dynamic meal types (coach-configurable) for the current date
  const dynamicMealTypes = useMemo(() => {
    const set = new Set();
    mealBlocksForCurrentDate.forEach((block) => {
      if (block.mealType) {
        set.add(block.mealType);
      }
    });
    return Array.from(set);
  }, [mealBlocksForCurrentDate]);

  // Get all meals for the currently selected date (regardless of meal type)
  const getAllMealsForCurrentDate = () => {
    return mealBlocksForCurrentDate.flatMap((block) => block.meals || []);
  };

  const allMealsForCurrentDate = getAllMealsForCurrentDate();

  // Meals for the active tab (or all meals when "All" is active)
  const currentMeals =
    !activeTab
      ? allMealsForCurrentDate
      : mealBlocksForCurrentDate
          .filter((block) => block.mealType === activeTab)
          .flatMap((block) => block.meals || []);

  // Initialize active tab from backend data when available
  useEffect(() => {
    if (!activeTab && dynamicMealTypes.length > 0) {
      setActiveTab(dynamicMealTypes[0]);
    }
  }, [activeTab, dynamicMealTypes]);

  return (
    <section className="w-full">
      {/* Plan header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight">
            {plan.title}
          </h2>
          {plan.description && (
            <p className="text-gray-500 text-sm leading-snug">
              {plan.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-[10px] md:text-xs text-gray-600">
            <span className="px-2 py-1 bg-[var(--comp-1)] rounded-md font-medium">
              Mode: {plan.mode}
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 italic rounded-md font-semibold border border-green-100">
              Updated: {formattedUpdatedAt}
            </span>
          </div>
        </div>
        <span className="shrink-0 mt-1 text-gray-400">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {/* Plan body */}
      <div
        className={`transition-all duration-300 overflow-x-auto no-scrollbar ${
          open ? "max-h-[2000px] mt-4" : "max-h-0"
        }`}
      >
        {isWeekly && (
           <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {weeklyDays.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDate(day)}
                className={`min-w-[64px] px-3 py-2 text-xs font-medium rounded-xl border transition-colors
                  ${
                    activeDate === day
                      ? "bg-[var(--accent-1)] text-white border-[var(--accent-1)]"
                      : "bg-[var(--comp-1)] text-gray-700 border-gray-200"
                  }`}
              >
                <span className="block text-[11px] uppercase tracking-wide">
                  {day}
                </span>
              </button>
            ))}
          </div>
        )}
        {isMonthly && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {monthlyDates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`min-w-[72px] px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex flex-col items-center
                  ${
                    activeDate === date
                      ? "bg-[var(--accent-1)] text-white border-[var(--accent-1)]"
                      : "bg-[var(--comp-1)] text-gray-700 border-gray-200"
                  }`}
              >
                {(() => {
                  const [dayStr, monthStr, yearStr] = date.split("-");
                  const d = new Date(
                    Number(yearStr),
                    Number(monthStr) - 1,
                    Number(dayStr)
                  );
                  const dayNum = d.getDate();
                  const weekday = d.toLocaleDateString("en-IN", {
                    weekday: "short",
                  });
                  return (
                    <>
                      <span className="text-[13px] font-semibold">
                        {String(dayNum).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] opacity-80">{weekday}</span>
                    </>
                  );
                })()}
              </button>
            ))}
          </div>
        )}
        {dynamicMealTypes.length > 0 && (
          <div className="flex gap-3 mb-4 border-b pb-2">
            {dynamicMealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-all
                ${
                  activeTab === type
                    ? "bg-[var(--accent-1)] text-white"
                    : "text-gray-600 hover:bg-gray-100 bg-[var(--comp-1)]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-5">
          {allMealsForCurrentDate.length > 0 && (
            <DailyTotalsCard meals={allMealsForCurrentDate} />
          )}

          {currentMeals.length === 0 ? (
            <p className="italic text-gray-400 text-xs text-center">
              No meals assigned
            </p>
          ) : (
            currentMeals.map((meal, index) => (
              <MealBlock meal={meal} key={index} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DailyTotalsCard({ meals }) {
  const totals = meals.reduce(
    (acc, meal) => {
      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      acc.calories += toNum(meal.calories);
      acc.protein += toNum(meal.protein);
      acc.carbs += toNum(meal.carbohydrates);
      acc.fats += toNum(meal.fats);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className="rounded-2xl bg-[var(--comp-1)] text-[var(--dark-1)] px-5 py-4 shadow-sm border border-gray-200">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-[var(--accent-1)]" />
        Daily Nutritional Totals
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] text-blue-700">
            Carb
          </span>
          <p className="font-semibold text-gray-800">{totals.carbs.toFixed(1)} g</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[10px] text-red-700">
            Prot
          </span>
          <p className="font-semibold text-gray-800">{totals.protein.toFixed(1)} g</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="w-8 h-8 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center text-[10px] text-yellow-700">
            Fat
          </span>
          <p className="font-semibold text-gray-800">{totals.fats.toFixed(1)} g</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[10px] text-green-700">
            Kcal
          </span>
          <p className="font-semibold text-gray-800">{totals.calories.toFixed(1)} Kcal</p>
        </div>
      </div>
    </div>
  );
}

function MealBlock({ meal }) {
  return (
    <div className="rounded-2xl bg-white text-[var(--dark-1)] overflow-hidden shadow-sm border border-gray-200">
      <div className="w-full bg-gray-100 relative">
        <div className="w-full aspect-[16/9] overflow-hidden">
        {meal.image ? (
          <img
            src={meal.image}
            alt={meal.dish_name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-xs text-gray-500">
            <span className="text-sm mb-1 font-semibold text-gray-700">
              No Meal Image Available
            </span>
          </div>
        )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm md:text-base truncate">
            {meal.dish_name}
          </p>
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            {meal.meal_time}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-[11px] md:text-xs">
          <MacroPill label="Cal" value={meal.calories} unit="Kcal" color="text-green-600 border-green-300 bg-green-50" />
          <MacroPill label="Protein" value={meal.protein} unit="g" color="text-blue-600 border-blue-300 bg-blue-50" />
          <MacroPill label="Carb" value={meal.carbohydrates} unit="g" color="text-yellow-700 border-yellow-300 bg-yellow-50" />
          <MacroPill label="Fat" value={meal.fats} unit="g" color="text-orange-600 border-orange-300 bg-orange-50" />
        </div>

        <p className="text-[11px] text-gray-500 mt-1">
          Serving: {meal.serving_size || "-"}
        </p>
      </div>
    </div>
  );
}

function MacroPill({ label, value, unit, color }) {
  const display = value !== undefined && value !== null ? value : "-";
  return (
    <div className="flex items-center gap-1">
      <span
        className={`px-2 py-0.5 rounded-full border flex items-center justify-center text-[10px] font-medium ${color}`}
      >
        {label}
      </span>
      <span className="text-gray-700">
        <span className="font-semibold">{display}</span>{" "}
        <span className="text-gray-400">{unit}</span>
      </span>
    </div>
  );
}
