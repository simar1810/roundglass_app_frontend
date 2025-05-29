import AddSubscriptionModal from "@/components/modals/club/AddSubscriptionModal";
import AddVolumePointsModal from "@/components/modals/club/AddVolumePointsModal";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useAppSelector } from "@/providers/global/hooks";
import { Eye } from "lucide-react";
import Link from "next/link";
import { mutate } from "swr";

export default function FreeTrialCustomerRow({
  index,
  customer
}) {
  const { clubSystem } = useAppSelector(state => state.coach.data)
  return <TableRow>
    <TableCell>{index + 1}</TableCell>
    <TableCell>{customer.clientId.name}</TableCell>
    <TableCell>{customer.clientId.mobileNumber}</TableCell>
    <TableCell>{customer.clientId.rollno}</TableCell>
    <TableCell>{customer.clientId.sponseredByName}</TableCell>
    <TableCell>{customer.clientId.joiningDate}</TableCell>
    <TableCell>{customer.clientId.city}</TableCell>
    <TableCell>
      {clubSystem === 1 && <AddSubscriptionModal
        _id={customer.clientId._id}
        onSubmit={() => mutate("free-trial-users")}
      />}
      {clubSystem === 2 && <AddVolumePointsModal
        _id={customer.clientId._id}
        onSubmit={() => mutate("free-trial-users")}
      />}
    </TableCell>
    <TableCell>
      <Link
        href={`/coach/clients/${customer._id}`}
      >
        <Eye className="w-[16px] mx-auto" />
      </Link>
    </TableCell>
  </TableRow>
}