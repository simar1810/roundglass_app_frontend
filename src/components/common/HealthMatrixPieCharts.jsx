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

const healtMetrics = [
  {
    title: "BMI",
    value: "23.4",
    desc: "Healthy",
    optimalRangeText: "Optimal: 18–23\nOverweight: 23–27\nObese: 27–32",
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

const payload = {
  bmi: 21,
  muscle: 1550,
  rm: 24,
  fat: 14,
  bodyAge: 23,
  idealWeight: 74,
};

const fields = ["heightCms", "heightFeet", "heightInches", "heightUnit", "weight", "weightInKgs", "weightInPounds", "weightUnit", "bodyComposition"]

export default function HealthMetrics({ data }) {
  const correctMetrics = fields.every(field => !Boolean(data[field]))
  const payload = {
    bmi: calculateBMIFinal(data),
    muscle: calculateSMPFinal(data),
    fat: calculateBodyFatFinal(data),
    rm: calculateBMRFinal(data),
    idealWeight: calculateIdealWeightFinal(data),
    bodyAge: calculateBodyAgeFinal(data),
  };

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
          />
        ))}
    </>
  );
}

export function MetricProgress({
  value = 15,
  title = "Muscle",
  maxThreshold = 100,
  minThreshold,
  icon,
  className,
  optimalRangeText = "Optimal Range: 32-36% for men, 24-30% for women\nAthletes: 38-42%",
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
    <Card className={cn("max-w-xs shadow-none", className)}>
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
              transform="rotate(-90 80 80)" // This rotates to start at top
            />
          </svg>

          {/* Value text - showing absolute value, not percentage */}
          <div className="absolute text-center">
            <span className="text-4xl font-bold">{value}</span>
          </div>
        </div>

        {/* <p className="text-sm text-gray-700 whitespace-pre-line">{optimalRangeText}</p> */}
      </CardContent>
    </Card>
  );
}
