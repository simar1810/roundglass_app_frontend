import useCurrentStateContext from "@/providers/CurrentStateContext";
import EditSelectedWorkoutDetails from "./EditSelectedWorkoutDetails";
import { BicepsFlexed, Minus, MinusCircle } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { deleteWorkout } from "@/config/state-reducers/custom-workout";

export default function SelectedWorkoutDetails({ workout, index }) {
  const { dispatch } = useCurrentStateContext();
  if (!isWorkoutSelected(workout)) return <div className="flex items-center gap-4">
    <EditSelectedWorkoutDetails
      workout={workout}
      index={index}
    >
      <DialogTrigger className="w-full text-[var(--accent-1)] h-[120px] border-1 mt-2 rounded-md flex items-center justify-center gap-2 font-bold">
        <BicepsFlexed /> Select Workout
      </DialogTrigger>
    </EditSelectedWorkoutDetails>
    <MinusCircle
      className="text-[var(--accent-2)] cursor-pointer"
      onClick={() => dispatch(deleteWorkout(index))}
    />
  </div>
  return <div className="mt-4 flex items-start gap-4">
    <Image
      alt=""
      src={workout.thumbnail || "/not-found.png"}
      height={100}
      width={100}
      className="rounded-lg"
    />
    <div className="grow">
      <h3>{workout.title}</h3>
      <p>{workout.duration}</p>
    </div>
    <EditSelectedWorkoutDetails
      key={workout?._id}
      index={index}
      workout={workout}
    />
    <Minus
      className="cursor-pointer"
      onClick={() => dispatch(deleteWorkout(index))}
    />
  </div>
}

function isWorkoutSelected(workout) {
  return Boolean(workout?._id?.$oid) || Boolean(workout?._id);
}