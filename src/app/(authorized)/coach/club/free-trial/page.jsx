import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Eye,
  FolderInput,
  FolderOutput,
  Forward
} from "lucide-react";

export default function Page() {
  return <div className="content-container">
    <Header />
    <div className="w-[calc(100vw-68px)] md:w-[calc(100vw-344px)] overflow-x-auto">
      <Table className="bordered-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Sr. No</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Phone No.</TableHead>
            <TableHead>Roll No</TableHead>
            <TableHead>Sponsored By</TableHead>
            <TableHead>Joining Date</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }, (_, i) => i).map(item => <FreeTrialCustomerRow key={item} />)}
        </TableBody>
      </Table>
    </div>
  </div>
}

function FreeTrialCustomerRow() {
  return <TableRow>
    <TableCell>1</TableCell>
    <TableCell>Dnyaneshwar</TableCell>
    <TableCell>9067183889</TableCell>
    <TableCell>dk411</TableCell>
    <TableCell>Virat Kohli</TableCell>
    <TableCell>20/05/2003</TableCell>
    <TableCell>Pune</TableCell>
    <TableCell>
      <Button size="sm" variant="wz_outline">Add</Button>
    </TableCell>
    <TableCell>
      <Eye className="w-[16px]" />
    </TableCell>
  </TableRow>
}

function Header() {
  return <>
    <div className="mb-4 flex items-center gap-4">
      <h4>Free Trial</h4>
      <FormControl
        className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
        placeholder="Search Client.."
      />
      <Button size="sm" variant="wz">
        <Forward />
        Onboarding Form
      </Button>
    </div>
    <div className="py-4 flex items-center justify-end gap-2 border-t-1">
      <Button size="sm" variant="wz_outline">
        <FolderInput />
        Import Data
      </Button>
      <Button size="sm" variant="wz_outline">
        <FolderOutput />
        Export Data
      </Button>
      <Button size="sm" variant="wz_outline">
        Demo
      </Button>
    </div>
  </>
}