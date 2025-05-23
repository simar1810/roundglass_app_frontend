import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { workoutInitialState } from "@/config/state-data/workout";
import { changeFieldValue, generateRequestPayload, workoutReducer } from "@/config/state-reducers/workout";
import { sendData, sendDataWithFormData } from "@/lib/api";
import { getAllWorkoutItems } from "@/lib/fetchers/app";
import { getObjectUrl } from "@/lib/utils";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { ImagePlus, Plus, PlusCircle, X } from "lucide-react";
import Image from "next/image";
import { use, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function CreateWorkoutModal() {
  return <Dialog>
    <DialogTrigger className="bg-[var(--accent-1)] text-white text-[14px] font-bold pl-4 pr-4 py-1 flex items-center gap-1 rounded-[8px]">
      <Plus className="w-[16px]" />
      Add
    </DialogTrigger>
    <DialogContent className="max-h-[70vh] p-0 overflow-y-auto">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Workout Details</DialogTitle>
      </DialogHeader>
      <CurrentStateProvider
        state={workoutInitialState}
        reducer={workoutReducer}
      >
        <AddWorkoutContainer />
      </CurrentStateProvider>
    </DialogContent>
  </Dialog>
}

function AddWorkoutContainer() {
  const [loading, setLoading] = useState(false);

  const { dispatch, ...state } = useCurrentStateContext();

  const closeBtnRef = useRef();
  const fileRef = useRef();

  async function saveWorkout() {
    try {
      setLoading(true);
      const data = generateRequestPayload(state)
      const response = await sendDataWithFormData("app/workout/create", data);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message || "Note added successfully!");
      closeBtnRef.current.click();
      mutate("app/coach/workoutCollections");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <div className="p-4 pt-0">
    <FormControl
      value={state.title}
      onChange={e => dispatch(changeFieldValue("title", e.target.value))}
      placeholder="Enter Title"
      label="Title"
    />

    <div className="mt-4">
      <p className="font-bold mb-2">Thumbnail</p>
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 relative">
        <X
          onClick={() => dispatch(changeFieldValue("thumbnail", ""))}
          className={`absolute right-2 top-2 text-gray-400 cursor-pointer ${state.thumbnail ? "block" : "hidden"}`}
        />
        <input
          type="file"
          hidden
          ref={fileRef}
          accept="image/*"
          onChange={(e) => dispatch(changeFieldValue("thumbnail", e.target.files[0]))}
        />
        {state.thumbnail
          ? <Image
            src={getObjectUrl(state.thumbnail) || "/not-found.png"}
            alt=""
            height={200}
            width={200}
            className="w-full max-h-[140px] object-contain"
            onClick={() => fileRef.current.click()}
          />
          : <div onClick={() => fileRef.current.click()} className="h-[140px] text-[var(--accent-1)] flex flex-col items-center justify-center">
            <ImagePlus size={24} className="mb-2" />
            <span>Add Image</span>
          </div>}
      </div>
    </div>

    <SelectWorkouts />

    <div className="mt-4">
      <p className="font-bold mb-2">Instructions</p>
      <Textarea
        value={state.instructions}
        onChange={e => dispatch(changeFieldValue("instructions", e.target.value))}
        placeholder="Enter instructions here (Optional)"
        className="resize-none h-[140px]"
      />
    </div>
    <Button disabled={loading} className="mt-5" variant="wz" onClick={saveWorkout}>Save</Button>
    <DialogClose ref={closeBtnRef} />
  </div>
}

function SelectWorkouts() {
  const [query, setQuery] = useState("");
  const { dispatch, workouts } = useCurrentStateContext();

  const { isLoading, error, data } = useSWR("app/coach/getAllWorkoutItems", getAllWorkoutItems);

  const closeBtnRef = useRef();

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const workoutItems = data.data.filter(workout => workout.title.toLowerCase().includes(query.toLowerCase()));

  const set = new Set(workouts)

  return <Dialog>
    <DialogTrigger className="w-full text-left p-0">
      <div className="mt-4">
        <div className="flex justify-between gap-4">
          <p className="font-bold mb-2">Select Workouts</p>
          <p>{workouts.length} selected!</p>
        </div>
        <div className="h-[140px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-4 relative">
          <PlusCircle size={24} className="text-[var(--accent-1)] mb-2" />
          <p className="text-[var(--accent-1)]">Add Workout</p>
        </div>
      </div>
    </DialogTrigger>
    <DialogContent className="h-[70vh] p-0 overflow-y-auto block">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Select Workouts</DialogTitle>
      </DialogHeader>
      <div className="m-4">
        <FormControl
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search"
        />
      </div>
      <div className="px-4 py-0">
        <p className="mb-2">{workoutItems.length} items found!</p>
        {workoutItems.map(item => <div key={item._id} className="flex items-start gap-2 mb-4">
          <input
            checked={set.has(item._id)}
            type="checkbox"
            className="h-[20px] w-[20px] mt-2"
            id={item._id}
            onChange={() => set.has(item._id)
              ? dispatch(changeFieldValue("workouts", workouts.filter(workout => workout !== item._id)))
              : dispatch(changeFieldValue("workouts", [...workouts, item._id]))}
          />
          <label htmlFor={item._id} className="text-sm grow">
            <Image
              src={item?.thumbnail?.trim() || "/not-found.png"}
              alt=""
              width={40}
              height={40}
              unoptimized
              onError={e => e.target.src = "/not-found.png"}
              className="w-full h-[140px] object-contain rounded-lg border-1"
            />
          </label>
        </div>)}
      </div>
      <div className="bg-white p-4 sticky bottom-0">
        <Button onClick={() => closeBtnRef.current.click()} className="w-full">Done</Button>
      </div>
      <DialogClose ref={closeBtnRef} />
    </DialogContent>
  </Dialog>
}