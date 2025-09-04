import ContentError from "@/components/common/ContentError"
import ContentLoader from "@/components/common/ContentLoader"
import ScheduleNotificationWrapper from "@/components/modals/client/ScheduleNotification"
import DualOptionActionModal from "@/components/modals/DualOptionActionModal"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { sendData } from "@/lib/api"
import { retrieveClientNudges } from "@/lib/fetchers/app"
import { cn } from "@/lib/utils"
import { Pen, Trash2 } from "lucide-react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

export default function ClientNudges() {
  const { id } = useParams()
  const { isLoading, data, error } = useSWR(`client/nudges/${id}`, () => retrieveClientNudges(id, { limit: Infinity }))

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error.message || data.message} />
  const notifications = data?.data?.results || []

  return <div className="bg-white border-1 p-4 mt-8 rounded-[16px]">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h4>Client Nudges</h4>
        <p className="text-sm text-[#808080]">{notifications.length} total</p>
      </div>
      <ScheduleNotificationWrapper selectedClients={[id]}>
        <Button variant="wz">
          Add
        </Button>
      </ScheduleNotificationWrapper>
    </div>
    <div>
      {notifications.map(notification => <NotificationItem
        key={notification._id}
        item={notification}
      />)}
      {notifications.length === 0 && <Card className="p-6 text-center text-muted-foreground">
        No notifications found.
      </Card>}
    </div>
  </div>
}

export function NotificationItem({ item = {} }) {
  const { id } = useParams()
  const { _id, message, subject, isRead, notificationType, schedule_type } = item;
  return (
    <Card
      className={cn("p-4 md:px-4 md:py-2 mb-2 bg-[var(--comp-2)]", !isRead && "border-primary/20 ring-1 ring-primary/20")}
      role="article"
      aria-labelledby={`notif-${_id}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {!isRead ? (
              <Badge variant="outline" className="text-[8px] font-bold border-primary/30 bg-primary/10 text-primary" aria-label="Unread">
                Unread
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[8px] font-bold" aria-label="Read">
                Read
              </Badge>
            )}

            {notificationType ? (
              <Badge variant="outline" className="text-muted-foreground">
                {notificationType}
              </Badge>
            ) : null}

            {schedule_type ? (
              <Badge variant="wz_fill" className="text-[8px] font-bold capitalize">
                {schedule_type}
              </Badge>
            ) : null}
          </div>

          <h3 id={`notif-${_id}-title`} className="mt-2 text-pretty text-base font-medium">
            {subject || "(no subject)"}
          </h3>

          <p className="text-sm leading-tight text-[#808080] mt-1">
            {message}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <ScheduleNotificationWrapper selectedClients={[id]} defaultPayload={item}>
            <Pen className="w-[28px] h-[28px] text-white bg-[var(--accent-1)] p-[6px] rounded-[4px] cursor-pointer" />
          </ScheduleNotificationWrapper>
          <DeleteClientNotification id={item._id} />
        </div>
      </div>
    </Card>
  )
}

function DeleteClientNotification({ id }) {
  async function deleteNotification(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData("app/notifications-schedule", { actionType: "DELETE", id }, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      closeBtnRef.current.click();
      location.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <DualOptionActionModal
    description="Are you sure of deleting this notification!"
    action={(setLoading, btnRef) => deleteNotification(setLoading, btnRef)}
  >
    <AlertDialogTrigger>
      <Trash2 className="w-[28px] h-[28px] text-white bg-[var(--accent-2)] p-[6px] rounded-[4px] cursor-pointer" />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}