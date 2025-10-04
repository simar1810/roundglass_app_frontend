"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export const description = "A bar chart"

const chartData = [
  { month: "January", presentees: 186 },
  { month: "February", presentees: 305 },
  { month: "March", presentees: 237 },
  { month: "April", presentees: 73 },
  { month: "May", presentees: 209 },
  { month: "June", presentees: 214 },
]



export function BarChartComponent({
  className,
  xAxis,
  yAxis,
  chartConfig
}) {
  return (
    <Card className={cn("border-1 shadow-none bg-[var(--comp-1)]", className)}>
      <CardHeader>
        <CardTitle>{chartConfig.title}</CardTitle>
        <CardDescription>{chartConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          [yAxis.YAxisDataKey]: {
            label: yAxis.YAxisDataLabel,
            color: "var(--chart-1)",
          }
        }}>
          <BarChart accessibilityLayer data={xAxis.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxis.XAxisDataKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey={yAxis.YAxisDataKey} fill="var(--accent-1)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {Boolean(chartConfig.label1) && <div className="flex gap-2 leading-none font-medium">
          {chartConfig.label1}
        </div>}
        {Boolean(chartConfig.label2) && <div className="text-muted-foreground leading-none">
          {chartConfig.label2}
        </div>}
      </CardFooter>
    </Card>
  )
}
