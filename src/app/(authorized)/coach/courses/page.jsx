"use client"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData } from "@/lib/api";
import Image from "next/image";

export default function Page() {
  const [value, setValue] = useState("")
  return <div className="content-container content-height-screen">
    <Header value={value} setValue={setValue} />
    <CourseLintings />
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
    <Link href="/coach/courses/creation">Create</Link>
  </div>
}

function CourseLintings() {
  const { isLoading, error, data } = useSWR(
    "app/courses/all",
    () => fetchData("app/courses/details")
  );

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  console.log(data.data)
  const courses = data.data ?? []
  return <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {courses.map(course => <CourseDetails
      key={course._id}
      course={course}
    />)}
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