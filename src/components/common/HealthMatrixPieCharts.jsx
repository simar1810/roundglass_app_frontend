"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateBMIFinal,
  calculateBMRFinal,
  calculateBodyAgeFinal,
  calculateBodyFatFinal,
  calculateIdealWeightFinal,
  calculateSMPFinal,
} from "@/lib/client/statistics";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Pencil } from "lucide-react";
import FormControl from "../FormControl";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { sendData } from "@/lib/api";
import { toast } from "sonner";
import { mutate } from "swr";
import { useParams } from "next/navigation";

const healtMetrics = [
  {
    title: "BMI",
    value: "23.4",
    desc: "Healthy",
    optimalRangeText: "Optimal: 18-23\nOverweight: 23-27\nObese: 27-32",
    icon: "/svgs/bmi.svg",
    name: "bmi",
    id: 1,
    getMaxValue: () => 25,
    getMinValue: () => 18,
  },
  {
    title: "Muscle",
    value: "15%",
    optimalRangeText:
      "Optimal Range: 32–36% for men, 24–30% for women\nAthletes: 38–42%",
    icon: "/svgs/muscle.svg",
    name: "muscle",
    id: 2,
    getMaxValue: () => 45,
    getMinValue: () => 30,
  },
  {
    title: "Fat",
    value: "15%",
    optimalRangeText: "Optimal Range:\n10–20% for Men\n20–30% for Women",
    icon: "/svgs/fats.svg",
    name: "fat",
    id: 3,
    getMaxValue: () => 20,
    getMinValue: () => 10,
  },
  {
    title: "Resting Metabolism",
    value: "15%",
    optimalRangeText:
      "Optimal Range: Varies by age,\ngender, and activity level",
    icon: "/svgs/meta.svg",
    name: "rm",
    id: 4,
    getMaxValue: () => 3000,
    getMinValue: () => 1500,
  },
  {
    title: "Weight",
    value: "65 Kg",
    desc: "Ideal 75",
    optimalRangeText:
      "Ideal weight Range:\n118. This varies by height and weight",
    icon: "/svgs/weight.svg",
    name: "idealWeight",
    id: 5,
    getMaxValue: (value) => value + 5,
    getMinValue: (value) => value - 5,
  },
  {
    title: "Body Age",
    value: "26",
    optimalRangeText:
      "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "bodyAge",
    id: 6,
    getMaxValue: () => 67,
    getMinValue: () => 33,
  },
];

export default function HealthMetrics({ data }) {
  const payload = {
    bmi: data.bmi || calculateBMIFinal(data),
    muscle: data.muscle || calculateSMPFinal(data),
    fat: data.fat || calculateBodyFatFinal(data),
    rm: data.rm || calculateBMRFinal(data),
    idealWeight: data.idealWeight || calculateIdealWeightFinal(data),
    bodyAge: data.bodyAge || calculateBodyAgeFinal(data),
  };
  try {
    return (
      <>
        {healtMetrics
          .filter((metric) => !isNaN(payload[metric.name]) && payload[metric.name] !== 0)
          .map((metric) => (
            <MetricProgress
              key={metric.id}
              {...metric}
              value={payload[metric.name]}
              maxPossibleValue={metric.getMaxValue(payload[metric.name])}
              minThreshold={metric.getMinValue(payload[metric.name])}
              name={metric.name}
              payload={payload}
              _id={data._id}
            />
          ))}
      </>
    );
  } catch (error) {
    return <div className="h-[200px]">
      No Health Matrix added!
    </div>
  }
}

export function MetricProgress({
  value = 15,
  title = "Muscle",
  maxThreshold = 100,
  minThreshold,
  icon,
  className,
  name,
  payload,
  _id
}) {
  const maxPossibleValue = maxThreshold + minThreshold;
  const progressPercentage = (value / maxPossibleValue) * 100;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = ((100 - progressPercentage) / 100) * circumference;

  const getColor = () => {
    if (value < minThreshold) return "#E8B903";
    if (value > maxThreshold) return "#FF0000";
    return "#67BC2A";
  };

  return (
    <Card className={cn("max-w-xs shadow-none relative", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Image
            src={icon}
            height={28}
            width={28}
            alt=""
            className="object-contain"
          />
          <h2 className="text-[16px] font-bold">{title}</h2>
          {/* <EditHealthMatric
            matrix={{
              title,
              name,
              defaultValue: payload,
              _id
            }}
            payload={payload}
          /> */}
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="relative flex items-center justify-center  mb -8">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth="16"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={getColor()}
              strokeWidth="16"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-4xl font-bold">{value}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditHealthMatric({ matrix, payload }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(payload)
  const closeBtnRef = useRef(null);
  const params = useParams()

  async function saveHealthMatrix() {
    try {
      setLoading(true);
      // throw new Error(`app/updateHealthMatrix?id=${matrix._id}&clientId=${params.id}`)
      const response = await sendData(`app/updateHealthMatrix?id=${matrix._id}&clientId=${params.id}`, { updatedData: formData }, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate(`getClientVolumePoints/${_id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <Dialog>
    <DialogTrigger>
      <Pencil className="w-4 h-4 absolute bottom-2 right-2" />
    </DialogTrigger>
    <DialogContent className="p-0 gap-0">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Edit Health Matrix</DialogTitle>
      </DialogHeader>
      <div className="max-h-[65vh] h-full overflow-y-auto p-4">
        <FormControl
          placeholder={"Please enter value"}
          label={matrix.title}
          value={formData[matrix.name]}
          onChange={(e) => setFormData(prev => ({ ...prev, [matrix.name]: e.target.value }))}
          className="block mb-4"
        />
        <Button variant="wz" disabled={loading} onClick={saveHealthMatrix}>Save</Button>
      </div>
      <DialogClose ref={closeBtnRef} />
    </DialogContent>
  </Dialog>
}