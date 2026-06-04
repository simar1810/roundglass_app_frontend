import RecipeModal from "@/components/modals/RecipeModal";
import DeleteRecipeModal from "@/components/modals/tools/DeleteRecipeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecipeIngredientsDetailBlock from "@/components/recipes/RecipeIngredientsDetailBlock";
import CategoryBadge from "@/features/feature-categories/components/CategoryBadge";
import { useFeatureScope } from "@/hooks/useFeatureScope";
import {
  computeCompositionTotalsFromRecipe,
  getRecipeIngredientsDisplayText,
  hasIngredientLineItems,
} from "@/lib/recipes/recipeIngredientsDisplay";
import { cn } from "@/lib/utils";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function RecipeDisplayCard({ plan }) {
  const { hasAccess: canManageMeals } = useFeatureScope("meal_plans:manage");
  const [modal, setModal] = useState(false);
  const ingredientsPreview = getRecipeIngredientsDisplayText(plan);
  const isCustom = !plan.admin;

  return (
    <Card
      tabIndex={0}
      aria-label={`View recipe: ${plan.title}`}
      onClick={() => setModal(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setModal(true);
        }
      }}
      className={cn(
        "group relative gap-0 overflow-hidden rounded-xl border border-border/80 bg-card p-0 shadow-sm transition-all",
        "cursor-pointer hover:border-[var(--accent-1)]/45 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-1)]/40",
      )}
    >
      {modal && (
        <DisplayRecipeDetails recipe={plan} setModal={setModal} />
      )}
      <CardHeader className="relative aspect-video shrink-0 p-0">
        <Image
          fill
          src={plan.image || "/not-found.png"}
          alt=""
          className="object-cover bg-black transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 25vw"
          onError={(e) => {
            e.currentTarget.src = "/not-found.png";
          }}
        />
        {/* Readability + click hint */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
          <span className="text-[11px] font-medium text-white/95 drop-shadow-md">
            Click card to view details
          </span>
          <span className="flex items-center gap-0.5 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
            View
            <ChevronRight className="size-3 opacity-90" aria-hidden />
          </span>
        </div>
        <Badge
          variant="wz"
          className="absolute top-2 left-2 z-10 text-[9px] font-semibold shadow-sm"
        >
          {plan.tag === "ADMIN" ? "Admin" : "Custom"}
        </Badge>
        {canManageMeals && isCustom ? (
          <div
            className="absolute top-2 right-2 z-20 flex flex-wrap items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <RecipeModal
              type="edit"
              recipe={plan}
              editTrigger={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1 border border-border/60 bg-white/95 text-[11px] font-semibold text-[var(--dark-1)] shadow-sm backdrop-blur-sm hover:bg-white dark:bg-zinc-900/95 dark:hover:bg-zinc-900"
                >
                  <Pencil className="size-3.5 shrink-0" aria-hidden />
                  Edit
                </Button>
              }
            />
            <DeleteRecipeModal
              _id={plan._id}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-[11px] font-semibold shadow-sm"
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  Delete
                </Button>
              }
            />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className="line-clamp-2 text-left text-[14px] font-semibold leading-snug text-[var(--dark-1)]">
            {plan.title}
          </h5>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {hasIngredientLineItems(plan) ? (
            <Badge
              variant="outline"
              className="h-5 border-[var(--accent-1)]/50 px-1.5 py-0 text-[9px] font-semibold text-[var(--dark-1)]/80"
            >
              Catalog
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-3 text-left text-[12px] leading-snug text-[var(--dark-1)]/65">
          {ingredientsPreview || "—"}
        </p>
        <CategoryBadge
          category={plan.category}
          subcategory={plan.subCategory}
          className="scale-[0.9] origin-left"
        />
      </CardContent>
    </Card>
  );
}

function DisplayRecipeDetails({ recipe, setModal }) {
  const compositionTotals = hasIngredientLineItems(recipe)
    ? computeCompositionTotalsFromRecipe(recipe)
    : null;
  const nutrition = compositionTotals
    ? {
        total: compositionTotals.total,
        proteins: compositionTotals.proteins,
        carbs: compositionTotals.carbs,
        fats: compositionTotals.fats,
        fibers: compositionTotals.fibers,
      }
    : recipe.calories;

  return (
    <Dialog open onOpenChange={(open) => !open && setModal(false)}>
      <DialogContent
        showCloseButton
        className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden rounded-xl border border-border/70 p-0 shadow-lg sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-[var(--accent-1)]/15 bg-[var(--comp-1)]/60 px-6 py-5 text-left">
          <DialogTitle className="text-balance text-xl font-semibold text-[var(--dark-1)] pr-8">
            {recipe.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--dark-1)]/55">
            Recipe details and nutrition per serving.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-6rem)] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {recipe.image ? (
              <div className="relative h-52 w-full overflow-hidden rounded-lg border border-border/60 bg-muted">
                <Image
                  src={recipe.image || "/placeholder.svg"}
                  alt={recipe.title || "Recipe"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 42rem"
                />
              </div>
            ) : null}

            <Card className="gap-0 overflow-hidden rounded-lg border border-border/70 shadow-none">
              <CardHeader className="border-b border-border/60 bg-[var(--comp-1)]/40 px-4 py-3">
                <CardTitle className="text-base font-semibold text-[var(--dark-1)]">
                  Nutrition
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <MacroTile
                    label="Calories"
                    value={nutrition?.total}
                    unit="kcal"
                    emphasis
                  />
                  <MacroTile
                    label="Protein"
                    value={nutrition?.proteins}
                    unit="g"
                  />
                  <MacroTile
                    label="Carbs"
                    value={nutrition?.carbs}
                    unit="g"
                  />
                  <MacroTile
                    label="Fat"
                    value={nutrition?.fats}
                    unit="g"
                  />
                  <MacroTile
                    label="Fibre"
                    value={nutrition?.fibers}
                    unit="g"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-lg border border-border/70 shadow-none">
              <CardHeader className="border-b border-border/60 bg-[var(--comp-1)]/40 px-4 py-3">
                <CardTitle className="text-base font-semibold text-[var(--dark-1)]">
                  Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <RecipeIngredientsDetailBlock recipe={recipe} />
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-lg border border-border/70 shadow-none">
              <CardHeader className="border-b border-border/60 bg-[var(--comp-1)]/40 px-4 py-3">
                <CardTitle className="text-base font-semibold text-[var(--dark-1)]">
                  Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--dark-1)]/90">
                  {recipe.method?.trim() ? recipe.method : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MacroTile({ label, value, unit, emphasis }) {
  const display =
    value != null && value !== "" ? `${value}${unit ? ` ${unit}` : ""}` : "—";
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-[var(--comp-1)]/35 p-3 text-center",
        emphasis && "border-[var(--accent-1)]/25 bg-[var(--accent-1)]/8",
      )}
    >
      <div
        className={cn(
          "text-lg font-bold tabular-nums text-[var(--dark-1)]",
          emphasis && "text-[var(--accent-1)]",
        )}
      >
        {display}
      </div>
      <div className="mt-1 text-xs font-medium text-[var(--dark-1)]/55">
        {label}
      </div>
    </div>
  );
}
