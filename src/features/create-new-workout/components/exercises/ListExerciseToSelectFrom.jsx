import Loader from "@/components/common/Loader"
import { fetchData } from "@/lib/api"
import { buildUrlWithQueryParams } from "@/lib/formatter"
import { useState } from "react"
import useSWR from "swr"
import { DEFAULT_EXERCISE_FILTERS, EXERCISE_FILTER_KEYS } from "../../utils/config"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import ExerciseFilterSelect from "./ExerciseFilterSelect"
import { EXERCISE_FILTER_OPTIONS } from "../../utils/exercise-filter-options"

export default function ListExerciseToSelectFrom() {
  const [filters, setFilters] = useState(DEFAULT_EXERCISE_FILTERS)

  const endpoint = buildUrlWithQueryParams(
    "app/newWorkout/new-exercise",
    filters
  )

  const { isLoading, error, data } = useSWR(endpoint, () => fetchData(endpoint))

  if (isLoading) return <Loader />
  if (error || data?.status_code !== 200)
    return <div>{error?.message || data?.message}</div>

  const exercises = data.data.results || []

  return (
    <div className="space-y-3">
      <Filters
        filters={filters}
        onChange={(key, value) => setFilters({ ...filters, [key]: value })}
      />

      <div className="grid grid-cols-4 gap-3 max-h-[80vh] overflow-y-auto">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise._id} exercise={exercise} />
        ))}
      </div>
    </div>
  )
}

function ExerciseCard({ exercise }) {
  const { name, target } = exercise
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: exercise._id,
    data: exercise,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="h-full bg-white border rounded-md shadow-none overflow-hidden cursor-pointer
                    hover:border-foreground transition-colors p-2 flex flex-col gap-2"
    >
      <div className="aspect-video bg-muted flex items-center justify-center text-xs text-muted-foreground">
        IMG
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {name}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {target}
        </p>
      </div>
    </div>
  )
}

function Filters({ filters, onChange }) {
  return (
    <div className="h-9 pb-4 border-b flex items-center gap-4 text-xs text-muted-foreground">
      <ExerciseFilterSelect
        placeholder="Category"
        value={filters.category}
        options={EXERCISE_FILTER_OPTIONS.CATEGORY_OPTIONS}
        onChange={v => onChange(EXERCISE_FILTER_KEYS.CATEGORY, v)}
      />

      <ExerciseFilterSelect
        placeholder="Body Part"
        value={filters.bodyPart}
        options={EXERCISE_FILTER_OPTIONS.BODY_PART_OPTIONS}
        onChange={v => onChange(EXERCISE_FILTER_KEYS.BODY_PART, v)}
      />

      <ExerciseFilterSelect
        placeholder="Target"
        value={filters.target}
        options={EXERCISE_FILTER_OPTIONS.TARGET_OPTIONS}
        onChange={v => onChange(EXERCISE_FILTER_KEYS.TARGET, v)}
      />

      <ExerciseFilterSelect
        placeholder="Equipment"
        value={filters.equipment}
        options={EXERCISE_FILTER_OPTIONS.EQUIPMENT_OPTIONS}
        onChange={v => onChange(EXERCISE_FILTER_KEYS.EQUIPMENT, v)}
      />
    </div>
  )
}