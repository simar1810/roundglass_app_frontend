import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { saveRecipe } from "@/config/state-reducers/custom-meal";
import useDebounce from "@/hooks/useDebounce";
import { getRecipesCalorieCounter } from "@/lib/fetchers/app";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import useSWR from "swr";

export default function SelectMealCollection({ children, index }) {
  return <Dialog>
    {children}
    {!Boolean(children) && <DialogTrigger className="w-full mt-4">
      <h3 className="text-left">Select Meals</h3>
      <div className="w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]">
        <PlusCircle size={32} className="text-[var(--accent-1)]" />
      </div>
    </DialogTrigger>}
    <DialogContent className="max-w-[450px] p-0 gap-0">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Add Meals</DialogTitle>
      </DialogHeader>
      <RecipeesContainer index={index} />
    </DialogContent>
  </Dialog>
}

function RecipeesContainer({ index }) {
  const [query, setQuery] = useState("rajma");
  const debouncedSearchQuery = useDebounce(query, 1000);
  const { isFetching, error, data } = useSWR(`recipees/${debouncedSearchQuery}`, () => getRecipesCalorieCounter(debouncedSearchQuery));

  const [selected, setSelected] = useState()
  const closeRef = useRef()
  const { dispatch } = useCurrentStateContext();

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const recipees = data.data

  return <div className="p-4">
    <div className="flex items-center gap-4 pb-2">
      <Input
        placeholder="Enter search Query"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {isFetching && <Loader />}
    </div>
    <div className="max-h-[55vh] overflow-y-auto flex flex-col items-start gap-y-8 no-scrollbar">
      {recipees.map((recipe, index) => <RecipeDeatils
        key={index}
        recipe={recipe}
        selected={selected}
        setSelected={setSelected}
      />)}
    </div>
    {selected && <Button
      onClick={() => {
        dispatch(saveRecipe(selected, index))
        closeRef.current.click()
      }}
      variant="wz"
      className="w-full"
    >
      Add
    </Button>}
    <DialogClose ref={closeRef} />
  </div>
}

function RecipeDeatils({
  recipe,
  selected,
  setSelected
}) {
  return <label className="w-full flex gap-4 items-start cursor-pointer">
    <FormControl
      type="checkbox"
      checked={selected?._id?.$oid === recipe?._id?.$oid}
      onChange={() => setSelected(selected?._id?.$oid === recipe?._id?.$oid ? {} : recipe)}
      className="min-w-[20px] min-h-[20px]"
    />
    <div className="grow">
      <Image
        src={recipe.image || "/not-found.png"}
        alt=""
        height={400}
        width={150}
        className="h-[140px] w-full object-cover mb-2"
      />
      <h3>{recipe.dish_name}</h3>
    </div>
  </label>
}