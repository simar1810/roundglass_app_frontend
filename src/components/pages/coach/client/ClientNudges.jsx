import ContentError from "@/components/common/ContentError"
import ContentLoader from "@/components/common/ContentLoader"
import ScheduleNotificationWrapper from "@/components/modals/client/ScheduleNotification"
import DualOptionActionModal from "@/components/modals/DualOptionActionModal"
import SelectMultiple from "@/components/SelectMultiple"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { DAYS, DAYS_EEEE } from "@/config/data/ui"
import { sendData } from "@/lib/api"
import { retrieveClientNudges } from "@/lib/fetchers/app"
import { getRecentNotifications, getReocurrNotification } from "@/lib/nudges"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Copy, EllipsisVertical, Image as ImageIcon, Pen, Trash2 } from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"
import DeleteClientNudges from "./DeleteClientNudges"
import CopyClientNudges from "../copy-client-nudges/CopyClientNudges"
import CopyMealNotifications from "../copy-client-nudges/CopyMealNotifications"

export default function ClientNudges() {
  const [selected, setSelected] = useState([])
  const { id } = useParams()
  const { isLoading, data, error } = useSWR(
    `client/nudges/${id}`,
    () => retrieveClientNudges(id, { limit: 10000000000 })
  )

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error?.message || data.message} />

  const notifications = data.data?.results || []

  return <div className="bg-white px-4 py-4 border-1 rounded-[10px] mt-4  w-[90vw] md:w-auto">
    <div className="flex items-center justify-between gap-4">
      <div className="mr-auto">
        <h4>Client Nudges</h4>
        <p className="text-sm text-[#808080] mt-2">{notifications.length ?? <>0</>} Total</p>
      </div>
      <DeleteClientNudges clientId={id} />
      <ScheduleNotificationWrapper
        selectedClients={id}
      />
    </div>
    <div className="flex items-center justify-end gap-4">
      <CopyMealNotifications clientId={id} />
      <CopyClientNudges clientId={id} />
    </div>
    {notifications.length === 0
      ? <CreateFirstNotification />
      :
      <Tabs defaultValue="recent" className="">
        <Header
          selected={selected}
          setSelected={setSelected}
        />
        <NotificationRecent
          notifications={notifications}
          selected={selected}
        />
        <NotificationAllDays
          notifications={notifications.filter(notif => notif.schedule_type === "reocurr")}
          selected={selected}
        />
        <NotificationSchedule
          notifications={notifications.filter(notif => notif.schedule_type === "schedule")}
          selected={selected}
        />
      </Tabs>}
  </div>
}

function CreateFirstNotification() {
  return <div className="h-40 p-4 mt-4 flex items-center justify-center bg-[var(--comp-1)] border-1 text-sm text-[#808080] font-bold rounded-[4px]">
    No Notifications found!
  </div>
}

const tabOptions = [
  { id: 1, name: "Recent", value: "recent" },
  { id: 2, name: "Reocurr", value: "all-days" },
  { id: 3, name: "Schedule", value: "schedule" },
]

