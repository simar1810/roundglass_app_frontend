"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { History, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";

import { SearchableSelect } from "@/components/common/selects/SearchableSelect";
import { fetchData, sendData } from "@/lib/api";
import { calculateTdee, normalizeTdeeGender } from "../utils";
import { ACTIVITY_OPTIONS, GENDER_OPTIONS } from "../utils/config";
import {
  GOAL_IDS,
  buildTdeeCalculationPayload,
  filterSavedEntriesByGoal,
  goalOptionLabel,
} from "../utils/goals";
import SelectClient from "./SelectClient";
import TdeeResult from "./TdeeResult";
import ClientGuardian from "@/components/client/ClientGuardian";

const historyKey = (clientId) =>
  clientId ? `coach-tdee-history/${clientId}` : null;

function TdeeHistoryPanel({ clientId, entries, goalLabel, hasAnySnapshots }) {
  if (!clientId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a client to see past TDEE calculations saved on their profile.
      </p>
    );
  }

  if (!entries?.length) {
    if (!hasAnySnapshots) {
      return (
        <p className="text-sm text-muted-foreground">
          No saved TDEE history yet for this client.
        </p>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        No saved snapshots for{" "}
        <span className="font-medium text-foreground">{goalLabel}</span> yet.
        Save from the form or pick another goal above.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((item, idx) => (
        <li
          key={item._id ?? item.createdAt ?? idx}
          className="rounded-lg border border-border bg-[var(--comp-1)]/80 px-3 py-2.5 text-sm"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-[var(--accent-1)]">
              {item.targetCalories != null
                ? `${item.targetCalories} kcal`
                : item.tdee != null
                  ? `${item.tdee} kcal`
                  : "—"}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : ""}
            </span>
          </div>
          {item.bmr != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              BMR {item.bmr} kcal
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function CalculatorContainer() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activity: "",
  });

  const [tdeeData, setTdeeData] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedTdee, setEditedTdee] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(GOAL_IDS.MAINTAIN);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const calculated = calculateTdee(formData);
    setTdeeData(calculated);
    setEditedTdee(null);
  }, [formData]);

  useEffect(() => {
    setSelectedGoal(GOAL_IDS.MAINTAIN);
  }, [formData.clientId]);

  const { data: profileData } = useSWR(
    historyKey(formData.clientId),
    () => fetchData(`app/clientProfile?id=${formData.clientId}`),
    { revalidateOnFocus: false }
  );

  const rawTdeeList =
    profileData?.status_code === 200 && profileData?.data?.tdeeCalculations
      ? profileData.data.tdeeCalculations
      : [];

  const hasAnyTdeeSnapshots =
    Array.isArray(rawTdeeList) && rawTdeeList.length > 0;

  const historyEntries = (() => {
    if (!hasAnyTdeeSnapshots) return [];
    const filtered = filterSavedEntriesByGoal(rawTdeeList, selectedGoal);
    return [...filtered]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, 8);
  })();

  const saveTDEE = async () => {
    try {
      setLoading(true);
      if (!formData.clientId) {
        throw new Error("Please select a client");
      }
      if (!tdeeData) throw new Error("Please fill all fields");
      const base = editedTdee || tdeeData;
      const payload = buildTdeeCalculationPayload(base, selectedGoal);
      const response = await sendData(
        `app/tdee-calculations/${formData.clientId}`,
        payload
      );
      if (response.status_code !== 200) {
        const msg =
          typeof response.message === "string" ? response.message : "";
        const errs = response.errors;
        let errDetail = "";
        if (Array.isArray(errs)) errDetail = errs.filter(Boolean).join("; ");
        else if (errs && typeof errs === "object")
          errDetail = Object.entries(errs)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
        else if (typeof errs === "string") errDetail = errs;
        throw new Error(
          [msg, errDetail].filter(Boolean).join(" — ") ||
            "TDEE save failed (check request fields)",
        );
      }
      toast.success(response.message || "TDEE saved successfully");
      setEditDialogOpen(false);
      setEditedTdee(null);
      await mutate(historyKey(formData.clientId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = formData.clientId;
    if (!clientId) return;

    setFormData((prev) => ({
      ...prev,
      age: "",
      gender: "",
      height: "",
      weight: "",
    }));

    let cancelled = false;

    const fetchClient = async () => {
      try {
        const res = await fetchData(
          `app/client-basic-details/${clientId}`
        );
        if (cancelled) return;

        if (res.status_code === 200) {
          const g = normalizeTdeeGender(
            res.data?.gender ?? res.data?.sex
          );
          setFormData((prev) => {
            if (prev.clientId !== clientId) return prev;
            return {
              ...prev,
              age: res.data.age ?? "",
              gender: g,
              height: res.data.height ?? "",
              weight: res.data.weight ?? "",
            };
          });
        } else {
          toast.error(res.message || "Failed to fetch client details");
        }
      } catch (error) {
        if (cancelled) return;
        console.log("Fetching Error!", error);
        toast.error(error.message || "Failed to fetch client details");
      }
    };

    fetchClient();
    return () => {
      cancelled = true;
    };
  }, [formData.clientId]);

  return (
    <div className="mx-auto max-w-5xl w-full">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[var(--accent-1)]/25 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border bg-[var(--comp-1)]/60 pb-4">
              <CardTitle className="text-lg text-[var(--dark-3)]">
                Client &amp; metrics
              </CardTitle>
              <CardDescription>
                Choose a client and confirm age, gender, height, weight, and
                activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <SelectClient
                selectedClient={formData.clientId}
                onSelectClient={(clientId) =>
                  handleChange("clientId", clientId)
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <SearchableSelect
                    options={GENDER_OPTIONS}
                    value={formData.gender}
                    onValueChange={(val) => handleChange("gender", val)}
                    selectLabel="Select Gender"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Activity level</Label>
                <SearchableSelect
                  options={ACTIVITY_OPTIONS}
                  value={formData.activity}
                  onValueChange={(val) => handleChange("activity", val)}
                  selectLabel="Select Activity"
                />
              </div>

              {tdeeData && (
                <div className="pt-2">
                  <TdeeResult
                    data={editedTdee || tdeeData}
                    selectedGoal={selectedGoal}
                    onGoalChange={setSelectedGoal}
                    onEdit={() => {
                      setEditedTdee(
                        editedTdee ||
                          JSON.parse(JSON.stringify(tdeeData))
                      );
                      setEditDialogOpen(true);
                    }}
                    breakdown={tdeeData.breakdown}
                    setBreakdown={(name, value) => setTdeeData(prev => ({
                      ...prev,
                      breakdown: {
                        ...prev.breakdown,
                        [name]: value
                      }
                    }))}
                  />
                </div>
              )}

              <Button
                variant="wz"
                className="w-full sm:w-auto"
                onClick={saveTDEE}
                disabled={loading || !formData.clientId}
              >
                {loading ? "Saving…" : "Save TDEE to client"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-border shadow-sm lg:sticky lg:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[var(--dark-3)]">
              <History className="size-4 text-[var(--accent-1)]" />
              Recent history
            </CardTitle>
            <CardDescription>
              Snapshots for the goal selected above (newest first). Other goals
              are hidden here but remain on the client profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TdeeHistoryPanel
              clientId={formData.clientId}
              entries={historyEntries}
              goalLabel={goalOptionLabel(selectedGoal)}
              hasAnySnapshots={hasAnyTdeeSnapshots}
            />
          </CardContent>
        </Card>
      </div>

      {editedTdee && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent
            showCloseButton
            className="flex max-h-[min(85vh,800px)] w-full max-w-2xl flex-col gap-0 overflow-hidden border-[var(--accent-1)]/25 p-0 sm:max-w-2xl"
          >
            <DialogHeader className="shrink-0 space-y-1 border-b border-border bg-[var(--comp-1)]/70 px-6 py-4 text-left">
              <DialogTitle className="flex items-center gap-2 text-[var(--dark-3)]">
                <Pencil className="size-4 text-[var(--accent-1)]" />
                Edit TDEE targets
              </DialogTitle>
              <DialogDescription>
                Adjust cut, maintenance, and bulk calorie targets. Use{" "}
                <span className="font-medium text-foreground">
                  Save TDEE to client
                </span>{" "}
                on the main form to persist.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-1)]">
                  Cut
                </h3>
                {Object.entries(editedTdee.cut).map(([key, val]) => (
                  <div
                    key={`cut-${key}`}
                    className="rounded-xl border border-border bg-muted/25 p-4 space-y-3"
                  >
                    <p className="text-sm font-medium capitalize text-foreground">
                      {key}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Calories</Label>
                        <Input
                          type="number"
                          value={val.calories}
                          onChange={(e) => {
                            setEditedTdee((prev) => ({
                              ...prev,
                              cut: {
                                ...prev.cut,
                                [key]: {
                                  ...prev.cut[key],
                                  calories: Number(e.target.value),
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Percent</Label>
                        <Input
                          value={val.percent}
                          onChange={(e) => {
                            setEditedTdee((prev) => ({
                              ...prev,
                              cut: {
                                ...prev.cut,
                                [key]: {
                                  ...prev.cut[key],
                                  percent: e.target.value,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Change</Label>
                        <Input
                          value={val.change}
                          onChange={(e) => {
                            setEditedTdee((prev) => ({
                              ...prev,
                              cut: {
                                ...prev.cut,
                                [key]: {
                                  ...prev.cut[key],
                                  change: e.target.value,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-1)]">
                  Maintain
                </h3>
                <div className="rounded-xl border border-border bg-muted/25 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Calories</Label>
                      <Input
                        type="number"
                        value={editedTdee.maintain.calories}
                        onChange={(e) => {
                          setEditedTdee((prev) => ({
                            ...prev,
                            tdee: Number(e.target.value),
                            maintain: {
                              ...prev.maintain,
                              calories: Number(e.target.value),
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Percent</Label>
                      <Input
                        value={editedTdee.maintain.percent}
                        onChange={(e) => {
                          setEditedTdee((prev) => ({
                            ...prev,
                            maintain: {
                              ...prev.maintain,
                              percent: e.target.value,
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-1)]">
                  Bulk
                </h3>
                {Object.entries(editedTdee.bulk).map(([key, val]) => (
                  <div
                    key={`bulk-${key}`}
                    className="rounded-xl border border-border bg-muted/25 p-4 space-y-3"
                  >
                    <p className="text-sm font-medium capitalize text-foreground">
                      {key}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Calories</Label>
                        <Input
                          type="number"
                          value={val.calories}
                          onChange={(e) => {
                            setEditedTdee((prev) => ({
                              ...prev,
                              bulk: {
                                ...prev.bulk,
                                [key]: {
                                  ...prev.bulk[key],
                                  calories: Number(e.target.value),
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Percent</Label>
                        <Input
                          value={val.percent}
                          onChange={(e) => {
                            setEditedTdee((prev) => ({
                              ...prev,
                              bulk: {
                                ...prev.bulk,
                                [key]: {
                                  ...prev.bulk[key],
                                  percent: e.target.value,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Change</Label>
                        <Input
                          value={val.change}
                          onChange={(e) => {
                            setEditedTdee((prev) => ({
                              ...prev,
                              bulk: {
                                ...prev.bulk,
                                [key]: {
                                  ...prev.bulk[key],
                                  change: e.target.value,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-[var(--comp-1)]/50 px-6 py-4 sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="wz"
                onClick={() => setEditDialogOpen(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
