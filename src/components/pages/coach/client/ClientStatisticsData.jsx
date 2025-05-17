import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import PDFRenderer from "@/components/modals/PDFRenderer";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { DialogTrigger } from "@/components/ui/dialog";
import { TabsContent } from "@/components/ui/tabs";
import { sendData } from "@/lib/api";
import { calculateBMI, calculateBMI2, calculateBMR, calculateBodyAge, calculateBodyFatPercentage, calculateSkeletalMassPercentage } from "@/lib/client/statistics";
import { getClientStatsForCoach } from "@/lib/fetchers/app";
import { calculatePieChartAngle } from "@/lib/utils";
import { FilePen } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react";
import {
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Label
} from "recharts"
import { toast } from "sonner";
import useSWR from "swr";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  safari: {
    label: "Safari",
    color: "var(--accent-1)",
  },
}

const chartData = [
  { browser: "safari", title: "Healthy", visitors: 23.4 },
]

const comparisonPDFData = {
  clientName: "John Doe",
  age: "32",
  gender: "Male",
  joined: "2025-05-12",
  weight: "78",
  height: "180",
  brandLogo: "/brandLogo.png",
  sideImage: "/side.png",
  bottomStripImage: "/bottom.png",
  allStatsList: [
    { createdDate: "2025-01-01", weight: "78", bmi: "24.5", muscle: "38%", fat: "20%", rm: "1600" },
    { createdDate: "2025-01-01", weight: "78", bmi: "24.5", muscle: "38%", fat: "20%", rm: "1600" },
    { createdDate: "2025-01-01", weight: "78", bmi: "24.5", muscle: "38%", fat: "20%", rm: "1600" },
    { createdDate: "2025-01-01", weight: "78", bmi: "24.5", muscle: "38%", fat: "20%", rm: "1600" },
  ]
}

const clientStatistics = {
  clientName: "Simarpreet Singh",
  age: "21",
  gender: "Male",
  joined: "2025-05-12",
  weight: "93",
  height: "6.3 ft",
  bmi: "27.2",
  fatPercentage: "27.5",
  musclePercentage: "31.4",
  restingMetabolism: "1550",
  bodyComposition: "Moderate Muscle, High Fat",
  coachName: "Gurpreet Sir",
  coachDescription: "A certified wellness coach helping you transform your lifestyle through science-backed fitness and meal plans.",
  coachProfileImage: "",
};

const invoiceData = {
  clientName: 'Simarpreet Singh',
  age: '21',
  address: 'New Amritsar, Punjab',
  city: 'Amritsar',
  phone: '9876543210',
  invoiceNo: 'INV123456',
  date: '2025-05-12',
  coachName: 'Wellness Coach',
  coachPhone: '9876543210',
  coachCity: 'Ludhiana',
  subtotal: '3500',
  discount: '500',
  total: '3000',
  logoUrl: 'https://wellnessz.in/static/logo.png',
  products: [
    { productName: 'Formula 1 Shake', quantity: 2, price: 1000 },
    { productName: 'Afresh Energy Drink', quantity: 1, price: 500 },
    { productName: 'Subtotal', quantity: "", price: 3500 },
    { productName: 'Discount', quantity: "", price: 500 },
    { productName: 'Total', quantity: "", price: 3000 },
  ],
};

const mealPlan = {
  planName: 'Fat Burn Plan',
  coachName: 'John Doe',
  coachDescription: 'Certified Health Coach',
  coachImage: '/coach.jpg',
  brandLogo: '/logo.png',
  mealTypes: ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'After Dinner'],
  meals: [
    {
      meals: [
        {
          name: 'Oats & Fruits',
          description: 'Healthy mix of oats and seasonal fruits',
          mealTime: '8:00 AM',
          image: '/meals/oats.png'
        }
      ]
    },
    {
      meals: [
        {
          name: 'Grilled Chicken',
          description: 'Lean protein with mixed vegetables',
          mealTime: '1:00 PM',
          image: '/meals/chicken.png'
        }
      ]
    },
    {
      meals: [
        {
          name: 'Soup & Salad',
          description: 'Light dinner with soup and green salad',
          mealTime: '7:00 PM',
          image: '/meals/soup.png'
        }
      ]
    }
  ]
};

export default function ClientStatisticsData({ clientId }) {
  const [selectedDate, setSelectedDate] = useState(0);

  const { isLoading, error, data } = useSWR(`app/clientStatsCoach?clientId=${clientId}`, () => getClientStatsForCoach(clientId));
  const clientStats = data?.data;

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200 || isNaN(selectedDate)) return <TabsContent value="statistics">
    <ContentError title={error || data.message} className="mt-0" />
  </TabsContent>

  const statistics = {
    ...clientStats?.at(selectedDate),
    bodyComposition: clientStats?.at(0)?.body_composition || "Slim"
  }
  const heightinMetres = statistics.heightUnit === "Cm"
    ? Number(statistics.height) / 100
    : Number(statistics.height) / 3.28084;
  const payload = {
    bmi: calculateBMI2(statistics || {}),
    muscle: calculateSkeletalMassPercentage({ ...statistics, bodyComposition: statistics?.body_composition } || {}),
    fat: calculateBodyFatPercentage({ ...statistics, bodyComposition: statistics?.body_composition } || {}),
    rm: calculateBMR({ ...statistics, gender: "male" } || {}),
    ideal_weight: (21 * (heightinMetres * heightinMetres)).toFixed(2),
    bodyAge: calculateBodyAge(statistics || {}),
  }

  async function sendAnalysis() {
    try {
      const response = await sendData(`app/requestFollowUpRequest?clientId=${clientId}`);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    }
  }

  return <TabsContent value="statistics">
    <div className="pb-4 flex items-center gap-2 border-b-1 overflow-x-auto">
      {clientStats.map((stat, index) => <Button
        key={index}
        variant={selectedDate === index ? "wz" : "outline"}
        className={selectedDate !== index && "text-[var(--dark-1)]/25"}
        onClick={() => setSelectedDate(index)}
      >
        {stat.createdDate}
      </Button>)}
    </div>
    <StatisticsExportingOptions clientStats={clientStats} />
    <h5 className="text-[16px] mt-4">Weight Difference Between Last Check-up: 2 KG</h5>
    <div className="aspect-video bg-[var(--dark-1)]/4 mt-4"></div>
    <div className="mt-8 grid grid-cols-3 gap-5">
      <ClientStatisticCharts payload={payload} />
    </div>
    <Button onClick={sendAnalysis} variant="wz" className="mx-auto mt-8 block">Send Analysis Reminder</Button>
  </TabsContent>
}

