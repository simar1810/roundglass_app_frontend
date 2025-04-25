import FormControl from "@/components/FormControl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Page() {
  return <div className="content-container">
    <NotesPageHeader />
  </div>
}

function NotesPageHeader() {
  return <div className="mb-4 flex items-center gap-4">
    <h4>Notes</h4>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
      placeholder="Search Notes.."
    />
    <Button size="sm" variant="wz">
      <Plus />
      Create New
    </Button>
  </div>
}