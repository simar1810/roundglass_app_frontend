"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCustomWorkoutPlans } from "@/lib/fetchers/app";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

export default function Page() {
  const { id } = useParams();
  return <Suspense>
    <WorkoutDetailsContainer id={id} />
  </Suspense>
}

function WorkoutDetailsContainer({ id }) {
  const { isLoading, error, data } = useSWR(`custom-workouts/${id}`, () => getCustomWorkoutPlans("coach", id));
  if (isLoading) return <ContentLoader />
  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const [customPlan] = data.data || [];
  return <main className="content-container">
    <div className="content-height-screen grid grid-cols-2 divide-x-1">
      <WorkoutMetaData customPlan={customPlan} />
      <WorkoutsListing customPlan={customPlan} />
    </div>
  </main>
}

function WorkoutMetaData({ customPlan }) {
  return <div className="p-4 pr-8">
    <div className="flex items-center gap-4">
      <h4 className="mr-auto">{customPlan.title}</h4>
      <Link
        href={`/coach/workouts/add?creationType=edit&mode=${customPlan.mode}&workoutId=${customPlan._id}`}
        className="px-4 py-2 rounded-[10px] bg-[var(--accent-1)] text-white font-bold leading-[1] text-[14px]"
        variant="wz_outline"
      >
        Edit
      </Link>
      <Link
        href={`/coach/workouts/add?creationType=copy_edit&mode=${customPlan.mode}&workoutId=${customPlan._id}`}
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
  </div>
}

function WorkoutsListing({ customPlan }) {
  const days = Object.keys(customPlan.plans || [])
  const [selectedPlan, setSelectedplan] = useState(days?.at(0))

  const selectedPlanWorkouts = customPlan.plans[selectedPlan]?.workouts || [];

  return <div className="p-4 pl-8">
    <div className="flex gap-4 mb-8">
      {days.map(day => <Button
        key={day}
        variant={day === selectedPlan ? "wz" : "wz_outline"}
        onClick={() => setSelectedplan(day)}
      >
        {day}
      </Button>)}
    </div>
    <Separator />
    <div className="mt-8 grid grid-cols-2 gap-4">
      {selectedPlanWorkouts.map(exercise => <WorkoutExercise
        key={exercise._id}
        exercise={exercise}
      />)}
    </div>
  </div>
}

function WorkoutExercise({ exercise }) {
  return <div className="border-1 rounded-[10px] overflow-clip">
    <Image
      alt=""
      src={exercise.thumbnail || "/not-found.png"}
      height={200}
      width={200}
      className="w-full max-h-[180px] object-cover border-b-1"
    />
    <div className="p-3 text-md">
      <h3>{exercise.title}</h3>
      <p className="text-black/60 text-xs mt-1">{exercise.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <Badge>{exercise.duration}</Badge>
        <Badge variant="wz_fill">{exercise.calorie}</Badge>
      </div>
    </div>
  </div>
}