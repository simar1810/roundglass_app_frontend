"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/formatter"
import { useState } from "react"
import FormControl from "@/components/FormControl"
import DualOptionActionModal from "@/components/modals/DualOptionActionModal"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { sendData } from "@/lib/api"
import { toast } from "sonner"
import { useAppSelector } from "@/providers/global/hooks"
import ContentError from "@/components/common/ContentError"
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import { retrieveDownlineCoaches, retrieveDownlineRequests } from "@/lib/fetchers/app"
import Link from "next/link"

export default function Page() {
  const { downline = {}, features } = useAppSelector(state => state.coach.data);

  if (
    features?.includes[3]
  ) return <ContentError title="This feature isn't enabled for you" />
  if (!["requested", "in-downline"].includes(downline?.status)) return <div className="content-height-screen content-container flex items-center justify-center">
    <StartDownline />
  </div>
  return <div className="content-container content-height-screen">
    {downline.status === "requested" && <Invitations />}
    {downline.status === "in-downline" && <div className="grid grid-cols-2 gap-x-4">
      <CreateInvitation />
      <CoachesList />
    </div>}
  </div>
}

function Invitations() {
  const { isLoading, error, data } = useSWR("app/downline", () => retrieveDownlineRequests());

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const invitations = data?.data || [];

  if (invitations.length === 0) return <></>

  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h4 className="!text-[28px]">Invitations</h4>
      <StartDownline />
    </div>
    {invitations.map((invitation, index) => <Card
      className="w-full max-w-md bg-[var(--comp-1)] border-2 border-[var(--accent-1)] rounded-lg p-0"
      key={index}
    >
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-md overflow-hidden">
            <Avatar className="h-[60px] w-[60px] border-1">
              <AvatarImage src={invitation.profilePhoto} />
              <AvatarFallback>{nameInitials(invitation.name)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">
              {invitation.name} <span className="text-gray-500 text-sm">#{invitation.coachId}</span>
            </h2>
            <p className="text-sm text-gray-600">{invitation.email}</p>
            <p className="text-sm text-gray-600">{invitation.mobileNumber}</p>
            {/* <p className="text-sm text-gray-600">
            No. of coaches in team: <span className="font-medium">20</span>
          </p> */}
          </div>
        </div>
        <hr />
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Respond to this Invitation</p>
          <div className="flex gap-2">
            <ActionOnRequest actionType="ACCEPT_INVITE" coachId={invitation._id}>
              <Button variant="default" className="bg-green-500 hover:bg-green-600">
                Confirm
              </Button>
            </ActionOnRequest>
            <ActionOnRequest actionType="DECLINE_INVITE" coachId={invitation._id}>
              <Button variant="default" className="bg-red-500 hover:bg-red-600">
                Decline
              </Button>
            </ActionOnRequest>
          </div>
        </div>
      </CardContent>
    </Card>)}
  </div>
}

function CreateInvitation() {
  const [coachId, setCoachId] = useState("")
  return (
    <div className="bg-[var(--comp-2)] w-full grow px-4 py-8 border-1 rounded-[8px]">
      <h4 className="mb-4">Invite a Coach</h4>
      <div className="flex flex-col gap-4">
        <FormControl
          type="text"
          placeholder="Enter Coach ID"
          value={coachId}
          onChange={(e) => setCoachId(e.target.value)}
          className="h-12"
        />
        {coachId.length > 0 && <ActionOnRequest coachId={coachId} actionType="INVITE">
          <Button
            variant="wz"
            className="max-w-xs w-full mx-auto"
          >
            Invite Coach
          </Button>
        </ActionOnRequest>}
      </div>
    </div>
  )
}

function CoachesList() {
  const { isLoading, error, data } = useSWR("app/downline/coaches", retrieveDownlineCoaches);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error?.message || data.message} />

  const coaches = data?.data || [];
  return <div className="bg-[var(--comp-1)] px-4 py-8 rounded-[8px] space-y-2 border-1">
    <h4 className="mb-4">Coaches under You {coaches.length}</h4>
    <div className="divide-y-1">
      {coaches.map((coach, index) => <Link
        key={index}
        href={`/coach/downline/coach/${coach._id}`}
        className="w-full flex items-center justify-between p-2 hover:bg-white [var(--comp-2)]"
      >
        <div className="flex items-center gap-3">
          <Avatar className="rounded-[8px] w-12 h-12 border-1">
            <AvatarImage src={coach.profilePhoto} alt="Symond Write" />
            <AvatarFallback className="rounded-[8px]">{nameInitials(coach.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-base">{coach.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* <Badge className="bg-green-500 hover:bg-green-600">Active</Badge> */}
          {/* <EllipsisVertical className="w-5 h-5 text-gray-500 cursor-pointer" /> */}
        </div>
      </Link>)}
    </div>
    {coaches.length === 0 && <div className="h-[150px] flex items-center justify-center">
      No coach under you!
    </div>}
  </div>
}

function StartDownline() {
  async function startDownline(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData("app/downline/requests", {}, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    asChild
    description="Are you sure to start your downline?"
    action={(setLoading, btnRef) => startDownline(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      <Button variant="wz">Start Downline</Button>
    </AlertDialogTrigger>
  </DualOptionActionModal>
}

function ActionOnRequest({
  children,
  actionType,
  coachId
}) {
  async function actionOnRequest(setLoading) {
    try {
      setLoading(true);
      const response = await sendData("app/downline/requests", { actionType, coachId }, "PATCH");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      location.reload()
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    action={(setLoading, btnRef) => actionOnRequest(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      {children}
    </AlertDialogTrigger>
  </DualOptionActionModal>
}