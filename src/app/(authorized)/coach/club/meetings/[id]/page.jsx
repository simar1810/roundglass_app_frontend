"use client"
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import MeetingAttendanceRow from "@/components/pages/coach/club/meeting/MeetingAttendanceRow";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getMeeting } from "@/lib/fetchers/club";
import { format, parse } from "date-fns";
import { Upload } from "lucide-react";
import { useParams } from "next/navigation";
import useSWR from "swr";

export default function Page() {
  const { id } = useParams()
  const { isLoading, error, data } = useSWR(`getMeeting/${id}`, () => getMeeting(id))

  if (isLoading) return <ContentLoader />

  if (!data.success || error) return <ContentError title={data.message || error} />

  const meeting = data.data;

  return <div className="content-container">
    <div className="text-[20px] mb-4 flex items-center justify-between gap-4">
      <h4>Meet Link</h4>
      {meeting.schedulueDate && <div>
        Date:&nbsp;
        {format(parse(meeting.schedulueDate, 'dd-MM-yyyy HH:mm:ss', new Date()), "dd-MM-yyyy")}
      </div>}
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
            <TableHead>Joining Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meeting.attendenceList.map((attendance, index) => <MeetingAttendanceRow
            key={attendance._id}
            index={index}
            attendance={attendance}
          />)}
        </TableBody>
      </Table>
    </div>
  </div>
}