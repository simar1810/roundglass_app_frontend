import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { sendData } from "@/lib/api";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function UpdateClientTrainingInfoModal({ id, clientData = {} }) {
  // Get training module from clientPreferences or fallback to trainingInfo for backward compatibility
  const trainingModule = clientData?.clientPreferences?.trainingModule?.[0] || clientData?.trainingInfo || {};
  const {
    trainingFrequency = "",
    duration = "",
    intensity = "",
    conditioningDays = "",
  } = trainingModule;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trainingFrequency: trainingFrequency || "",
    duration: duration || "",
    intensity: intensity || "",
    conditioningDays: conditioningDays || "",
  });

  const closeBtnRef = useRef(null);

  async function updateTrainingInfo() {
    try {
      setLoading(true);
      // Use POST for upsert (create if doesn't exist, update if exists)
      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: id,
          trainingModule: [
            {
              trainingFrequency: formData.trainingFrequency,
              duration: formData.duration,
              intensity: formData.intensity,
              conditioningDays: formData.conditioningDays,
            },
          ],
        },
        "POST"
      );
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      
      // Mutate both caches to trigger re-fetch
      // Use revalidate: true to force a fresh fetch from the server
      mutate(`clientDetails/${id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${id}`, undefined, { revalidate: true });
      
      // Small delay to ensure cache updates before closing
      setTimeout(() => {
        closeBtnRef.current?.click();
      }, 100);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="text-[var(--accent-1)] text-[14px] font-semibold pr-3">
        Edit
      </DialogTrigger>
      <DialogContent className="!max-w-[550px] text-center border-0 px-4 lg:px-10 overflow-auto gap-0">
        <DialogTitle className="text-[24px] mb-4">Training Information</DialogTitle>
        <div className="mt-4">
          <div className="text-left grid grid-cols-1 gap-4 [&_.label]:font-[500] text-[14px]">
            <FormControl
              label="Training Frequency"
              value={formData.trainingFrequency}
              onChange={(e) => setFormData(prev => ({ ...prev, trainingFrequency: e.target.value }))}
              placeholder="e.g., 3 times per week"
            />
            <FormControl
              label="Duration"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g., 60 minutes"
            />
            <FormControl
              label="Intensity"
              value={formData.intensity}
              onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
              placeholder="e.g., Moderate, High, Low"
            />
            <FormControl
              label="Conditioning Days"
              value={formData.conditioningDays}
              onChange={(e) => setFormData(prev => ({ ...prev, conditioningDays: e.target.value }))}
              placeholder="e.g., Monday, Wednesday, Friday"
            />
          </div>
          <Button
            variant="wz"
            onClick={updateTrainingInfo}
            disabled={loading}
            className="mt-8"
          >
            Save Training Information
          </Button>
          <DialogClose ref={closeBtnRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

