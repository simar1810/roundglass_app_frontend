"use client";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { sendData, sendDataWithFormData } from "@/lib/api";
import { getObjectUrl } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { PlusCircle, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import imageCompression from "browser-image-compression";

export default function Page() {
  const coachId = useAppSelector(state => state.coach.data._id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    link: "",
    isActive: true,
    coachId: coachId,
    file: ""
  })

  const fileRef = useRef();

  async function saveProgramDetails() {
    try {
      setLoading(true);
      const data = new FormData();
      for (const field of ["name", "link", "isActive", "coachId"]) {
        if (!Boolean(formData[field])) throw new Error(`${field} is required!`);
        data.append(field, formData[field]);
      }
      data.append("file", await imageCompression(formData.file, { maxSizeMB: 0.25 }))
      const response = await sendDataWithFormData(`app/add-program`, data);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("coachHomeTrial");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="content-container">
    <div className="max-w-[650px] mx-auto">
      <h4 className="mb-6">Program Details</h4>
      <FormControl
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Program Title"
        className="block mb-4"
      />
      <FormControl
        value={formData.link}
        onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
        placeholder="Program Link"
        className="block mb-4"
      />
      {formData.file
        ? <div className="relative">
          <Image
            alt=""
            src={getObjectUrl(formData.file) || "/not-found.png"}
            onError={e => e.target.src = "/not-fonud.png"}
            height={550}
            width={550}
            className="w-full h-[200px] object-contain object-center"
            onClick={() => fileRef.current.click()}
          />
          <X
            className="absolute top-4 right-4 opacity-70 cursor-pointer"
            onClick={() => setFormData(prev => ({ ...prev, file: "" }))}
          />
        </div>
        : <div onClick={() => fileRef.current.click()} className="h-[200px] flex items-center justify-center border-1 border-gray-300 rounded-[8px] cursor-pointer">
          <PlusCircle className="text-[var(--accent-1)]" />
        </div>}
      <FormControl
        type="file"
        hidden
        ref={fileRef}
        onChange={e => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
      />
      <Button
        disabled={loading}
        className="mx-auto block mt-6"
        variant="wz"
        onClick={saveProgramDetails}
      >
        Save
      </Button>
    </div>
  </div>
}