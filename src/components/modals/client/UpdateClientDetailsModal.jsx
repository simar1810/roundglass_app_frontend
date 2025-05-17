import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { clientDetailsFields } from "@/config/data/ui";
import { sendDataWithFormData } from "@/lib/api";
import { getObjectUrl } from "@/lib/utils";
import { format, parse } from "date-fns";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Image as ImageIcon } from "lucide-react"

const formFields = ["name", "email", "mobileNumber", "dob", "age", "heightCms", "heightFeet", "heightInches", "weight", "heightUnit", "weightUnit", "gender", "file"];

function generateDefaultPayload(obj) {
  const payload = {};
  for (const field of formFields) {
    payload[field] = obj[field] || "";
  }
  if (!payload.weightUnit) payload.weightUnit = "kgs"
  if (!payload.heightUnit) payload.heightUnit = "inches"
  if (payload.dob && payload.dob.split("-")[0].length === 2) {
    payload.dob = format(parse(payload.dob, 'dd-MM-yyyy', new Date()), "yyyy-MM-dd");
  }
  return payload;
}

export default function UpdateClientDetailsModal({ clientData }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => generateDefaultPayload(clientData));

  const closeBtnRef = useRef();
  const fileRef = useRef();

  async function updateClientDetails() {
    try {
      const data = new FormData();
      for (const field of formFields) {
        data.append(field, formData[field])
      }
      const response = await sendDataWithFormData(`app/updateClient?id=${clientData._id}`, data, "PUT");
      if (!response.data) throw new Error(response.message);
      toast.success(response.message);
      mutate(`clientDetails?id=${clientData._id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger className="text-[var(--accent-1)] text-[14px] font-semibold pr-3">
      Edit
    </DialogTrigger>
    <DialogContent className="!max-w-[650px] text-center border-0 px-4 lg:px-10 overflow-auto gap-0">
      <DialogTitle>Personal Information</DialogTitle>
      <div className="mt-4">
        <ProfilePhoto
          fileRef={fileRef}
          value={formData.file}
          setFormData={setFormData}
          profilePhoto={clientData.profilePhoto}
        />
        <div className="text-left mt-8 grid grid-cols-2 gap-x-4 gap-y-2 [&_.label]:font-[500] text-[14px]">
          {clientDetailsFields.map(field => <Component
            key={field.id}
            field={field}
            formData={formData}
            setFormData={setFormData}
          />)}
        </div>
        <Button
          variant="wz"
          onClick={updateClientDetails}
          disabled={loading}
          className="mt-8"
        >
          Save details
        </Button>
        <DialogClose ref={closeBtnRef} />
      </div>
    </DialogContent>
  </Dialog>
}

function ProfilePhoto({ profilePhoto, value, fileRef, setFormData }) {
  return <>
    <input
      type="file"
      className="hidden"
      ref={fileRef}
      onChange={e => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
    />
    {value || profilePhoto
      ? <Image
        src={getObjectUrl(value) || profilePhoto || "/not-found.png"}
        alt=""
        height={200}
        width={200}
        onClick={() => fileRef.current.click()}
        className="max-w-[100px] w-full bg-[var(--comp-3)] rounded-full border-[var(--accent-1)] object-contain aspect-square"
      />
      : <div
        onClick={() => fileRef.current.click()}
        className="max-w-[100px] w-full bg-[var(--comp-3)] flex items-center justify-center rounded-full border-[var(--accent-1)] aspect-square"
      >
        <ImageIcon className="w-[20px] h-[20px]" />
      </div>}
  </>
}

function Component({ field, formData, setFormData }) {
  switch (field.type) {
    case 2:
      return <HeightFormControl
        key={field.id}
        formData={formData}
        setFormData={setFormData}
      />;
    case 3:
      return <WeightFormControl
        key={field.id}
        weight={formData.weight}
        weightUnit={formData.weightUnit}
        setFormData={setFormData}
      />;
    case 4:
      return <SelectControl
        key={field.id}
        {...field}
      />;
    default:
      return <FormControl
        key={field.id}
        value={formData[field.name]}
        onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
        label={field.label}
        placeholder={"Please enter the value."}
        {...field}
      />;
  }
}

function HeightFormControl({
  formData,
  setFormData
}) {
  if (formData.heightUnit.toLowerCase() === "cms") return

  function changeHeightUnit(unit) {
    if (unit.toLowerCase() === "inches") {
      (feet * 30.48) + (inches * 2.54)
    } else {

    }
  }

  return <div className="mt-2">
    <div className="flex items-center gap-4 justify-between">
      <p className="mr-auto">Last Height</p>
      <RadioGroup value={formData.heightUnit} className="flex items-center gap-2">
        <input
          id="feet"
          value="feet"
          type="radio"
          className="w-[14px] h-[14px]"
          checked={formData.heightUnit.toLowerCase() === "inches"}
          onChange={() => setFormData(prev => ({ ...prev, heightUnit: "inches" }))}
        />
        <Label htmlFor="feet">
          Ft In
        </Label>
        <input
          id="cms"
          value="cms"
          type="radio"
          checked={formData.heightUnit.toLowerCase() === "cm"}
          className="w-[14px] h-[14px]"
          onChange={() => setFormData(prev => ({ ...prev, heightUnit: "cm" }))}
        />
        <Label htmlFor="cms">
          Cm
        </Label>
      </RadioGroup>
    </div>
    {formData.heightUnit === "inches"
      ? <div className="flex items-center gap-3">
        <FormControl
          type="number"
          value={formData.heightFeet}
          onChange={e => setFormData(prev => ({ ...prev, heightFeet: e.target.value }))}
          placeholder="Feet"
        />
        <FormControl
          type="number"
          value={formData.heightInches}
          onChange={e => setFormData(prev => ({ ...prev, heightInches: e.target.value }))}
          placeholder="Inches"
        />
      </div>
      : <FormControl
        type="number"
        value={formData.heightCms}
        onChange={e => setFormData(prev => ({ ...prev, heightCms: e.target.value }))}
        placeholder="CMs"
      />}
  </div>
}

function WeightFormControl({
  weight,
  weightUnit = "KGs",
  setFormData
}) {

  return <div className="mt-2">
    <div className="flex items-center gap-4 justify-between">
      <p className="mr-auto">Last Weight</p>
      <RadioGroup value={weightUnit} className="flex items-center gap-2">
        <input
          id="kgs"
          value="kgs"
          type="radio"
          className="w-[14px] h-[14px]"
          checked={weightUnit === "kgs"}
          onChange={() => setFormData(prev => ({ ...prev, weightUnit: "kgs" }))}
        />
        <Label htmlFor="kgs">
          KGs
        </Label>
        <input
          id="pounds"
          value="pounds"
          type="radio"
          checked={weightUnit === "pounds"}
          className="w-[14px] h-[14px]"
          onChange={() => setFormData(prev => ({ ...prev, weightUnit: "pounds" }))}
        />
        <Label htmlFor="pounds">
          LBS
        </Label>
      </RadioGroup>
    </div>
    <FormControl
      value={weight}
      onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))}
      placeholder="Please enter the weight"
    />
  </div>
}