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
import { calculateBMI } from "@/lib/client/statistics";
import { getClientStatsForCoach } from "@/lib/fetchers/app";
import { FilePen } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react";
import {
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Label
} from "recharts"
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
  { browser: "safari", title: "Healthy", visitors: 23.4, fill: "var(--color-safari)" },
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
  mealTypes: ['Breakfast', 'Lunch', 'Snack','Dinner' , 'After Dinner'],
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
  const [selectedDate, setSelectedDate] = useState();

  const { isLoading, error, data } = useSWR(`app/clientStatsCoach?clientId=${clientId}`, () => getClientStatsForCoach(clientId));
  const clientStats = data?.data;

  useEffect(function () {
    if (!isLoading && !error && data) {
      setSelectedDate(clientStats?.at(0)?.createdDate)
    }
  }, [isLoading])
  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200 || !selectedDate) return <ContentError title={error || data.message} />

  const statisticsForData = clientStats.find(stat => stat.createdDate === selectedDate);
  const bmi = calculateBMI(statisticsForData)

  const cards = generateStatsCardPayload(statisticsForData)

  return <TabsContent value="statistics">
    <div className="pb-4 flex items-center gap-2 border-b-1">
      {clientStats.map((stat, index) => <Button
        key={index}
        variant={selectedDate === stat.createdDate ? "wz" : "outline"}
        className={selectedDate !== stat.createdDate && "text-[var(--dark-1)]/25"}
        onClick={() => setSelectedDate(stat.createdDate)}
      >
        {stat.createdDate}
      </Button>)}
    </div>
    <StatisticsExportingOptions clientStats={clientStats} />
    <h5 className="text-[16px] mt-4">Weight Difference Between Last Check-up: 2 KG</h5>
    <div className="aspect-video bg-[var(--dark-1)]/4 mt-4"></div>
    <div className="mt-8 grid grid-cols-3 gap-5">
      <ClientStatisticCharts />
    </div>
    <Button variant="wz" className="mx-auto mt-8 block">Send Analysis Reminder</Button>
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

function ClientStatisticCharts() {
  return <>
    {Array.from({ length: 6 }, (_, i) => i).map(item => <Card className="bg-[var(--comp-1)] px-2 py-0 gap-2 shadow-none border-0" key={item}>
      <CardHeader>
        <CardTitle className="!font-[400] pt-2 flex items-center gap-2">
          <Image
            className=""
            height={20}
            width={20}
            alt=""
            src="/svgs/bmi.svg"
          />
          BMI
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
            endAngle={-125}
            innerRadius={60}
            outerRadius={110}
            maxBarSize={10}
          >
            <RadialBar dataKey="visitors" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
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
                          {chartData[0].visitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {chartData[0].title}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
        <p className="p-2">Optimal: 18 - 23</p>
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
  for (const metric of ["bmi", "muscle", "fat",]) {

  }
}