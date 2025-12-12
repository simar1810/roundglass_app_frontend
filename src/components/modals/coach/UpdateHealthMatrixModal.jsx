import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendData } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { updateCoachField } from "@/providers/global/slices/coach";
import { Edit2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

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
        <Button variant="default" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
          <Edit2 className="h-4 w-4" />
          Manage Fields
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">Manage Health Matrix Fields</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            Configure default metrics and create custom fields for your clients
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-10 p-6">
            {/* Default Fields Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded-lg shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold break-words">Default Fields</h3>
                  <p className="text-sm text-muted-foreground break-words">Select the standard metrics you want to track for your clients.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {DEFAULT_FIELDS_ENUM.map(field => {
                  const isChecked = defaultFields.includes(field);
                  return (
                    <div 
                      key={field} 
                      className={cn(
                        "flex items-start gap-2 border-2 rounded-lg p-3 transition-all cursor-pointer min-w-0",
                        isChecked 
                          ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                      onClick={() => handleDefaultFieldToggle(field)}
                    >
                      <Checkbox
                        id={`default-${field}`}
                        checked={isChecked}
                        onCheckedChange={() => handleDefaultFieldToggle(field)}
                        className="mt-0.5 shrink-0"
                      />
                      <Label 
                        htmlFor={`default-${field}`} 
                        className="cursor-pointer flex-1 font-medium text-sm leading-snug break-words overflow-wrap-break-word min-w-0"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                      >
                        {DEFAULT_FIELD_LABELS[field] || field}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coach Added Fields Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-950 rounded-lg shrink-0 mt-0.5">
                    <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold break-words">Custom Fields</h3>
                    <p className="text-sm text-muted-foreground break-words">Add your own metrics to track.</p>
                  </div>
                </div>
                <Button onClick={handleAddCoachField} size="default" variant="default" className="gap-2 shadow-md hover:shadow-lg transition-shadow shrink-0">
                  <Plus className="h-4 w-4" />
                  Add Custom Field
                </Button>
              </div>

              <div className="space-y-4">
                {coachAddedFields.map((field, index) => (
                  <div 
                    key={index} 
                    className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 sm:p-5 space-y-4 sm:space-y-5 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/30 dark:to-transparent relative shadow-sm"
                  >
                    <div className="absolute top-3 right-3 z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => handleRemoveCoachField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-semibold break-words">Title *</Label>
                        <Input
                          value={field.title}
                          onChange={(e) => handleCoachFieldChange(index, "title", e.target.value)}
                          placeholder="e.g. Flexibility Score"
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-semibold break-words">Field Label (Internal) *</Label>
                        <Input
                          value={field.fieldLabel}
                          onChange={(e) => handleCoachFieldChange(index, "fieldLabel", e.target.value)}
                          placeholder="e.g. flexibility"
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-semibold break-words">Min Value</Label>
                        <Input
                          type="number"
                          value={field.minValue}
                          onChange={(e) => handleCoachFieldChange(index, "minValue", e.target.value)}
                          className="h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-sm font-semibold break-words">Max Value</Label>
                        <Input
                          type="number"
                          value={field.maxValue}
                          onChange={(e) => handleCoachFieldChange(index, "maxValue", e.target.value)}
                          className="h-10 w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold break-words">Select Icon</Label>
                      <Select
                        value={String(field.svg)}
                        onValueChange={(value) => handleCoachFieldChange(index, "svg", Number(value))}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {SVG_ICONS.map((iconPath, i) => {
                            if (i === 0) return null; // Skip 0 as range is 1-12
                            return (
                              <SelectItem key={i} value={String(i)}>
                                <div className="relative w-5 h-5">
                                  <Image src={iconPath} alt={`Icon ${i}`} fill className="object-contain" />
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                {coachAddedFields.length === 0 && (
                  <div className="text-center p-12 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-950/20">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground font-medium mb-1">No custom fields added yet</p>
                    <p className="text-sm text-muted-foreground">Click "Add Custom Field" to create your first custom metric</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shrink-0">
          <div className="text-sm text-muted-foreground break-words">
            {defaultFields.length + coachAddedFields.length} {defaultFields.length + coachAddedFields.length === 1 ? "field" : "fields"} configured
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="min-w-[100px] shrink-0">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px] shadow-md hover:shadow-lg transition-shadow shrink-0">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



