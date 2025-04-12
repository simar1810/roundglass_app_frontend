import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import {
  Link2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoachDetailsCard() {
  return <Card className="bg-white rounded-[18px] shadow-none">
    <CardHeader className="relative flex items-start gap-4 md:gap-8">
      <Avatar className="w-[100px] h-[100px]">
        <AvatarImage src="/" />
        <AvatarFallback>SN</AvatarFallback>
      </Avatar>
      <div>
        <h4 className="my-2">John Lane</h4>
        <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1] mb-2">ID #123456</p>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <h4>About</h4>
        <Button variant="wz_ghost" size="sm">Edit</Button>
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2 pb-4 border-b-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
      <div className="mt-4 flex items-center justify-between">
        <h4>Specialization</h4>
        <Button variant="wz_ghost" size="sm">Edit</Button>
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2 pb-4 border-b-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
      <div className="mt-4 flex items-center justify-between">
        <h4>Personal Information</h4>
        <Button variant="wz_ghost" size="sm">
          <Pencil />
          Edit
        </Button>
      </div>
      <div className="mt-4 pl-4 pb-4 border-b-1">
        {Array.from({ length: 10 }, (_, i) => i).map(item => <div key={item} className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
          <p>Email ID</p>
          <p className="text-[var(--dark-2)] col-span-2">:&nbsp;rowan.brown@gmail.com</p>
        </div>)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h4>Personal Portfolio</h4>
        <Button variant="wz_outline" size="sm">
          <Link2 />
          Go To Store
        </Button>
      </div>
    </CardContent>
  </Card>
}