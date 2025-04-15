"use client"
import { AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Avatar } from "@radix-ui/react-avatar";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

      <ActivityTool />
    </div>
  </div>
}

function ActivityTool() {
  const [api, setApi] = useState(null)
  const [current, setCurrent] = useState(0)

  const onSelect = () => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
  }

  const scrollToIndex = (index) => {
    if (!api) return
    api.scrollTo(index)
  }

  useEffect(() => {
    if (!api) return

    api.on("select", onSelect)

    // Cleanup
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return <Card className="grow relative !bg-transparent py-0 border-0 shadow-none">
    <CardHeader className="w-full absolute top-0 px-0 flex translate-y-[-105%] items-center justify-between">
      <CardTitle>Activity</CardTitle>
      <Button variant="wz">+ Add</Button>
    </CardHeader>
    <CardContent className="pt-2 px-0">
      <Carousel setApi={setApi}>
        <CarouselContent>
          {Array.from({ length: 4 }, (_, i) => i).map(item => <CarouselItem
            key={item}
            className="max-h-[180px] aspect-video relative"
          >
            <Image
              fill
              src="/login-thumbnail.png"
              alt=""
              className="bg-gray-900 object-cover"
            />
          </CarouselItem>)}
        </CarouselContent>
      </Carousel>

      <div className="bg-[var(--dark-1)]/50 absolute bottom-2 left-1/2 translate-x-[-50%] px-[4px] py-[2px] flex justify-center gap-[2px] rounded-full">
        {Array.from({ length: 4 }, (_, i) => i).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={cn(
              "w-[10px] h-[10px] rounded-full transition-colors",
              current === index ? "bg-[var(--accent-1)]" : "bg-[#D9D9D9] hover:bg-gray-400",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </CardContent>
  </Card>
}