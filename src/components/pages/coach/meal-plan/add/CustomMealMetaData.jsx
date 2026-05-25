import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customWorkoutUpdateField, generateMonthlyDays } from "@/config/state-reducers/custom-meal";
import { cn, getObjectUrl } from "@/lib/utils";
import { uploadImage } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import ImportMealPlans from "./ImportMealPlans";

export default function CustomMealMetaData({ viewType }) {
  const { dispatch, ...state } = useCurrentStateContext()
  const fileRef = useRef()
  const [uploadingImage, setUploadingImage] = useState(false)
  const mealPlanAutosaveEnabled = useAppSelector((s) => s.coach?.data?.mealPlanAutosaveEnabled === true)
  const showTitleAutosaveHint =
    mealPlanAutosaveEnabled && !String(state.title || "").trim()

  return <div className={cn("md:pr-8 flex gap-4 bg-slate-50/20 border-1 rounded-[10px] p-4", viewType === "vertical" ? "flex-col md:flex-row" : "flex-col")}>
    <div className="grow">
      <Label className="font-bold mb-2">Thumbnail</Label>
      <Image
        src={state.file ? getObjectUrl(state.file) : state.thumbnail || state.image || "/not-found.png"}
        alt=""
        height={400}
        width={400}
        className="max-h-[220px] w-full object-cover rounded-[10px]"
        onClick={() => !uploadingImage && fileRef.current?.click()}
        onError={e => e.target.src = "/not-found.png"}
      />
      {showTitleAutosaveHint && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
          Add a title to ensure Autosave works.
        </p>
      )}
    </div>
    <div className="grow space-y-2">
      <div>
        <FormControl
          value={state.title}
          onChange={e => dispatch(customWorkoutUpdateField("title", e.target.value))}
          placeholder="Enter title"
          label="Title"
        />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const MAX_SIZE_LIMIT = 5 * 1024 * 1024;
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > MAX_SIZE_LIMIT) {
              toast.error("File size more than 5MB");
              return;
            }
            setUploadingImage(true);
            try {
              const response = await uploadImage(file);
              const ok = response && response.status_code === 200;
              const imgUrl = ok
                ? (response?.img ?? response?.data?.img ?? response?.data?.url ?? response?.url)
                : null;
              if (imgUrl) {
                dispatch(customWorkoutUpdateField("image", imgUrl));
                dispatch(customWorkoutUpdateField("thumbnail", imgUrl));
                dispatch(customWorkoutUpdateField("file", null));
              } else if (!ok) {
                toast.error("Upload failed");
                dispatch(customWorkoutUpdateField("file", file));
              }
            } catch (err) {
              toast.error(err?.message || "Upload failed");
              dispatch(customWorkoutUpdateField("file", file));
            } finally {
              setUploadingImage(false);
            }
            e.target.value = "";
          }}
          ref={fileRef}
          hidden
        />
        {uploadingImage && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
      </div>
      <div>
        <Label className="font-bold mb-2">Description</Label>
        <Textarea
          value={state.description}
          onChange={e => dispatch(customWorkoutUpdateField("description", e.target.value))}
          placeholder="Enter Description"
          label="Description"
          className="min-h-[120px]"
        />
      </div>
      <div>
        <Label className="font-bold mb-2">Guidelines</Label>
        <Textarea
          value={state.guidelines}
          onChange={e => dispatch(customWorkoutUpdateField("guidelines", e.target.value))}
          placeholder="Enter Guidelines"
          label="Guidelines"
          className="min-h-[120px]"
        />
      </div>
      <div>
        <Label className="font-bold mb-2">Supplements</Label>
        <Textarea
          value={state.supplements}
          onChange={e => dispatch(customWorkoutUpdateField("supplements", e.target.value))}
          placeholder="Enter Supplements"
          label="Supplements"
          className="min-h-[120px]"
        />
      </div>
      {state.mode === "monthly" && <div className="grid grid-cols-2 items-end gap-2">
        <NumberOfDaysControl
          noOfDays={state.noOfDays}
          dispatch={dispatch}
          customWorkoutUpdateField={customWorkoutUpdateField}
          generateMonthlyDays={generateMonthlyDays}
        />
        <ImportMealPlans />
      </div>}
    </div>
  </div>
}

function NumberOfDaysControl({ noOfDays, dispatch, customWorkoutUpdateField, generateMonthlyDays }) {
  const [localDays, setLocalDays] = useState(noOfDays === 0 ? "" : Number(noOfDays));
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    const n = noOfDays === 0 ? "" : Number(noOfDays);
    setLocalDays(n);
    setHasChanged(false);
  }, [noOfDays]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) {
      setLocalDays(value === "" ? "" : value);
      setHasChanged(true);
    }
  };

  const handleApply = () => {
    const num = Number(localDays);
    if (localDays === "" || isNaN(num) || num <= 0) {
      toast.error("Enter a valid number of days (1 or more).");
      return;
    }
    dispatch(customWorkoutUpdateField("noOfDays", num));
    dispatch(generateMonthlyDays(num));
    setHasChanged(false);
    toast.success(`Plan updated to ${num} days.`);
  };

  return (
    <div className="space-y-2">
      <Label className="font-bold mb-2">Number Of Days</Label>
      {/* <p className="text-xs text-muted-foreground mb-1">
        Change the value and click Apply to update. Existing meals for each day are preserved.
      </p> */}
      <div className="flex flex-wrap items-end gap-2">
        <FormControl
          value={localDays}
          onChange={handleInputChange}
          placeholder="e.g. 7, 14, 30"
          type="number"
          min={1}
          className="w-[120px] min-h-0 text-xs grow"
        />
        <Button
          type="button"
          variant={hasChanged ? "wz" : "outline"}
          size="sm"
          onClick={handleApply}
          disabled={!hasChanged}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}