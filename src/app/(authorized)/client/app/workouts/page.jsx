'use client';
import { Filter,ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getWorkoutDetails, getWorkoutForClient } from "@/lib/fetchers/app";
import useSWR from "swr";
import AssignWorkoutModal from "@/components/modals/AssignModal";
import CreateWorkoutModal from "@/components/modals/tools/CreateWorkoutModal";
import Link from "next/link";
import { useState, useEffect } from "react";
import FormControl from "@/components/FormControl";
import { useAppSelector } from "@/providers/global/hooks";

export default function Page() {
  const { _id } = useAppSelector(state => state.client.data)
  const [searchQuery, setSearchQuery] = useState("")
  // const { isLoading, error, data } = useSWR("app/client/workoutCollections", () => getWorkoutDetails(undefined, "client"));
  const { isLoading, error, data } = useSWR("client/workouts", () => getWorkoutForClient(_id));

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) {
  const errorMessage = error?.message || data?.message || "Something went wrong";
  return (
    <div value="reports">
      <ContentError className="mt-0" title={errorMessage} />
    </div>
    );
  }

  return (
    <main className="content-container content-height-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <WorkoutsContainer
          allWorkouts={data.data}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}

function FilterOptions() {
  return <div className="flex items-center gap-3 mb-6 overflow-x-auto">
    <div className="flex items-center gap-2 px-4 py-2 text-green-600 border-[1.5px] border-[var(--accent-1)] rounded-full text-sm">
      <Filter className="w-4 h-4" />
      Filter
    </div>

    <div className="px-4 py-2 rounded-full text-sm whitespace-nowrap bg-[var(--accent-1)] text-white">
      Cardio
    </div>
    <div className="px-4 py-2 rounded-full text-sm whitespace-nowrap text-gray-500 bg-gray-100">
      Shoulder
    </div>
    <div className="px-4 py-2 rounded-full text-sm whitespace-nowrap text-gray-500 bg-gray-100">
      Light Weight
    </div>
  </div>
}

function Header({
  searchQuery,
  setSearchQuery
}) {
  return <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
    <h1 className="text-2xl font-semibold">Workout Library</h1>
    <FormControl
      className="w-full lg:min-w-[280px] md:max-w-[500px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] md:ml-auto"
      placeholder="Search Workout.."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
    />
  </div>
}

// function WorkoutsContainer({
//   allWorkouts,
//   searchQuery
// }) {
//   const workouts = allWorkouts.filter(workout => new RegExp(searchQuery, "i").test(workout.title));
//   return
//   // <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
//   //   {workouts.map(workout => <div key={workout._id} className="overflow-hidden bg-white">
//   //     <div className="relative">
//   //       <Link href={`/client/app/workouts/${workout._id}`}>
//   //         <Image
//   //           src={workout?.thumbnail?.trim() || "/not-found.png"}
//   //           alt="Total Core Workout"
//   //           width={1024}
//   //           height={1024}
//   //           unoptimized
//   //           onError={e => e.target.src = "/not-found.png"}
//   //           className="w-full h-[250px] object-cover rounded-xl border-1"
//   //         />
//   //       </Link>
//   //     </div>
//   //     <div className="mt-2 text-lg font-bold">{workout.title}</div>
//   //   </div>)}
//   // </div>
// }

function WorkoutsContainer({ allWorkouts, searchQuery }) {
  const workouts = allWorkouts.filter(item =>
    new RegExp(searchQuery, "i").test(item.title)
  );

  if (workouts.length === 0)
    return <ContentError title="No workout plans assigned" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {workouts.map(plan => (
        <WorkoutDisplayCard plan={plan} key={plan._id} />
      ))}
    </div>
  );
}
function WorkoutDisplayCard({ plan }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const isDaily = plan.mode === "daily";
  const isWeekly = plan.mode === "weekly";
  const isMonthly = plan.mode === "monthly";
  const dailyData = isDaily ? plan.plans.daily : null;
  const weeklyKeys = isWeekly ? Object.keys(plan.plans) : [];
  const monthlyKeys = isMonthly ? Object.keys(plan.plans) : [];

  useEffect(() => {
    if (isDaily && !activeTab) setActiveTab("daily");
    if (isWeekly && weeklyKeys.length && !activeTab) setActiveTab(weeklyKeys[0]);
    if (isMonthly && monthlyKeys.length && !activeTab) setActiveTab(monthlyKeys[0]);
  }, [isDaily, isWeekly, isMonthly, weeklyKeys, monthlyKeys]);

  const activeWorkouts =
    isDaily
      ? dailyData?.workouts || []
      : isWeekly
      ? plan.plans[activeTab]?.workouts || []
      : isMonthly
      ? plan.plans[activeTab]?.workouts || []
      : [];

  return (
    <div className="w-full md:w-[25vw] xl:w-[35vw] 2xl:w-[30vw] rounded-xl bg-white border shadow-sm transition-all hover:shadow-md p-5 cursor-pointer">
      <div onClick={() => setOpen(!open)} className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{plan.title}</h2>
          <p className="text-gray-500 text-sm">{plan.description}</p>

          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs mt-2 inline-block">
            Mode: {plan.mode.toUpperCase()}
          </span>
        </div>

        {open ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
      </div>
      <div className={`transition-all duration-300 overflow-x-auto no-scrollbar ${open ? "max-h-[2000px] mt-6" : "max-h-0"}`}>
        
        {isWeekly && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {weeklyKeys.map(day => (
              <button
                key={day}
                onClick={() => setActiveTab(day)}
                className={`px-3 py-1 text-xs rounded-md border ${
                  activeTab === day ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {day.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {isMonthly && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {monthlyKeys.map(date => (
              <button
                key={date}
                onClick={() => setActiveTab(date)}
                className={`px-3 py-1 text-xs rounded-md border ${
                  activeTab === date ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-5">
          {activeWorkouts.length === 0 ? (
            <p className="italic text-gray-400 text-center text-xs">No workouts assigned</p>
          ) : (
            activeWorkouts.map((workout, idx) => (
              <WorkoutCard workout={workout} key={idx} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
function WorkoutCard({ workout }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-gray-50">

      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
        {workout.thumbnail ? (
          <img src={workout.thumbnail} className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-gray-500 flex items-center justify-center h-full">
            No Image
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1">
        <p className="font-semibold">{workout.title}</p>
        <p className="text-sm text-gray-500">{workout.description || "No description"}</p>

        {/* Category */}
        <p className="text-xs text-gray-600">
          <strong>Category:</strong> {workout.category}
        </p>

        {/* Equipments */}
        <p className="text-xs text-gray-600">
          <strong>Equipments:</strong>{" "}
          {workout.equipments?.length ? workout.equipments.join(", ") : "None"}
        </p>

        <div className="flex flex-wrap gap-2 text-xs mt-2">
          {workout.duration && (
            <span className="px-2 py-1 border bg-white rounded-md">
              ⏱ {workout.duration}
            </span>
          )}
          {workout.calorie && (
            <span className="px-2 py-1 border bg-white rounded-md">
              🔥 {workout.calorie}
            </span>
          )}
        </div>

        <a
          href={workout.video_link}
          target="_blank"
          className="text-[var(--accent-1)] text-xs italic animate-pulse"
        >
          Watch Video
        </a>
      </div>
    </div>
  );
}