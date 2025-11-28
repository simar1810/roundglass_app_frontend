import ContentError from "@/components/common/ContentError"
import DropdownItemSelection from "@/components/common/DropdownItemSelection"
import Loader from "@/components/common/Loader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { copyClientNudgesInitialState } from "@/config/state-data/copy-client-nudges"
import {
  copyClientNudgesReducer, pulledClientNudges, selectAllNotifications, deselectAllNotifications,
  selectCopyNudgeClient, selectCurrentClientNudges, toggleNotificationSelection
} from "@/config/state-reducers/copy-client-nudges"
import { fetchData, sendData } from "@/lib/api"
import { nameInitials } from "@/lib/formatter"
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext"
import { useEffect, useRef, useState } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"

export default function CopyClientNudges({ clientId }) {
  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="wz">
        Copy Client Nudges
      </Button>
    </DialogTrigger>
    <DialogContent className="!max-w-[700px] w-full max-h-[85vh] overflow-hidden flex flex-col p-0">
      <DialogTitle className="px-6 py-4 border-b bg-[var(--comp-2)] text-lg font-semibold">
        Copy Client Nudges
      </DialogTitle>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Container clientId={clientId} />
      </div>
    </DialogContent>
  </Dialog>
}

function Container({ clientId }) {
  return <CurrentStateProvider
    state={copyClientNudgesInitialState}
    reducer={copyClientNudgesReducer}
  >
    <SelectClient clientId={clientId} />
    <SelectNudges clientId={clientId} />
  </CurrentStateProvider>
}

function SelectClient({ clientId }) {
  const {
    selectedClient,
    nudgesPulledFrom,
    dispatch
  } = useCurrentStateContext();

  const { isLoading, error, data } = useSWR(
    "notification-copy/clients",
    () => fetchData("app/notification-copy/clients")
  );

  if (isLoading) return <Loader />

  if (error || data?.status_code !== 200) return <ContentError
    className="!max-h-[80px]"
    title={error || data?.message}
  />

  // Filter out the current client from the list
  const items = (data.data || [])
    .filter(client => client._id !== clientId) // Exclude current client
    .map(client => ({
      id: client._id,
      title: client.name,
      avatar: client.profilePhoto ?? nameInitials(client.name),
      value: client._id
    }))

  return <div className="space-y-4">
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Select Client to Copy From
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <DropdownItemSelection
            items={items}
            value={selectedClient}
            onSelectItem={(value) => dispatch(selectCopyNudgeClient(value))}
            placeholder="Choose a client..."
          />
        </div>
        {selectedClient && (
          <Button
            onClick={() => dispatch(selectCurrentClientNudges())}
            variant="wz"
            className="whitespace-nowrap"
          >
            Find Nudges
          </Button>
        )}
      </div>
      {items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          No other clients available to copy from.
        </p>
      )}
    </div>
  </div>
}

function SelectNudges({ clientId }) {
  const { nudgesPulledFrom } = useCurrentStateContext()

  if (!nudgesPulledFrom) return <></>

  return <SelectNudgesContainer
    clientId={clientId}
    nudgesPulledFrom={nudgesPulledFrom}
  />
}

function SelectNudgesContainer({ clientId, nudgesPulledFrom }) {
  const [loading, setLoading] = useState(false)
  const closeRef = useRef(null)
  const { clientNudges, dispatch } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR(
    nudgesPulledFrom ? `notification-copy/clients/${nudgesPulledFrom}` : null,
    () => fetchData(`app/notification-copy/clients/${nudgesPulledFrom}`)
  );

  const notifications = data?.data || [];

  useEffect(function () {
    if (!isLoading && notifications.length > 0) {
      dispatch(pulledClientNudges(notifications))
    }
  }, [nudgesPulledFrom, isLoading, notifications.length, dispatch]);

  if (isLoading) return <div className="mt-6">
    <Loader />
  </div>

  if (error || (data && data?.status_code !== 200)) return <div className="mt-6">
    <ContentError
      className="!max-h-[80px]"
      title={error || data?.message || "Failed to load nudges"}
    />
  </div>

  if (!nudgesPulledFrom) return null;

  const selectedNotification = new Set(
    clientNudges
      .filter(notification => notification.selected)
      .map(notification => notification._id)
  )
  const allSelected = clientNudges.length > 0 && selectedNotification.size === clientNudges.length

  async function createCopyNudges() {
    try {
      setLoading(true);
      const payload = {
        notifications: Array.from(selectedNotification)
      }
      const response = await sendData(`app/notification-copy/clients/${clientId}`, payload);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message || "Nudges copied successfully!");
      mutate(`client/nudges/${clientId}`);
      if (closeRef.current) {
        closeRef.current.click();
      }
    } catch (error) {
      toast.error(error.message || "Failed to copy nudges");
    } finally {
      setLoading(false);
    }
  }

  if (notifications.length === 0) {
    return <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-sm text-gray-600 text-center">
        No nudges found for this client.
      </p>
    </div>
  }

  return <div className="mt-6 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-700">
        Select Nudges to Copy ({notifications.length} available)
      </h3>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              dispatch(selectAllNotifications())
            } else {
              dispatch(deselectAllNotifications())
            }
          }}
        />
        <span className="text-sm text-gray-600">Select All</span>
      </label>
    </div>
    
    <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2">
      {notifications.map(notification => {
        const isSelected = selectedNotification.has(notification._id)
        return (
          <label
            key={notification._id}
            className={`px-4 py-3 rounded-lg border-2 cursor-pointer flex items-start gap-3 transition-all ${
              isSelected 
                ? "bg-blue-50 border-blue-300" 
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <Checkbox
              className="mt-0.5"
              checked={isSelected}
              onCheckedChange={() => dispatch(toggleNotificationSelection(notification._id))}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {notification.subject || "Untitled Notification"}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {notification.message || "No message"}
              </p>
              {notification.schedule_type && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                  {notification.schedule_type}
                </span>
              )}
            </div>
          </label>
        )
      })}
    </div>
    
    {selectedNotification.size > 0 && (
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-gray-600">
          {selectedNotification.size} nudges selected
        </p>
        <Button
          variant="wz"
          onClick={createCopyNudges}
          disabled={loading}
          className="font-semibold"
        >
          {loading ? "Copying..." : `Copy ${selectedNotification.size} Nudge${selectedNotification.size > 1 ? 's' : ''}`}
        </Button>
      </div>
    )}
    <DialogClose ref={closeRef} className="hidden" />
  </div>
}