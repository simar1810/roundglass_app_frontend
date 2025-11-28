import ContentError from "@/components/common/ContentError"
import DropdownItemSelection from "@/components/common/DropdownItemSelection"
import Loader from "@/components/common/Loader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { copyClientNudgesInitialState } from "@/config/state-data/copy-client-nudges"
import {
  copyClientNudgesReducer, pulledClientNudges, selectAllNotifications,
  selectCopyNudgeClient, selectCurrentClientNudges, toggleNotificationSelection
} from "@/config/state-reducers/copy-client-nudges"
import { fetchData, sendData } from "@/lib/api"
import { nameInitials } from "@/lib/formatter"
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext"
import { useEffect, useState } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"

export default function CopyClientNudges({ clientId }) {
  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="wz">
        Copy Client Nudges
      </Button>
    </DialogTrigger>
    <DialogContent className="p-0 !gap-0 !space-y-0 !max-w-[840px] w-full">
      <DialogTitle className="p-4 border-b-1">Copy Client Nudges</DialogTitle>
      <div className="p-4">
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
    <SelectClient />
    <SelectNudges clientId={clientId} />
  </CurrentStateProvider>
}

function SelectClient() {
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

  const items = (data.data || [])
    .map(client => ({
      id: client._id,
      title: client.name,
      avatar: client.profilePhoto ?? nameInitials(client.name),
      value: client._id
    }))

  return <div className="flex items-center gap-4">
    <div className="grow">
      <DropdownItemSelection
        items={items}
        value={selectedClient}
        onSelectItem={(value) => dispatch(selectCopyNudgeClient(value))}
      />
    </div>
    {selectedClient
      && (nudgesPulledFrom !== selectedClient)
      && <Button
        onClick={() => dispatch(selectCurrentClientNudges())}
      >
        Find Nudges
      </Button>}
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
  const { clientNudges, dispatch } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR(
    `notification-copy/clients/${nudgesPulledFrom}`,
    () => fetchData(`app/notification-copy/clients/${nudgesPulledFrom}`)
  );

  const notifications = data?.data || [];

  useEffect(function () {
    dispatch(pulledClientNudges(notifications))
  }, [nudgesPulledFrom, isLoading]);

  if (isLoading) return <Loader />

  if (error || data?.status_code !== 200) return <ContentError
    className="!max-h-[80px]"
    title={error || data?.message}
  />

  const selectedNotification = new Set(
    clientNudges
      .filter(notification => notification.selected)
      .map(notification => notification._id)
  )
  const allSelected = selectedNotification.size === clientNudges.length

  async function createCopyNudges() {
    try {
      setLoading(true);
      const payload = {
        notifications: Array.from(selectedNotification)
      }
      const response = await sendData(`app/notification-copy/clients/${clientId}`, payload);
      console.log(response)
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate(`client/nudges/${clientId}`);
      // closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <div>
    <label className="flex items-center px-2 mt-4 gap-2 cursor-pointer">
      <Checkbox
        checked={allSelected}
        onCheckedChange={() => allSelected
          ? {}
          : dispatch(selectAllNotifications())
        }
      />
      Select All
    </label>
    <div className="grid grid-cols-2 gap-4 mt-4 max-h-[400px] overflow-y-auto">
      {notifications.map(notification => <label
        key={notification._id}
        className="px-4 py-2 rounded-[10px] bg-[var(--comp-1)] border-1 cursor-pointer flex items-start gap-2"
      >
        <Checkbox
          className="mt-1"
          checked={selectedNotification.has(notification._id)}
          onCheckedChange={() => dispatch(toggleNotificationSelection(notification._id))}
        />
        <div className="">
          <p className="text-sm font-bold">{notification.subject}</p>
          <p className="text-xs text-[#808080]">{notification.message}</p>
        </div>
      </label>)}
    </div>
    {selectedNotification.size > 0 && <Button
      className="mt-4 font-bold"
      onClick={createCopyNudges}
      disabled={loading}
    >
      Add Nudges
    </Button>}
  </div>
}