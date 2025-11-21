"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Eye, FileText, Trash2 } from "lucide-react";
import useSWR, { mutate } from "swr";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { fetchData, sendData } from "@/lib/api";
import { youtubeVideoId } from "@/lib/utils";
import YouTubeEmbed from "@/components/common/YoutubeEmbed";
import PDFPreview from "@/components/common/PDFPreview";
import { DialogTrigger } from "@/components/ui/dialog";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const FALLBACK_THUMBNAIL = "/not-found.png";

export default function Page() {
  const { id: courseId } = useParams();
  const { isLoading, error, data } = useSWR(
    `app/courses/details/${courseId}`,
    () => fetchData(`app/courses/details/${courseId}`)
  );

  if (isLoading) return <ContentLoader />;

  if (error || data.status_code !== 200) {
    return <ContentError title={error || data.message} />;
  }

  const course = data?.data ?? {};
  const lectures = Array.isArray(course.lectures) ? course.lectures : [];

  return (
    <div className="content-container content-height-screen py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-1">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-slate-900">
              {course.title || "Course details"}
            </h1>
            <p className="text-sm text-slate-500">
              {lectures.length} lecture{lectures.length === 1 ? "" : "s"} •{" "}
              {formatDateTime(course.createdAt)}
            </p>
          </div>
          <DeleteCourse courseId={course._id} />
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
          <div className="flex flex-col gap-6">
            <CourseThumbnail thumbnail={course.thumbnail} title={course.title} />
            <CourseMeta course={course} />
          </div>
          <LecturesPanel lectures={lectures} />
        </div>
      </div>
    </div>
  );
}

function CourseThumbnail({ thumbnail, title }) {
  const heroSrc = thumbnail || FALLBACK_THUMBNAIL;

  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-900/80 p-0.5 shadow-[0px_18px_48px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-video w-full max-h-[400px] overflow-hidden rounded-[15px] bg-slate-900">
        {heroSrc ? (
          <>
            <Image
              src={heroSrc}
              alt={title ? `${title} thumbnail` : "Course thumbnail"}
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white/50">
            Thumbnail not available
          </div>
        )}
        <div className="absolute left-5 bottom-5 flex flex-col gap-1 text-white drop-shadow">
          <span className="text-xs uppercase tracking-wide text-white/70">
            Course Preview
          </span>
          <span className="text-xl font-semibold">{title || "Untitled course"}</span>
        </div>
      </div>
    </div>
  );
}

function CourseMeta({ course }) {
  const categories = Array.isArray(course.categories) ? course.categories : [];
  const metaInfo = [
    { label: "Language", value: course.language || "Not specified" },
    { label: "Amount", value: formatCurrency(course.amount) },
    { label: "Created on", value: formatDateTime(course.createdAt) },
    { label: "Updated on", value: formatDateTime(course.updatedAt) },
  ];

  return (
    <section className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-[0px_14px_32px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Overview
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            {course.title || "Untitled course"}
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          {course.description || "No description has been added for this course yet."}
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          {metaInfo.map((item) => (
            <div key={item.label} className="rounded-[10px] border border-slate-100 bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {item.label}
              </dt>
              <dd className="text-sm font-semibold text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Categories
          </p>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No categories available.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function LecturesPanel({ lectures }) {
  if (!lectures.length) {
    return (
      <aside className="rounded-[16px] border border-dashed border-slate-200 bg-white/60 p-6 text-center shadow-[0px_14px_32px_rgba(15,23,42,0.06)]">
        <p className="text-base font-semibold text-slate-900">No lectures yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Once lectures are added to this course, they will appear here.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-[0px_14px_32px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lectures</p>
        <h3 className="text-lg font-semibold text-slate-900">
          {lectures.length} lecture{lectures.length === 1 ? "" : "s"}
        </h3>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {lectures.map((lecture, index) =>
          lecture.lectureType === "pdf" ? (
            <LecturePdfCard key={lecture._id || index} lecture={lecture} index={index} />
          ) : (
            <LectureVideoCard key={lecture._id || index} lecture={lecture} index={index} />
          )
        )}
      </div>
    </aside>
  );
}

function LectureVideoCard({ lecture, index }) {
  return (
    <article className=" gap-3 rounded-[12px] border border-slate-100 bg-slate-50/80 p-3">
      <YouTubeEmbed link={lecture?.videoLectureRef?.ytLink} />

      <div className="flex flex-1 flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Lecture {index + 1} • Video
        </p>
        <p className="text-sm font-semibold text-slate-900">
          {lecture.title || "Untitled lecture"}
        </p>
        {lecture.description ? (
          <p className="text-sm text-slate-500 line-clamp-2">{lecture.description}</p>
        ) : null}
      </div>
    </article>
  );
}

function LecturePdfCard({ lecture, index }) {
  return (
    <article className="flex items-start gap-3 rounded-[12px] border border-dashed border-slate-200 bg-white p-3">
      <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-slate-50 text-slate-500 border-1">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-1">
        {/* <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Lecture {index + 1} • PDF
        </p> */}
        <p className="text-sm font-semibold text-slate-900">
          {lecture.title || "Untitled lecture"}
        </p>
        {lecture.description ? (
          <p className="text-sm text-slate-500 line-clamp-2">{lecture.description}</p>
        ) : null}
      </div>
      <PDFPreview fileLink={lecture.pdfLink}>
        <DialogTrigger className="ml-auto">
          <Eye className="text-slate-400 hover:text-black w-[16px] h-[16px]" />
        </DialogTrigger>
      </PDFPreview>
    </article>
  );
}

function formatDateTime(value) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLectureVideoThumbnail(lecture) {
  if (!lecture || typeof lecture !== "object") return null;
  if (lecture.thumbnail) return lecture.thumbnail;
  const possibleLinks = [
    lecture.videoUrl,
    lecture.videoLink,
    lecture.url,
    lecture.link,
    lecture.assetUrl,
    lecture.video,
    lecture.sourceUrl,
    lecture?.assets?.videoUrl,
    Array.isArray(lecture?.assets)
      ? lecture.assets.find((asset) => asset?.url)?.url
      : null,
  ].filter(Boolean);

  for (const link of possibleLinks) {
    const videoId = youtubeVideoId(link);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  return null;
}

function DeleteCourse({ courseId }) {
  const router = useRouter()
  async function deleteCourse(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData(`app/courses/details/${courseId}`, { courseId }, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("app/courses/all");
      router.push("/coach/courses")
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <DualOptionActionModal
    description="Are you sure of deleting this course!"
    action={(setLoading, btnRef) => deleteCourse(setLoading, btnRef)}
  >
    <AlertDialogTrigger
      variant="destructive"
      asChild
    >
      <Button>
        <Trash2 className="w-[28px] h-[28px] text-white rounded-[4px]" />
        Delete
      </Button>
    </AlertDialogTrigger>
  </DualOptionActionModal>
}