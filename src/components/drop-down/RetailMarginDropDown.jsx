import { PenLine } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";

export default function RetailMarginDropDown({ margins, setMargin }) {
  return <DropdownMenu className="absolute top-4 right-4">
    <DropdownMenuTrigger>
      <PenLine className="w-[20px] h-[20px] bg-[var(--accent-1)] text-white p-[3px] rounded-[4px] absolute top-4 right-4 cursor-pointer" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="translate-x-[105%]">
      <DropdownMenuLabel className="font-bold">Select your margin</DropdownMenuLabel>
      {margins.map((margin, index) => <DropdownMenuItem
        key={index}
        checked={true}
        onClick={() => setMargin(margin)}
        className="cursor-pointer"
      >
        {margin}
      </DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>
}