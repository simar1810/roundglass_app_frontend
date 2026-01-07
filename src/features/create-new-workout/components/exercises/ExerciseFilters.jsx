import { EXERCISE_FILTER_KEYS } from "../../utils/config";
import { EXERCISE_FILTER_OPTIONS } from "../../utils/exercise-filter-options";
import ExerciseFilterSelect from "./ExerciseFilterSelect";

export default function ExerciseFilters({ filters, onChange }) {
  return (
    <div className="z-[10000000] px-5 py-3 border-b bg-white">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
    </div>
  );
}
