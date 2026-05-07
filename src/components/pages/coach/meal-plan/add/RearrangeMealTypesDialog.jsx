"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { setMealTypeOrderAllPlans } from "@/config/state-reducers/custom-meal";
import { checkArray } from "@/lib/formatter";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Move } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function getPlanMeals(plan) {
  if (Array.isArray(plan)) return plan;
  if (Array.isArray(plan?.meals)) return plan.meals;

  return [
    { mealType: "breakfast", meals: plan?.breakfast || [] },
    { mealType: "lunch", meals: plan?.lunch || [] },
    { mealType: "dinner", meals: plan?.dinner || [] },
    { mealType: "snacks", meals: plan?.snacks || [] },
  ].filter((item) => Array.isArray(item.meals));
}

export default function RearrangeMealTypesDialog({
  selectedPlan,
  open: controlledOpen,
  onOpenChange,
  trigger = true,
}) {
  const { dispatch, selectedPlans } = useCurrentStateContext();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [localItems, setLocalItems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const prevOpenRef = useRef(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const meals = useMemo(() => {
    const rawPlan = selectedPlans?.[selectedPlan];
    return checkArray(getPlanMeals(rawPlan));
  }, [selectedPlan, selectedPlans]);

  const sortableItems = useMemo(
    () => meals.map((meal, index) => ({
      id: `${meal.mealType}-${index}`,
      mealType: meal.mealType,
      index,
    })),
    [meals]
  );

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    if (justOpened) {
      setLocalItems(sortableItems);
      setActiveId(null);
    }
    if (!open) {
      setActiveId(null);
    }
    prevOpenRef.current = open;
  }, [open, sortableItems]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activeMealType = useMemo(
    () => localItems.find((item) => item.id === activeId)?.mealType,
    [activeId, localItems]
  );

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setLocalItems((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const onSaveOrder = () => {
    const order = localItems.map((item) => item.mealType);
    dispatch(setMealTypeOrderAllPlans(order));
    handleOpenChange(false);
  };

  const hasOrderChanges = useMemo(() => {
    if (localItems.length !== sortableItems.length) return true;
    return localItems.some((item, index) => item?.mealType !== sortableItems[index]?.mealType);
  }, [localItems, sortableItems]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          <Button variant="outline">Rearrange Meal Types</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Rearrange Meal Types</DialogTitle>
        <DialogDescription>
          Drag meal types to reorder them. Changes apply to all plans.
        </DialogDescription>

        <div className="mt-2">
          {localItems.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No meal types found to rearrange.
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={(event) => setActiveId(event.active.id)}
              onDragCancel={() => setActiveId(null)}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={localItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localItems.map((item) => (
                    <SortableMealTypeRow key={item.id} id={item.id} label={item.mealType} />
                  ))}
                </div>
              </SortableContext>
              {isClient && createPortal(
                <DragOverlay adjustScale={false}>
                  {activeMealType ? (
                    <MealTypeRow label={activeMealType} isOverlay />
                  ) : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={onSaveOrder} disabled={!hasOrderChanges}>Save Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableMealTypeRow({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 160ms ease",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="transition-shadow">
      <MealTypeRow label={label} dragProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function MealTypeRow({ label, dragProps = {}, isOverlay = false }) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border bg-background px-3 py-2 ${isOverlay ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded border text-muted-foreground cursor-grab active:cursor-grabbing"
          {...dragProps}
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-medium uppercase tracking-wide">{label}</span>
      </div>
      <Move className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
