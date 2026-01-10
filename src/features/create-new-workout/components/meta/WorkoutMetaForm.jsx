import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Button } from "@/components/ui/button";
import { META_FIELDS } from "../../utils/config";
import TextAreaField from "./TextAreaField";
import TextField from "./TextField";
import CategoryFields from "./CategoryFields";
import { useState } from "react";
import ImageSelector from "@/components/common/ImageSelector";
import { validateMetaPayload } from "../../utils/helpers";

export default function WorkoutMetaForm() {
  const { meta, dispatch } = useCurrentStateContext();
  const [formData, setFormData] = useState(meta);
  const [errors, setErrors] = useState({});

  function updateField(key, value) {
    setFormData(m => ({ ...m, [key]: value }));
  }

  function handleNext() {
    const validationErrors = validateMetaPayload(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    dispatch({
      type: "UPDATE_META",
      payload: {
        ...formData,
        stage: 2,
      },
    });
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <TextField
        label="Workout Title"
        value={formData.title}
        onChange={v => updateField(META_FIELDS.TITLE, v)}
      />

      <TextAreaField
        label="Description"
        value={formData.description}
        onChange={v => updateField(META_FIELDS.DESCRIPTION, v)}
      />

      <TextAreaField
        label="Guidelines"
        value={formData.guidelines}
        onChange={v => updateField(META_FIELDS.GUIDELINES, v)}
      />

      <CategoryFields
        category={formData.category}
        subcategory={formData.subcategory}
        onCategoryChange={v => updateField(META_FIELDS.CATEGORY, v)}
        onSubcategoryChange={v => updateField(META_FIELDS.SUBCATEGORY, v)}
      />

      <ImageSelector
        file={formData.file}
        onFileChange={value => updateField("file", value)}
        label="Thumbnail"
        defaultImageLink={meta.image}
        className="[&_.label]:font-medium [&_.label]:text-sm [&_.label]:text-gray-700"
      />

      {Object.keys(errors).length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Please fill all required fields before continuing fields not filled: {Object.keys(errors).join(", ")}
        </div>
      )}

      <div className="pt-4">
        <Button className="px-8" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
