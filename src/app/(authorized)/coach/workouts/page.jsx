'use client';
import { Filter } from "lucide-react";
import Image from "next/image";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getWorkouts } from "@/lib/fetchers/app";
import useSWR from "swr";

export default function Page() {
  const { isLoading, error, data } = useSWR("app/coach/workoutCollections", getWorkouts);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const workouts = data.data;

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Workout Library</h1>
        {/* <FilterOptions /> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map(workout => <div key={workout._id} className=" overflow-hidden bg-white">
            <div className="relative">
              <Image
                src={workout.thumbnail || "/not-found.png"}
                alt="Total Core Workout"
                width={1024}
                height={1024}
                unoptimized
                onError={e => e.target.src = "/not-found.png"}
                className="w-full max-h-[200px] object-cover rounded-xl"
              />

            </div>
            <div className="text-lg font-bold">{workout.title}</div>
            {/* <div className="text-sm opacity-90">Category : 10 MIN</div> */}
          </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-1)] text-white rounded-full text-sm font-medium">
            Assign Workout
          </div>
        </div>
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