function StatisticsExportingOptions({ clientStats }) {
  return <div className="py-4 text-[12px] flex items-center gap-2 border-b-1 overflow-x-auto">
    <PDFRenderer pdfTemplate="PDFShareStatistics" data={clientStatistics}>
      <DialogTrigger className="h-9 px-4 flex items-center gap-2 border-1 rounded-[8px]">
        <FilePen className="w-[14px]" />
        Share Statistics
      </DialogTrigger>
    </PDFRenderer>
    <PDFRenderer pdfTemplate="PDFComparison" data={comparisonPDFData}>
      <DialogTrigger className="h-9 px-4 flex items-center gap-2 border-1 rounded-[8px]">
        <FilePen className="w-[14px]" />
        Share & View Comparison PPT
      </DialogTrigger>
    </PDFRenderer>
    <PDFRenderer pdfTemplate="PDFInvoice" data={invoiceData}>
      <DialogTrigger className="h-9 px-4 flex items-center gap-2 border-1 rounded-[8px]">
        <FilePen className="w-[14px]" />
        Invoice
      </DialogTrigger>
    </PDFRenderer>
    <PDFRenderer pdfTemplate="PDFMealPlan" data={mealPlan}>
      <DialogTrigger className="h-9 px-4 flex items-center gap-2 border-1 rounded-[8px]">
        <FilePen className="w-[14px]" />
        Meal Plan
      </DialogTrigger>
    </PDFRenderer>
  </div>
}

const formFields = [
  {
    label: "BMI",
    maxValue: () => 25,
    minValue: () => 18,
    idealValue: 23.0,
    desc: "Healthy",
    info: "Optimal: 18-23\nOverweight: 23-27\nObese: 27-32",
    icon: "/svgs/bmi.svg",
    name: "bmi"
  },
  {
    label: "Muscle",
    maxValue: () => 45,
    minValue: () => 30,
    idealValue: 35,
    info: "Optimal Range: 32-36% for men, 24-30% for women\nAthletes: 38-42%",
    icon: "/svgs/muscle.svg",
    name: "muscle"
  },
  {
    label: "Fat",
    maxValue: () => 20,
    minValue: () => 10,
    idealValue: 15,
    info: "Optimal Range:\n10-20% for Men\n20-30% for Women",
    icon: "/svgs/fats.svg",
    name: "fat",
  },
  {
    label: "Resting Metabolism",
    maxValue: () => 3000,
    minValue: () => 1500,
    idealValue: 2000,
    info: "Optimal Range: Varies by age,\ngender, and activity level",
    icon: "/svgs/meta.svg",
    name: "rm"
  },
  {
    label: "Weight",
    desc: "Ideal 75",
    maxValue: (value) => value + 5,
    minValue: (value) => value - 5,
    info: "Ideal weight Range:\n118. This varies by height and weight",
    icon: "/svgs/weight.svg",
    name: "ideal_weight"
  },
  {
    label: "Body Age",
    maxValue: () => 67,
    minValue: () => 33,
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "bodyAge"
  },
]

function ClientStatisticCharts({ payload }) {
  return <>
    {formFields.filter(field => !!payload[field.name]).map(field => <Card className="bg-[var(--comp-1)] px-2 py-0 gap-2 shadow-none border-0" key={field.name}>
      <CardHeader className="px-0">
        <CardTitle className="w-full b !font-[400] px-2 pt-4 flex items-center gap-2">
          <Image
            className=""
            height={20}
            width={20}
            alt=""
            src={field.icon}
          />
          {field.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-[12px] px-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={
              calculatePieChartAngle(
                field.idealValue || 1,
                payload[field.name],
                field.minValue || payload[field.name] - 5,
                field.maxValue || payload[field.name] + 5
              )}
            innerRadius={60}
            outerRadius={110}
            maxBarSize={10}
          >
            <RadialBar dataKey="visitors" background cornerRadius={10} fill={payload[field.name] > field.maxValue ? "#FF0000" : payload[field.name] > field.minValue ? "var(--accent-1)" : "#E8B903"} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-4xl font-bold"
                      >
                        {payload[field.name]}
                      </tspan>
                    </text>
                  )
                }
              }} />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>)}
  </>
}

const metrics = [
  { metric: "bmi", type: 1 },
  { metric: "muscle", type: 1 },
  { metric: "bmi", type: 1 },
  { metric: "bmi", type: 1 },
  { metric: "bmi", type: 1 },
]

function generateStatsCardPayload(stats) {
}