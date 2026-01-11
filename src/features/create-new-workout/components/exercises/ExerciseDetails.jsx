import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Minus, Plus, GripVertical, Pen } from "lucide-react";
import SelectExercise from "./SelectExercise";
import { DialogTrigger } from "@/components/ui/dialog";

const buildDraftSets = (sourceSets = []) =>
  sourceSets.map((set) => ({
    reps: typeof set?.reps === "number" ? set.reps : 0,
    weight: typeof set?.weight === "number" ? set.weight : 0,
  }));

export default function ExerciseDetails({
  exercise,
  saveExercisesForDay,
  target,
}) {
  const { id, name, sets = [] } = exercise;
  const [activeSetIndex, setActiveSetIndex] = useState("0");
  const [draftSets, setDraftSets] = useState(() => buildDraftSets(sets));
  const [isSetDropdownOpen, setIsSetDropdownOpen] = useState(false);

  useEffect(() => {
    setDraftSets(buildDraftSets(sets));
  }, [sets]);

  useEffect(() => {
    if (!draftSets.length) {
      if (activeSetIndex !== "0") {
        setActiveSetIndex("0");
      }
      return;
    }

    const currentIndex = Number(activeSetIndex);

    if (Number.isNaN(currentIndex) || currentIndex >= draftSets.length) {
      setActiveSetIndex(String(draftSets.length - 1));
    }
  }, [draftSets.length, activeSetIndex]);

  const updateSet = (index, updatedSet) => {
    saveExercisesForDay({
      ...exercise,
      sets: sets.map((set, i) =>
        i === index ? { ...set, ...updatedSet } : set,
      ),
    });
  };

  const commitActiveSet = () => {
    const index = Number(activeSetIndex);

    if (
      Number.isNaN(index) ||
      index < 0 ||
      index >= draftSets.length
    ) {
      return;
    }

    const draft = draftSets[index];
    const baseSet = sets[index] ?? {};

    if (draft.reps === baseSet.reps && draft.weight === baseSet.weight) {
      return;
    }

    updateSet(index, draft);
  };

  const updateDraftValue = (index, key, delta) => {
    setDraftSets((current) =>
      current.map((draft, draftIndex) => {
        if (draftIndex !== index) {
          return draft;
        }

        const currentValue = typeof draft[key] === "number" ? draft[key] : 0;
        return { ...draft, [key]: Math.max(0, currentValue + delta) };
      }),
    );
  };

  const handleDropdownOpenChange = (open) => {
    if (!open) {
      commitActiveSet();
    }

    setIsSetDropdownOpen(open);
  };

  const handleCloseDropdown = () => {
    commitActiveSet();
    setIsSetDropdownOpen(false);
  };

  const handleAddSet = () => {
    const newSet = { reps: 0, weight: 0 };

    saveExercisesForDay({
      ...exercise,
      sets: [...sets, newSet],
    });

    setDraftSets((current) => [...current, { ...newSet }]);
    setActiveSetIndex(String(sets.length));
  };

  const activeSetNumber = Number(activeSetIndex);
  const activeSetLabel = draftSets.length
    ? `Set ${Number.isNaN(activeSetNumber) ? 1 : activeSetNumber + 1}`
    : "Select Set";

  return (
    <Card className="bg-[var(--comp-1)] rounded-md border border-border shadow-none p-3 space-y-3 gap-0">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded border flex items-center justify-center text-xs text-muted-foreground">
          IMG
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-xs text-muted-foreground">{target}</p>
        </div>
        <GripVertical className="cursor-grab text-muted-foreground" size={18} />
        <SelectExercise
          saveExercisesForDay={(value) => {
            saveExercisesForDay({ ...value, id })
          }}
        >
          <DialogTrigger>
            <Pen size={14} />
          </DialogTrigger>
        </SelectExercise>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={activeSetIndex}
          onValueChange={setActiveSetIndex}
          open={isSetDropdownOpen}
          onOpenChange={handleDropdownOpenChange}
        >
          <SelectTrigger className="w-full h-9 rounded-md border text-xs">
            <span className="truncate text-left leading-none">
              {activeSetLabel}
            </span>
          </SelectTrigger>
          <SelectContent
            className="w-full max-h-[320px] overflow-y-auto pb-0"
            key={draftSets.length}
          >
            <div className="space-y-3 px-2 py-3">
              {draftSets.length === 0 &&
                <p className="text-xs text-muted-foreground px-1">
                  Add a set to start logging reps and weight.
                </p>}
              {draftSets.map((draft, index) => (<SetDetails
                key={index}
                index={index}
                draft={draft}
                updateDraftValue={updateDraftValue}
              />))}
              <div className="bg-white flex gap-4 sticky bottom-0 justify-end border-t pt-2">
                <Button onClick={handleAddSet} size="sm" variant="outline">
                  Add Set
                </Button>
                <Button size="sm" variant="outline" onClick={handleCloseDropdown}>
                  Done
                </Button>
              </div>
            </div>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}

function SetDetails({ index, draft, updateDraftValue }) {
  return <div
    key={index}
    className={"bg-gray-50 space-y-2 rounded-md border px-3 py-2 text-xs border-border"}
    onClick={() => setActiveSetIndex(String(index))}
  >
    <div className="flex items-center justify-between">
      Set {index + 1}
    </div>

    <div className="flex items-center gap-4">
      <div>Reps:</div>
      <div className="flex items-center gap-1 border rounded px-1">
        <Button
          variant="icon"
          size="icon"
          className="h-5 w-5 rounded opacity-90"
          onClick={(event) => {
            event.stopPropagation();
            updateDraftValue(index, "reps", -1);
          }}
        >
          <Minus size={12} />
        </Button>
        <span className="text-xs w-4 text-center">
          {draft.reps}
        </span>
        <Button
          variant="icon"
          size="icon"
          className="h-5 w-5 rounded opacity-90"
          onClick={(event) => {
            event.stopPropagation();
            updateDraftValue(index, "reps", 1);
          }}
        >
          <Plus size={12} />
        </Button>
      </div>

      <div className="ml-8">Weight:</div>
      <div className="flex items-center gap-1 border rounded px-1">
        <Button
          variant="icon"
          size="icon"
          className="h-5 w-5 rounded opacity-90"
          onClick={(event) => {
            event.stopPropagation();
            updateDraftValue(index, "weight", -1);
          }}
        >
          <Minus size={12} />
        </Button>
        <span className="text-xs w-4 text-center">
          {draft.weight}
        </span>
        <Button
          variant="icon"
          size="icon"
          className="h-5 w-5 rounded opacity-90"
          onClick={(event) => {
            event.stopPropagation();
            updateDraftValue(index, "weight", 1);
          }}
        >
          <Plus size={12} />
        </Button>
      </div>
    </div>
  </div>
}