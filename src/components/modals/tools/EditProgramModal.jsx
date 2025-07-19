import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { programInitialState } from "@/config/state-data/program";
import { changeProgramFieldValue, generateProgramIS, generateProgramRP, programReducer } from "@/config/state-reducers/program";
import { sendData, sendDataWithFormData } from "@/lib/api";
import { getObjectUrl } from "@/lib/utils";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Pencil, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function EditProgramModal({ program }) {
  return <Dialog>
    <DialogTrigger>
      <Pencil className="w-[16px] h-[16px]" />
    </DialogTrigger>
    <DialogContent className="p-0 gap-0 max-h-[75vh] overflow-y-auto">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Edit Program</DialogTitle>
      </DialogHeader>
      <CurrentStateProvider
        state={generateProgramIS(program)}
        reducer={programReducer}
      >
        <ProgramContainer />
      </CurrentStateProvider>
    </DialogContent>
  </Dialog>
}

function ProgramContainer() {
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();
  const closeBtnRef = useRef()
  const fileRef = useRef();

  async function updateProgram() {
    try {
      setLoading(true);
      const data = generateProgramRP(state)
      for (const [field, value] of data.entries()) {
        console.log(field, value)
      }
      const response = await sendDataWithFormData("app/programs", data, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("client/programs");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <div className="px-4 py-6">
    <FormControl
      label="Title"
      value={state.name}
      onChange={e => dispatch(changeProgramFieldValue("name", e.target.value))}
      className="block mt-2"
    />
    <FormControl
      label="Link "
      value={state.link}
      onChange={e => dispatch(changeProgramFieldValue("link", e.target.value))}
      className="block mt-2"
    />
    <div className="relative">
      <Image
        src={state.file ? getObjectUrl(state.file) : state.defaultImage || "/not-found.png"}
        alt=""
        height={500}
        width={500}
        className="w-full aspect-video mt-4 border-1 object-contain"
        onClick={() => fileRef.current.click()}
      />
      {state.file && <X
        className="absolute top-4 right-4 cursor-pointer"
        onClick={() => dispatch(changeProgramFieldValue("file", ""))}
      />}
    </div>
    <input
      type="file"
      hidden
      ref={fileRef}
      onChange={e => dispatch(changeProgramFieldValue("file", e.target.files[0]))}
    />
    <Button onClick={updateProgram} disabled={loading} variant="wz" className="mt-8 w-full">Save</Button>
    <DialogClose ref={closeBtnRef} />
  </div>
}