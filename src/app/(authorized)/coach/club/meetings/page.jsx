import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Clipboard, Eye, Pen, Trash2 } from "lucide-react";

export default function Page() {
  return <div className="content-container">
    <div className="mb-8 flex items-center justify-between gap-4">
      <h4>Meeting Details</h4>
      <ClubSystemOptions />
    </div>
    <div className="w-[calc(100vw-68px)] md:w-[calc(100vw-344px)] overflow-x-auto">
      <Table className=" border-1 border-r-0 [&_th]:border-r-1 [&_td]:border-r-1 overflow-x-auto">
        <TableHeader className=" bg-[var(--comp-1)] border-b-1">
          <TableRow>
            <TableHead className="w-[100px]">Sr. No</TableHead>
            <TableHead>Base Link</TableHead>
            <TableHead>WellnessZ Link</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Meet Type</TableHead>
            <TableHead>Club Type</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Actions</TableHead>
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
    <TableCell>https://club.wellnessz.in/meeting/67e695f950bac36d3b6e3c83/zoom-events</TableCell>
    <TableCell className="flex items-start gap-2">
      <span>https://club.wellnessz.in/meet/62f4fcb9-b81f-4ad6-aa0a-447240087c42</span>
      <Clipboard className="w-[16px]" />
    </TableCell>
    <TableCell>01/01/2025</TableCell>
    <TableCell>10:00 AM</TableCell>
    <TableCell className="flex items-start gap-2">
      <span>1</span>
      <Eye className="w-[16px]" />
    </TableCell>
    <TableCell>Scheduled</TableCell>
    <TableCell>Morning Club</TableCell>
    <TableCell>-</TableCell>
    <TableCell className="flex items-start gap-2">
      <Pen className="w-[16px]" />
      <Trash2 className="text-[var(--accent-2)] w-[16px]" />
    </TableCell>
  </TableRow>
}

function ClubSystemOptions() {
  return <RadioGroup defaultValue="option-one" className="flex items-center gap-4">
    <div className="flex items-center space-x-2">
      <RadioGroupItem
        value="option-one"
        id="option-one"
        className="w-[20px] h-[20px] relative after:absolute after:w-[28px] after:h-[28px] after:top-[-5px] after:left-[-5px] data-[state=checked]:after:border-2 after:rounded-full after:border-[var(--accent-1)] data-[state=checked]:border-[var(--accent-1)] data-[state=checked]:bg-[var(--accent-1)]"
      />
      <Label htmlFor="option-one">Free</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem
        value="option-two"
        id="option-two"
        className="w-[20px] h-[20px] relative after:absolute after:w-[28px] after:h-[28px] after:top-[-5px] after:left-[-5px] data-[state=checked]:after:border-2 after:rounded-full after:border-[var(--accent-1)] data-[state=checked]:border-[var(--accent-1)] data-[state=checked]:bg-[var(--accent-1)]"
      />
      <Label htmlFor="option-two">Subscription</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem
        value="option-three"
        id="option-three"
        className="w-[20px] h-[20px] relative after:absolute after:w-[28px] after:h-[28px] after:top-[-5px] after:left-[-5px] data-[state=checked]:after:border-2 after:rounded-full after:border-[var(--accent-1)] data-[state=checked]:border-[var(--accent-1)] data-[state=checked]:bg-[var(--accent-1)]"
      />
      <Label htmlFor="option-three">Volume Points</Label>
    </div>
  </RadioGroup>
}