"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import NoData from "@/components/common/NoData";
import FormControl from "@/components/FormControl";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import AddNoteModal from "@/components/modals/tools/AddNoteModal";
import UpdateNoteModal from "@/components/modals/tools/UpdateNoteModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import useDebounce from "@/hooks/useDebounce";
import { getNotes } from "@/lib/fetchers/app";
import { PenLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

export default function Page() {
  const { isLoading, error, data } = useSWR("app/getNotes", getNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const notes = data.data.filter(note => note.title.includes(debouncedSearchQuery));

  if (notes.length === 0) return <div className="content-container content-height-screen flex flex-col items-center justify-center">
    <NotesPageHeader setSearchQuery={setSearchQuery} />
    <div className="my-auto">
      <NoData message="No Notes Available" />
    </div>
  </div>

  return <div className="content-container content-height-screen">
    <NotesPageHeader setSearchQuery={setSearchQuery} />
    <div className="grid grid-cols-3 gap-4">
      {notes.map(note => <Note
        key={note._id}
        note={note}
      />)}
    </div>
  </div>
}

function NotesPageHeader({ setSearchQuery }) {
  return <div className="w-full mb-4 flex items-center gap-4">
    <h4>Notes</h4>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
      placeholder="Search Notes.."
      onChange={e => setSearchQuery(e.target.value)}
    />
    <AddNoteModal />
  </div>
}

function Note({ note }) {
  const [loading, setLoading] = useState(false);

  async function deleteNote(
    setLoading,
    closeBtnRef
  ) {
    try {
      setLoading(true);
      throw new Error("cannot delete the note!")
      const response = await sendData(`app/updateClientActiveStatus?id=${_id}&status=${status}`, {}, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate(`clientDetails?id=${_id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Card className="bg-[#FFD8F4] shadow-none py-2 px-0 gap-0">
    <CardHeader>
      <CardTitle className="text-[24px]">{note.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="leading-[1]">{note.description}</p>
      <div className="my-2 flex gap-2">
        <UpdateNoteModal
          title={note.title}
          description={note.description}
          _id={note._id}
        />
        <DualOptionActionModal
          description="You are deleting a note"
          action={(setLoading, btnRef) => deleteNote(setLoading, btnRef)}
        >
          <AlertDialogTrigger>
            <Trash2 className="w-[28px] h-[28px] text-white bg-[var(--accent-2)] p-1 rounded-[8px]" />
          </AlertDialogTrigger>
        </DualOptionActionModal>
      </div>
    </CardContent>
  </Card>
}