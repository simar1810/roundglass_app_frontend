import { EXERCISE_FILTER_KEYS } from "../../utils/config";
import ExerciseFilterSelect from "./ExerciseFilterSelect";

const CATEGORY_OPTIONS = ["strength", "cardio", "mobility"];
const BODY_PART_OPTIONS = ["waist", "chest", "legs", "arms"];
const TARGET_OPTIONS = ["abs", "quads", "biceps"];
const EQUIPMENT_OPTIONS = ["body weight", "dumbbell", "barbell"];

export default function ExerciseFilters({ filters, onChange }) {
  return (
    <div className="px-5 py-3 border-b bg-white">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ExerciseFilterSelect
          placeholder="Category"
          value={filters.category}
          options={CATEGORY_OPTIONS}
          onChange={v => onChange(EXERCISE_FILTER_KEYS.CATEGORY, v)}
        />

        <ExerciseFilterSelect
          placeholder="Body Part"
          value={filters.bodyPart}
          options={BODY_PART_OPTIONS}
          onChange={v => onChange(EXERCISE_FILTER_KEYS.BODY_PART, v)}
        />

        <ExerciseFilterSelect
          placeholder="Target"
          value={filters.target}
          options={TARGET_OPTIONS}
          onChange={v => onChange(EXERCISE_FILTER_KEYS.TARGET, v)}
        />

        <ExerciseFilterSelect
          placeholder="Equipment"
          value={filters.equipment}
          options={EQUIPMENT_OPTIONS}
          onChange={v => onChange(EXERCISE_FILTER_KEYS.EQUIPMENT, v)}
        />
      </div>
    </div>
  );
}
