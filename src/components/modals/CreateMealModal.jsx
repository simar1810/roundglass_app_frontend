"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "@/components/FormControl";

export default function CreateMealModal() {
  return (
    <Dialog>
      <DialogTrigger className="bg-green-500 text-white font-bold px-4 py-2 rounded-full">
        Create Meal
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] min-h-[600px] border-0 p-0">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold">
            Create Meal
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 space-y-6">
          {/* Search */}
          <div>
            <FormControl
              placeholder="Search Meals"
              className="w-full bg-gray-50 rounded-lg"
            />
          </div>

          <div>
            <h3 className="font-medium mb-4">Select from our Meal Library</h3>
            
            <div className="grid grid-cols-2 gap-4 space-y-4">
              {/* Recipe Row 1 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe1"
                  className="w-5 h-5"
                />
              </div>

              {/* Recipe Row 2 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe2"
                  className="w-5 h-5"
                />
              </div>

              {/* Recipe Row 3 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe3"
                  className="w-5 h-5"
                />
              </div>

              {/* Recipe Row 4 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe4"
                  className="w-5 h-5"
                />
              </div>

              {/* Recipe Row 5 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe5"
                  className="w-5 h-5"
                />
              </div>

              {/* Recipe Row 6 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe6"
                  className="w-5 h-5"
                />
              </div>

              {/* Recipe Row 7 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <span className="flex-1">Recipe Name 1</span>
                <FormControl
                  type="checkbox"
                  name="recipe"
                  value="recipe7"
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          {/* Add Recipe Button */}
          <div className="text-center pt-4">
            <button className="bg-[var(--accent-1)] hover:bg-green-600 text-white w-full px-10 py-3 rounded-md">
              Add your own Recipe
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}