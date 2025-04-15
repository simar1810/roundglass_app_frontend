import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "@/components/FormControl";

export default function AssignMealModal() {
  return (
    <Dialog>
      <DialogTrigger className="bg-[var(--accent-1)] text-white font-bold px-4 py-2 rounded-full">
        Assign Meal
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] min-h-[500px] border-0 p-0 overflow-auto">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold pb-1 w-fit h-[2px]">
            Assign Meal
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 text-sm space-y-6">
          {/* Search */}
          <div>
            <FormControl
              placeholder="Search Client here"
              className="w-full bg-gray-50 rounded-lg"
            />
            <p className="mt-4 font-medium">23 Clients Available</p>
          </div>

          {/* Client Lists */}
          <div className="grid grid-cols-2 gap-6">
            {/* Plan Already Assigned */}
            <div>
              <h3 className="font-medium mb-4">Plan Already Assigned</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/illustrations/image.png"
                    alt="Symond Write"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="flex-1">Symond Write</span>
                  <FormControl
                    type="checkbox"
                    checked
                    disabled
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Image
                    src="/illustrations/image.png"
                    alt="Gavin Peterson"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="flex-1">Gavin Peterson</span>
                  <FormControl
                    type="checkbox"
                    checked
                    disabled
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Image
                    src="/illustrations/image.png"
                    alt="Denial Braine"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="flex-1">Denial Braine</span>
                  <FormControl
                    type="checkbox"
                    checked
                    disabled
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>

            {/* Not Assigned */}
            <div>
              <h3 className="font-medium mb-4">Not Assigned</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/illustrations/image.png"
                    alt="Symond Write"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="flex-1">Symond Write</span>
                  <FormControl
                    type="checkbox"
                    name="assign"
                    value="symond"
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Image
                    src="/illustrations/image.png"
                    alt="Gavin Peterson"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="flex-1">Gavin Peterson</span>
                  <FormControl
                    type="checkbox"
                    name="assign"
                    value="gavin"
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Image
                    src="/illustrations/image.png"
                    alt="Denial Braine"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="flex-1">Denial Braine</span>
                  <FormControl
                    type="checkbox"
                    name="assign"
                    value="denial"
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full px-10 py-3 rounded-md">
              Assign Meal
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
