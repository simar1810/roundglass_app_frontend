import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { sendData, fetchData } from "@/lib/api";
import { useRef, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Plus, Trash2, Pencil } from "lucide-react";

export default function UpdateClientTrainingInfoModal({ id, clientData = {} }) {
  // Get training modules from clientPreferences or fallback to trainingInfo for backward compatibility
  // Memoize to prevent infinite loops
  const trainingModules = useMemo(() => {
    if (Array.isArray(clientData?.clientPreferences?.trainingModule)) {
      return clientData.clientPreferences.trainingModule;
    }
    if (clientData?.trainingInfo) {
      return [clientData.trainingInfo];
    }
    return [];
  }, [clientData?.clientPreferences?.trainingModule, clientData?.trainingInfo]);

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mainModalOpen, setMainModalOpen] = useState(false);

  const closeBtnRef = useRef(null);

  // Load entries when modal opens or data changes
  useEffect(() => {
    if (Array.isArray(trainingModules) && trainingModules.length > 0) {
      const loadedEntries = trainingModules.map((module) => ({
        _id: module._id || null,
        trainingFrequency: module.trainingFrequency || "",
        duration: module.duration || "",
        intensity: module.intensity || "",
        conditioningDays: module.conditioningDays || "",
      }));
      setEntries(loadedEntries);
    } else {
      setEntries([]);
    }
  }, [trainingModules, refreshTrigger]);

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
          trainingModule: updatedEntries.map(entry => ({
            trainingFrequency: entry.trainingFrequency.trim(),
            duration: entry.duration.trim(),
            intensity: entry.intensity.trim(),
            conditioningDays: entry.conditioningDays.trim(),
            ...(entry._id && { _id: entry._id }),
          })),
        },
        method
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Training entry deleted successfully");
      
      // Update local state immediately - ensure it's always an array
      setEntries(Array.isArray(updatedEntries) ? updatedEntries : []);
      
      // Refresh data to sync with backend (non-blocking)
      mutate(`clientDetails/${id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${id}`, undefined, { revalidate: true });
      
      // Trigger refresh after a short delay to allow mutations to complete
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
      <DialogContent className="!max-w-[650px] max-h-[90vh] text-center border-0 px-4 lg:px-10 overflow-y-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">Training Information</DialogTitle>
        <div className="mt-4">
          <div className="text-left space-y-4">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <div
                  key={entry._id || index}
                  className="p-4 border-1 rounded-[8px] bg-[var(--comp-1)] space-y-2 relative"
                >
                  <div className="flex items-center justify-end gap-2 absolute top-2 right-2">
                    <TrainingEntryEditModal
                      id={id}
                      entry={entry}
                      index={index}
                      onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                    />
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry._id, index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={loading}
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[13px] space-y-2 pr-16">
                    {entry.trainingFrequency && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Training Frequency</p>
                        <p className="text-[var(--dark-2)]">{entry.trainingFrequency}</p>
                      </div>
                    )}
                    {entry.duration && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Duration</p>
                        <p className="text-[var(--dark-2)]">{entry.duration}</p>
                      </div>
                    )}
                    {entry.intensity && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Intensity</p>
                        <p className="text-[var(--dark-2)]">{entry.intensity}</p>
                      </div>
                    )}
                    {entry.conditioningDays && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Conditioning Days</p>
                        <p className="text-[var(--dark-2)]">{entry.conditioningDays}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm italic text-[#808080] text-center py-4">
                No training information added yet
              </p>
            )}
            
            <TrainingEntryEditModal
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
                  Add Training Entry
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

function TrainingEntryEditModal({ id, entry, index, onSuccess, trigger }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    trainingFrequency: entry?.trainingFrequency || "",
    duration: entry?.duration || "",
    intensity: entry?.intensity || "",
    conditioningDays: entry?.conditioningDays || "",
  });

  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open && entry) {
      setFormData({
        trainingFrequency: entry.trainingFrequency || "",
        duration: entry.duration || "",
        intensity: entry.intensity || "",
        conditioningDays: entry.conditioningDays || "",
      });
    } else if (open && !entry) {
      setFormData({
        trainingFrequency: "",
        duration: "",
        intensity: "",
        conditioningDays: "",
      });
    }
  }, [open, entry]);

  function validateForm() {
    const fields = ['trainingFrequency', 'duration', 'intensity', 'conditioningDays'];
    for (const field of fields) {
      const value = formData[field].trim();
      if (!value || value === '') {
        toast.error(`Please fill in all fields or enter "N/A" for optional fields`);
        return false;
      }
    }
    return true;
  }

  async function saveEntry() {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Get current entries
      let currentEntries = [];
      try {
        const checkResponse = await fetchData(`app/roundglass/client-preference?person=coach&clientId=${id}`);
        if (checkResponse?.data?.trainingModule) {
          currentEntries = checkResponse.data.trainingModule;
        }
      } catch (error) {
        // Preferences don't exist yet
      }

      // Prepare the entry to save
      const entryToSave = {
        trainingFrequency: formData.trainingFrequency.trim(),
        duration: formData.duration.trim(),
        intensity: formData.intensity.trim(),
        conditioningDays: formData.conditioningDays.trim(),
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

      // Check if preferences exist
      const preferencesExist = currentEntries.length > 0 || entry?._id;
      const method = preferencesExist ? "PUT" : "POST";

      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: id,
          trainingModule: currentEntries,
        },
        method
      );

      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(entry?._id ? "Training entry updated successfully" : "Training entry added successfully");
      
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
      <DialogContent className="!max-w-[550px] text-center border-0 px-4 lg:px-10 overflow-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">
          {entry?._id ? "Edit Training Entry" : "Add Training Entry"}
        </DialogTitle>
        <div className="mt-4">
          <div className="text-left grid grid-cols-1 gap-4 [&_.label]:font-[500] text-[14px]">
            <FormControl
              label="Training Frequency *"
              value={formData.trainingFrequency}
              onChange={(e) => setFormData(prev => ({ ...prev, trainingFrequency: e.target.value }))}
              placeholder="e.g., 3 times per week or N/A"
              required
            />
            <FormControl
              label="Duration *"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g., 60 minutes or N/A"
              required
            />
            <FormControl
              label="Intensity *"
              value={formData.intensity}
              onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
              placeholder="e.g., Moderate, High, Low or N/A"
              required
            />
            <FormControl
              label="Conditioning Days *"
              value={formData.conditioningDays}
              onChange={(e) => setFormData(prev => ({ ...prev, conditioningDays: e.target.value }))}
              placeholder="e.g., Monday, Wednesday, Friday or N/A"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-left">
            * All fields are required. Enter "N/A" if information is not available.
          </p>
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
