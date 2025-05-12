import RecipeModal from "@/components/modals/RecipeModal";
import DeleteRecipeModal from "@/components/modals/tools/DeleteRecipeModal";
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

export default function RecipeDisplayCard({ plan }) {
  return <Card className="p-0 rounded-[4px] shadow-none gap-2">
    <CardHeader className="relative aspect-video">
      <Image
        fill
        src={plan.image || "/"}
        alt=""
        className="object-cover bg-black"
      />
      {plan.tag === "ADMIN"
        ? <Badge variant="wz" className="text-[9px] font-semibold absolute top-2 left-2">Admin</Badge>
        : <Badge variant="wz" className="text-[9px] font-semibold absolute top-2 left-2">Custom</Badge>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="text-white w-[16px] !absolute top-2 right-2">
          {!plan.admin && <EllipsisVertical className="cursor-pointer" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-semibold">
          <RecipeModal type="edit" recipe={plan} />
          <DropdownMenuSeparator className="mx-1" />
          <DropdownMenuLabel className="!text-[12px]  font-semibold py-0">
            <DeleteRecipeModal _id={plan._id} />
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent className="p-2 pt-1">
      <div className="flex items-start justify-between gap-1">
        <h5 className="text-[14px]">{plan.title}</h5>
        {/* <Button variant="wz" size="sm" className="h-auto p-1">Assign</Button> */}
      </div>
      <p className="text-[12px] text-[var(--dark-1)]/25 leading-tight mt-1">
        {plan.ingredients}
      </p>
    </CardContent>
  </Card>
}