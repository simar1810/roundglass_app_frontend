"use client"
import { ClipboardList, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import FormControl from "@/components/FormControl";

export default function Page() {
  return <div className="content-container content-height-screen flex flex-col items-center justify-center">
    <div className="max-w-[450px]">
      <h4 className="w-full text-center pb-2 border-b-1">Workout</h4>
      <div className="mt-8 flex items-center gap-4">
        <Link href="/coach/workouts/add" className="bg-[var(--comp-1)] font-bold text-[14px] p-4 rounded-[8px] border-1 border-[var(--accent-1)]">
          <PlusCircle className="w-[64px] h-[64px] bg-[var(--accent-1)]/40 text-white p-3 mx-auto mb-2 rounded-full" fill="#67BC2A" />
          Create New Workout
        </Link>
        <Link href="/coach/workouts/list" className="bg-[var(--comp-1)] font-bold text-[14px] p-4 rounded-[8px] border-1 border-[var(--accent-1)]">
          <ClipboardList className="w-[64px] h-[64px] bg-[var(--accent-1)]/40 text-white p-3 mx-auto mb-2 rounded-full" fill="#67BC2A" />
          View Your Workout
        </Link>
      </div>
    </div>
  </div>
}

function Header({
  searchQuery,
  setSearchQuery
}) {
  return <div className="flex items-center justify-between gap-4 mb-10">
    <h1 className="text-2xl font-semibold">Workout Library</h1>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
      placeholder="Search Meal.."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
    />
    <CreateWorkoutModal />
  </div>
}

function WorkoutsContainer({
  allWorkouts,
  searchQuery
}) {
  const workouts = allWorkouts.filter(workout => new RegExp(searchQuery, "i").test(workout.title));;
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
    {workouts.map(workout => <div key={workout._id} className=" overflow-hidden bg-white">
      <div className="relative">
        <Link href={`/coach/workouts/${workout._id}`}>
          <Image
            src={workout?.thumbnail?.trim() || "/not-found.png"}
            alt="Total Core Workout"
            width={1024}
            height={1024}
            unoptimized
            onError={e => e.target.src = "/not-found.png"}
            className="w-full h-[250px] object-cover rounded-xl border-1"
          />
        </Link>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-lg font-bold">{workout.title}</div>
        <AssignWorkoutModal type="normal" workoutId={workout._id} />
      </div>
    </div>)}
  </div>
}