function Header({
  selected,
  setSelected
}) {
  return <div className="my-4 flex flex-wrap items-center gap-4 select-none">
    <TabsList className="mr-auto bg-transpatent gap-2">
      {tabOptions.map(tab =>
        <TabsTrigger
          key={tab.id}
          className="md:min-w-[110px] mb-[-5px] px-2 font-semibold flex-1 basis-0 flex items-center gap-1 rounded-[10px] py-2
             data-[state=active]:bg-[var(--accent-1)] data-[state=active]:text-[var(--comp-1)]
             data-[state=active]:shadow-none text-[#808080] bg-[var(--comp-1)] border-1 border-[#EFEFEF]"
          value={tab.value}
        >
          {tab.name}
        </TabsTrigger>)}
    </TabsList>
    <SelectMultiple
      label="Days"
      align="top"
      options={DAYS_EEEE.map((day, idx) => ({
        id: idx,
        name: day,
        value: day
      }))}
      value={selected}
      onChange={value => setSelected(value)}

    />
  </div>
}

function NotificationRecent({
  notifications,
  selected
}) {
  const [paginate, setPaginate] = useState({
    page: 1,
    limit: 5
  })
  const sortedNotifications = getRecentNotifications(
    notifications,
    selected,
    paginate
  )

  return <TabsContent
    value="recent"
    className="bg-[var(--comp-1)] text-sm px-4 py-2 border-1 rounded-[6px]"
  >
    <p className="font-bold text-[16px] mb-2">Recent Notifications</p>
    {sortedNotifications.length === 0 && <NoNotificationFound />}
    {sortedNotifications.map(notif => <NotificationItem
      key={notif._id}
      notif={notif}
    />)}
    {sortedNotifications.length > 0 && <Paginate
      paginate={paginate}
      setPaginate={setPaginate}
      totalPages={Math.ceil(notifications.length / paginate.limit)}
    />}
  </TabsContent>
}

function NotificationAllDays({
  notifications,
  selected,
}) {
  const [paginate, setPaginate] = useState({
    page: 1,
    limit: 5
  })
  const sortedNotifications = getReocurrNotification(
    notifications,
    selected,
    paginate
  )

  return <TabsContent
    value="all-days"
    className="bg-[var(--comp-1)] text-sm px-4 py-2 border-1 rounded-[6px]"
  >
    <p className="font-bold text-[16px] mb-2">Reocurr Notifications</p>
    {sortedNotifications.length === 0 && <NoNotificationFound />}
    {sortedNotifications.map(notif => <NotificationItem
      key={notif._id}
      notif={notif}
    />)}
    {sortedNotifications.length > 0 && <Paginate
      paginate={paginate}
      setPaginate={setPaginate}
      totalPages={Math.ceil(notifications.length / paginate.limit)}
    />}
  </TabsContent>
}

function NotificationSchedule({
  notifications,
  selected,
}) {
  const [paginate, setPaginate] = useState({
    page: 1,
    limit: 5
  })
  const sortedNotifications = getReocurrNotification(
    notifications,
    selected,
    paginate
  )

  return <TabsContent
    value="schedule"
    className="bg-[var(--comp-1)] text-sm px-4 py-2 border-1 rounded-[6px]"
  >
    <p className="font-bold text-[16px] mb-2">Schedule Notifications</p>
    {sortedNotifications.length === 0 && <NoNotificationFound />}
    {sortedNotifications.map(notif => <NotificationItem
      key={notif._id}
      notif={notif}
    />)}
    {sortedNotifications.length > 0 && <Paginate
      paginate={paginate}
      setPaginate={setPaginate}
      totalPages={Math.ceil(notifications.length / paginate.limit)}
    />}
  </TabsContent>
}

function NotificationItem({ notif }) {
  const { id } = useParams();

  const isSeen = notif?.isRead;
  const formattedTime = notif?.time || "--:--";
  const formattedDate = notif?.date || "--/--/----";
  
  // Get status options if available
  const possibleStatuses = Array.isArray(notif?.notificationStatus?.possibleStatus) 
    ? notif.notificationStatus.possibleStatus 
    : [];
  const defaultStatus = notif?.notificationStatus?.clientMarkedStatus || "";
  console.log("DefaultStatus", defaultStatus);
  console.log("---",possibleStatuses);
  // Get image URL if available (check multiple possible field names)
  const imageUrl = notif?.image || notif?.imageUrl || notif?.attachment || notif?.photo || null;

  return (
    <div
      className={cn(
        "border rounded-2xl px-4 py-3 mb-3 flex flex-col gap-3 transition hover:shadow-sm",
        isSeen ? "bg-white" : "bg-[#f9fafb]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm md:!text-lg">
                {notif.subject || "Untitled Notification"}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 ml-2 shrink-0"
                >
                  <EllipsisVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={e => e.preventDefault()}
                  className="p-0"
                >
                  <ScheduleNotificationWrapper
                    selectedClients={[id]}
                    defaultPayload={notif}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm"
                    >
                      <Pen className="w-4 h-4 text-gray-600" />
                      <span>Edit notification</span>
                    </button>
                  </ScheduleNotificationWrapper>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={e => e.preventDefault()}
                  className="p-0"
                >
                  {/* <ScheduleNotificationWrapper
                    defaultPayload={{
                      ...notif,
                      _id: undefined
                    }}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                      <span>Copy notification</span>
                    </button>
                  </ScheduleNotificationWrapper> */}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={e => e.preventDefault()}
                  className="p-0"
                >
                  <DeleteClientNotification id={notif._id}>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600" />
                        <span>Delete notification</span>
                      </button>
                    </AlertDialogTrigger>
                  </DeleteClientNotification>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {notif.message || "No message provided."}
          </p>

          {/* Display Image if available */}
          {imageUrl && (
            <div className="mb-2 mt-2">
              <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={imageUrl}
                  alt={notif.subject || "Notification image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Display Status Options if available */}
          {possibleStatuses.length > 0 && (
            <div className="mt-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-700">Status Options:</span>
                {possibleStatuses.map((status, index) => (
                  <Badge
                    key={index}
                    className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-700 border-gray-300"
                    variant="outline"
                  >
                    {typeof status === "string" ? status : status.name}
                  </Badge>
                ))}
              </div>
              {/* Show current client status if available */}
              {defaultStatus && possibleStatuses.includes(defaultStatus) && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Current Status:</span>{" "}
                  <Badge className="text-[10px] font-medium px-2 py-0.5 bg-blue-100 text-blue-800 border-blue-300 ml-1">
                    {defaultStatus}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <Badge className="capitalize text-[10px] font-bold">{notif.schedule_type}</Badge>
            {notif.schedule_type === "schedule" && (
              <span>
                📅 {formattedDate} •
              </span>
            )}
            <span>🕒 {formattedTime}</span>
            {notif.notificationType && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full border text-gray-700">
                {notif.notificationType}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationReadStatus({ isSeen }) {
  if (isSeen) return <Badge className="text-green-500 font-bold px-1 py-[2px] text-[10px] bg-transparent">
    Seen
    <span className="h-2 w-2 bg-green-500 rounded-full inline-block ml-1" />
  </Badge>

  return <Badge className="text-red-500 font-bold px-1 py-[2px] text-[10px] bg-transparent">
    Unseen
    <span className="h-2 w-2 bg-red-500 rounded-full inline-block ml-1" />
  </Badge>
}

function DeleteClientNotification({ id, children }) {
  const { id: clientId } = useParams()
  async function deleteNotification(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData("app/notifications-schedule", { actionType: "DELETE", id }, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      closeBtnRef.current.click();
      mutate(`client/nudges/${clientId}`)
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
    {!children && <AlertDialogTrigger asChild>
      <Button
        size="icon"
        variant="ghost"
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      >
        <Trash2 className="w-4 h-4 text-[var(--accent-2)]" />
      </Button>
    </AlertDialogTrigger>}
    {children}
  </DualOptionActionModal>
}

function Paginate({
  paginate = {},
  setPaginate,
  totalPages = 10
}) {
  return <div className="mt-4 flex items-center justify-between gap-4">
    <Select
      value={paginate.limit}
      onValueChange={value => setPaginate({ ...paginate, limit: value })}
    >
      <SelectTrigger className="bg-white">
        <SelectValue value={paginate.limit} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={5}>5</SelectItem>
        <SelectItem value={10}>10</SelectItem>
        <SelectItem value={15}>15</SelectItem>
      </SelectContent>
    </Select>
    <PaginatePages
      paginate={paginate}
      setPaginate={setPaginate}
      totalPages={totalPages}
    />
  </div>
}

function PaginatePages({ paginate, setPaginate, totalPages = 20 }) {
  const { page } = paginate;

  const handlePageChange = (value) => {
    if (value < 1 || value > totalPages) return;
    setPaginate({ ...paginate, page: value });
  };

  const startPage = Math.floor((page - 1) / 4) * 4 + 1;
  const endPage = Math.min(startPage + 3, totalPages);
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="bg-white flex items-center justify-center mt-4">
      <Button
        size="icon"
        variant="outline"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="rounded-none w-8 h-8"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {visiblePages.map((num) => (
        <Button
          key={num}
          onClick={() => handlePageChange(num)}
          variant={num === page ? "default" : "outline"}
          className={`w-8 h-8 text-sm rounded-none transition-all ${num === page
            ? "bg-black text-white hover:bg-black"
            : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
        >
          {num}
        </Button>
      ))}
      <Button
        size="icon"
        variant="outline"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-none w-8 h-8"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function NoNotificationFound() {
  return <div className="h-32 flex flex-col items-center justify-center text-center text-gray-500">
    <div className="text-sm font-medium">No notifications found</div>
    <p className="text-xs text-gray-400 mt-1">Nothing here yet. Create your first notification.</p>
  </div>
}