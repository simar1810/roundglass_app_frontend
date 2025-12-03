import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useCurrentStateContext, {
  CurrentStateProvider,
} from "@/providers/CurrentStateContext";
import { differenceInYears, parse } from "date-fns";
import { addTask, changeField, changeSubmissionReuirements, deleteTask, generatePayload, init, newMarathonReducer, selectTask } from "@/config/state-reducers/new-marathon";
import useSWR, { mutate } from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { getMarathonTaskOptions } from "@/lib/fetchers/app";
import FormControl from "@/components/FormControl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { sendData } from "@/lib/api";

export default function CreateMarathonModal({
  children,
  type,
  data
}) {
  return <Dialog>
    {children}
    {!Boolean(children) && <DialogTrigger className="bg-[var(--accent-1)] text-[var(--primary-1)] text-[14px] font-semibold px-3 py-2 rounded-[8px]">
      Add
    </DialogTrigger>}
    <DialogContent className="!max-w-[650px] max-h-[70vh] border-b-1 mb-0 p-0 gap-0 overflow-y-auto">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle className="text-[24px]">Create Marathon</DialogTitle>
      </DialogHeader>
      <CurrentStateProvider
        state={init(type, data)}
        reducer={newMarathonReducer}
      >
        <MarathonContainer />
      </CurrentStateProvider>
    </DialogContent>
  </Dialog>
}

async function generateLink(data, type) {
  if (type === "update") {
    return await sendData("app/marathon/coach/editMarathon", data, "PUT");
  } else {
    return await sendData("app/marathon/coach/createMarathon", data);
  }
}

function MarathonContainer() {
  const [loading, setLoading] = useState(false);
  const { isLoading, error, data } = useSWR("app/marathon/task-options", getMarathonTaskOptions);

  const { dispatch, ...state } = useCurrentStateContext()

  const closeBtnRef = useRef(null);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const tasks = data.data;
  async function createMaraton() {
    try {
      setLoading(true);
      const data = generatePayload(state);
      const response = await generateLink(data, state.type)
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("app/getMarathons");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const listTasks = tasks
  // .filter(task => task.title.includes(state.title))

  return <div className="p-4 pb-0">
    <FormControl
      label="Title"
      value={state.title}
      placeholder="Enter title"
      onChange={e => dispatch(changeField("title", e.target.value))}
    />
    {listTasks.map(task => <TaskDetails key={task._id} task={task} />)}
    <div className="bg-[var(--primary-1)] pb-4 sticky bottom-0">
      <Button
        variant="wz"
        className="w-full mt-4"
        onClick={createMaraton}
        disabled={loading}
      >
        Save
      </Button>
    </div>
    <DialogClose ref={closeBtnRef} />
  </div>
}
export const DeleteMarathonTasks = () => {
  const [open, setOpen] = useState(false);
  const { isLoading, error, data, mutate } = useSWR(
    "app/marathon/task-options",
    getMarathonTaskOptions
  );

  const tasks = data?.data || [];

  const handleDelete = async (id) => {
    try {
      const res = await sendData("app/marathon/coach/task-options", {taskId: id} ,"DELETE");
      if (res.status_code !== 200) {
        console.log(res);
        toast.error(res.message);
        return;
      }
      toast.success("Task deleted!");
      mutate();
    } catch (err) {
      toast.error("Error deleting task");
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-red-400 cursor-pointer text-white text-base font-normal rounded-md border border-red-500 px-2 py-1"
      >
        <p>Delete Tasks</p>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[500px] rounded-xl shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delete Marathon Tasks</h2>
              <button
                className="text-gray-500 text-lg font-normal"
                onClick={() => setOpen(false)}
              >
                ✖
              </button>
            </div>
            {isLoading && <p className="text-gray-600">Loading...</p>}
            {error && <p className="text-red-500">Failed to load tasks</p>}

            <div className="max-h-[450px] overflow-y-auto no-scrollbar space-y-3 pr-2">
              {tasks.length === 0 ? (
                <p className="text-gray-500">No tasks found</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task._id}
                    className="border border-gray-200 rounded-md p-3 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(task._id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
function TaskDetails({ task }) {
  const { tasks, selected, dispatch } = useCurrentStateContext();

  const isTaskSelected = selected.includes(task._id)
  const currentTask = tasks.find(current => current._id === task._id);
  return <div className="mt-4 p-4 flex items-start gap-4 border-1 rounded-[8px]">
    <Input
      type="checkbox"
      className="h-auto w-fit mt-1"
      checked={isTaskSelected}
      onChange={() => !isTaskSelected
        ? dispatch(addTask(task))
        : dispatch(deleteTask(task._id))}
    />
    <div>
      <h3>{task.title}</h3>
      <p className="text-[var(--dark-1)]/25 text-[12px]">{task.description}</p>
      <div className="text-[var(--dark-1)]/25 text-[12px] mt-2 flex gap-10">
        {task.photoSubmission && <div className="flex gap-2">
          <Input
            type="checkbox"
            className="h-auto w-fit"
            checked={Boolean(currentTask) ? currentTask.photoSubmission : false}
            onChange={() => isTaskSelected
              ? dispatch(changeSubmissionReuirements(task._id, "photoSubmission", !currentTask.photoSubmission))
              : toast.error("Please select the task first")}
          />
          Photo Required
        </div>}
        {task.videoSubmission && <div className="flex gap-2">
          <Input
            type="checkbox"
            className="h-auto w-fit"
            checked={Boolean(currentTask) ? currentTask.videoSubmission : false}
            onChange={() => Boolean(isTaskSelected)
              ? dispatch(changeSubmissionReuirements(task._id, "videoSubmission", !currentTask.videoSubmission))
              : toast.error("Please select the task first")} />
          Video Required
        </div>}
      </div>
    </div>
  </div>
}