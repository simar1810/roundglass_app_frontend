import useCurrentStateContext from "@/providers/CurrentStateContext";
import { WORKOUT_STAGES } from "../utils/config";

export default function WorkoutStageStepper() {
  const {
    meta: { stage: currentStage },
  } = useCurrentStateContext();

  return (
    <div className="w-full px-8 py-6">
      <div className="flex items-center justify-center w-full">
        {WORKOUT_STAGES.map((stage, index) => {
          const isCompleted = currentStage > stage.id;
          const isActive = currentStage === stage.id;

          return (
            <div key={stage.id} className="flex items-center w-full">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={[
                    "w-9 h-9 flex items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    isCompleted
                      ? "bg-green-600 border-green-600 text-white"
                      : isActive
                        ? "border-green-600 text-green-600"
                        : "border-gray-300 text-gray-400",
                  ].join(" ")}
                >
                  {isCompleted ? "✓" : stage.id}
                </div>

                <p
                  className={[
                    "mt-2 text-xs font-medium whitespace-nowrap",
                    isActive || isCompleted
                      ? "text-gray-700"
                      : "text-gray-400",
                  ].join(" ")}
                >
                  {stage.label}
                </p>
              </div>
              {index !== WORKOUT_STAGES.length - 1 && (
                <div className="flex-1 px-4">
                  <div
                    className={[
                      "h-[2px] w-full transition-colors",
                      currentStage > stage.id
                        ? "bg-green-600"
                        : "bg-gray-300",
                    ].join(" ")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
