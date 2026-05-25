import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customWorkoutUpdateField, generateMonthlyDays } from "@/config/state-reducers/custom-meal";
import { cn, getObjectUrl } from "@/lib/utils";
import { uploadImage } from "@/lib/api";
import { SearchableSelect } from "@/components/common/selects/SearchableSelect";
import { getAppClientPortfolioDetails, getAppClients } from "@/lib/fetchers/app";
import { getMacroBreakdownFromEntry, getSavedEntryDisplay } from "@/features/meals/tdee-calculator/utils/goals";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import Image from "next/image";
import useSWR from "swr";
import { useMemo, useRef, useState, useEffect } from "react";
import { Flame, Target, TriangleAlert, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import ImportMealPlans from "./ImportMealPlans";

export default function CustomMealMetaData({ viewType }) {
  const { dispatch, ...state } = useCurrentStateContext()
  const fileRef = useRef()
  const [uploadingImage, setUploadingImage] = useState(false)
  const mealPlanAutosaveEnabled = useAppSelector((s) => s.coach?.data?.mealPlanAutosaveEnabled === true)
  const showTitleAutosaveHint =
    mealPlanAutosaveEnabled && !String(state.title || "").trim()
  const tdeeEnabled = state.tdeeEnabled === true;

  const { data: clientsResponse } = useSWR(
    "meal-plan-tdee-clients",
    () => getAppClients({ page: 1, limit: 300 })
  );
  const clients = Array.isArray(clientsResponse?.data) ? clientsResponse.data : [];
  const tdeeClientOptions = useMemo(
    () =>
      clients
        .filter((client) => client?.isActive && client?.isVerified)
        .map((client) => ({
          value: client._id,
          label: client?.name || "Unnamed client",
        })),
    [clients]
  );

  const selectedClientId = state.tdeeClientId || "";
  const { data: clientProfileResponse, isLoading: loadingTdeeProfile } = useSWR(
    selectedClientId ? `meal-plan-tdee-client-profile-${selectedClientId}` : null,
    () => getAppClientPortfolioDetails(selectedClientId)
  );

  const latestTdeeSnapshot = useMemo(() => {
    const profile = clientProfileResponse?.data || {};
    const snapshots = Array.isArray(profile?.tdeeCalculations) ? profile.tdeeCalculations : [];
    if (!snapshots.length) return null;
    return [...snapshots].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))[0];
  }, [clientProfileResponse?.data]);
  const latestTdeeDisplay = latestTdeeSnapshot ? getSavedEntryDisplay(latestTdeeSnapshot) : null;
  const resolvedTdeeCalories = Number(latestTdeeDisplay?.calories ?? 0);
  const hasValidTdeeCalories = Number.isFinite(resolvedTdeeCalories) && resolvedTdeeCalories > 0;

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
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label className="font-bold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--accent-1)]" />
              TDEE Guided Planning
            </Label>
            <p className="text-xs text-muted-foreground">
              Pick a client and pull the latest saved TDEE target.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={tdeeEnabled ? "wz" : "outline"}
            onClick={() => dispatch(customWorkoutUpdateField("tdeeEnabled", !tdeeEnabled))}
          >
            {tdeeEnabled ? "Enabled" : "Enable"}
          </Button>
        </div>

        {tdeeEnabled && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <SearchableSelect
                value={selectedClientId}
                options={tdeeClientOptions}
                selectLabel="Select client for TDEE"
                searchPlaceholder="Search client..."
                onValueChange={(nextClientId) => {
                  const picked = tdeeClientOptions.find((item) => item.value === nextClientId);
                  dispatch(customWorkoutUpdateField("tdeeClientId", nextClientId));
                  dispatch(customWorkoutUpdateField("tdeeClientName", picked?.label || ""));
                }}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!selectedClientId || loadingTdeeProfile}
              onClick={() => {
                if (!selectedClientId) {
                  toast.error("Please select a client first.");
                  return;
                }
                if (!latestTdeeSnapshot || !hasValidTdeeCalories) {
                  toast.error("No valid TDEE snapshot found for this client.");
                  return;
                }
                const snapshotDate = latestTdeeSnapshot?.createdAt
                  ? new Date(latestTdeeSnapshot.createdAt).toLocaleString()
                  : "";
                dispatch(customWorkoutUpdateField("tdeeTargetCalories", Math.round(resolvedTdeeCalories)));
                dispatch(customWorkoutUpdateField("tdeeGoalLabel", latestTdeeDisplay?.goalLabel || "TDEE Target"));
                dispatch(customWorkoutUpdateField("tdeeSnapshotAt", snapshotDate));
                dispatch(
                  customWorkoutUpdateField(
                    "tdeeMacroTargets",
                    getMacroBreakdownFromEntry(latestTdeeSnapshot) || null
                  )
                );
                toast.success("Latest TDEE target applied.");
              }}
            >
              {loadingTdeeProfile ? "Loading latest TDEE..." : "Use latest TDEE target"}
            </Button>

            {!selectedClientId && (
              <p className="text-xs text-muted-foreground">Select a client to pull TDEE data.</p>
            )}

            {selectedClientId && latestTdeeDisplay && (
              <div className="rounded-lg border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--dark-3)]">
                  <UserRoundCheck className="h-4 w-4 text-[var(--accent-1)]" />
                  {state.tdeeClientName || "Selected client"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{latestTdeeDisplay?.goalLabel || "Goal"}</Badge>
                  <Badge variant="outline">
                    <Flame className="mr-1 h-3 w-3" />
                    {latestTdeeDisplay?.calories ?? "—"} kcal
                  </Badge>
                </div>
                {latestTdeeSnapshot?.createdAt && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Latest snapshot: {new Date(latestTdeeSnapshot.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {selectedClientId && !loadingTdeeProfile && !latestTdeeDisplay && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" />
                This client has no saved TDEE snapshot yet.
              </div>
            )}
          </div>
        )}
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