import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import Image from "next/image";

export default function MealDisplayCard() {
  return <Card className="p-0 rounded-[4px] shadow-none gap-2">
    <CardHeader className="relative aspect-video">
      <Image
        fill
        src="/"
        alt=""
        className="object-cover bg-black"
      />
      <Badge variant="wz" className="text-[9px] font-semibold absolute top-2 left-2">Custom</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="text-white w-[16px] !absolute top-2 right-2">
          <EllipsisVertical className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-semibold">
          <DropdownMenuLabel className="!text-[12px]  font-semibold py-0">
            Edit
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-1" />
          <DropdownMenuLabel className="!text-[12px] font-semibold text-[var(--accent-2)] py-0">
            Delete
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent className="p-2">
      <div className="flex items-center">
        <h5 className="text-[12px]">Roasted Sweet Potato & Eggplant Pitas Meal</h5>
        <Button variant="wz" size="sm" className="h-auto p-1">Assign</Button>
      </div>
      <p className="text-[14px] text-[var(--dark-1)]/25 mt-2">
        Lorem ipsum dolor sit.
      </p>
    </CardContent>
  </Card>
}