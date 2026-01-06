"use client";
import useSWR from "swr";
import { useState } from "react";
import { Plus } from "lucide-react";
import { fetchData } from "@/lib/api";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DEFAULT_EXERCISE_FILTERS } from "../../utils/config";
import ExerciseList from "./ExerciseList";
import ExerciseFilters from "./ExerciseFilters";
import Loader from "@/components/common/Loader";

export default function SelectExercise({ saveExercisesForDay }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_EXERCISE_FILTERS);

  const endpoint = buildUrlWithQueryParams(
    "app/newWorkout/new-exercise",
    filters
  );

  const { isLoading, error, data } = useSWR(endpoint, () => fetchData(endpoint));

  function updateFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  if (isLoading) return <Loader />;
  if (error || data?.status_code !== 200)
    return <div>
      {error?.message || data?.message}
    </div>;

  const exercises = data.data.results || [];

  return (
    <Dialog>
      <DialogTrigger>
        <Plus size={18} />
      </DialogTrigger>

      <DialogContent className="p-0 max-h-[75vh] overflow-y-auto overflow-x-hidden max-w-[900px]">
        <DialogTitle className="px-5 py-4 border-b">
          Select Exercise
        </DialogTitle>

        <ExerciseFilters
          filters={filters}
          onChange={updateFilter}
        />

        <ExerciseList
          exercises={exercises}
          selectedExercise={selectedExercise}
          onSelect={setSelectedExercise}
          saveExercisesForDay={() => {
            const exercise = exercises.find(exercise => exercise._id === selectedExercise);
            saveExercisesForDay(exercise)
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
