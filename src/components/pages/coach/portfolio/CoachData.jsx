import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CoachData() {
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="links">
      <TabsList className="w-full bg-transparent p-0 mb-4 grid grid-cols-2 border-b-2 rounded-none">
        <TabsTrigger
          className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
          value="links"
        >
          Links
        </TabsTrigger>
        <TabsTrigger
          className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
          value="awards"
        >
          Awards
        </TabsTrigger>
      </TabsList>
      <CoachSMLinks />
      <CoachAwards />
    </Tabs>
  </div>
}

function CoachSMLinks() {
  return <TabsContent value="links">
    <div>
      {Array.from({ length: 5 }, (_, i) => i).map(item => <div
        key={item}
        className="px-4 mb-2 flex items-center gap-4"
      >
        <Image
          src="/svgs/fb-icon.svg"
          alt=""
          height={32}
          width={32}
          className="object-contain"
        />
        <Link target="_blank" href="/">https://www.facebook.com/account</Link>
      </div>)}
    </div>
    <Button className="block mx-auto mt-10" variant="wz">Edit</Button>
  </TabsContent>
}

function CoachAwards() {
  return <TabsContent value="awards">
    <div className="flex items-center gap-2 justify-between">
      <h4>4 Awards Available</h4>
      <Button variant="wz">
        <Trophy />
        Add Award
      </Button>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
      {Array.from({ length: 4 }, (_, i) => i).map(item => <div key={item} className="flex items-center gap-4">
        <Image
          src="/illustrations/award.png"
          alt=""
          height={64}
          width={64}
          className="object-contain"
        />
        <p>Lorem ipsum dolor sit.</p>
      </div>)}
    </div>
  </TabsContent>
}