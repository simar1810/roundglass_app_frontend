import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Pen, Search, } from "lucide-react";
import SelectMealCollection from "./SelectMealCollection";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import FormControl from "@/components/FormControl";
import { useRef, useState } from "react";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { saveRecipe } from "@/config/state-reducers/custom-meal";
import UploadImage from "@/components/modals/UploadImage";

export default function EditSelectedMealDetails({
  children,
  recipe,
  index
}) {
  const [formData, setFormData] = useState(recipe);
  const { dispatch } = useCurrentStateContext();
  const onChangeHandler = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const closeBtnRef = useRef()
  return <Dialog>
    {!children && <DialogTrigger>
      <Pen size={16} />
    </DialogTrigger>}
    {children}
    <DialogContent className="p-0 gap-0 max-h-[70vh] overflow-y-auto">
      <DialogTitle className="p-4 border-b-1">Details</DialogTitle>
      <div className="p-4">
        <Image
          alt=""
          src={recipe.image || "/not-found.png"}
          height={100}
          width={100}
          className="w-full h-[140px] rounded-lg object-cover"
        />
        <div className="mt-2 mb-6 flex justify-between items-center">
          <SelectMealCollection index={index}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search />
                Search
              </Button>
            </DialogTrigger>
          </SelectMealCollection>
          {recipe._id && <UploadImage setter={(image) => setFormData({ ...formData, image })} />}
        </div>
        <FormControl
          value={formData.dish_name || formData.name}
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
        <Button
          className="w-full mt-4"
          variant="wz"
          onClick={() => {
            dispatch(saveRecipe(formData, index))
            closeBtnRef.current.click()
          }}
        >
          Save
        </Button>
        <DialogClose ref={closeBtnRef} />
      </div>
    </DialogContent>
  </Dialog>
}