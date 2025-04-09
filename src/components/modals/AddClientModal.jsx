import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export default function AddClientModal() {
  return <Dialog>
    <DialogTrigger className="bg-green-600 text-white font-bold px-4 py-2 rounded-full">Add Client</DialogTrigger>
    <DialogContent className="!max-w-[400px] border-0 p-0 overflow-clip">
      <DialogHeader className="bg-[var(--accent-1)] py-6 ">
        <DialogTitle className="text-center text-white">Add Client</DialogTitle>
      </DialogHeader>
      <div className="p-6 pt-0">
        <h2 className="!font-semibold mb-4">How would you like to Calculate Metrics</h2>
        <button className="w-full bg-[#F5F5F5] py-4 rounded-full mb-3 border-1 border-[var(--accent-1)]">With Machine</button>
        <button className="w-full bg-[#F5F5F5] py-4 rounded-full mb-40 border-1 border-[var(--accent-1)]">Without Machine</button>

        <button className="bg-[var(--accent-1)] text-white font-bold w-full text-center px-4 py-3 rounded-[4px]">Continue</button>
      </div>
    </DialogContent>
  </Dialog>
}