import RecipeModal from "@/components/modals/RecipeModal";
import DeleteRecipeModal from "@/components/modals/tools/DeleteRecipeModal";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import { getRecipeById } from "@/lib/fetchers/app";
import { getIngredientRecipeErrorMessage } from "@/lib/utils/ingredientRecipeErrors";

export default function RecipeDisplayCard({ plan }) {
  const [modal, setModal] = useState(false);
  return <Card
    className="p-0 rounded-[4px] shadow-none gap-2"
  >
    {modal && <DisplayRecipeDetails
      recipe={plan}
      setModal={setModal}
    />}
    <CardHeader className="relative aspect-video">
      <Image
        fill
        src={plan.image || "/"}
        alt=""
        className="object-cover bg-black"
        onClick={() => setModal(true)}
      />
      {plan.tag === "ADMIN"
        ? <Badge variant="wz" className="text-[9px] font-semibold absolute top-2 left-2">Admin</Badge>
        : <Badge variant="wz" className="text-[9px] font-semibold absolute top-2 left-2">Custom</Badge>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="text-white w-[16px] !absolute top-2 right-2">
          {!plan.admin && <EllipsisVertical className="cursor-pointer" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-semibold">
          <RecipeModal type="edit" recipe={plan} />
          <DropdownMenuSeparator className="mx-1" />
          <DropdownMenuLabel className="!text-[12px]  font-semibold py-0">
            <DeleteRecipeModal _id={plan._id} />
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent onClick={() => setModal(true)} className="p-2 pt-1">
      <div className="flex items-start justify-between gap-1">
        <h5 className="text-[14px]">{plan.title}</h5>
      </div>
      {/* List uses title + recipe.ingredients only (no GET-by-id). Backend provides ingredients string for both legacy and line-item recipes. */}
      <p className="text-[12px] text-[var(--dark-1)]/25 leading-tight mt-1">
        {plan.ingredients}
      </p>
    </CardContent>
  </Card>
}

function DisplayRecipeDetails({
  recipe,
  setModal
}) {
  const recipeId = recipe?._id;
  const { data, isLoading } = useSWR(
    recipeId ? ["recipe-detail", recipeId] : null,
    () => getRecipeById(recipeId)
  );

  const fetchFailed = data && !data?.success;
  const fetchErrorMsg = fetchFailed ? getIngredientRecipeErrorMessage(data, "recipe_get") : null;

  const detail = data?.success && data?.data ? data.data : recipe;

  const calories = detail.calories || {};

  const ingredientLines = Array.isArray(detail.ingredientLineItems) && detail.ingredientLineItems.length > 0
    ? detail.ingredientLineItems
        .filter((item) => item && item.ingredient && item.quantityGrams)
        .map((item) => {
          const name = item.ingredient?.foodName || item.ingredient?.foodCode || "Ingredient";
          return `${name} (${item.quantityGrams} g)`;
        })
        .join(", ")
    : detail.ingredients;

  return (
    <Dialog open={true} onOpenChange={() => setModal(false)}>
      <DialogContent className="p-0 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="p-6 border-b text-2xl font-bold text-balance">{detail.title}</DialogTitle>

        {fetchErrorMsg && (
          <div className="px-6 py-4 text-[var(--accent-2)] font-medium">{fetchErrorMsg}</div>
        )}

      <div className="p-6 space-y-6">
        {detail.image && (
          <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
            <img src={detail.image || "/placeholder.svg"} alt={detail.title} className="w-full h-full object-contain" />
          </div>
        )}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-lg">Nutritional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{calories.total}</div>
                <div className="text-sm text-muted-foreground">Total Calories</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-semibold text-blue-600">{calories.proteins}g</div>
                <div className="text-sm text-muted-foreground">Proteins</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-semibold text-green-600">{calories.carbs}g</div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-semibold text-yellow-600">{calories.fats}g</div>
                <div className="text-sm text-muted-foreground">Fats</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-semibold text-orange-600">{calories.fibers}g</div>
                <div className="text-sm text-muted-foreground">Fibers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-lg">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line text-foreground leading-relaxed">
              {isLoading ? "Loading ingredients…" : (ingredientLines || "—")}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-lg">Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line text-foreground leading-relaxed">{detail.method}</div>
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  </Dialog>
  );
}