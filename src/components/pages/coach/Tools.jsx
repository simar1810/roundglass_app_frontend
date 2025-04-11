import { AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Avatar } from "@radix-ui/react-avatar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Tools({
  calories = 1543,
  distance = 1.25,
  moves = 122
}) {
  return <div className="mt-10">
    <h4 className="mb-4">Quick Star Tools</h4>
    <div className="flex gap-4">
      <Card className="w-[180px] !border-0 !shadow-none gap-2 rounded-[10px]">
        <CardHeader className="text-[14px] font-semibold">Calorie Counter</CardHeader>
        <CardContent>
          <Avatar className="w-fit block mx-auto">
            <AvatarImage
              className="w-[64px] h-[64px]"
              src="/svgs/flame-icon.svg"
            />
          </Avatar>
          <Link href="coach/calorie-counter" className="block text-center text-[var(--accent-1)] text-[14px] mt-2">Calculate Now</Link>
        </CardContent>
      </Card>

      <Card className="w-[180px] !border-0 !shadow-none gap-2 rounded-[10px]">
        <CardHeader className="text-[14px] font-semibold">Ideal Weight</CardHeader>
        <CardContent>
          <Avatar className="w-fit block mx-auto">
            <AvatarImage
              className="w-[64px] h-[64px]"
              src="/svgs/weight-icon.svg"
            />
          </Avatar>
          <Link href="/coach/weight" className="block text-center text-[var(--accent-1)] text-[14px] mt-2">Check Now</Link>
        </CardContent>
      </Card>

      <Card className="w-[400px] border-0 !shadow-none gap-2 rounded-[10px]">
        <CardHeader className="text-[14px] font-semibold flex items-center justify-between gap-[4px]">
          <p>Activity</p>
          <Link href="/" className="text-[var(--dark-2)] font-medium flex items-center gap-[2px]">
            <span>Connect Health Data</span>
            <ChevronRight className="w-[16px] h-[16px]" />
          </Link>
        </CardHeader>
        <CardContent className="mt-8">
          <div className="grid grid-cols-3 gap-[32px]">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  className="w-[30px] h-[30px]"
                  src="/svgs/flame-icon.svg"
                />
              </Avatar>
              <div>
                <h4>{calories}</h4>
                <p className="text-[var(--dark-2)]">Cal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  className="w-[30px] h-[30px]"
                  src="/svgs/flame-icon.svg"
                />
              </Avatar>
              <div>
                <h4>{distance}</h4>
                <p className="text-[var(--dark-2)]">Km</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  className="w-[30px] h-[30px]"
                  src="/svgs/flame-icon.svg"
                />
              </Avatar>
              <div>
                <h4>{moves}</h4>
                <p className="text-[var(--dark-2)]">Moves</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
}