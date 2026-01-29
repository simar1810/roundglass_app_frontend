import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchData, sendData } from "@/lib/api";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function UpdateClientSupplementIntakeModal({ id, clientData = {} }) {
  // Get supplements from clientPreferences or fallback to supplementIntake for backward compatibility
  // Memoize to prevent infinite loops
  const supplements = useMemo(() => {
    if (Array.isArray(clientData?.clientPreferences?.supplements)) {
      return clientData.clientPreferences.supplements;
    }
    if (Array.isArray(clientData?.supplementIntake)) {
      return clientData.supplementIntake;
    }
    return [];
  }, [clientData?.clientPreferences?.supplements, clientData?.supplementIntake]);

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mainModalOpen, setMainModalOpen] = useState(false);

  const closeBtnRef = useRef(null);

  // Load entries when modal opens or data changes
  useEffect(() => {
    if (Array.isArray(supplements) && supplements.length > 0) {
      const loadedEntries = supplements.map((supp) => ({
        _id: supp._id || null,
        brand: supp.brand || "",
        dosage: supp.dosage || "",
        frequency: supp.frequency || "",
        source: supp.source || "",
        purpose: supp.purpose || "",
        dateTime: supp.dateTime || new Date().toISOString(),
      }));
      setEntries(loadedEntries);
    } else {
      setEntries([]);
    }
  }, [supplements, refreshTrigger]);

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
          supplements: updatedEntries.map(entry => ({
            brand: entry.brand.trim(),
            dosage: entry.dosage.trim(),
            frequency: entry.frequency.trim(),
            source: entry.source.trim(),
            purpose: entry.purpose.trim(),
            dateTime: entry.dateTime || new Date().toISOString(),
            ...(entry._id && { _id: entry._id }),
          })),
        },
        method
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Supplement entry deleted successfully");
      
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
        <DialogTitle className="text-[24px] mb-4">Supplement Intake Tracker</DialogTitle>
        <div className="mt-4">
          <div className="text-left space-y-4">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <div
                  key={entry._id || index}
                  className="p-4 border-1 rounded-[8px] bg-[var(--comp-1)] space-y-2 relative"
                >
                  <div className="flex items-center justify-end gap-2 absolute top-2 right-2">
                    <SupplementEntryEditModal
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
                    {entry.brand && (
                      <div className="grid grid-cols-[100px_1fr] gap-3">
                        <p className="font-semibold">Brand</p>
                        <p className="text-[var(--dark-2)]">{entry.brand}</p>
                      </div>
                    )}
                    {entry.dosage && (
                      <div className="grid grid-cols-[100px_1fr] gap-3">
                        <p className="font-semibold">Dosage</p>
                        <p className="text-[var(--dark-2)]">{entry.dosage}</p>
                      </div>
                    )}
                    {entry.frequency && (
                      <div className="grid grid-cols-[100px_1fr] gap-3">
                        <p className="font-semibold">Frequency</p>
                        <p className="text-[var(--dark-2)]">{entry.frequency}</p>
                      </div>
                    )}
                    {entry.source && (
                      <div className="grid grid-cols-[100px_1fr] gap-3">
                        <p className="font-semibold">Source</p>
                        <p className="text-[var(--dark-2)]">{entry.source}</p>
                      </div>
                    )}
                    {entry.purpose && (
                      <div className="grid grid-cols-[100px_1fr] gap-3">
                        <p className="font-semibold">Purpose</p>
                        <p className="text-[var(--dark-2)]">{entry.purpose}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm italic text-[#808080] text-center py-4">
                No supplement information added yet
              </p>
            )}
            
            <SupplementEntryEditModal
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
                  Add Supplement Entry
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

function SupplementEntryEditModal({ id, entry, index, onSuccess, trigger }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand: entry?.brand || "",
    dosage: entry?.dosage || "",
    frequency: entry?.frequency || "",
    source: entry?.source || "",
    purpose: entry?.purpose || "",
  });

  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open && entry) {
      setFormData({
        brand: entry.brand || "",
        dosage: entry.dosage || "",
        frequency: entry.frequency || "",
        source: entry.source || "",
        purpose: entry.purpose || "",
      });
    } else if (open && !entry) {
      setFormData({
        brand: "",
        dosage: "",
        frequency: "",
        source: "",
        purpose: "",
      });
    }
  }, [open, entry]);

  function validateForm() {
    const fields = ['brand', 'dosage', 'frequency', 'source', 'purpose'];
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
        if (checkResponse?.data?.supplements) {
          currentEntries = checkResponse.data.supplements;
        }
      } catch (error) {
        // Preferences don't exist yet
      }

      // Prepare the entry to save
      const entryToSave = {
        brand: formData.brand.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        source: formData.source.trim(),
        purpose: formData.purpose.trim(),
        dateTime: entry?.dateTime || new Date().toISOString(),
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
          supplements: currentEntries,
        },
        method
      );

      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(entry?._id ? "Supplement entry updated successfully" : "Supplement entry added successfully");
      
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
          {entry?._id ? "Edit Supplement Entry" : "Add Supplement Entry"}
        </DialogTitle>
        <div className="mt-4">
          <div className="text-left grid grid-cols-1 gap-4 [&_.label]:font-[500] text-[14px]">
            <FormControl
              label="Brand *"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="e.g., Optimum Nutrition or N/A"
              required
            />
            <FormControl
              label="Dosage *"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder="e.g., 25g per serving or N/A"
              required
            />
            <FormControl
              label="Frequency *"
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
              placeholder="e.g., Once daily or N/A"
              required
            />
            <FormControl
              label="Source *"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              placeholder="e.g., Online store, Pharmacy or N/A"
              required
            />
            <FormControl
              label="Purpose *"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="e.g., Muscle recovery or N/A"
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
