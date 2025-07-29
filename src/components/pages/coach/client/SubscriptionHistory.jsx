import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import AddSubscriptionModal from "@/components/modals/club/AddSubscriptionModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getClientSubscriptions } from "@/lib/fetchers/club";
import useSWR from "swr";

export default function SubscriptionHistory({ _id }) {
  const { isLoading, error, data } = useSWR(`getClientSubscriptions/${_id}`, () => getClientSubscriptions(_id));
  if (isLoading) return <div className="h-[200px] flex items-center justify-center">
    <Loader />
  </div>

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const subscriptions = data.data?.at(0)?.history || [];

  if (subscriptions.length === 0) return <div className="mb-8">
    <div className="flex items-center justify-between">
      <h5>Membership History</h5>
      <AddSubscriptionModal _id={_id} />
    </div>
    <ContentError className="!min-h-[200px] mt-4 mb-8" title="This client has 0 subscriptions" />
  </div>

  return <div className="mb-8">
    <div className="flex items-center justify-between">
      <h5>Membership History</h5>
      <AddSubscriptionModal _id={_id} />
    </div>
    <Table className="bordered-table mt-4 [&_th]:font-bold">
      <TableHeader>
        <TableRow className="[&_th]:text-center">
          <TableHead>Sr No.</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Payment Mode</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((subscription, index) => <TableRow key={subscription._id}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>{subscription.startDate}</TableCell>
          <TableCell>{subscription.endDate}</TableCell>
          <TableCell>{subscription.paymentMode}</TableCell>
          <TableCell>{subscription.amount}</TableCell>
          <TableCell>{subscription.description}</TableCell>
          <TableCell>{subscription.description}</TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </div>
}