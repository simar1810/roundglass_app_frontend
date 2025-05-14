import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger
} from "@/components/ui/menubar";
import {
  ChevronDown,
  EllipsisVertical,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { nameInitials } from "@/lib/formatter";
import { clientPortfolioFields } from "@/config/data/ui";
import UpdateClientGoalModal from "@/components/modals/client/UpdateClientGoalModal";
import UpdateClientDetailsModal from "@/components/modals/client/UpdateClientDetailsModal";
import DeleteClientModal from "@/components/modals/client/DeleteClientModal";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { mutate } from "swr";
import { sendData } from "@/lib/api";
import FollowUpModal from "@/components/modals/client/FollowUpModal";
import UpdateClientNotesModal from "@/components/modals/client/UpdateClientNotesModal";

export default function ClientDetailsCard({ clientData }) {
  return <Card className="bg-white rounded-[18px] shadow-none">
    <Header clientData={clientData} />
    <CardContent>
      <div className="flex items-center justify-between">
        <h4>Goal</h4>
        <UpdateClientGoalModal
          id={clientData._id}
          defaultValue={clientData.goal}
        />
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2 mb-4">{clientData.goal}</p>
      <div className="flex items-center justify-between">
        <h4>Notes</h4>
        <UpdateClientNotesModal
          id={clientData._id}
          defaultValue={clientData.notes}
        />
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2">{clientData.notes}</p>
      <div className="mt-4">
        <FollowUpModal clientData={clientData} />
      </div>
      <div className="mt-4 p-4 rounded-[10px] border-1">
        <div className="font-semibold pb-2 flex items-center gap-6 border-b-1">
          <div>
            <p className="text-[var(--accent-1)]">122</p>
            <p>Steps</p>
          </div>
          <div>
            <p className="text-[var(--accent-1)]">1543</p>
            <p>Calories</p>
          </div>
          <Image
            src="/svgs/circle-embedded.svg"
            height={64}
            width={64}
            alt=""
            className="ml-auto"
          />
        </div>
        <p className="text-[var(--dark-1)]/25 text-[12px] font-semibold mt-2">Last 7 Days</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h4>Personal Information</h4>
        <UpdateClientDetailsModal clientData={clientData} />
      </div>
      <div className="mt-4 pl-4">
        {clientPortfolioFields.map(field => <div key={field.id} className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
          <p>{field.title}</p>
          <p className="text-[var(--dark-2)] col-span-2">:&nbsp;{clientData[field.name]}</p>
        </div>)}
      </div>
    </CardContent>
  </Card>
}

function Header({ clientData }) {
  return <CardHeader className="relative flex items-center gap-4 md:gap-8">
    <Avatar className="w-[100px] h-[100px]">
      <AvatarImage src={clientData.profilePhoto} />
      <AvatarFallback>{nameInitials(clientData.name)}</AvatarFallback>
    </Avatar>
    <div>
      <h3 className="mb-2">{clientData.name}</h3>
      <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1] mb-2">ID #{clientData.clientId}</p>
      <ClientStatus
        status={clientData.isActive}
        _id={clientData._id}
      />
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="!absolute top-0 right-4">
        <EllipsisVertical className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-[14px] font-semibold">
        <DeleteClientModal _id={clientData._id} />
      </DropdownMenuContent>
    </DropdownMenu>
  </CardHeader>
}

function ClientStatus({
  status,
  _id
}) {
  async function changeStatus(
    setLoading,
    closeBtnRef,
    status
  ) {
    try {
      setLoading(true);
      const response = await sendData(`app/updateClientActiveStatus?id=${_id}&status=${status}`, {}, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate(`clientDetails?id=${_id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <Menubar className="p-0 border-0 shadow-none">
    <MenubarMenu className="p-0">
      <MenubarTrigger className={`${status ? "bg-[var(--accent-1)] hover:bg-[var(--accent-1)]" : "bg-[var(--accent-2)] hover:bg-[var(--accent-2)]"} text-white font-bold py-[2px] px-2  text-[12px] gap-1`}>
        {status ? <>Active</> : <>In Active</>}
        <ChevronDown className="w-[18px]" />
      </MenubarTrigger>
      <MenubarContent sideOffset={10} align="center">
        {status
          ? <DualOptionActionModal
            description="Are you sure to change the status of the client"
            action={(setLoading, btnRef) => changeStatus(setLoading, btnRef, false)}
          >
            <AlertDialogTrigger className="font-semibold text-[14px] text-[var(--accent-2)] pl-4 py-1 flex items-center gap-2">Inactive</AlertDialogTrigger>
          </DualOptionActionModal>
          : <DualOptionActionModal
            description="Are you sure to change the status of the client"
            action={(setLoading, btnRef) => changeStatus(setLoading, btnRef, true)}
          >
            <AlertDialogTrigger className="font-semibold text-[14px] text-[var(--accent-1)] pl-4 py-1 flex items-center gap-2">Active</AlertDialogTrigger>
          </DualOptionActionModal>}
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
}