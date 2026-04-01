"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAppClients } from "@/lib/fetchers/app";
import {
    createSweatRateEntry,
    deleteSweatRateEntry,
    getSweatRateEntries,
    getSweatRateSummary,
    updateSweatRateEntry,
} from "@/lib/fetchers/sweatRate";
import { CalendarClock, Droplets, Pencil, Save, Trash2, TrendingUp, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function normalizeEntriesResponse(response) {
  const root = response?.data;
  const candidates = [
    root?.entries,
    root?.records,
    root?.items,
    root?.docs,
    root?.rows,
    root?.data,
    root,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeSummaryResponse(response) {
  const root = response?.data;
  if (!root || typeof root !== "object") return {};
  if (root.summary && typeof root.summary === "object") return root.summary;
  return root;
}

export default function SweatRatePage() {
  const { data, isLoading, error } = useSWR("sweat-rate-clients", () =>
    getAppClients({ page: 1, limit: 1000 })
  );

  const clients = useMemo(() => {
    const list = data?.data?.clients || data?.data || [];
    const arr = Array.isArray(list) ? list : [];
    return arr.map((client) => ({
      _id: client?._id || client?.id,
      name: client?.name || "Unknown Athlete",
      clientId: client?.clientId || "",
    })).filter((client) => Boolean(client._id));
  }, [data]);

  const [selectedClientId, setSelectedClientId] = useState("none");
  const [preWeightKg, setPreWeightKg] = useState("");
  const [postWeightKg, setPostWeightKg] = useState("");
  const [fluidIntakeL, setFluidIntakeL] = useState("");
  const [exerciseDurationHrs, setExerciseDurationHrs] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState(null);

  const selectedClient = useMemo(() => {
    if (selectedClientId === "none") return null;
    return clients.find((client) => client._id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const entriesKey = selectedClient?._id ? `sweat-rate-entries:${selectedClient._id}` : null;
  const summaryKey = selectedClient?._id ? `sweat-rate-summary:${selectedClient._id}` : null;

  const { data: entriesResponse, isLoading: entriesLoading } = useSWR(
    entriesKey,
    () => getSweatRateEntries({ clientId: selectedClient._id, page: 1, limit: 500 }),
    { revalidateOnFocus: false }
  );

  const { data: summaryResponse, isLoading: summaryLoading } = useSWR(
    summaryKey,
    () => getSweatRateSummary({ clientId: selectedClient._id, includeTrend: true }),
    { revalidateOnFocus: false }
  );

  const computed = useMemo(() => {
    const pre = toNumber(preWeightKg);
    const post = toNumber(postWeightKg);
    const fluid = toNumber(fluidIntakeL);
    const duration = toNumber(exerciseDurationHrs);

    if (pre === null || post === null || fluid === null || duration === null) {
      return { sweatRate: null, rehydration: null, message: "Fill all fields to calculate." };
    }

    if (duration <= 0) {
      return { sweatRate: null, rehydration: null, message: "Exercise duration must be greater than 0." };
    }

    const sweatRate = (pre - post + fluid) / duration;
    const rehydration = sweatRate * 1.5;
    return { sweatRate, rehydration, message: "" };
  }, [exerciseDurationHrs, fluidIntakeL, postWeightKg, preWeightKg]);

  const selectedClientEntries = useMemo(() => {
    if (!selectedClient?._id) return [];
    const arr = normalizeEntriesResponse(entriesResponse);
    const selectedId = String(selectedClient._id);
    return arr
      .filter((entry) => {
        const entryClientId = String(
          entry?.clientId?._id ??
          entry?.clientId ??
          entry?.client?._id ??
          entry?.client ??
          ""
        );
        return entryClientId === selectedId;
      })
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  }, [entriesResponse, selectedClient]);

  const chartData = useMemo(() => {
    const summary = normalizeSummaryResponse(summaryResponse);
    const trend =
      summary?.trend ||
      summary?.graphData ||
      summary?.dataPoints ||
      summary?.series ||
      [];
    if (Array.isArray(trend) && trend.length > 0) {
      return trend
        .slice()
        .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
        .map((entry, index) => ({
          index: index + 1,
          label: `#${index + 1}`,
          sweatRate: Number(entry?.sweatRateLPerHour ?? 0),
          rehydration: Number(entry?.rehydrationL ?? 0),
        }));
    }
    return selectedClientEntries.map((entry, index) => ({
      index: index + 1,
      label: `#${index + 1}`,
      sweatRate: Number(entry?.sweatRateLPerHour ?? entry?.sweatRate ?? 0),
      rehydration: Number(entry?.rehydrationL ?? entry?.rehydration ?? 0),
    }));
  }, [selectedClientEntries, summaryResponse]);

  const stats = useMemo(() => {
    const s = normalizeSummaryResponse(summaryResponse);
    const summaryCount = Number(
      s?.count ??
      s?.totalEntries ??
      s?.entriesCount ??
      s?.total ??
      NaN
    );
    // Prefer summary only when it has meaningful data or when entries are empty.
    // This avoids a transient/stale zero-summary overriding visible entry-derived stats.
    if (Number.isFinite(summaryCount) && (summaryCount > 0 || selectedClientEntries.length === 0)) {
      return {
        count: summaryCount,
        avgSweatRate: Number(s.avgSweatRate ?? s.averageSweatRate ?? s.meanSweatRate ?? 0) || 0,
        avgRehydration: Number(s.avgRehydration ?? s.averageRehydration ?? s.meanRehydration ?? 0) || 0,
        variance: Number(s.varianceSweatRate ?? s.sweatRateVariance ?? s.variance ?? 0) || 0,
      };
    }

    if (!selectedClientEntries.length) {
      return { count: 0, avgSweatRate: 0, avgRehydration: 0, variance: 0 };
    }
    const sweatRates = selectedClientEntries.map((entry) =>
      Number(entry?.sweatRateLPerHour ?? entry?.sweatRate ?? 0)
    );
    const rehydrations = selectedClientEntries.map((entry) =>
      Number(entry?.rehydrationL ?? entry?.rehydration ?? 0)
    );
    const avgSweatRate = sweatRates.reduce((sum, v) => sum + v, 0) / sweatRates.length;
    const avgRehydration = rehydrations.reduce((sum, v) => sum + v, 0) / rehydrations.length;
    const variance =
      sweatRates.reduce((sum, v) => sum + ((v - avgSweatRate) ** 2), 0) / sweatRates.length;
    return {
      count: selectedClientEntries.length,
      avgSweatRate,
      avgRehydration,
      variance,
    };
  }, [selectedClientEntries, summaryResponse?.data]);

  const resetForm = () => {
    setPreWeightKg("");
    setPostWeightKg("");
    setFluidIntakeL("");
    setExerciseDurationHrs("");
    setNotes("");
    setEditingEntryId(null);
  };

  const handleSave = async () => {
    if (!selectedClient?._id) {
      toast.error("Select a player before saving.");
      return;
    }

    if (computed.sweatRate === null || computed.rehydration === null) {
      toast.error(computed.message || "Invalid input values.");
      return;
    }

    const payload = {
      clientId: selectedClient._id,
      preWeightKg: Number(preWeightKg),
      postWeightKg: Number(postWeightKg),
      fluidIntakeL: Number(fluidIntakeL),
      exerciseDurationHrs: Number(exerciseDurationHrs),
      notes: String(notes || "").trim() || undefined,
    };

    try {
      const response = editingEntryId
        ? await updateSweatRateEntry(editingEntryId, payload)
        : await createSweatRateEntry(payload);
      const isSuccess =
        response?.status_code === 200 ||
        response?.status_code === 201 ||
        response?.success === true;

      if (!isSuccess) {
        throw new Error(response?.message || "Failed to save sweat analysis");
      }
      toast.success(editingEntryId ? "Entry updated successfully." : "Sweat analysis saved for player.");
      resetForm();
      if (entriesKey) await mutate(entriesKey);
      if (summaryKey) await mutate(summaryKey);
    } catch (e) {
      toast.error(e?.message || "Failed to save sweat analysis");
    }
  };

  const handleEdit = (entry) => {
    const entryClientId = String(entry?.clientId?._id ?? entry?.clientId ?? "");
    if (selectedClient?._id && entryClientId && entryClientId !== String(selectedClient._id)) {
      toast.error("Please select the matching player before editing this entry.");
      return;
    }
    setEditingEntryId(entry?._id || entry?.id || null);
    setPreWeightKg(String(entry?.preWeightKg ?? ""));
    setPostWeightKg(String(entry?.postWeightKg ?? ""));
    setFluidIntakeL(String(entry?.fluidIntakeL ?? ""));
    setExerciseDurationHrs(String(entry?.exerciseDurationHrs ?? ""));
    setNotes(String(entry?.notes ?? ""));
  };

  const handleDelete = async (entry) => {
    const entryId = entry?._id || entry?.id;
    if (!entryId) return;
    if (!confirm("Delete this sweat rate entry?")) return;
    try {
      const response = await deleteSweatRateEntry(entryId);
      const isSuccess =
        response?.status_code === 200 ||
        response?.status_code === 204 ||
        response?.success === true;
      if (!isSuccess) throw new Error(response?.message || "Failed to delete entry");
      toast.success("Entry deleted successfully.");
      if (editingEntryId === entryId) resetForm();
      if (entriesKey) await mutate(entriesKey);
      if (summaryKey) await mutate(summaryKey);
    } catch (e) {
      toast.error(e?.message || "Failed to delete entry");
    }
  };

  if (isLoading) return <ContentLoader />;
  if (error || data?.status_code !== 200) {
    return <ContentError title={error?.message || data?.message || "Failed to load players"} />;
  }

  return (
    <div className="content-container space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-600" />
            Sweat Rate Calculator
          </CardTitle>
          <CardDescription>
            Sweat Rate (L/h) = (Pre weight - Post weight + Fluid intake) / Exercise duration
            {" "}and Rehydration = Sweat Rate x 1.5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Athlete</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select player</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}{client.clientId ? ` (${client.clientId})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pre weight (kg)</Label>
              <Input type="number" min="0" step="0.01" value={preWeightKg} onChange={(e) => setPreWeightKg(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Post weight (kg)</Label>
              <Input type="number" min="0" step="0.01" value={postWeightKg} onChange={(e) => setPostWeightKg(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fluid intake (L)</Label>
              <Input type="number" min="0" step="0.01" value={fluidIntakeL} onChange={(e) => setFluidIntakeL(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Exercise duration (hrs)</Label>
              <Input type="number" min="0" step="0.01" value={exerciseDurationHrs} onChange={(e) => setExerciseDurationHrs(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context (weather, drill type, intensity, etc.)"
            />
          </div>

          {computed.sweatRate === null ? (
            <p className="text-sm text-muted-foreground">{computed.message}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border p-3 bg-cyan-50/40">
                <p className="text-xs text-muted-foreground">Sweat Rate</p>
                <p className="text-xl font-semibold">{computed.sweatRate.toFixed(2)} L/h</p>
              </div>
              <div className="rounded-md border p-3 bg-blue-50/40">
                <p className="text-xs text-muted-foreground">Rehydration</p>
                <p className="text-xl font-semibold">{computed.rehydration.toFixed(2)} L</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {editingEntryId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
              <Button onClick={handleSave} disabled={!selectedClient || computed.sweatRate === null}>
              <Save className="h-4 w-4 mr-2" />
              {editingEntryId ? "Update Entry" : "Save Follow-up Entry"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Athlete Follow-up Overview
          </CardTitle>
          <CardDescription>
            {selectedClient
              ? `Tracking entries for ${selectedClient.name}`
              : "Select a player to view saved entries, variance and trends"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedClient ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Entries</p>
                    <p className="text-2xl font-semibold">{stats.count}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Avg Sweat Rate</p>
                    <p className="text-2xl font-semibold">{stats.avgSweatRate.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Avg Rehydration</p>
                    <p className="text-2xl font-semibold">{stats.avgRehydration.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Sweat Rate Variance</p>
                    <p className="text-2xl font-semibold">{stats.variance.toFixed(3)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trend Graph (Sweat Rate & Rehydration)
                </p>
                {chartData.length ? (
                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="sweatRate"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Sweat Rate (L/h)"
                        />
                        <Line
                          type="monotone"
                          dataKey="rehydration"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Rehydration (L)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No entries yet for this player.</p>
                )}
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Recorded At</TableHead>
                      <TableHead>Pre (kg)</TableHead>
                      <TableHead>Post (kg)</TableHead>
                      <TableHead>Fluid (L)</TableHead>
                      <TableHead>Duration (h)</TableHead>
                      <TableHead>Sweat Rate (L/h)</TableHead>
                      <TableHead>Rehydration (L)</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Delta SR</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(entriesLoading || summaryLoading) && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          Loading entries...
                        </TableCell>
                      </TableRow>
                    )}
                    {selectedClientEntries.map((entry, idx) => {
                      const prev = idx > 0 ? selectedClientEntries[idx - 1] : null;
                      const sweatRate = Number(entry.sweatRateLPerHour ?? entry.sweatRate ?? 0);
                      const rehydration = Number(entry.rehydrationL ?? entry.rehydration ?? 0);
                      const delta = prev
                        ? sweatRate - Number(prev.sweatRateLPerHour ?? prev.sweatRate ?? 0)
                        : null;
                      return (
                        <TableRow key={entry._id || entry.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarClock className="h-3 w-3 text-muted-foreground" />
                              {formatDate(entry.recordedAt)}
                            </div>
                          </TableCell>
                          <TableCell>{entry.preWeightKg}</TableCell>
                          <TableCell>{entry.postWeightKg}</TableCell>
                          <TableCell>{entry.fluidIntakeL}</TableCell>
                          <TableCell>{entry.exerciseDurationHrs}</TableCell>
                          <TableCell>{sweatRate.toFixed(2)}</TableCell>
                          <TableCell>{rehydration.toFixed(2)}</TableCell>
                          <TableCell className="max-w-[220px] truncate">{entry.notes || "-"}</TableCell>
                          <TableCell>
                            {delta === null ? (
                              <Badge variant="outline">-</Badge>
                            ) : (
                              <Badge variant={delta >= 0 ? "default" : "destructive"}>
                                {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                                title="Edit entry"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry)}
                                title="Delete entry"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!entriesLoading && selectedClientEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          No follow-up entries yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a player to view follow-up analytics.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

