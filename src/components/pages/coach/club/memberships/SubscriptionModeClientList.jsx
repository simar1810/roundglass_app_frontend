import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import useSWR from "swr";
import ClientListSubscription from "../../client/ClientListSubscription";
import { Button } from "@/components/ui/button";
import { Forward } from "lucide-react";
import { getClubClientSubscriptions } from "@/lib/fetchers/club";
import RequestedSubscriptionModal from "@/components/modals/club/RequestedSubscriptionModal";
import { toast } from "sonner";
import { copyText } from "@/lib/utils";

export default function SubscriptionModeClientList() {
  const { isLoading, error, data } = useSWR(`getAllClubSubscriptions`, () => getClubClientSubscriptions());

  if (isLoading) return <ContentLoader />

  if (data.status_code !== 200 || error) return <ContentError title={error || data.message} />

  const subscriptions = data.data;

  return <div className="content-container">
    <Header />
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 divide-y-1">
      {/* {subscriptions.map(item => <ClientListSubscription key={item} />)} */}
    </div>
  </div>
}

function Header() {
  function copyLink() {
    copyText(process.env.NEXT_PUBLIC_CLIENT_ENDPOINT + "/request-subscription")
    toast.success("Link Copied")
  }
  return <div className="pb-4 flex items-center gap-2 border-b-1">
    <h4>Subscription</h4>
    <Button onClick={copyLink} className="ml-auto" size="sm" variant="wz_outline">
      <Forward className="w-[16px]" />
      Membership Form
    </Button>
    <RequestedSubscriptionModal />
  </div>
}