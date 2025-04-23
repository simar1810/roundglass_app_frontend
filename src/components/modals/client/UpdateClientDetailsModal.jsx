import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { clientDetailsFields } from "@/config/data/ui";
import { sendDataWithFormData } from "@/lib/api";
import { getObjectUrl } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { format, parse } from "date-fns";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

const formFields = ["name", "email", "mobileNumber", "dob", "age", "height", "weight", "heightUnit", "weightUnit", "gender"];

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
      for (const [field, value] of data.entries()) {
        console.log(field, value)
      }
      throw new Error("this is error!")
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
        src={getObjectUrl(value) || profilePhoto || "/"}
        alt=""
        height={200}
        width={200}
        onClick={() => fileRef.current.click()}
        className="max-w-[100px] w-full bg-[var(--comp-3)] rounded-full border-[var(--accent-1)] object-contain aspect-square"
      />
      : <div
        onClick={() => fileRef.current.click()}
        className="max-w-[100px] w-full bg-[var(--comp-3)] rounded-full border-[var(--accent-1)] aspect-square"
      />}
  </>
}

function generateDefaultPayload(obj) {
  const payload = {};
  for (const field of formFields) {
    payload[field] = obj[field];
  }
  if (!payload.weightUnit) payload.weightUnit = "kgs"
  if (!payload.heightUnit) payload.heightUnit = "feet"
  if (!payload.weight) payload.weight = 0;
  if (!payload.height) payload.height = 0;
  if (payload.dob && payload.dob.split("-")[0].length === 2) {
    payload.dob = format(parse(payload.dob, 'dd-MM-yyyy', new Date()), "yyyy-MM-dd");
  }
  return payload;
}

function Component({ field, formData, setFormData }) {
  switch (field.type) {
    case 2:
      return <HeightFormControl
        key={field.id}
        height={formData.height}
        heightUnit={formData.heightUnit}
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
  height,
  heightUnit,
  setFormData
}) {

  function onFeetChange(e) {
    const newFeet = e.target.value;
    setFeet(newFeet);
    const cm = (parseFloat(newFeet) || 0) * 30.48 + (parseFloat(inches) || 0) * 2.54;
    setFormData(prev => ({ ...prev, height: cm.toFixed(2) }));
  };

  function onInchesChange(e) {
    const newInches = Number(e.target.value);
    if (newInches < 0) return;
    const feet = Number((newInches / 12).toFixed(0));
    setFormData(prev => ({
      ...prev,
      height: prev.height + (feet * 30.48) + ((newInches % 12) * 2.54)
    }));
  };

  return <div className="mt-2">
    <div className="flex items-center gap-4 justify-between">
      <p className="mr-auto">Last Height</p>
      <RadioGroup value={heightUnit} className="flex items-center gap-2">
        <input
          id="feet"
          value="feet"
          type="radio"
          className="w-[14px] h-[14px]"
          checked={heightUnit === "feet"}
          onChange={() => setFormData(prev => ({ ...prev, heightUnit: "feet" }))}
        />
        <Label htmlFor="feet">
          Ft In
        </Label>
        <input
          id="cms"
          value="cms"
          type="radio"
          checked={heightUnit === "cms"}
          className="w-[14px] h-[14px]"
          onChange={() => setFormData(prev => ({ ...prev, heightUnit: "cms" }))}
        />
        <Label htmlFor="cms">
          Cm
        </Label>
      </RadioGroup>
    </div>
    {heightUnit === "feet"
      ? <div className="flex items-center gap-3">
        <FormControl
          type="number"
          value={((parseFloat(height) || 0) / 30.48).toFixed(0)}
          onChange={onFeetChange}
          placeholder="Feet"
        />
        <FormControl
          type="number"
          value={((height % 30.48) / 2.54).toFixed(0)}
          onChange={onInchesChange}
          placeholder="Inches"
        />
      </div>
      : <FormControl
        type="number"
        value={height}
        onChange={e => setFormData(prev => ({ ...prev, height: e.target.value }))}
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