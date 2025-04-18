
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "@/components/FormControl";

export default function NewRecipeModal() {
  return (
    <Dialog>
      <DialogTrigger className="bg-green-500 text-white font-bold px-4 py-2 rounded-full">
        New Recipe
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] border-0 p-0">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold">
            New Recipe
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 space-y-6">
          {/* Title */}
          <div>
            <p className="font-medium mb-2">Title</p>
            <FormControl
              placeholder="Enter Title"
              className="w-full"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <p className="font-medium mb-2">Thumbnail</p>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <ImagePlus size={24} className="mb-2" />
                <span>Add Image</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="font-medium mb-2">Description</p>
            <FormControl
              as="textarea"
              placeholder="Enter description here"
              className="w-full min-h-[120px]"
            />
          </div>

          {/* Calories */}
          <div>
            <p className="font-medium mb-2">Calories</p>
            <FormControl
              placeholder="Enter Approx Calories"
              type="number"
              className="w-full"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-md">
              Add Recipe
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}