import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import StoryModal from "./StoryModal";
import AddStoryModal from "@/components/modals/app/AddStoryModal";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ClockFading, X } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { sendData } from "@/lib/api";

export default function Stories({ stories }) {
  const [currentStory, setCurrentStory] = useState(0);
  const [modalOpened, setModalOpened] = useState(false);

  return <div className="mt-8">
    <h4 className="mb-4">Results</h4>
    <div className="max-w-[calc(100vw-204px-64px)] flex items-center gap-2 no-scrollbar">
      <AddStoryModal />
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {stories.map((story, index) => <div key={story._id} className="relative hover:[&_.close]:text-[var(--accent-2)]">
          <DeleteStory id={story._id} />
          <Avatar
            className="w-[64px] h-[64px] border-2 border-[var(--accent-1)] cursor-pointer"
            onClick={() => {
              setCurrentStory(index)
              setModalOpened(true)
            }}
          >
            <AvatarImage src={story.img1} />
            <AvatarFallback className="bg-[var(--accent-1)] text-white">SN</AvatarFallback>
          </Avatar>
        </div>)}
      </div>
      {modalOpened && <StoryModal
        story={stories[currentStory]}
        currentStory={currentStory}
        setCurrentStory={setCurrentStory}
        isLast={stories.length === currentStory + 1}
        onClose={() => setModalOpened(false)}
      />}
    </div>
  </div>
}

function DeleteStory({ id }) {
  async function deleteStory(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData(`app/delete-story/${id}`, {}, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("coachHomeTrial");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <DualOptionActionModal
    description="Are you sure to delete this result?"
    action={(setLoading, closeBtnRef) => deleteStory(setLoading, closeBtnRef)}
  >
    <AlertDialogTrigger className="absolute top-[2px] right-[2px] z-10">
      <X className="w-[16px] h-[16px] close" strokeWidth={3} />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}