import WorkoutMetaForm from "./WorkoutMetaForm";

export default function WorkoutCreationMeta() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Workout Meta
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Basic information about the workout
        </p>
      </div>
      <WorkoutMetaForm />
    </div>
  );
}