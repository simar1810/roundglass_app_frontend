import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Upload } from "lucide-react";

export default function Page() {
  return <div className="content-container">
    <div className="text-[20px] mb-4 flex items-center justify-between gap-4">
      <h4>Meet Link</h4>
      <div>Date:&nbsp;{"01/01/2025"}</div>
    </div>
    <div className="py-4 flex items-center justify-between gap-2 border-t-1">
      <span>{7} Records Available</span>
      <Button size="sm" variant="wz_outline">
        <Upload />
        Export Records
      </Button>
    </div>
    <div className="w-[calc(100vw-68px)] md:w-[calc(100vw-344px)] overflow-x-auto">
      <Table className="bordered-table">
        <TableHeader className="">
          <TableRow>
            <TableHead className="w-[100px]">Sr. No</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Client ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joining Time</TableHead>
            <TableHead>Leaving Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }, (_, i) => i).map(item => <MeetingDetailRow key={item} />)}
        </TableBody>
      </Table>
    </div>
  </div>
}

function MeetingDetailRow() {
  return <TableRow>
    <TableCell>1</TableCell>
    <TableCell>Dnyaneshwar</TableCell>
    <TableCell>dk411</TableCell>
    <TableCell>dnyaneshwar@gmail.com</TableCell>
    <TableCell>10:00 AM</TableCell>
    <TableCell>10:22 AM</TableCell>
  </TableRow>
}