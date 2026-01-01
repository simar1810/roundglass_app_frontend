import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendDataWithFormData } from "@/lib/api";
import { cn, getObjectUrl } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { Trophy, Upload, X } from "lucide-react";
import NextImage from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function UpdateCoachAwardModal() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => ({ file: null, title: "" }));
  const [open, setOpen] = useState(false);

  const _id = useAppSelector(state => state.coach.data._id);

  const closeBtnRef = useRef(null);
  const fileRef = useRef(null);

  const resetForm = () => {
    setFormData({ file: null, title: "" });
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  async function updateCoachAward(e) {
    try {
      e.preventDefault();
      
      if (!formData.title.trim()) {
        toast.error("Please enter an award title");
        return;
      }
      
      if (!formData.file) {
        toast.error("Please select an award image");
        return;
      }

      setLoading(true);
      const data = new FormData();
      data.append("file", formData.file);
      data.append("awardTitle", formData.title);
      data.append("coachId", _id);
      
      const response = await sendDataWithFormData(`app/updateCoachProfile`, data, "POST");
      if (response.status_code !== 200) throw new Error(response.message);
      
      toast.success(response.message || "Award added successfully");
      mutate("coachProfile");
      handleClose();
    } catch (error) {
      toast.error(error.message || "Failed to add award");
    } finally {
      setLoading(false);
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button variant="wz" className="flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Add Award
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-[500px] p-0 gap-0">
      <div className="p-6 border-b">
        <DialogTitle className="text-xl font-semibold">Add New Award</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">Upload an award image and provide a title</p>
      </div>
      
      <form onSubmit={updateCoachAward} className="p-6 space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="award-image" className="text-sm font-medium">
            Award Image <span className="text-destructive">*</span>
          </Label>
          <div 
            onClick={() => fileRef.current?.click()} 
            className={cn(
              "h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-[10px] cursor-pointer transition-colors relative overflow-hidden",
              formData.file ? "border-primary" : "border-muted hover:border-primary/50"
            )}
          >
            <input
              type="file"
              id="award-image"
              name="file"
              ref={fileRef}
              className="hidden"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData(prev => ({ ...prev, file }));
                }
              }}
            />
            {!formData.file ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
            ) : (
              <>
                <NextImage
                  src={getObjectUrl(formData.file)}
                  fill
                  alt="Award preview"
                  className="object-contain p-4"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, file: null }));
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="award-title" className="text-sm font-medium">
            Award Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="award-title"
            placeholder="e.g., Best Coach 2024"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="wz"
            disabled={loading || !formData.file || !formData.title.trim()}
            className="flex-1"
          >
            {loading ? "Adding..." : "Add Award"}
          </Button>
        </div>
      </form>
      <DialogClose ref={closeBtnRef} className="hidden" />
    </DialogContent>
  </Dialog>
}