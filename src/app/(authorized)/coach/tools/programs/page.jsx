"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import EditProgramModal from "@/components/modals/tools/EditProgramModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sendData } from "@/lib/api";
import { getClientPrograms } from "@/lib/fetchers/app";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function Page() {
  const { isLoading, error, data } = useSWR("client/programs", getClientPrograms);
  if (isLoading) return <ContentLoader />
  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const programs = data.data;
  return <div className="content-container content-height-screen">
    <div className="mb-10 flex items-center justify-between">
      <h2>Programs</h2>
      <Link href="/coach/tools/programs/add" className="bg-green-700 text-white px-4 py-2 rounded-[10px] font-bold">Add</Link>
    </div>
    <div className="grid grid-cols-4 gap-4">
      {programs.map((program, index) => <div
        key={index}
        className="bg-[var(--comp-1)] rounded-[10px] border-1 overflow-clip hover:[&_.actions]:opacity-100"
      >
        <div className="relative">
          <div className="bg-white px-2 py-1 rounded-[10px] border-1 actions absolute bottom-2 right-2 opacity-0 flex items-center gap-1">
            <EditProgramModal program={{ ...program, order: index }} />
            <DeleteProgramAction id={program._id} />
          </div>
          <Image
            src={program.image || "/"}
            alt=""
            height={400}
            width={400}
            className="h-auto aspect-video object-cover"
          />
        </div>
        <div className="p-4">
          <h2>{program.name}</h2>
          <Link href={program.link} target="_blank" className="text-green-700 text-[14px] hover:text-underline font-bold">Open Link</Link>
        </div>
      </div>)}
    </div>
  </div>
}

function DeleteProgramAction({ id }) {
  async function deleteProgramAction(setLoading, btnRef) {
    try {
      setLoading(true);
      const response = await sendData("app/programs", { programId: id }, "DELETE");
      console.log(response)
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("client/programs");
      btnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    action={(setLoading, btnRef) => deleteProgramAction(setLoading, btnRef)}
    description="Are you sure to delete this program?"
  >
    <AlertDialogTrigger>
      <Trash2 className="text-[var(--accent-2)] cursor-pointer w-[18px] h-[18px]" />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}