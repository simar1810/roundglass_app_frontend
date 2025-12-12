import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendData } from "@/lib/api";
import { useAppSelector } from "@/providers/global/hooks";
import { Plus, Trash2, Edit2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { updateCoachField } from "@/providers/global/slices/coach";
import { useDispatch } from "react-redux";
import { cn } from "@/lib/utils";

const SVG_ICONS = [
  "/svgs/body.svg",      // 0 - Not in range 1-12
  "/svgs/check.svg",     // 1
  "/svgs/checklist.svg", // 2
  "/svgs/bmi.svg",       // 3
  "/svgs/cutlery.svg",   // 4
  "/svgs/fat.svg",       // 5
  "/svgs/fats.svg",      // 6
  "/svgs/muscle.svg",    // 7
  "/svgs/meta.svg",      // 8
  "/svgs/person.svg",    // 9
  "/svgs/weight.svg",    // 10
  "/svgs/flame-icon.svg",// 11
  "/svgs/marathon.svg",  // 12
];

const DEFAULT_FIELDS_ENUM = [
  "bmi", "muscle", "fat", "rm", "ideal_weight",
  "bodyAge", "visceral_fat", "weight", "sub_fat"
];

const DEFAULT_FIELD_LABELS = {
  bmi: "BMI",
  muscle: "Muscle Mass",
  fat: "Body Fat",
  rm: "Resting Metabolism",
  ideal_weight: "Ideal Weight",
  bodyAge: "Body Age",
  visceral_fat: "Visceral Fat",
  weight: "Weight",
  sub_fat: "Subcutaneous Fat"
};

export default function UpdateHealthMatrixModal({ data }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { _id } = useAppSelector(state => state.coach.data);
  const dispatch = useDispatch();

  // Initial state from props
  const [defaultFields, setDefaultFields] = useState(data?.defaultFields || []);
  const [coachAddedFields, setCoachAddedFields] = useState(data?.coachAddedFields || []);

  useEffect(() => {
    if (open) {
      setDefaultFields(data?.defaultFields || []);
      setCoachAddedFields(data?.coachAddedFields || []);
    }
  }, [open, data]);

  const handleDefaultFieldToggle = (field) => {
    setDefaultFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleAddCoachField = () => {
    setCoachAddedFields(prev => [
      ...prev,
      {
        title: "",
        fieldLabel: "",
        minValue: 0,
        maxValue: 100,
        svg: 1,
        systemDefault: false
      }
    ]);
  };

  const handleRemoveCoachField = (index) => {
    setCoachAddedFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleCoachFieldChange = (index, field, value) => {
    setCoachAddedFields(prev => {
      const newFields = [...prev];
      newFields[index] = { ...newFields[index], [field]: value };
      return newFields;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation
      if (coachAddedFields.some(f => !f.title || !f.fieldLabel)) {
        throw new Error("All custom fields must have a title and label");
      }

      const payload = {
        coachAddedFields: coachAddedFields.map(f => ({
          ...f,
          minValue: Number(f.minValue),
          maxValue: Number(f.maxValue),
          svg: Number(f.svg)
        })),
        defaultFields
      };

      const response = await sendData("app/health-matrix/fields-list", payload, "POST");
      console.log(response)
      if (response.status_code !== 200) throw new Error(response.message);

      // Update local state and redux
      dispatch(updateCoachField({ coachHealthMatrixFields: payload }));
      toast.success("Health matrix fields updated successfully");
      setOpen(false);

    } catch (error) {
      toast.error(error.message || "Failed to update fields");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Fields
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Update Health Matrix Fields</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Default Fields Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Default Fields</h3>
              <p className="text-sm text-muted-foreground">Select the standard metrics you want to track for your clients.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DEFAULT_FIELDS_ENUM.map(field => (
                  <div key={field} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`default-${field}`}
                      checked={defaultFields.includes(field)}
                      onCheckedChange={() => handleDefaultFieldToggle(field)}
                    />
                    <Label htmlFor={`default-${field}`} className="cursor-pointer flex-1">
                      {DEFAULT_FIELD_LABELS[field] || field}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Added Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Custom Fields</h3>
                  <p className="text-sm text-muted-foreground">Add your own metrics to track.</p>
                </div>
                <Button onClick={handleAddCoachField} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {coachAddedFields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 bg-muted/10 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveCoachField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={field.title}
                          onChange={(e) => handleCoachFieldChange(index, "title", e.target.value)}
                          placeholder="e.g. Flexibility Score"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Label (Internal)</Label>
                        <Input
                          value={field.fieldLabel}
                          onChange={(e) => handleCoachFieldChange(index, "fieldLabel", e.target.value)}
                          placeholder="e.g. flexibility"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          value={field.minValue}
                          onChange={(e) => handleCoachFieldChange(index, "minValue", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          value={field.maxValue}
                          onChange={(e) => handleCoachFieldChange(index, "maxValue", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-2">
                        {SVG_ICONS.map((iconPath, i) => {
                          if (i === 0) return null; // Skip 0 as range is 1-12
                          const isSelected = field.svg === i;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleCoachFieldChange(index, "svg", i)}
                              className={cn(
                                "w-10 h-10 rounded-md border flex items-center justify-center transition-all",
                                isSelected ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2" : "hover:bg-muted"
                              )}
                            >
                              <div className="relative w-6 h-6">
                                <Image src={iconPath} alt="" fill className="object-contain" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {coachAddedFields.length === 0 && (
                  <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    No custom fields added.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex justify-end gap-2 bg-background">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



