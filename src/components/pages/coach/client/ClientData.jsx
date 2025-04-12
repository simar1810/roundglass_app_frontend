"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FilePen } from "lucide-react";
import Image from "next/image";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

export default function ClientData() {
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="statistics">
      <TabsList className="w-full bg-transparent p-0 mb-4 grid grid-cols-2 border-b-2 rounded-none">
        <TabsTrigger
          className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
          value="statistics"
        >
          Statistics
        </TabsTrigger>
        <TabsTrigger
          className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
          value="meal"
        >
          Meal
        </TabsTrigger>
      </TabsList>
      <ClientStatisticsData />
      <ClientMealData />
    </Tabs>
  </div>
}

function ClientMealData() {
  return <TabsContent value="meal">
    <div className="flex items-center gap-4">
      <Button variant="wz">Before Breakfast</Button>
      <Button variant="outline" className="text-[var(--dark-1)]/25">Breakfast</Button>
      <Button variant="outline" className="text-[var(--dark-1)]/25">Lunch</Button>
      <Button variant="outline" className="text-[var(--dark-1)]/25">Snacks</Button>
    </div>
    <Button
      variant="outline"
      className="w-full text-[var(--dark-1)]/25 my-4"
    >
      View Meal Section
    </Button>
    {Array.from({ length: 4 }, (_, i) => i).map(item => <Card
      key={item}
      className="p-0 mb-8 shadow-none border-0 rounded-none overflow-clip"
    >
      <CardContent className="p-0">
        <Image
          src="/"
          height={400}
          width={240}
          alt=""
          className="w-full bg-[var(--accent-1)] object-contain rounded-[10px] border-2 aspect-[8/3]"
        />
        <CardTitle className="px-2 mt-2 mb-0">Roasted Sweet Potato & Eggplant Pitas</CardTitle>
        <div className="text-[var(--dark-1)]/25 text-[12px] px-2 flex items-center gap-2">
          <Clock className="w-[16px]" />
          20 Minutes
        </div>
      </CardContent>
    </Card>)}
  </TabsContent>
}

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

function ClientStatisticsData() {
  return <TabsContent value="statistics">
    <div className="pb-4 flex items-center gap-2 border-b-1">
      <Button variant="wz">12-04-2025</Button>
      <Button variant="outline" className="text-[var(--dark-1)]/25">13-04-2025</Button>
      <Button variant="outline" className="text-[var(--dark-1)]/25">14-04-2025</Button>
      <Button variant="outline" className="text-[var(--dark-1)]/25">13-04-2025</Button>
    </div>
    <div className="py-4 text-[12px] flex items-center gap-2 border-b-1 overflow-x-aut">
      <Button variant="outline" className="text-[12px]">
        <FilePen className="w-[14px]" />
        Share and View Comparison PPT
      </Button>
      <Button variant="outline" className="text-[12px]">
        <FilePen className="w-[14px]" />
        Create and Share PDF
      </Button>
      <Button variant="outline" className="text-[12px]">
        <FilePen className="w-[14px]" />
        Share Statistics
      </Button>
    </div>
    <h5 className="text-[16px] mt-4">Weight Difference Between Last Check-up: 2 KG</h5>
    <div className="aspect-video bg-[var(--dark-1)]/4 mt-4"></div>
    <div className="mt-8 grid grid-cols-3 gap-5">
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
    </div>
    <Button variant="wz" className="mx-auto mt-8 block">Send Analysis Reminder</Button>
  </TabsContent>
}