import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


export default function PersonalBranding() {
  return <Dialog>
    <DialogTrigger>
      App personalisation
    </DialogTrigger>
    <DialogContent className="!max-w-[400px] w-full max-h-[70vh] border-0 p-0 overflow-auto">
      <DialogHeader className="bg-[var(--comp-1)] p-4 border-b-1">
        <DialogTitle className="">
          App Personalization
        </DialogTitle>
      </DialogHeader>
      <div className="p-4"></div>
    </DialogContent>
  </Dialog>
}