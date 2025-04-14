import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "../FormControl";

export default function AssignWorkoutModal() {
  return (
    <Dialog>
      <DialogTrigger className="bg-[var(--accent-1)] text-white font-bold px-4 py-2 rounded-full overflow-auto">
        Assign Model
      </DialogTrigger>
      <DialogContent className="!max-w-[600px] h-[600px] border-0 p-0 overflow-auto">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold pb-1 w-fit">
            Assign Workout
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 space-y-2 text-sm">
          <div>
            {/* Title */}
            <div className="space-y-0">
              <label className="block mb-1 font-medium">Title</label>
              <FormControl
                type="text"
                placeholder="Workout Title"
                name="title"
                className="w-full rounded-md px-4 py-2"
              />
            </div>

            {/* Workouts */}
            <div>
              <label className="block mb-1 font-medium">Workouts</label>
              <div className="w-full border border-gray-300 rounded-md px-4 py-6 flex justify-center items-center">
                <div className="text-center text-gray-600 cursor-pointer">
                  <div className="text-green-500 text-2xl mb-1">+</div>
                  <p className="text-sm">Select Workouts</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div >
              <label className="block mb-1 font-medium">Instructions</label>
              <FormControl
                type="textarea"
                placeholder="Instructions (Optional)"
                name="instructions"
                className="w-full rounded-md px-4 py-2 h-24 resize-none"
              />
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block mb-1 font-medium">
              Do you want to send Reminders for this workout?{" "}
              <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-md w-fit">
              {/* Yes Option */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer ">
                <FormControl
                  type="radio"
                  name="yesno"
                  value="yes"
                  label="Yes"
                />
              </div>

              {/* No Option */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer ">
                <FormControl type="radio" name="yesno" value="no" label="No" />
              </div>
            </div>

            {/* +Add Time Box */}
            <div className="mt-4 w-full h-[100px] border border-gray-300 rounded-md px-4 py-2 text-gray-400 cursor-pointer flex items-start">
              <div className="w-[110px] h-[30px] border border-gray-300 rounded-xl flex items-center justify-center text-sm">
                + Add Time
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button className="bg-[var(--accent-1)] hover:bg-[var(--accent-1)] text-white px-[90px] py-2 rounded-md">
              Assign Workouts
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
