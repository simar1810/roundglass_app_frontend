import { EXERCISE_DIFFICULTY_COLOR } from "../../utils/config";

export default function ExerciseCard({ exercise, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={[
        "cursor-pointer border p-4 transition-colors rounded-[6px]",
        isSelected
          ? "border-[var(--accent-1)] bg-[var(--accent-1)]/5"
          : "border-border hover:border-muted-foreground/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-medium text-sm text-gray-900">
            {exercise.name}
          </h4>

          <p className="text-xs text-muted-foreground">
            {exercise.bodyPart} • {exercise.target} • {exercise.equipment}
          </p>
        </div>

        <span
          className={`text-xs font-medium capitalize ${EXERCISE_DIFFICULTY_COLOR[exercise.difficulty]}`}
        >
          {exercise.difficulty}
        </span>
      </div>
    </div>
  );
}
