"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendData } from "@/lib/api";
import { getMeetingPersonList } from "@/lib/fetchers/club";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

export default function Page() {
  const [selected, setSelected] = useState(false);
  const [query, setQuery] = useState("");

  return <div className="content-container content-height-screen max-w-[1024px] mt-28 mx-auto flex flex-col items-center justify-center border-0">
    <h4 className="mb-4">Meetings</h4>
    <Tabs className="mt-6" defaultValue="client">
      <TabsList className="mx-auto mb-4">
        <TabsTrigger value="client" className="w-[100px]">
          Client
        </TabsTrigger>
        <TabsTrigger value="coach" className="w-[100px]">
          Coach
        </TabsTrigger>
      </TabsList>
      <TabsContent value="client">
        <div className="mt-4">
          <Label htmlFor="search" className="mb-2">Enter Client ID</Label>
          <Input
            value={query}
            id="search"
            onChange={(e) => {
              setSelected(false)
              setQuery(e.target.value)
            }}
            placeholder="Search by rollno or Client Id"
            className="w-[400px] mb-4"
          />
          <Button onClick={() => setSelected(true)} variant="wz">Search</Button>
        </div>
        {selected && <ListMeetings person="client" query={query} />}
      </TabsContent>
      <TabsContent value="coach">
        <div className="mt-4">
          <Label htmlFor="search" className="mb-2">Enter Coach ID</Label>
          <Input
            value={query}
            id="search"
            onChange={(e) => {
              setSelected(false)
              setQuery(e.target.value)
            }}
            placeholder="Search by rollno or Coach Id"
            className="w-[400px] mb-4"
          />
          <Button onClick={() => setSelected(true)} variant="wz">Search</Button>
        </div>
        {selected && <ListMeetings person="coach" query={query} />}
      </TabsContent>
    </Tabs>
  </div>;
}

function ListMeetings({ person, query }) {
  const [loading, setLoading] = useState(false);
  const { isLoading, error, data } = useSWR(
    `app/meeting/person-list?person=${person}&query=${query}`,
    () => getMeetingPersonList(person, query)
  );

  const router = useRouter();

  if (isLoading) return <ContentLoader />

  if (error || !Boolean(data.data) || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const meeting = data.data;
  async function joinMeeting() {
    try {
      setLoading(true);
      const response = await sendData(
        "verifyClientMeeting?wellnessZLink=" + meeting.wellnessZLink,
        { rollno: meeting.rollno, person }
      );
      if (!response.status) throw new Error(response.message);
      router.push(response.data)
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="mt-10">
    <h5>{meeting.meetingType.toUpperCase()}</h5>
    <p>{meeting.topics}</p>
    <p>{meeting.baseLink}</p>
    <Button onClick={joinMeeting} disabled={loading} className="mt-2">Join</Button>
  </div>
}