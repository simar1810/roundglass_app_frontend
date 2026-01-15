import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendData, fetchData, sendDataWithFormData } from "@/lib/api";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Trash2, Pencil, Upload, File, X, Plus, Eye } from "lucide-react";
import Image from "next/image";
import { getObjectUrl } from "@/lib/utils";

export default function UpdateClientInjuryLogModal({ id, clientData = {} }) {
  // Get injuries from clientPreferences or fallback to injuryLog for backward compatibility
  const injuries = Array.isArray(clientData?.clientPreferences?.injuries)
    ? clientData.clientPreferences.injuries
    : (Array.isArray(clientData?.injuryLog) ? clientData.injuryLog : []);

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mainModalOpen, setMainModalOpen] = useState(false);

  const closeBtnRef = useRef(null);

  // Load entries when modal opens or data changes
  useEffect(() => {
    if (Array.isArray(injuries) && injuries.length > 0) {
      const loadedEntries = injuries.map(injury => ({
        _id: injury._id || null,
        injuryType: injury.injuryType || "",
        bodyPart: injury.bodyPart || "",
        incidentDate: injury.incidentDate ? new Date(injury.incidentDate).toISOString().split('T')[0] : "",
        rehabProgress: injury.rehabProgress || "",
        physiotherapistAssignment: injury.physiotherapistAssignment || "",
        fileUpload: injury.fileUpload || "",
      }));
      setEntries(loadedEntries);
    } else {
      setEntries([]);
    }
  }, [injuries, refreshTrigger]);

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
          injuries: updatedEntries.map(entry => ({
            injuryType: entry.injuryType.trim(),
            bodyPart: entry.bodyPart.trim(),
            incidentDate: entry.incidentDate ? new Date(entry.incidentDate).toISOString() : "",
            rehabProgress: entry.rehabProgress.trim(),
            physiotherapistAssignment: entry.physiotherapistAssignment.trim(),
            fileUpload: entry.fileUpload || "",
            ...(entry._id && { _id: entry._id }),
          })),
        },
        method
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Injury entry deleted successfully");
      
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
      <DialogContent className="!max-w-[700px] max-h-[90vh] text-center border-0 px-4 lg:px-10 overflow-y-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">Injury Log</DialogTitle>
        <div className="mt-4">
          <div className="text-left space-y-4">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <div
                  key={entry._id || index}
                  className="p-4 border-1 rounded-[8px] bg-[var(--comp-1)] space-y-2 relative"
                >
                  <div className="flex items-center justify-end gap-2 absolute top-2 right-2">
                    <InjuryEntryEditModal
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
                    {entry.injuryType && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Injury Type</p>
                        <p className="text-[var(--dark-2)]">{entry.injuryType}</p>
                      </div>
                    )}
                    {entry.bodyPart && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Body Part</p>
                        <p className="text-[var(--dark-2)]">{entry.bodyPart}</p>
                      </div>
                    )}
                    {entry.incidentDate && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Incident Date</p>
                        <p className="text-[var(--dark-2)]">
                          {new Date(entry.incidentDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {entry.rehabProgress && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Rehab Progress</p>
                        <p className="text-[var(--dark-2)] break-words whitespace-pre-wrap">{entry.rehabProgress}</p>
                      </div>
                    )}
                    {entry.physiotherapistAssignment && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">Physiotherapist</p>
                        <p className="text-[var(--dark-2)]">{entry.physiotherapistAssignment}</p>
                      </div>
                    )}
                    {entry.fileUpload && (
                      <div className="grid grid-cols-[140px_1fr] gap-3">
                        <p className="font-semibold">File</p>
                        <div className="text-[var(--dark-2)]">
                          {entry.fileUpload.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <ImagePreviewDialog imageUrl={entry.fileUpload}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Image
                              </Button>
                            </ImagePreviewDialog>
                          ) : (
                            <a
                              href={entry.fileUpload}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline break-all"
                            >
                              {entry.fileUpload}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm italic text-[#808080] text-center py-4">
                No injury log entries added yet
              </p>
            )}
            
            <InjuryEntryEditModal
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
                  Add Injury Entry
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

function InjuryEntryEditModal({ id, entry, index, onSuccess, trigger }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    injuryType: entry?.injuryType || "",
    bodyPart: entry?.bodyPart || "",
    incidentDate: entry?.incidentDate ? new Date(entry.incidentDate).toISOString().split('T')[0] : "",
    rehabProgress: entry?.rehabProgress || "",
    physiotherapistAssignment: entry?.physiotherapistAssignment || "",
    fileUpload: entry?.fileUpload || "",
    newFile: null,
  });

  const closeBtnRef = useRef(null);
  const fileInputRef = useRef(null);

  // Common injury types
  const injuryTypes = [
    "Sprain", "Strain", "Fracture", "Dislocation", "Tendinitis", "Bursitis",
    "Contusion", "Laceration", "Concussion", "Muscle Tear", "Ligament Tear", "Other"
  ];

  // Common body parts
  const bodyParts = [
    "Head", "Neck", "Shoulder", "Upper Arm", "Elbow", "Forearm", "Wrist", "Hand", "Fingers",
    "Chest", "Back (Upper)", "Back (Lower)", "Hip", "Thigh", "Knee", "Shin", "Ankle", "Foot", "Toes", "Other"
  ];

  useEffect(() => {
    if (open && entry) {
      setFormData({
        injuryType: entry.injuryType || "",
        bodyPart: entry.bodyPart || "",
        incidentDate: entry.incidentDate ? new Date(entry.incidentDate).toISOString().split('T')[0] : "",
        rehabProgress: entry.rehabProgress || "",
        physiotherapistAssignment: entry.physiotherapistAssignment || "",
        fileUpload: entry.fileUpload || "",
        newFile: null,
      });
    } else if (open && !entry) {
      setFormData({
        injuryType: "",
        bodyPart: "",
        incidentDate: "",
        rehabProgress: "",
        physiotherapistAssignment: "",
        fileUpload: "",
        newFile: null,
      });
    }
  }, [open, entry]);

  function validateForm() {
    const fields = ['injuryType', 'bodyPart', 'incidentDate', 'rehabProgress', 'physiotherapistAssignment'];
    for (const field of fields) {
      const value = formData[field].trim();
      if (!value || value === '') {
        toast.error(`Please fill in all fields or enter "N/A" for optional fields`);
        return false;
      }
    }
    return true;
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        newFile: file,
      }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      newFile: null,
      fileUpload: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function saveEntry() {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Upload file first if there is a new file
      let fileUploadUrl = formData.fileUpload || "";
      if (formData.newFile) {
        try {
          setUploadProgress(0);
          // Upload the file with progress tracking
          const uploadData = new FormData();
          uploadData.append("file", formData.newFile);
          
          // Use XMLHttpRequest for progress tracking
          const xhr = new XMLHttpRequest();
          const uploadPromise = new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setUploadProgress(percentComplete);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status === 200) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  if (response.status_code === 200 && response.img) {
                    resolve(response.img);
                  } else {
                    reject(new Error(response.message || "Failed to upload file"));
                  }
                } catch (error) {
                  reject(new Error("Failed to parse upload response"));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error("Upload failed"));
            });

            xhr.addEventListener('abort', () => {
              reject(new Error("Upload aborted"));
            });

            // Get token from cookies
            const getCookie = (name) => {
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) return parts.pop().split(';').shift();
            };
            const token = getCookie('token');

            xhr.open('POST', `${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/app/getPlanImageWeb`);
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(uploadData);
          });

          fileUploadUrl = await uploadPromise;
          setUploadProgress(100);
        } catch (error) {
          toast.error(error.message || "Failed to upload file. Please try again.");
          setLoading(false);
          setUploadProgress(0);
          return;
        }
      }
      
      // Get current entries
      let currentEntries = [];
      try {
        const checkResponse = await fetchData(`app/roundglass/client-preference?person=coach&clientId=${id}`);
        if (checkResponse?.data?.injuries) {
          currentEntries = checkResponse.data.injuries;
        }
      } catch (error) {
        // Preferences don't exist yet
      }

      // Prepare the entry to save
      const entryToSave = {
        injuryType: formData.injuryType.trim(),
        bodyPart: formData.bodyPart.trim(),
        incidentDate: formData.incidentDate ? new Date(formData.incidentDate).toISOString() : "",
        rehabProgress: formData.rehabProgress.trim(),
        physiotherapistAssignment: formData.physiotherapistAssignment.trim(),
        fileUpload: fileUploadUrl,
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
          injuries: currentEntries,
        },
        method
      );

      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(entry?._id ? "Injury entry updated successfully" : "Injury entry added successfully");
      
      // Refresh data to sync with backend
      mutate(`clientDetails/${id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${id}`, undefined, { revalidate: true });
      
      if (onSuccess) onSuccess();
      setOpen(false);
      setUploadProgress(0);
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
      <DialogContent className="!max-w-[600px] max-h-[90vh] text-center border-0 px-4 lg:px-10 overflow-y-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">
          {entry?._id ? "Edit Injury Entry" : "Add Injury Entry"}
        </DialogTitle>
        <div className="mt-4">
          <div className="text-left grid grid-cols-1 gap-4 [&_.label]:font-[500] text-[14px]">
            {/* Injury Type */}
            <div>
              <label className="label font-[600] block mb-1">Injury Type *</label>
              <Select
                value={formData.injuryType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, injuryType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select injury type" />
                </SelectTrigger>
                <SelectContent>
                  {injuryTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Part */}
            <div>
              <label className="label font-[600] block mb-1">Body Part *</label>
              <Select
                value={formData.bodyPart}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bodyPart: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select body part" />
                </SelectTrigger>
                <SelectContent>
                  {bodyParts.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Incident Date */}
            <FormControl
              label="Incident Date *"
              type="date"
              value={formData.incidentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
              required
            />

            {/* Rehab Progress */}
            <div>
              <label className="label font-[600] block mb-1">Rehab Progress *</label>
              <Textarea
                value={formData.rehabProgress}
                onChange={(e) => setFormData(prev => ({ ...prev, rehabProgress: e.target.value }))}
                placeholder="Enter rehabilitation progress details or N/A"
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Physiotherapist Assignment */}
            <FormControl
              label="Physiotherapist Assignment *"
              value={formData.physiotherapistAssignment}
              onChange={(e) => setFormData(prev => ({ ...prev, physiotherapistAssignment: e.target.value }))}
              placeholder="Enter physiotherapist name or ID or N/A"
              required
            />

            {/* File Upload */}
            <div>
              <label className="label font-[600] block mb-2">File Upload (Optional)</label>
              
              {/* Existing File Preview */}
              {formData.fileUpload && !formData.newFile && (
                <div className="mb-3 p-2 bg-white rounded border-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <span className="text-sm break-all">
                        {typeof formData.fileUpload === 'string' ? formData.fileUpload : formData.fileUpload.name || formData.fileUpload.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.fileUpload.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <ImagePreviewDialog imageUrl={formData.fileUpload}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </ImagePreviewDialog>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, fileUpload: "" }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* New File Preview */}
              {formData.newFile && (
                <div className="mb-3 p-2 bg-white rounded border-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formData.newFile.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.newFile.type.startsWith('image/') && (
                        <ImagePreviewDialog imageUrl={getObjectUrl(formData.newFile)}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </ImagePreviewDialog>
                      )}
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              )}

              {/* File Upload Input */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <label
                  htmlFor="file-upload"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[var(--accent-1)]"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">Click to upload file</span>
                  <span className="text-xs mt-1">(Images, PDF, DOC, DOCX - Single file only)</span>
                </label>
              </div>
            </div>
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

function ImagePreviewDialog({ imageUrl, children }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] md:max-w-4xl max-h-[80vh] overflow-auto">
        <DialogTitle>Image Preview</DialogTitle>
        <div className="relative w-full h-[70vh] flex items-center justify-center">
          <Image
            src={imageUrl}
            alt="Image preview"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
