import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendData } from "@/lib/api";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { X, Upload, File } from "lucide-react";

export default function UpdateClientInjuryLogModal({ id, clientData = {} }) {
  const injuryLogs = clientData.injuryLog || [];

  const [loading, setLoading] = useState(false);
  const [injuryEntries, setInjuryEntries] = useState(
    injuryLogs.length > 0
      ? injuryLogs.map(log => ({
          ...log,
          files: log.files || [],
          newFiles: [] // For newly uploaded files
        }))
      : [
          {
            injuryType: "",
            bodyPart: "",
            incidentDate: "",
            rehabProgress: "",
            physiotherapistAssignment: "",
            files: [],
            newFiles: []
          },
        ]
  );

  const closeBtnRef = useRef(null);

  const addInjuryEntry = () => {
    setInjuryEntries([
      ...injuryEntries,
      {
        injuryType: "",
        bodyPart: "",
        incidentDate: "",
        rehabProgress: "",
        physiotherapistAssignment: "",
        files: [],
        newFiles: []
      },
    ]);
  };

  const removeInjuryEntry = (index) => {
    if (injuryEntries.length > 1) {
      setInjuryEntries(injuryEntries.filter((_, i) => i !== index));
    }
  };

  const updateInjuryEntry = (index, field, value) => {
    const updated = [...injuryEntries];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setInjuryEntries(updated);
  };

  const handleFileUpload = (index, event) => {
    const files = Array.from(event.target.files || []);
    const updated = [...injuryEntries];
    updated[index] = {
      ...updated[index],
      newFiles: [...(updated[index].newFiles || []), ...files],
    };
    setInjuryEntries(updated);
  };

  const removeFile = (entryIndex, fileIndex, isNewFile = true) => {
    const updated = [...injuryEntries];
    if (isNewFile) {
      updated[entryIndex].newFiles = updated[entryIndex].newFiles.filter(
        (_, i) => i !== fileIndex
      );
    } else {
      updated[entryIndex].files = updated[entryIndex].files.filter(
        (_, i) => i !== fileIndex
      );
    }
    setInjuryEntries(updated);
  };

  async function updateInjuryLog() {
    try {
      setLoading(true);
      
      // Filter out empty entries
      const validInjuryLogs = injuryEntries.filter(
        (entry) =>
          entry.injuryType.trim() ||
          entry.bodyPart.trim() ||
          entry.incidentDate ||
          entry.rehabProgress.trim() ||
          entry.physiotherapistAssignment.trim()
      );

      // Prepare data for backend
      // Note: File uploads will need to be handled separately via FormData
      // For now, we'll structure the data so backend can easily process it
      const injuryLogData = validInjuryLogs.map(entry => ({
        injuryType: entry.injuryType,
        bodyPart: entry.bodyPart,
        incidentDate: entry.incidentDate,
        rehabProgress: entry.rehabProgress,
        physiotherapistAssignment: entry.physiotherapistAssignment,
        existingFiles: entry.files, // Files that already exist on server
        // newFiles will be handled separately via FormData upload
      }));

      // TODO: When backend is ready, you'll need to:
      // 1. First upload files using FormData
      // 2. Then send the injury log data with file references
      // For now, we'll just send the structured data
      
      const response = await sendData(
        `app/updateClient?id=${id}`,
        {
          injuryLog: injuryLogData,
        },
        "PUT"
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message || "Injury log updated successfully");
      mutate(`clientDetails/${id}`);
      closeBtnRef.current?.click();
    } catch (error) {
      toast.error(error.message || "Failed to update injury log");
    } finally {
      setLoading(false);
    }
  }

  // Common injury types
  const injuryTypes = [
    "Sprain",
    "Strain",
    "Fracture",
    "Dislocation",
    "Tendinitis",
    "Bursitis",
    "Contusion",
    "Laceration",
    "Concussion",
    "Muscle Tear",
    "Ligament Tear",
    "Other"
  ];

  // Common body parts
  const bodyParts = [
    "Head",
    "Neck",
    "Shoulder",
    "Upper Arm",
    "Elbow",
    "Forearm",
    "Wrist",
    "Hand",
    "Fingers",
    "Chest",
    "Back (Upper)",
    "Back (Lower)",
    "Hip",
    "Thigh",
    "Knee",
    "Shin",
    "Ankle",
    "Foot",
    "Toes",
    "Other"
  ];

  return (
    <Dialog>
      <DialogTrigger className="text-[var(--accent-1)] text-[14px] font-semibold pr-3">
        Edit
      </DialogTrigger>
      <DialogContent className="!max-w-[700px] text-center border-0 px-4 lg:px-10 overflow-auto gap-0 max-h-[90vh]">
        <DialogTitle className="text-[24px] mb-4">Injury Log</DialogTitle>
        <div className="mt-4">
          <div className="text-left space-y-6">
            {injuryEntries.map((entry, index) => (
              <div
                key={index}
                className="p-4 border-1 rounded-[8px] bg-[var(--comp-1)] space-y-4 relative"
              >
                {injuryEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInjuryEntry(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 gap-4 [&_.label]:font-[500] text-[14px]">
                  {/* Injury Type */}
                  <div>
                    <label className="label font-[600] block mb-1">Injury Type</label>
                    <Select
                      value={entry.injuryType}
                      onValueChange={(value) =>
                        updateInjuryEntry(index, "injuryType", value)
                      }
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
                    <label className="label font-[600] block mb-1">Body Part</label>
                    <Select
                      value={entry.bodyPart}
                      onValueChange={(value) =>
                        updateInjuryEntry(index, "bodyPart", value)
                      }
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
                    label="Incident Date"
                    type="date"
                    value={entry.incidentDate}
                    onChange={(e) =>
                      updateInjuryEntry(index, "incidentDate", e.target.value)
                    }
                  />

                  {/* Rehab Progress */}
                  <div>
                    <label className="label font-[600] block mb-1">Rehab Progress</label>
                    <Textarea
                      value={entry.rehabProgress}
                      onChange={(e) =>
                        updateInjuryEntry(index, "rehabProgress", e.target.value)
                      }
                      placeholder="Enter rehabilitation progress details..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Physiotherapist Assignment */}
                  <FormControl
                    label="Physiotherapist Assignment"
                    value={entry.physiotherapistAssignment}
                    onChange={(e) =>
                      updateInjuryEntry(index, "physiotherapistAssignment", e.target.value)
                    }
                    placeholder="Enter physiotherapist name or ID"
                  />

                  {/* File Uploads */}
                  <div>
                    <label className="label font-[600] block mb-2">File Uploads</label>
                    
                    {/* Existing Files */}
                    {entry.files && entry.files.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {entry.files.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center justify-between p-2 bg-white rounded border-1"
                          >
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {typeof file === 'string' ? file : file.name || file.url}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index, fileIndex, false)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Files Preview */}
                    {entry.newFiles && entry.newFiles.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {entry.newFiles.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center justify-between p-2 bg-white rounded border-1"
                          >
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index, fileIndex, true)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File Upload Input */}
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        hidden
                        id={`file-upload-${index}`}
                        onChange={(e) => handleFileUpload(index, e)}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <label
                        htmlFor={`file-upload-${index}`}
                        className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[var(--accent-1)]"
                      >
                        <Upload className="w-6 h-6 mb-2" />
                        <span className="text-sm">Click to upload files</span>
                        <span className="text-xs mt-1">(Images, PDF, DOC, DOCX)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addInjuryEntry}
              className="w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              <Upload className="w-4 h-4" />
              Add Another Injury Entry
            </Button>
          </div>
          <Button
            variant="wz"
            onClick={updateInjuryLog}
            disabled={loading}
            className="mt-8"
          >
            {loading ? "Saving..." : "Save Injury Log"}
          </Button>
          <DialogClose ref={closeBtnRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

