import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchData, sendData } from "@/lib/api";
import { format, parse, compareDesc } from "date-fns";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function UpdateClientMealRecallModal({ id, clientData = {} }) {
  // Get dietRecall from clientPreferences
  const dietRecall = useMemo(() => {
    if (Array.isArray(clientData?.clientPreferences?.dietRecall)) {
      return clientData.clientPreferences.dietRecall;
    }
    return [];
  }, [clientData?.clientPreferences?.dietRecall]);

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mainModalOpen, setMainModalOpen] = useState(false);

  const closeBtnRef = useRef(null);

  // Load entries when modal opens or data changes
  useEffect(() => {
    if (Array.isArray(dietRecall) && dietRecall.length > 0) {
      const loadedEntries = dietRecall.map((recall) => ({
        _id: recall._id || null,
        date: recall.date || format(new Date(), "dd-MM-yyyy"),
        practionerNotes: recall.practionerNotes || {
          totalEnergyIntake: "",
          proteinG: "",
          carbohydrateG: "",
          fatG: "",
          commentsKeyObservations: "",
        },
        meals: recall.meals || [],
      }));
      setEntries(loadedEntries);
    } else {
      setEntries([]);
    }
  }, [dietRecall, refreshTrigger]);

  async function deleteEntry(entryId, index) {
    try {
      setLoading(true);
      const updatedEntries = entries.filter((_, i) => i !== index);
      
      // Check if preferences exist first
      let preferencesExist = false;
      try {
        const checkResponse = await fetchData(`app/roundglass/client-preference?person=coach&clientId=${id}`);
        preferencesExist = !!checkResponse?.data;
      } catch (error) {
        preferencesExist = false;
      }

      const method = preferencesExist ? "PUT" : "POST";
      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: id,
          dietRecall: updatedEntries.map(entry => ({
            date: entry.date,
            practionerNotes: entry.practionerNotes,
            meals: entry.meals,
            ...(entry._id && { _id: entry._id }),
          })),
        },
        method
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Meal recall entry deleted successfully");
      
      // Update local state immediately
      setEntries(Array.isArray(updatedEntries) ? updatedEntries : []);
      
      // Refresh data to sync with backend
      mutate(`clientDetails/${id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${id}`, undefined, { revalidate: true });
      
      // Trigger refresh after a short delay
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 300);
    } catch (error) {
      toast.error(error.message || "Failed to delete entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={mainModalOpen} onOpenChange={setMainModalOpen}>
      <DialogTrigger className="text-[var(--accent-1)] text-[14px] font-semibold pr-3">
        Edit
      </DialogTrigger>
      <DialogContent className="!max-w-[800px] max-h-[90vh] text-center border-0 px-4 lg:px-10 overflow-y-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">24-Hour Meal Recall</DialogTitle>
        <div className="mt-4">
          <MealRecallModalDisplay 
            entries={entries}
            id={id}
            loading={loading}
            onDelete={deleteEntry}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
            
          <div className="mt-4">
            <MealRecallEntryEditModal
              id={id}
              entry={null}
              onSuccess={() => setRefreshTrigger(prev => prev + 1)}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  Add Meal Recall Entry
                </Button>
              }
            />
          </div>
          <DialogClose ref={closeBtnRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MealRecallModalDisplay({ entries, id, loading, onDelete, onRefresh }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY_COUNT = 7;

  // Sort by date (newest first)
  const sortedEntries = useMemo(() => {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    
    return [...entries].sort((a, b) => {
      try {
        const dateA = parse(a.date || "", "dd-MM-yyyy", new Date());
        const dateB = parse(b.date || "", "dd-MM-yyyy", new Date());
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return compareDesc(dateA, dateB);
      } catch {
        return 0;
      }
    });
  }, [entries]);

  const displayedEntries = showAll ? sortedEntries : sortedEntries.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = sortedEntries.length > INITIAL_DISPLAY_COUNT;

  if (sortedEntries.length === 0) {
    return (
      <p className="text-sm italic text-[#808080] text-center py-4">
        No meal recall entries added yet
      </p>
    );
  }

  return (
    <div className="text-left space-y-4">
      {displayedEntries.map((entry, index) => {
        // Find original index for delete function
        const originalIndex = entries.findIndex(e => e._id === entry._id || (e.date === entry.date && !e._id && !entry._id));
        
        return (
          <div
            key={entry._id || index}
            className="p-4 border-1 rounded-[8px] bg-[var(--comp-1)] space-y-3 relative"
          >
            <div className="flex items-center justify-end gap-2 absolute top-2 right-2">
              <MealRecallEntryEditModal
                id={id}
                entry={entry}
                index={originalIndex >= 0 ? originalIndex : index}
                onSuccess={onRefresh}
              />
              <button
                type="button"
                onClick={() => onDelete(entry._id, originalIndex >= 0 ? originalIndex : index)}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={loading}
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-[13px] space-y-2 pr-16">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <p className="font-semibold">Date</p>
                  <p className="text-[var(--dark-2)]">{entry.date}</p>
                </div>
                {entry.meals && entry.meals.length > 0 && (
                  <span className="text-xs text-[var(--dark-1)]/60">
                    {entry.meals.length} meal{entry.meals.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {entry.practionerNotes && (
                <>
                  {(entry.practionerNotes.totalEnergyIntake || entry.practionerNotes.proteinG || 
                    entry.practionerNotes.carbohydrateG || entry.practionerNotes.fatG) && (
                    <div className="mt-3 pt-3 border-t-1">
                      <p className="font-semibold mb-2">Nutritional Summary</p>
                      <div className="flex flex-wrap gap-4">
                        {entry.practionerNotes.totalEnergyIntake && (
                          <span className="text-[var(--dark-2)] text-xs">
                            <span className="text-[var(--dark-1)]/70">Energy: </span>
                            {entry.practionerNotes.totalEnergyIntake} kcal
                          </span>
                        )}
                        {entry.practionerNotes.proteinG && (
                          <span className="text-[var(--dark-2)] text-xs">
                            <span className="text-[var(--dark-1)]/70">Protein: </span>
                            {entry.practionerNotes.proteinG}g
                          </span>
                        )}
                        {entry.practionerNotes.carbohydrateG && (
                          <span className="text-[var(--dark-2)] text-xs">
                            <span className="text-[var(--dark-1)]/70">Carbs: </span>
                            {entry.practionerNotes.carbohydrateG}g
                          </span>
                        )}
                        {entry.practionerNotes.fatG && (
                          <span className="text-[var(--dark-2)] text-xs">
                            <span className="text-[var(--dark-1)]/70">Fat: </span>
                            {entry.practionerNotes.fatG}g
                          </span>
                        )}
                      </div>
                      {entry.practionerNotes.commentsKeyObservations && (
                        <div className="grid grid-cols-[140px_1fr] gap-3 mt-2">
                          <p className="text-[var(--dark-1)]/70">Comments</p>
                          <p className="text-[var(--dark-2)] break-words whitespace-pre-wrap text-xs">
                            {entry.practionerNotes.commentsKeyObservations}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {entry.meals && entry.meals.length > 0 && (
                <div className="mt-3 pt-3 border-t-1">
                  <p className="font-semibold mb-2">Meals ({entry.meals.length})</p>
                  <div className="space-y-2">
                    {entry.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="p-2 bg-white rounded border-1">
                        {meal.mealType && (
                          <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                            <p className="text-[var(--dark-1)]/70 text-xs">Meal Type</p>
                            <p className="text-[var(--dark-2)] text-xs font-medium">{meal.mealType}</p>
                          </div>
                        )}
                        {meal.foodBeverage && (
                          <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                            <p className="text-[var(--dark-1)]/70 text-xs">Food/Beverage</p>
                            <p className="text-[var(--dark-2)] text-xs">{meal.foodBeverage}</p>
                          </div>
                        )}
                        {meal.quantity && (
                          <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                            <p className="text-[var(--dark-1)]/70 text-xs">Quantity</p>
                            <p className="text-[var(--dark-2)] text-xs">{meal.quantity}</p>
                          </div>
                        )}
                        {meal.location && (
                          <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                            <p className="text-[var(--dark-1)]/70 text-xs">Location</p>
                            <p className="text-[var(--dark-2)] text-xs">{meal.location}</p>
                          </div>
                        )}
                        {meal.comments && (
                          <div className="grid grid-cols-[100px_1fr] gap-2">
                            <p className="text-[var(--dark-1)]/70 text-xs">Comments</p>
                            <p className="text-[var(--dark-2)] text-xs break-words">{meal.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Show More/Less Toggle */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-[var(--accent-1)] font-medium hover:bg-[var(--comp-1)] rounded-lg border-1 flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less ({INITIAL_DISPLAY_COUNT} most recent)
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show All ({sortedEntries.length} entries)
            </>
          )}
        </button>
      )}
      
      {sortedEntries.length > 0 && (
        <p className="text-xs text-[var(--dark-1)]/50 text-center">
          Showing {displayedEntries.length} of {sortedEntries.length} entries
        </p>
      )}
    </div>
  );
}

function MealRecallEntryEditModal({ id, entry, index, onSuccess, trigger }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    entry?.date ? (() => {
      try {
        const parsed = parse(entry.date, "dd-MM-yyyy", new Date());
        return isNaN(parsed.getTime()) ? format(new Date(), "yyyy-MM-dd") : format(parsed, "yyyy-MM-dd");
      } catch {
        return format(new Date(), "yyyy-MM-dd");
      }
    })() : format(new Date(), "yyyy-MM-dd")
  );
  const [meals, setMeals] = useState(entry?.meals || []);
  const [practitionerNotes, setPractitionerNotes] = useState(
    entry?.practionerNotes || {
      totalEnergyIntake: "",
      proteinG: "",
      carbohydrateG: "",
      fatG: "",
      commentsKeyObservations: "",
    }
  );

  const closeBtnRef = useRef(null);

  const mealTypes = [
    "Breakfast",
    "Brunch",
    "Lunch",
    "Afternoon Snack",
    "Dinner",
    "Evening Snack",
    "Snack",
    "Pre-Workout",
    "Post-Workout",
  ];

  useEffect(() => {
    if (open && entry) {
      setSelectedDate(() => {
        try {
          const parsed = parse(entry.date, "dd-MM-yyyy", new Date());
          return isNaN(parsed.getTime()) ? format(new Date(), "yyyy-MM-dd") : format(parsed, "yyyy-MM-dd");
        } catch {
          return format(new Date(), "yyyy-MM-dd");
        }
      });
      setMeals(entry.meals || []);
      setPractitionerNotes(entry.practionerNotes || {
        totalEnergyIntake: "",
        proteinG: "",
        carbohydrateG: "",
        fatG: "",
        commentsKeyObservations: "",
      });
    } else if (open && !entry) {
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
      setMeals([]);
      setPractitionerNotes({
        totalEnergyIntake: "",
        proteinG: "",
        carbohydrateG: "",
        fatG: "",
        commentsKeyObservations: "",
      });
    }
  }, [open, entry]);

  function addMeal() {
    setMeals([...meals, {
      mealType: "",
      foodBeverage: "",
      quantity: "",
      location: "",
      comments: "",
    }]);
  }

  function updateMeal(index, field, value) {
    const updated = [...meals];
    updated[index][field] = value;
    setMeals(updated);
  }

  function removeMeal(index) {
    setMeals(meals.filter((_, i) => i !== index));
  }

  function formatDateForAPI(dateString) {
    try {
      const date = parse(dateString, "yyyy-MM-dd", new Date());
      return format(date, "dd-MM-yyyy");
    } catch {
      return format(new Date(), "dd-MM-yyyy");
    }
  }

  async function saveEntry() {
    try {
      setLoading(true);
      
      // Check if preferences document exists first
      let preferencesExist = false;
      let currentEntries = [];
      try {
        const checkResponse = await fetchData(`app/roundglass/client-preference?person=coach&clientId=${id}`);
        preferencesExist = !!checkResponse?.data;
        if (checkResponse?.data?.dietRecall) {
          currentEntries = checkResponse.data.dietRecall;
        }
      } catch (error) {
        // Preferences don't exist yet
        preferencesExist = false;
      }

      // Prepare the entry to save
      const entryToSave = {
        date: formatDateForAPI(selectedDate),
        practionerNotes: {
          totalEnergyIntake: practitionerNotes.totalEnergyIntake.trim() || "",
          proteinG: practitionerNotes.proteinG.trim() || "",
          carbohydrateG: practitionerNotes.carbohydrateG.trim() || "",
          fatG: practitionerNotes.fatG.trim() || "",
          commentsKeyObservations: practitionerNotes.commentsKeyObservations.trim() || "",
        },
        meals: meals.map(meal => ({
          mealType: meal.mealType.trim() || "",
          foodBeverage: meal.foodBeverage.trim() || "",
          quantity: meal.quantity.trim() || "",
          location: meal.location.trim() || "",
          comments: meal.comments.trim() || "",
        })),
      };

      // If editing, preserve _id and update the specific entry
      if (entry?._id) {
        entryToSave._id = entry._id;
        const updatedEntries = currentEntries.map(e => 
          e._id === entry._id ? entryToSave : e
        );
        currentEntries = updatedEntries;
      } else {
        // Adding new entry
        currentEntries.push(entryToSave);
      }

      // Use POST if preferences don't exist, PUT if they do
      const method = preferencesExist ? "PUT" : "POST";

      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: id,
          dietRecall: currentEntries,
        },
        method
      );

      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(entry?._id ? "Meal recall entry updated successfully" : "Meal recall entry added successfully");
      
      // Refresh data to sync with backend
      mutate(`clientDetails/${id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${id}`, undefined, { revalidate: true });
      
      if (onSuccess) onSuccess();
      setOpen(false);
      closeBtnRef.current?.click();
    } catch (error) {
      toast.error(error.message || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger className="text-blue-500 hover:text-blue-700 p-1" title="Edit entry">
          <Pencil className="w-4 h-4" />
        </DialogTrigger>
      )}
      <DialogContent className="!max-w-[700px] max-h-[90vh] text-center border-0 px-4 lg:px-10 overflow-y-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">
          {entry?._id ? "Edit Meal Recall Entry" : "Add Meal Recall Entry"}
        </DialogTitle>
        <div className="mt-4">
          <div className="text-left space-y-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]"
                required
              />
            </div>

            {/* Meals Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Meals</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMeal}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Meal
                </Button>
              </div>
              {meals.length > 0 ? (
                <div className="space-y-3">
                  {meals.map((meal, mealIndex) => (
                    <div key={mealIndex} className="p-3 border-1 rounded-lg bg-[var(--comp-1)] space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => removeMeal(mealIndex)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                        title="Remove meal"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <Select
                        value={meal.mealType}
                        onValueChange={(value) => updateMeal(mealIndex, "mealType", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Meal Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {mealTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormControl
                        placeholder="Food/Beverage"
                        value={meal.foodBeverage}
                        onChange={(e) => updateMeal(mealIndex, "foodBeverage", e.target.value)}
                      />
                      <FormControl
                        placeholder="Quantity"
                        value={meal.quantity}
                        onChange={(e) => updateMeal(mealIndex, "quantity", e.target.value)}
                      />
                      <FormControl
                        placeholder="Location"
                        value={meal.location}
                        onChange={(e) => updateMeal(mealIndex, "location", e.target.value)}
                      />
                      <Textarea
                        placeholder="Comments (optional)"
                        value={meal.comments}
                        onChange={(e) => updateMeal(mealIndex, "comments", e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-[#808080] text-center py-2">
                  No meals added yet. Click "Add Meal" to add one.
                </p>
              )}
            </div>

            {/* Practitioner Notes Section */}
            <div className="pt-4 border-t-1">
              <label className="block text-sm font-medium mb-2">Nutritional Summary (Optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <FormControl
                  label="Total Energy Intake (kcal)"
                  type="text"
                  placeholder="e.g., 2500"
                  value={practitionerNotes.totalEnergyIntake}
                  onChange={(e) => setPractitionerNotes({
                    ...practitionerNotes,
                    totalEnergyIntake: e.target.value,
                  })}
                />
                <FormControl
                  label="Protein (g)"
                  type="text"
                  placeholder="e.g., 150"
                  value={practitionerNotes.proteinG}
                  onChange={(e) => setPractitionerNotes({
                    ...practitionerNotes,
                    proteinG: e.target.value,
                  })}
                />
                <FormControl
                  label="Carbohydrates (g)"
                  type="text"
                  placeholder="e.g., 300"
                  value={practitionerNotes.carbohydrateG}
                  onChange={(e) => setPractitionerNotes({
                    ...practitionerNotes,
                    carbohydrateG: e.target.value,
                  })}
                />
                <FormControl
                  label="Fat (g)"
                  type="text"
                  placeholder="e.g., 80"
                  value={practitionerNotes.fatG}
                  onChange={(e) => setPractitionerNotes({
                    ...practitionerNotes,
                    fatG: e.target.value,
                  })}
                />
              </div>
              <Textarea
                label="Comments / Key Observations"
                placeholder="Enter any observations or recommendations..."
                value={practitionerNotes.commentsKeyObservations}
                onChange={(e) => setPractitionerNotes({
                  ...practitionerNotes,
                  commentsKeyObservations: e.target.value,
                })}
                className="mt-3 min-h-[80px]"
              />
            </div>
          </div>
          <Button
            variant="wz"
            onClick={saveEntry}
            disabled={loading}
            className="mt-6"
          >
            {loading ? "Saving..." : entry?._id ? "Update Entry" : "Add Entry"}
          </Button>
          <DialogClose ref={closeBtnRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

