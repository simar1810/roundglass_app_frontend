"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "@/components/FormControl";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Textarea } from "../ui/textarea";
import {
  changeFieldvalue,
  generateRequestPayload,
  init,
  newRecipeeReducer,
  setLineItems,
  setMode,
} from "@/config/state-reducers/new-recipe";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendDataWithFormData } from "@/lib/api";
import Image from "next/image";
import { getObjectUrl } from "@/lib/utils";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import useDebounce from "@/hooks/useDebounce";
import { searchIngredients, getRecipeById } from "@/lib/fetchers/app";
import { getIngredientRecipeErrorMessage } from "@/lib/utils/ingredientRecipeErrors";

const calorieFields = [
  { id: 1, label: "Calories", name: "total", unit: "Kcal" },
  { id: 2, label: "Protein", name: "proteins", unit: "gm" },
  { id: 3, label: "Carbs", name: "carbs", unit: "gm" },
  { id: 4, label: "Fat", name: "fats", unit: "gm" },
  { id: 5, label: "Fibres", name: "fibers", unit: "gm" },
];

export default function RecipeModal({ type, recipe }) {
  const isEdit = type === "edit";
  const recipeId = recipe?._id;

  const { data: detailData, isLoading: isDetailLoading } = useSWR(
    isEdit && recipeId ? ["recipe-by-id", recipeId] : null,
    () => getRecipeById(recipeId)
  );

  const effectiveRecipe =
    isEdit && detailData?.data && detailData?.success ? detailData.data : recipe;

  return (
    <Dialog>
      {type === "new"
        ? (
          <DialogTrigger className="bg-[var(--accent-1)] text-[var(--primary-1)] text-xs md:text-[14px] font-[600] px-4 py-2 rounded-[8px]">
            Add New Recipe
          </DialogTrigger>
        )
        : (
          <DialogTrigger className="text-[12px] font-[ 400] px-2">
            Edit
          </DialogTrigger>
        )}
      <DialogContent className="!max-w-[500px] max-h-[85vh] border-0 p-0 overflow-y-auto gap-0">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold">{type === "new" ? "New Recipe" : "Edit Recipe"}</DialogTitle>
        </DialogHeader>
        {isEdit && recipeId && isDetailLoading && !detailData?.data ? (
          <div className="px-6 py-6 text-sm text-[var(--dark-1)]/60">
            Loading recipe details…
          </div>
        ) : (
          <CurrentStateProvider state={init(type, effectiveRecipe)} reducer={newRecipeeReducer}>
            <NewRecipeContainer type={type} />
          </CurrentStateProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function getLink(type, payload, _id) {
  if (type === "new") {
    const response = await sendDataWithFormData("app/addRecipes", payload);
    return response;
  }
  const response = await sendDataWithFormData(`app/editRecipes?id=${_id}`, payload, "PUT");
  return response;
}

function NewRecipeContainer({ type }) {
  const { dispatch, ...state } = useCurrentStateContext();
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef();
  const fileRef = useRef();

  const isLineItemsMode = state.mode === "lineItems";
  const lineItems = Array.isArray(state.lineItems) ? state.lineItems : [];
  const hasValidLineItems = lineItems.some(
    (item) => item && (item.ingredientId || item.ingredient) && Number(item.quantityGrams) > 0
  );

  async function createNewRecipee() {
    if (!state.title?.trim()) {
      toast.error("Recipe name is required.");
      return;
    }
    if (!state.method?.trim()) {
      toast.error("Method is required.");
      return;
    }
    if (isLineItemsMode) {
      if (!hasValidLineItems) {
        toast.error("Add at least one ingredient with quantity (grams).");
        return;
      }
    }

    try {
      setLoading(true);
      const payload = generateRequestPayload(state);
      const response = await getLink(type, payload, state._id);
      if (response?.status_code !== 200) {
        const context = type === "new" ? "recipe_add" : "recipe_edit";
        const msg = getIngredientRecipeErrorMessage(response, context);
        throw new Error(msg);
      }
      toast.success(response.message);
      mutate("getRecipes");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DialogClose ref={closeBtnRef} />
      <div className="px-6 pt-4 pb-6 space-y-4">
        <div>
          <p className="font-medium">Recipe Name</p>
          <FormControl
            placeholder="Enter Recipe Name"
            className="w-full"
            value={state.title}
            onChange={(e) => dispatch(changeFieldvalue("title", e.target.value))}
          />
        </div>

        <div>
          <p className="font-medium mb-2">Ingredients</p>
          <Tabs
            value={state.mode || "legacy"}
            onValueChange={(v) => dispatch(setMode(v))}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="legacy">Free-text ingredients</TabsTrigger>
              <TabsTrigger value="lineItems">Build from ingredients</TabsTrigger>
            </TabsList>
            <TabsContent value="legacy" className="mt-2">
              <Textarea
                placeholder="Enter Ingredients"
                className="w-full min-h-[120px]"
                value={state.ingredients}
                onChange={(e) => dispatch(changeFieldvalue("ingredients", e.target.value))}
              />
            </TabsContent>
            <TabsContent value="lineItems" className="mt-2">
              <RecipeLineItemsBuilder lineItems={lineItems} dispatch={dispatch} />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <p className="font-medium">Thumbnail</p>
          <div className="border-2 border-dashed border-gray-200 rounded-lg">
            {state.file || state.image
              ? (
                <Image
                  src={getObjectUrl(state.file) || state.image}
                  alt=""
                  height={200}
                  width={200}
                  className="w-full h-[200px] object-contain"
                  onClick={() => fileRef.current?.click()}
                />
              )
              : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="h-[120px] flex flex-col items-center justify-center text-gray-400 cursor-pointer"
                >
                  <ImagePlus size={24} className="mb-2" />
                  <span>Add Image</span>
                </div>
              )}
            <input
              ref={fileRef}
              onChange={(e) => dispatch(changeFieldvalue("file", e.target.files?.[0]))}
              type="file"
              hidden
            />
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Method</p>
          <Textarea
            placeholder="Enter Method"
            className="w-full min-h-[120px]"
            value={state.method}
            onChange={(e) => dispatch(changeFieldvalue("method", e.target.value))}
          />
        </div>

        {!isLineItemsMode && (
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {calorieFields.map((field) => (
              <FormControl
                key={field.id}
                value={state[field.name]}
                onChange={(e) => dispatch(changeFieldvalue(field.name, e.target.value))}
                className="[&_.label]:font-[400] [&_.label]:text-[14px] [&_.input]:text-[14px]"
                placeholder="required"
                type="number"
                {...field}
                label={`${field.label} - ${field.unit}`}
              />
            ))}
          </div>
        )}
        {isLineItemsMode && (
          <p className="text-sm text-[var(--dark-1)]/50">Calories will be computed from ingredients.</p>
        )}

        <div className="pt-4">
          <Button disabled={loading} onClick={createNewRecipee} variant="wz">
            Save Recipe
          </Button>
        </div>
      </div>
    </>
  );
}

function RecipeLineItemsBuilder({ lineItems, dispatch }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const closeTimeoutRef = useRef(null);

  const { data, isLoading } = useSWR(
    debouncedQuery && debouncedQuery.trim().length >= 2
      ? ["ingredients-search", debouncedQuery.trim()]
      : null,
    () => searchIngredients({ q: debouncedQuery.trim(), limit: 20 }),
    { keepPreviousData: true }
  );

  const options = Array.isArray(data?.data) ? data.data : [];

  function addIngredient(ingredient) {
    const newItem = {
      ingredientId: ingredient._id,
      quantityGrams: 100,
      ingredient: { _id: ingredient._id, foodName: ingredient.foodName, foodCode: ingredient.foodCode },
    };
    dispatch(setLineItems([...lineItems, newItem]));
    setQuery("");
    setOpen(false);
  }

  function updateQuantity(index, value) {
    const n = Number(value);
    const next = lineItems.map((item, i) =>
      i === index ? { ...item, quantityGrams: Number.isFinite(n) && n >= 0 ? n : item.quantityGrams } : item
    );
    dispatch(setLineItems(next));
  }

  function removeAt(index) {
    dispatch(setLineItems(lineItems.filter((_, i) => i !== index)));
  }

  function scheduleClose() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 200);
  }

  function handleFocus() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <FormControl
          placeholder="Search ingredients (min 2 characters)…"
          className="w-full"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={scheduleClose}
        />
        {open && query.trim().length >= 2 && (
          <div
            className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[var(--dark-1)]/10 rounded-md shadow-lg max-h-[200px] overflow-y-auto"
            role="listbox"
          >
            {isLoading && <div className="p-3 text-sm text-[var(--dark-1)]/50">Searching…</div>}
            {!isLoading && options.length === 0 && (
              <div className="p-3 text-sm text-[var(--dark-1)]/50">No ingredients found.</div>
            )}
            {!isLoading &&
              options.map((ing) => (
                <button
                  key={ing._id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-[var(--comp-1)] text-sm"
                  onClick={() => addIngredient(ing)}
                  role="option"
                >
                  {ing.foodName}
                  {ing.foodCode ? ` (${ing.foodCode})` : ""}
                </button>
              ))}
          </div>
        )}
      </div>

      {lineItems.length > 0 && (
        <ul className="space-y-2 mt-2">
          {lineItems.map((item, index) => (
            <li
              key={`${item.ingredientId}-${index}`}
              className="flex items-center gap-2 p-2 rounded-md bg-[var(--comp-1)] border border-[var(--dark-1)]/10"
            >
              <span className="flex-1 min-w-0 truncate text-sm">
                {item.ingredient?.foodName ?? item.ingredientId ?? "—"}
              </span>
              <input
                type="number"
                min={0}
                step={1}
                className="w-20 px-2 py-1 text-sm border border-[var(--dark-1)]/20 rounded"
                value={item.quantityGrams ?? ""}
                onChange={(e) => updateQuantity(index, e.target.value)}
              />
              <span className="text-xs text-[var(--dark-1)]/50">g</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[var(--accent-2)]"
                onClick={() => removeAt(index)}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
