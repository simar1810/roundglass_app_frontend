"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClientMealPlanById, getPlans } from "@/lib/fetchers/app";
import { useAppSelector } from "@/providers/global/hooks";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {plans.map(plan => <MealDisplayCard
      plan={plan}
      key={plan._id} />)}
  </div>
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
function MealDisplayCard({ plan }) {
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
  const [activeTab, setActiveTab] = useState("Breakfast");
  const [activeDate, setActiveDate] = useState(null);

  const mealTypes = ["Breakfast", "Lunch", "Snacks", "Dinner"];

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

  return (
    <div className="w-full md:w-[25vw] xl:w-[35vw] 2xl:w-[30vw] rounded-xl bg-white border shadow-sm transition-all hover:shadow-md p-5 cursor-pointer">
      <div onClick={() => setOpen(!open)} className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{plan.title}</h2>
          <p className="text-gray-500 text-sm leading-snug">{plan.description}</p>

          <div className="flex items-center gap-3 mt-2 text-[10px] md:text-xs">
            <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">
              Mode: {plan.mode}
            </span>
            <span className="px-2 py-1 bg-blue-50 text-green-600 italic rounded-md font-semibold">
              Updated On: {formattedUpdatedAt}
            </span>
          </div>
        </div>

        {open ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
      </div>

      <div className={`transition-all duration-300 overflow-x-auto no-scrollbar ${open ? "max-h-[2000px] mt-6" : "max-h-0"}`}>
        {isWeekly && (
           <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {weeklyDays.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDate(day)}
              className={`px-3 py-1 text-xs font-medium rounded-md border
              ${activeDate === day ? "bg-black text-white" : "text-gray-700 bg-gray-100"}`}
            >
            {day.toUpperCase()}
            </button>
            ))}
          </div>
        )}
        {isMonthly && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {monthlyDates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`px-3 py-1 text-xs font-medium rounded-md border
                ${
                  activeDate === date
                    ? "bg-black text-white"
                    : "text-gray-700 bg-gray-100"
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 mb-5 border-b pb-2">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-all
              ${
                activeTab === type
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="space-y-5">
          {(() => {

            //Daily mode
            if (isDaily) {
              const filtered = dailyPlan?.meals?.filter((m) => m.mealType === activeTab);
              if (!filtered || filtered.length === 0)
                return <p className="italic text-gray-400 text-xs text-center">No meals assigned</p>;

              return filtered.map((mealBlock, index) =>
                mealBlock.meals.map((meal, idx) => (
                  <MealBlock meal={meal} key={`${index}-${idx}`} />
                ))
              );
            }

            // Monthly Mode
            if (isMonthly) {
              const filtered = monthlyMeals?.filter((m) => m.mealType === activeTab);
              if (!filtered || filtered.length === 0)
                return <p className="italic text-gray-400 text-xs text-center">No meals assigned</p>;

              return filtered.map((mealBlock, index) =>
                mealBlock.meals.map((meal, idx) => (
                  <MealBlock meal={meal} key={`${index}-${idx}`} />
                ))
              );
            }
            // Weeklyy mode
            if (isWeekly) {
              const filtered = weeklyMeals?.filter((m) => m.mealType === activeTab);
              if (!filtered || filtered.length === 0)
                return (
                  <p className="italic text-gray-400 text-xs text-center">
                    No meals assigned
                  </p>
                );
              
              return filtered.map((mealBlock, index) =>
                mealBlock.meals.map((meal, idx) => (
                  <MealBlock meal={meal} key={`${index}-${idx}`} />
                ))
              );
            }

          })()}
        </div>
      </div>
    </div>
  );
}

function MealBlock({ meal }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
        {meal.image ? (
          <img src={meal.image} className="object-cover w-full h-full" />
        ) : (
          <div className="text-xs text-gray-500 flex items-center justify-center h-full">
            No Image
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1">
        <p className="font-medium text-gray-800">{meal.dish_name}</p>
        <p className="text-sm text-gray-500">{meal.description || "No description"}</p>

        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          <span className="px-2 py-1 bg-white border rounded-md">{meal.calories}</span>
          <span className="px-2 py-1 bg-white border rounded-md">Protein: {meal.protein}</span>
          <span className="px-2 py-1 bg-white border rounded-md">Carbs: {meal.carbohydrates}</span>
          <span className="px-2 py-1 bg-white border rounded-md">Fats: {meal.fats}</span>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Serving: {meal.serving_size} • Time: {meal.meal_time}
        </p>
      </div>
    </div>
  );
}
