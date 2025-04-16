import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";
import useSWR from "swr";
import { getClubClientVolumePoints } from "@/lib/fetchers/club";
import { copyText } from "@/lib/utils";
import { toast } from "sonner";
import ClientListVolumePoint from "./ClientListVolumePoint";

export default function VolumePointModeClientsList() {
  const { isLoading, error, data } = useSWR(`membership`, getClubClientVolumePoints);

  if (isLoading) return <ContentLoader />

  if (data.status_code !== 200 || error) return <ContentError title={error || data.message} />

  const clients = data.data.filter(client => !!client.clientId);

  return <div className="content-container">
    <Header />
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 divide-y-1">
      {clients.map(client => <ClientListVolumePoint
        key={client?.clientId?._id}
        client={client.clientId}
        activePoints={client.activePoints}
      />)}
    </div>
  </div>
}

function Header() {
  function copyLink() {
    copyText(process.env.NEXT_PUBLIC_CLIENT_ENDPOINT + "/request-volume-point")
    toast.success("Link Copied")
  }

  return <div className="pb-4 flex items-center gap-2 border-b-1">
    <h4>Volume Point</h4>
    <Button
      className="ml-auto"
      size="sm"
      variant="wz_outline"
      onClick={copyLink}
    >
      <Forward className="w-[16px]" />
      Volume Point Form
    </Button>
    <Button
      size="sm"
      variant="wz"
    >
      Requested Volume Points
    </Button>
  </div>
}