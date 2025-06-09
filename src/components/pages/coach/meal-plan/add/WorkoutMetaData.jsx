import FormControl from "@/components/FormControl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customWorkoutUpdateField } from "@/config/state-reducers/custom-meal";
import useCurrentStateContext from "@/providers/CurrentStateContext";

export default function WorkoutMetaData() {
  const { dispatch, title, description } = useCurrentStateContext()
  return <div>
    <FormControl
      value={title}
      onChange={e => dispatch(customWorkoutUpdateField("title", e.target.value))}
      placeholder="Enter title"
      label="Title"
    />
    <div className="mt-4">
      <Label className="font-bold mb-2">Description</Label>
      <Textarea
        value={description}
        onChange={e => dispatch(customWorkoutUpdateField("description", e.target.value))}
        placeholder="Enter Description"
        label="Description"
        className="min-h-[120px]"
      />
    </div>
  </div>
}