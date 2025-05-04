import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useState } from "react";
import StoryModal from "./StoryModal";

export default function Stories({ stories }) {
  const [currentStory, setCurrentStory] = useState(0);
  const [modalOpened, setModalOpened] = useState(false);

  return <div className="mt-8">
    <h4 className="mb-4">Results</h4>
    <div className="max-w-[calc(100vw-204px-64px)] flex items-center gap-2 no-scrollbar">
      <div className="min-w-[64px] h-[64px] border-2 border-[var(--accent-1)] relative rounded-full">
        <Avatar className="w-full h-full p-3">
          <AvatarImage src="/logo.png" />
        </Avatar>
        <Plus className="w-[18px] h-[18px] bg-black text-white absolute bottom-0 right-0 rounded-full" />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {stories.map((story, index) => <Avatar
          key={story._id}
          className="w-[64px] h-[64px] border-2 border-[var(--accent-1)] cursor-pointer"
          onClick={() => {
            setCurrentStory(index)
            setModalOpened(true)
          }}
        >
          <AvatarImage src={story.img1} />
          <AvatarFallback className="bg-[var(--accent-1)] text-white">SN</AvatarFallback>
        </Avatar>)}
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