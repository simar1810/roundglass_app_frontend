import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "../FormControl";

export default function AssignWorkoutAddModal() {
  return (
    <Dialog>
      <DialogTrigger className="bg-[var(--accent-1)] text-white font-bold px-4 py-2 rounded-full overflow-auto">
        Assign Model
      </DialogTrigger>
      <DialogContent className="!max-w-[700px] h-[650px] border-0 p-0 overflow-auto">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold pb-1 w-fit">
            Assign Workout
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 text-sm space-y-4">
          {/* Filters */}
          <div className="flex gap-2 text-sm font-medium">
            <div className="text-green-600">Filter</div>
            <div className="bg-green-100 text-green-600 rounded-full px-3 py-1">Cardio</div>
            <div className="bg-gray-100 text-gray-400 rounded-full px-3 py-1">Shoulder</div>
            <div className="bg-gray-100 text-gray-400 rounded-full px-3 py-1">Light Weight</div>
          </div>

          {/* Workout Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative w-full h-[120px]">
                <Image
                  src="/image.png"
                  alt="Total Core Workout"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium">Total Core Workout</p>
                <p className="text-xs text-gray-500">Category · 10 Min</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative w-full h-[120px]">
                <Image
                  src="/image.png"
                  alt="Total Core Workout"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium">Total Core Workout</p>
                <p className="text-xs text-gray-500">Category · 10 Min</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative w-full h-[120px]">
                <Image
                  src="/image.png"
                  alt="Total Core Workout"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium">Total Core Workout</p>
                <p className="text-xs text-gray-500">Category · 10 Min</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative w-full h-[120px]">
                <Image
                  src="/image.png"
                  alt="Total Core Workout"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium">Total Core Workout</p>
                <p className="text-xs text-gray-500">Category · 10 Min</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button className="bg-green-500 hover:bg-green-600 text-white px-10 py-2 rounded-md">
              Assign Workouts
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
