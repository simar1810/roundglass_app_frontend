import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "../FormControl";
import Image from "next/image";

export default function AddPostModal() {
  return (
    <Dialog>
      <DialogTrigger className="bg-[var(--accent-1)] text-white font-bold px-4 py-2 rounded-full">
        Add Post
      </DialogTrigger>

      <DialogContent className="!max-w-[500px] h-[550px] border-0 p-0 overflow-auto">
        <DialogHeader className="bg-gray-300 py-4 h-[50px]">
          <DialogTitle className="text-black text-sm ml-5">
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="flex gap-[100px] mb-4">
            <FormControl
              type="radio"
              name="postType"
              value="image"
              label="Image"
            />
            <FormControl
              type="radio"
              name="postType"
              value="video"
              label="Video"
            />
          </div>

          <div className="border rounded-lg flex flex-col items-center justify-center h-40 mb-4 cursor-pointer h-[182px]">
            <Image
              src="/icons/add-image.svg"
              width={50}
              height={50}
              alt="Add Image"
            />
            <p className="text-sm text-gray-500">Add </p>
          </div>
          <div className="mb-10">
            <FormControl
              label="Caption"
              type="text"
              placeholder="Write something..."
              className="mb-4"
            />
          </div>
          <p className="text-sm font-semibold mb-2">Select Community</p>
          <div className="grid grid-cols-1 gap-2 mb-3 border p-2 rounded-md">
            <FormControl
              type="radio"
              name="community"
              value="global"
              label="Global Community"
            />
            <FormControl
              type="radio"
              name="community"
              value="personal"
              label="Personal Community"
            />
          </div>

          <button
            className="bg-gray-400 text-white font-bold w-full px-4 py-2 rounded cursor-not-allowed"
            disabled
          >
            Post
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
