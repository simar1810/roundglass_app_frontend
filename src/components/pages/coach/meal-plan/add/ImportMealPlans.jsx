"use client";
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData, sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ClipboardList, Layers, Download } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { checkArray } from "@/lib/formatter";
import { MultiSearchableSelect } from "@/components/common/selects/MultiSearchableSelect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildImportPayload } from "@/lib/meal-plan-import";

export default function ImportMealPlans() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Import Plan
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-h-[85vh] !gap-0 overflow-y-auto">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-xl font-bold">Import Meal Plan</DialogTitle>
                    <p className="text-sm text-muted-foreground">Select a pre-existing plan to import into your current schedule.</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    <Container />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Container() {
    const { selectedPlans, dispatch } = useCurrentStateContext()
    const [filters, setFilters] = useState({ query: "", mode: [] })
    const { isLoading, error, data } = useSWR(
        "app/meal-plan/available-imports",
        () => fetchData("app/meal-plan/available-imports"),
    );
    const closeRef = useRef()

    // const searchRegex = useMemo(() => new RegExp(filters.query, "i"), [filters.query])
    const filteredPlans = useMemo(function () {
        if (!Array.isArray(data?.data)) return [];

        const normalize = (str = "") =>
          str
              .toLowerCase()
              .trim()
              .replace(/\s+/g, " "); // collapse multiple spaces

        const query = normalize(filters.query);
        return checkArray(data?.data)
            .filter(plan => (
                // searchRegex.test(plan.title) &&
                plan.title?.toLowerCase().includes(query) &&
                (filters.mode.length === 0 || filters.mode.includes(plan.mode))
            ))
    }, [data, filters])

    if (isLoading) return <ContentLoader />;
    if (error || data?.status_code !== 200)
        return <ContentError title={error?.message || data?.message || "Failed to load plans"} />;

    const handleImport = async function (planId) {
        const toastId = toast.loading("Fetching meal plan details...")
        try {
            const response = await fetchData(`app/meal-plan/custom/${planId}?person=coach`)
            toast.dismiss(toastId)
            if (response.status_code !== 200) throw new Error(response.message)
            const payload = buildImportPayload(response.data, selectedPlans)
            dispatch({ type: "IMPORT_MEALS", payload })
            toast.success("Import successful")
            closeRef?.current?.click()
        } catch (error) {
            toast.error(error.message || "Something went wrong!")
        }
    };

    return (
        <div>
            <DialogClose ref={closeRef} />
            <div className="flex items-center gap-4">
                <Input
                    value={filters.query}
                    onChange={e => setFilters(prev => {
                        console.log(e.target.value)
                        return ({ ...prev, query: e.target.value })
                    })}
                    placeholder="Search By Meal title"
                />
                <div>
                    <MultiSearchableSelect
                        value={filters.mode}
                        onValueChange={value => setFilters(prev => ({ ...prev, mode: value }))}
                        options={["daily", "weekly", "monthly"].map(opt => ({ value: opt, label: opt }))}
                        searchEnabled={false}
                        selectLabel="Meal Plan Mode"
                    />
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans.map((plan) => (
                    <div
                        key={plan._id}
                        className={cn(
                            "group relative flex flex-col border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all duration-200 cursor-pointer",
                            // selectedPlan === plan._id && "border-2 border-[var(--accent-1)]"
                        )}
                    // onClick={() => setSelectedPlan(prev => prev === plan._id ? "" : plan._id)}
                    >
                        <div className="h-24 w-full bg-muted flex items-center justify-center overflow-hidden">
                            {plan.image ? (
                                <img onError={e => e.target.src = "/not-found.png"} src={plan.image} alt={plan.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="bg-primary/5 w-full h-full flex items-center justify-center">
                                    <ClipboardList className="w-8 h-8 text-primary/20" />
                                </div>
                            )}
                            <Badge className="absolute top-2 right-2 capitalize" variant="secondary">
                                {plan.mode}
                            </Badge>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                                {plan.title || "Untitled Plan"}
                            </h3>

                            <div className="flex items-center text-xs text-muted-foreground mb-4">
                                <CalendarDays className="w-3 h-3 mr-1" />
                                <span>
                                    {plan.mode === 'daily' && '1 Day Plan'}
                                    {plan.mode === 'weekly' && '7 Day Rotation'}
                                    {plan.mode === 'monthly' && `${Object.keys(plan.plans).length} Days Configured`}
                                </span>
                            </div>

                            <Button
                                size="sm"
                                className="mt-auto w-full group-hover:bg-primary"
                                onClick={() => handleImport(plan._id)}
                            >
                                Import Plan
                            </Button>
                        </div>
                    </div>
                ))}

            </div>
            {filteredPlans.length === 0 && <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                    <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No plans available</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
                    You haven't created any plans yet that can be imported.
                </p>
            </div>}
        </div>
    );
}