"use client"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData } from "@/lib/api";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/utils";
import { toast } from "sonner";

export default function Page() {
  const searchParams = useSearchParams()
  const isFirstTime = searchParams.get("isFirstTime")
  const [value, setValue] = useState("")
  return <div className="content-container content-height-screen">
    <Suspense>
      <Header value={value} setValue={setValue} />
      <CourseLintings isFirstTime={isFirstTime === "true"} />
    </Suspense>
  </div>
}

function Header({ value, setValue }) {
  return <div className="flex items-center justify-between gap-4">
    <h4>Courses</h4>
    <Input
      className="max-w-sm ml-auto"
      placeholder="search by title..."
      value={value}
      onChange={e => setValue(e.target.value)}
    />
    <Link
      href="/coach/courses/creation"
      className="bg-[var(--accent-1)] px-4 py-2 rounded-full text-white font-bold"
    >Create</Link>
  </div>
}

function CourseLintings({ isFirstTime }) {
  const router = useRouter()
  const { isLoading, error, data } = useSWR(
    "app/courses/all",
    () => fetchData("app/courses/details")
  );

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const courses = data.data ?? []

  useEffect(function () {
    if (isFirstTime) router.replace("/coach/courses")
  }, [isFirstTime])

  if (courses.length === 0) return <div className="min-h-[400px] bg-[var(--comp-1)] flex items-center justify-center">
    No courses Created.
  </div>

  return <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {courses.map(course => <CourseDetails
      key={course._id}
      course={course}
    />)}
    {isFirstTime && <WarningModalToVerifyYTAccount />}
  </div>
}

function CourseDetails({ course }) {
  return <div className="bg-[var(--comp-1)] border-1 rounded-[6px] overflow-clip">
    <Link href={`/coach/courses/${course._id}`}>
      <Image
        src={course.thumbnail || "/not-found.png"}
        onError={e => e.target.src = "/not-found.png"}
        height={200}
        width={400}
        className="w-full aspect-video object-cover border-b-1"
        alt=""
      /></Link>
    <div className="p-4 ">
      <p className="font-bold">{course.title}</p>
      <p className="text-sm text-[#808080]">{course.description}</p>
    </div>
  </div>
}

function WarningModalToVerifyYTAccount() {
  function copyLink() {
    {
      copyText("https://www.youtube.com/verify")
      toast.success("Link Copied.")
    }
  }
  return <Dialog defaultOpen={true}>
    <DialogTrigger />
    <DialogContent className="p-0">
      <DialogTitle className="text-red-500 flex items-center gap-4 p-4 border-b-1">
        <TriangleAlert />
        Warning:
      </DialogTitle>
      <div className="p-4">
        <p className="mb-4">Warning: Your YouTube account is unverified. Video uploads are limited to 15 minutes. Verify your account at the following link to enable longer uploads.</p>
        <div className="flex items-center gap-4">
          <div onClick={copyLink} className="grow border-1 px-4 py-2 text-sm bg-[var(--comp-1)] rounded-[4px] select-none cursor-pointer">
            https://www.youtube.com/verify
          </div>
          <Button onClick={copyLink}>
            <Copy />
          </Button>
        </div>
        <DialogClose asChild>
          <Button
            variant="wz"
            className="mt-4"
          >
            Verified
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
}