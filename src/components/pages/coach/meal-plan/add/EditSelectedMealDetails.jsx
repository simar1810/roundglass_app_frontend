import FormControl from "@/components/FormControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveRecipe } from "@/config/state-reducers/custom-meal";
import { uploadImage } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { DialogTitle } from "@radix-ui/react-dialog";
import { format, parse } from "date-fns";
import { Search, } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import SelectMealCollection from "./SelectMealCollection";

const MEASURE_OPTIONS = [
  { value: "cup", label: "Cup" },
  { value: "tablespoon", label: "Tablespoon (tbsp)" },
  { value: "teaspoon", label: "Teaspoon (tsp)" },
  { value: "bowl", label: "Bowl (small/medium/large)" },
  { value: "katori", label: "Katori (standard Indian bowl, ~150 ml)" },
  { value: "glass", label: "Glass (small/medium/large)" },
  { value: "plate", label: "Plate (small/full/half)" },
  { value: "piece", label: "Piece" },
  { value: "slice", label: "Slice" },
  { value: "poha_serving", label: "Poha serving (1 medium bowl)" },
  { value: "rice_serving", label: "Rice serving (1 medium bowl)" },
  { value: "sabzi", label: "Sabzi (1 katori or ½ cup)" },
  { value: "dal", label: "Dal (1 katori)" },
  { value: "spoonful", label: "Spoonful (1 serving spoon, ~10 g)" },
  { value: "handful", label: "Handful" },
  { value: "pinch", label: "Pinch (spices, salt)" },
  { value: "scoop", label: "Scoop" },
  { value: "packet", label: "Packet" },
  { value: "bottle", label: "Bottle" },
  { value: "cup_240ml", label: "Cup (standard 240 ml)" },
  { value: "gram", label: "Gram (g)" },
  { value: "kilogram", label: "Kilogram (kg)" },
  { value: "millilitre", label: "Millilitre (ml)" },
  { value: "litre", label: "Litre (L)" },
  { value: "small_medium_large", label: "Small / Medium / Large piece" },
  { value: "serving", label: "Serving (customized portion)" },
];

