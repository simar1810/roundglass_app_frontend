import ClientListMembership from "@/components/pages/coach/client/ClientListMembership";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";

export default function Page() {
  return <div className="content-container">
    <div className="pb-4 flex items-center gap-2 border-b-1">
      <h4>Membership</h4>
      <Button className="ml-auto" size="sm" variant="wz_outline">
        <Forward className="w-[16px]" />
        Membership Form
      </Button>
      <Button size="sm" variant="wz">
        Request Membership
      </Button>
    </div>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 divide-y-1">
      {Array.from({ length: 10 }, (_, i) => i).map(item => <ClientListMembership key={item} />)}
    </div>
  </div>
}