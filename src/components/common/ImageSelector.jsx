import { cn, getObjectUrl } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export default function ImageSelector({
  label,
  file,
  onFileChange,
  defaultImageLink,
  className
}) {
  const inputRef = useRef()

  const url = createImagePreviewLink(file, defaultImageLink)
  return <div className={cn("relative", className)}>
    {file && <X
      className="w-[20px] h-[20px] p-[2px] absolute translate-y-[80%] top-0 right-0 bg-[var(--accent-2)] text-white rounded-full cursor-pointer"
      onClick={() => onFileChange()}
    />}
    <label className="mb-2 font-semibold label">{label}</label>
    <div className="bg-[var(--comp-1)] border-1 border-dashed cursor-pointer" onClick={() => inputRef.current.click()}>
      {url
        ? <Image
          src={url}
          alt=""
          height={400}
          width={400}
          onError={e => e.target.src = "/not-found.png"}
          className="w-full object-contain object-center max-h-[250px]"
        />
        : <div
          className="min-h-[200px] border-1 border-dashed rounded-[4px] flex items-center justify-center"
        >
          <Upload />
        </div>}
    </div>
    <input
      hidden
      type="file"
      ref={inputRef}
      accept="image/*"
      onChange={e => onFileChange(e.target.files[0])}
    />
  </div>
}

function createImagePreviewLink(file, defaultImageLink) {
  if (file instanceof File) return getObjectUrl(file)
  return defaultImageLink || "";
}