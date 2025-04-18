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
import { coachPortfolioFields } from "@/config/data/ui";

export default function CoachDetailsCard({ coachData }) {
  return <Card className="bg-white rounded-[18px] shadow-none">
    <CardHeader className="relative flex items-start gap-4 md:gap-8">
      <Avatar className="w-[100px] h-[100px]">
        <AvatarImage src={coachData.profilePhoto} />
        <AvatarFallback>SN</AvatarFallback>
      </Avatar>
      <div>
        <h4 className="my-2">{coachData.name}</h4>
        <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1] mb-2">ID #{coachData.coachId}</p>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <h4>About</h4>
        <Button variant="wz_ghost" size="sm">Edit</Button>
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2 pb-4 border-b-1">{coachData.about}</p>
      <div className="mt-4 flex items-center justify-between">
        <h4>Specialization</h4>
        <Button variant="wz_ghost" size="sm">Edit</Button>
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2 pb-4 border-b-1">{coachData.specialization}</p>
      <div className="mt-4 flex items-center justify-between">
        <h4>Personal Information</h4>
        <Button variant="wz_ghost" size="sm">
          <Pencil />
          Edit
        </Button>
      </div>
      <div className="mt-4 pl-4 pb-4 border-b-1">
        {coachPortfolioFields.map(field => <div key={field.id} className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
          <p>{field.title}</p>
          <p className="text-[var(--dark-2)] col-span-2">:&nbsp;{coachData[field.name]}</p>
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