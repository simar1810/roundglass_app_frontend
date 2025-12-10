import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import FormControl from "@/components/FormControl";
import AddSubscriptionModal from "@/components/modals/club/AddSubscriptionModal";
import SelectControl from "@/components/Select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sendData } from "@/lib/api";
import { getClientSubscriptions } from "@/lib/fetchers/club";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import PDFRenderer from "@/components/modals/PDFRenderer"
import { FileText, Pen, Eye } from "lucide-react"
import { useAppSelector } from "@/providers/global/hooks";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SubscriptionHistory({ _id, clientData }) {
  const { invoiceMeta } = useAppSelector(state => state.coach.data)
  const { isLoading, error, data } = useSWR(`getClientSubscriptions/${_id}`, () => getClientSubscriptions(_id));
  if (isLoading) return <div className="h-[200px] flex items-center justify-center">
    <Loader />
  </div>

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const subscriptions = data.data?.at(0)?.history.filter(subscription => subscription.amount !== 0) || [];

  if (subscriptions.length === 0) return <div className="mb-8">
    <div className="flex items-center justify-between">
      <h5>Membership History</h5>
      <AddSubscriptionModal _id={_id} />
    </div>
    <ContentError className="!min-h-[200px] mt-4 mb-8" title="This client has 0 subscriptions" />
  </div>
  return <div className="mb-8 w-[87vw] overflow-x-auto no-scrollbar md:w-auto">
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
          <TableHead>Total Amount</TableHead>
          <TableHead>Paid Amount</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((subscription, index) => (
          <TableRow key={subscription._id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{subscription.startDate}</TableCell>
            <TableCell>{subscription.endDate}</TableCell>
            <TableCell>{subscription.paymentMode}</TableCell>
            <TableCell>{subscription.amount}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {subscription.paidAmount ?? subscription.amount}
                {subscription.history?.length > 0 && <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-black border shadow-lg p-3">
                      <div className="flex flex-col gap-2">
                        <p className="font-semibold text-xs border-b pb-1">Payment History</p>
                        {subscription.history?.length > 0 ? (
                          subscription.history.map((record, i) => (
                            <div key={record._id || i} className="text-xs flex justify-between gap-6">
                              <span className="text-gray-600">{new Date(record.paidDate).toLocaleDateString()}</span>
                              <span className="font-medium">₹{record.amount}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No payment records</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>}
                <UpdatePaymentAmount
                  membershipId={subscription._id}
                  clientId={_id}
                  subscription={subscription}
                  pendingAmount={parseInt(subscription.amount) - parseInt(subscription.paidAmount ?? subscription.amount)} />
              </div>
            </TableCell>
            <TableCell>{subscription.description}</TableCell>
            <TableCell className="flex items-center gap-2">
              <UpdateSubscription
                subscription={subscription}
                _id={_id}
              />
              <PDFRenderer
                pdfTemplate="MembershipInvoicePDF"
                data={{ subscription, client: clientData, invoiceMeta }}
              >
                <DialogTrigger>
                  <FileText />
                </DialogTrigger>
              </PDFRenderer>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
}

function UpdateSubscription({ subscription = {}, _id }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: subscription.amount || "",
    paidAmount: subscription.paidAmount || "",
    endDate: subscription.endDate || "",
    invoice: subscription.invoice || "",
    paymentMode: subscription.paymentMode || "cash",
    startDate: subscription.startDate || "",
    description: subscription.description || "",
    historyId: subscription._id
  });
  const closeBtnRef = useRef(null);

  async function addSubscription() {
    try {
      setLoading(true);
      const response = await sendData(`editSubscription/${_id}`, formData, "POST");
      if (!response.status) throw new Error(response.message);
      toast.success(response.message);
      mutate(`getClientSubscriptions/${_id}`)
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger className="font-semibold text-[12px] text-[var(--primary-1)] bg-[var(--accent-1)] px-4 py-2 rounded-[8px]">
      Edit
    </DialogTrigger>
    <DialogContent className="!max-w-[450px] max-h-[70vh] border-0 px-0 overflow-auto gap-0 overflow-y-auto">
      <DialogTitle className="text-[24px] px-4">Add Membership</DialogTitle>
      <div className="mt-6 px-4">
        <FormControl
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          label="Amount"
          type="number"
          placeholder="Enter Amount"
          className="block mb-4"
        />
        <FormControl
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          label="Start Date"
          type="date"
          className="block mb-4"
        />
        <FormControl
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          label="End Date"
          type="date"
          className="block mb-4"
        />
        <FormControl
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          label="Description"
          type="text"
          placeholder="Enter Description"
          className="block mb-4"
        />
        <SelectControl
          value={formData.paymentMode}
          onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
          label="Payment Mode"
          className="block mb-4"
          options={[{ id: 1, name: "Cash", value: "cash" }, { id: 2, name: "UPI", value: "upi" }, { id: 3, name: "Net Banking", value: "online" }]}
        />
        <Button
          variant="wz"
          disabled={loading}
          onClick={addSubscription}
          className="mt-8"
        >
          Save
        </Button>
        <DialogClose ref={closeBtnRef} />
      </div>
    </DialogContent>
  </Dialog>
}

function UpdatePaymentAmount({ membershipId, clientId, subscription, pendingAmount }) {
  const [paidAmount, setPaidAmount] = useState(subscription.paidAmount || "");
  const [loading, setLoading] = useState(false);

  // if pending amount is 0, then return
  if (pendingAmount === 0) {
    return null;
  }

  async function updatePaymentAmount() {
    try {
      setLoading(true);
      const payload = {
        membershipId,
        clientId,
        paidAmount
      }
      console.log(payload)
      if (paidAmount > pendingAmount) {
        toast.error("Paid amount cannot be greater than pending amount");
        return;
      }

      if (paidAmount < 0) {
        toast.error("Paid amount cannot be less than 0");
        return;
      }

      const response = await sendData("subscription/pending-payment", payload, "POST");
      if (!response.status) throw new Error(response.message);
      toast.success(response.message);
      mutate(`getClientSubscriptions/${_id}`)
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Pen className="w-3 h-3 ml-auto block text-gray-500 hover:text-gray-700 cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="!max-w-[400px] p-0 !gap-0 !space-y-0">
        <DialogTitle className="p-4 border-b">Update Paid Amount</DialogTitle>
        <div className="mt-4 p-4">
          <FormControl
            label="Paid Amount"
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <span className="text-xs italic text-gray-500">Pending Amount: {pendingAmount}</span>
          <Button
            variant="wz"
            onClick={updatePaymentAmount}
            className="block mt-4"
            disabled={loading}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
