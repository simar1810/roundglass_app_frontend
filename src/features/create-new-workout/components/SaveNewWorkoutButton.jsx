import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveNewWorkoutBackend } from "../api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { toast } from "sonner";

export default function SaveNewWorkoutButton() {
  const [loading, setLoading] = useState(false);
  const { ...state } = useCurrentStateContext();

  async function saveNewWorkout() {
    setLoading(true);
    const { success, message } = await saveNewWorkoutBackend(state);
    console.log(success, message);
    if (!success) toast.error(message);
    else toast.success(message);
    setLoading(false);
  }

  return <Button
    variant="wz"
    className="max-w-md w-full mx-auto block mt-4 opacity-40 hover:opacity-100"
    disabled={loading}
    onClick={saveNewWorkout}
  >
    {loading
      ? <Loader className="!w-6 border-white mx-auto" />
      : <>Save</>}
  </Button>
}