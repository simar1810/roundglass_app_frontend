import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendData } from "@/lib/api";
import { getSyncedCoachesClientList } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import { useAppSelector } from "@/providers/global/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import AddSubscriptionModal from "../club/AddSubscriptionModal";


export default function SyncedCoachesModal({ coachId }) {
  return <Dialog>
    <DialogTrigger>
      <Badge variant="wz_fill">Clients</Badge>
    </DialogTrigger>
    <DialogContent className="!max-w-[850px] text-center border-0 px-4 overflow-auto gap-0">
      <DialogTitle className="text-[24px] mb-4">All Clients</DialogTitle>
      <ClientsContainer coachId={coachId} />
    </DialogContent>
  </Dialog>
}

function ClientsContainer({ coachId }) {
  const { isLoading, error, data } = useSWR(`sync-coach/super/client${coachId}`, () => getSyncedCoachesClientList(coachId));
  if (isLoading) return <ContentLoader />

  if (error || !data?.success) return <ContentError title={error || data?.message} />
  const clients = data.data;
  return <div className="mt-8 grid grid-cols-2 gap-4">
    {clients.map((client) => <SyncedCoachClientDetails
      client={client}
      key={client._id}
    />)}
  </div>
}

function SyncedCoachClientDetails({ client }) {
  const [formData, setFormData] = useState({ ...client, client_doc_id: client._id });
  const [loading, setLoading] = useState(false);

  const closeBtnRef = useRef()

  async function udpateDetails() {
    try {
      setLoading(true);
      const data = {}
      for (const key in formData) {
        if (formData[key]) data[key] = formData[key]
      }
      const response = await sendData(`app/sync-coach/super/client`, data, "PUT");
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      mutate(`sync-coach/super/client${client.coachId}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger>
      <div className="bg-[var(--comp-2)] border-1 rounded-[4px] mb-1 px-4 py-2 flex items-center gap-4">
        <Avatar className="w-[36px] h-[36px] !rounded-[8px]">
          <AvatarImage className="rounded-[8px]" src={client.profilePhoto} />
          <AvatarFallback className="rounded-[8px]">{nameInitials(client.name)}</AvatarFallback>
        </Avatar>
        <p className="text-[14px] font-semibold">{client.name}</p>
      </div>
    </DialogTrigger>
    <DialogContent className="!max-w-[850px] w-full">
      <DialogTitle className="!text-[32px]">{client.name}</DialogTitle>
      <div className="grid grid-cols-2 items-end gap-y-2 gap-x-4">
        <FormControl
          label="Client Name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="[&_.label]:text-[14px]"
          placeholder="Please fill the detail!"
        />
        <FormControl
          label="Roll No"
          value={formData.rollno}
          onChange={e => setFormData(prev => ({ ...prev, rollno: e.target.value }))}
          className="[&_.label]:text-[14px]"
          placeholder="Please fill the detail!"
        />
        <FormControl
          label="Client ID"
          value={formData.clientId}
          onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
          className="[&_.label]:text-[14px]"
          placeholder="Please fill the detail!"
        />
        <DialogClose ref={closeBtnRef} />
      </div>
      <div className="flex gap-4">
        <Button
          disabled={loading}
          onClick={udpateDetails}
          variant="wz_outline"
        >
          Save
        </Button>
        <AddSubscriptionModal _id={client._id} />
      </div>
    </DialogContent>
  </Dialog>
}