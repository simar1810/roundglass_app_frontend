import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { FolderInput, FolderOutput, Forward } from "lucide-react";

export default function FreeTrialCustomerHeader() {
  return <>
    <div className="mb-4 flex items-center gap-4">
      <h4>Free Trial</h4>
      <FormControl
        className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
        placeholder="Search Client.."
      />
      <Button size="sm" variant="wz">
        <Forward />
        Onboarding Form
      </Button>
    </div>
    <div className="py-4 flex items-center justify-end gap-2 border-t-1">
      <Button size="sm" variant="wz_outline">
        <FolderInput />
        Import Data
      </Button>
      <Button size="sm" variant="wz_outline">
        <FolderOutput />
        Export Data
      </Button>
      <Button size="sm" variant="wz_outline">
        Demo
      </Button>
    </div>
  </>
}