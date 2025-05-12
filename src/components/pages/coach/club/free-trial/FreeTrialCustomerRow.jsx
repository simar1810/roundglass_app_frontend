import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import Link from "next/link";

export default function FreeTrialCustomerRow({
  index,
  customer
}) {
  return <TableRow>
    <TableCell>{index + 1}</TableCell>
    <TableCell>{customer.clientId.name}</TableCell>
    <TableCell>{customer.clientId.mobileNumber}</TableCell>
    <TableCell>{customer.clientId.rollno}</TableCell>
    <TableCell>{customer.clientId.sponseredByName}</TableCell>
    <TableCell>{customer.clientId.joiningDate}</TableCell>
    <TableCell>{customer.clientId.city}</TableCell>
    <TableCell>
      <Button size="sm" variant="wz_outline">Add</Button>
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