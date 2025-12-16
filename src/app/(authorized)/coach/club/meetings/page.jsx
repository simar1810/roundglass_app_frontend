"use client";

import ClubSystemOptions from "@/components/pages/coach/club/meeting/ClubSystemOptions";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import MeetingDetailRow from "@/components/pages/coach/club/meeting/MeetingDetailRow";
import useSWR from "swr";
import { getMeetings } from "@/lib/fetchers/club";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import Link from "next/link";

export default function Page() {
  const { isLoading, error, data: allData } = useSWR("getMeetings", () => getMeetings());

  if (isLoading) return <ContentLoader />

  if (!allData.status || error) return <div className="content-container">
    {allData.message === "No meetings found for the given coach." && <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <h4 className="mr-auto">Meeting Details</h4>
      <ClubSystemOptions />
      <Link
        className="px-4 py-2 rounded-[4px] bg-[var(--accent-1)] text-white font-bold"
        href="/coach/club/link-generator"
      >Create</Link>
    </div>}
    <ContentError
      title={error || allData.message}
      className="mt-0 border-0"
    />
  </div>
  const data = allData.data;

  return <div className="content-container">
    <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <h4 className="mr-auto">Meeting Details</h4>
      <ClubSystemOptions />
      <Link
        className="px-4 py-2 rounded-[4px] bg-[var(--accent-1)] text-white font-bold"
        href="/coach/club/link-generator"
      >Create</Link>
    </div>
    <div className="overflow-x-auto">
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
          {data.map((meeting, index) => <MeetingDetailRow
            key={meeting._id}
            meeting={meeting}
            index={index}
          />)}
        </TableBody>
      </Table>
    </div>
  </div>
}