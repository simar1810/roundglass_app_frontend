import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Pen } from "lucide-react";

export default function EditMeetingModal() {
  return <Dialog>
    <DialogTrigger>
      <Pen className="w-[16px]" />
    </DialogTrigger>
    <DialogContent className="!max-w-[450px] border-0 p-0 overflow-auto">
      <DialogHeader className="bg-[#FBFBFB] py-6 h-[56px] border-b-1">
        <DialogTitle className="text-black text-[20px] ml-5">
          Zoom Connection
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-[20px] font-bold border-b-1 px-4 mt-10">Zoom not Connected</p>
        <div className="w-[80px] h-[80px] text-center text-white font-semibold leading-[80px] rounded-[8px] bg-blue-600 mt-10 mb-4">zoom</div>
        <button className="text-[#004FFE] font-semibold px-4 py-2 rounded-[12px] border-2 border-[#004FFE] mb-20">Connect Now</button>
      </div>
    </DialogContent>
  </Dialog>
}