export default function EditSelectedMealDetails({
  defaultOpen,
  children,
  recipe,
  index
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { dispatch } = useCurrentStateContext();
  const [formData, setFormData] = useState(recipe);
  const onChangeHandler = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const closeBtnRef = useRef();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(formData.image || recipe.image || "/not-found.png");

  // Keep preview in sync when recipe changes (e.g., after save or selecting from search)
  useEffect(() => {
    setFormData(recipe);
    setPreviewImage(recipe.image || "/not-found.png");
  }, [recipe]);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    const MAX_SIZE_LIMIT = 1 * 1024 * 1024;
    if (!file) return;
    if (file && file.size > MAX_SIZE_LIMIT) {
      toast.error("File size more than 1MB");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreviewImage(localPreview);
    try {
      setUploading(true);
      const response = await uploadImage(file);
      setFormData((prev) => ({ ...prev, image: response.img }));
      setPreviewImage(response.img || localPreview);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setUploading(false);
    }
  }

  function updateDish(open) {
    if (open === true) return;
    for (const field of ["dish_name", "time"]) {
      if (!formData[field]) {
        toast.error(`${field} is required.`)
        return
      }
    }
    dispatch(saveRecipe(formData, index))
    closeBtnRef.current.click()
    setOpen(false)
  }

  function onOpenChange() {
    dispatch(saveRecipe(formData, index, true))
    setOpen(!open)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    {!children && <DialogTrigger className="w-full">
      <div className="mt-4 flex items-start gap-4">
        <Image
          alt=""
          src={previewImage}
          height={100}
          width={100}
          className="rounded-lg max-h-[100px] bg-[var(--comp-1)] object-contain border-1"
        />
        <div className="text-left text-sm md:text-base">
          <h3>{recipe.name || recipe.dish_name || recipe.title}</h3>
          {recipe.description && (
            <p className="leading-[1.2] text-[14px] text-black/60 mt-1 line-clamp-2">{recipe.description}</p>
          )}
          {recipe.time && <p className="mt-1">
            {format(
              parse(recipe.time, "HH:mm", new Date()),
              "hh:mm a"
            )}
          </p>}
          {!recipe.time && recipe.meal_time && <p className="mt-1">
            {recipe.meal_time}
          </p>}
          <div className="mt-2 flex flex-wrap gap-1 overflow-x-auto no-scrollbar">
            {typeof recipe.calories === "object"
              ? <RecipeCalories recipe={recipe} />
              : <MealCalories recipe={recipe} />}
          </div>
        </div>
      </div>
    </DialogTrigger>}
    {children}
    <DialogContent className="p-0 gap-0 max-h-[70vh] overflow-y-auto">
      <DialogTitle className="p-4 border-b-1">Details</DialogTitle>
      <div className="p-4">
        <div
          className="relative w-full h-[250px] bg-[var(--comp-1)] rounded-lg overflow-hidden border-1 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <Image
            alt=""
            src={previewImage}
            fill
            sizes="100vw"
            className="object-contain"
            onError={(e) => (e.currentTarget.src = "/not-found.png")}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-semibold transition">
            {uploading ? "Uploading..." : "Click to upload photo"}
          </div>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileRef}
            onChange={handleImageUpload}
          />
        </div>
        <div className="mt-2 mb-6 flex justify-between items-center">
          <SelectMealCollection index={index}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search />
                Search
              </Button>
            </DialogTrigger>
          </SelectMealCollection>
        </div>
        <FormControl
          value={formData.dish_name || formData.name || ""}
          name="dish_name"
          onChange={onChangeHandler}
          placeholder="Dish Name"
          className="block mb-4"
        />
        <FormControl
          value={formData.description || ""}
          name="description"
          onChange={onChangeHandler}
          placeholder="Description"
          className="block mb-4"
        />
        <FormControl
          type="time"
          value={formData.time || ""}
          name="time"
          onChange={onChangeHandler}
          className="block mb-4"
        />
        <h3>Nutrition Values</h3>
        <label className="flex justify-between items-center">
          <span>Serving Size</span>
          <FormControl
            value={formData.serving_size || ""}
            name="serving_size"
            onChange={onChangeHandler}
          />
        </label>
        <label className="flex justify-between items-center">
          <span>Calories</span>
          <FormControl
            value={formData.calories || ""}
            name="calories"
            onChange={onChangeHandler}
          />
        </label>
        <label className="flex justify-between items-center">
          <span>Proteins</span>
          <FormControl
            value={formData.protein || ""}
            name="protein"
            onChange={onChangeHandler}
          />
        </label>
        <label className="flex justify-between items-center">
          <span>Carbohydrates</span>
          <FormControl
            value={formData.carbohydrates || ""}
            name="carbohydrates"
            onChange={onChangeHandler}
          />
        </label>
        <label className="flex justify-between items-center">
          <span>Fats</span>
          <FormControl
            value={formData.fats || ""}
            name="fats"
            onChange={onChangeHandler}
          />
        </label>
        <label className="mt-2 flex justify-between items-center">
          <span>Measure</span>
          <Select
            value={formData.measure || undefined}
            onValueChange={(value) => setFormData({ ...formData, measure: value })}
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Select measure" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {MEASURE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button
          className="w-full mt-4"
          variant="wz"
          onClick={updateDish}
        >
          Save
        </Button>
        <DialogClose ref={closeBtnRef} />
      </div>
    </DialogContent>
  </Dialog>
}

function MealCalories({ recipe }) {
  return <div className="flex flex-row flex-wrap gap-1">
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Serving Size -</span>{recipe?.serving_size}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Kcal -</span>{recipe?.calories}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Protien -</span> {recipe.protein}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Carbs -</span> {recipe.carbohydrates}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Fats -</span> {recipe.fats}</Badge>
    {recipe.measure !== undefined && <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Measure -</span> {recipe.measure}</Badge>}
  </div>
}

function RecipeCalories({ recipe }) {
  return <div className="flex flex-row flex-wrap gap-1">
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Protien -</span> {recipe?.calories?.proteins}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Carbs -</span> {recipe?.calories?.carbs}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Fats -</span> {recipe?.calories?.fats}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Kcal -</span>{recipe?.calories?.total}</Badge>
  </div>
}