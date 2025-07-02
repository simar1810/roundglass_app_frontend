"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientMealPlanById, getClientOrderHistory, getClientWorkouts, getMarathonClientTask } from "@/lib/fetchers/app";
import { CalendarIcon, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { useEffect, useState } from "react";
import ClientClubDataComponent from "./ClientClubDataComponent";
import { useAppSelector } from "@/providers/global/hooks";
import ClientStatisticsData from "./ClientStatisticsData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ClientData({ clientData }) {
  const { organisation } = useAppSelector(state => state.coach.data);
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="statistics">
      <Header />
      <ClientStatisticsData clientData={clientData} />
      <ClientMealData _id={clientData._id} />
      {organisation.toLowerCase() === "herbalife" && <ClientRetailData clientId={clientData.clientId} />}
      <ClientClubDataComponent clientData={clientData} />
      <MarathonData clientData={clientData} />
      <WorkoutContainer id={clientData._id} />
    </Tabs>
  </div>
}

function ClientMealData({ _id }) {
  const [selectedMeal, setSelectedMeal] = useState("")
  const { isLoading, error, data } = useSWR(`app/getClientMealPlanById?clientId=${_id}`, () => getClientMealPlanById(_id));

  const mealsData = data?.data;
  const mealPlans = mealsData?.at(0)?.meals;
  const mealsFromSelectedMealPlan = mealPlans?.find(plan => plan.mealType === selectedMeal);

  useEffect(function () {
    if (!isLoading && !error && data) {
      setSelectedMeal(mealsData?.at(0)?.meals?.at(0)?.mealType)
    }
  }, [isLoading])

  if (isLoading) return <TabsContent value="meal">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200 || !mealsFromSelectedMealPlan) return <TabsContent value="meal">
    <ContentError className="mt-0" title={error || data.message} />
  </TabsContent>

  return <TabsContent value="meal">
    <div className="mb-4 flex items-center gap-4 overflow-x-auto custom-scrollbar">
      {mealPlans.map((plan, index) => <Button
        key={index}
        variant={selectedMeal === plan.mealType ? "wz" : "outline"}
        className={selectedMeal !== plan.mealType && "text-[var(--dark-1)]/25"}
        onClick={() => setSelectedMeal(plan.mealType)}
      >
        {plan.mealType}
      </Button>)}
    </div>
    {mealsFromSelectedMealPlan?.meals?.map((meal, index) => <Card
      key={index}
      className="p-0 mb-8 shadow-none border-0 rounded-none overflow-clip"
    >
      <CardContent className="p-0">
        <Image
          src={meal.image || "/not-found.png"}
          height={400}
          width={240}
          alt=""
          className="w-full bg-[var(--accent-1)] object-cover object-center rounded-[10px] border-2 aspect-[8/4]"
        />
        <CardTitle className="px-2 mt-2 mb-0">{meal.name}</CardTitle>
        <div className="text-[var(--dark-1)]/25 text-[12px] px-2 flex items-center gap-2">
          <Clock className="w-[16px]" />
          {meal.meal_time}
        </div>
      </CardContent>
    </Card>)}
  </TabsContent>
}

function ClientRetailData({ clientId }) {
  const { isLoading, error, data } = useSWR(`app/getClientOrderHistory?clientId=${clientId}`, () => getClientOrderHistory(clientId));

  if (isLoading) return <TabsContent value="meal">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200) return <TabsContent value="meal">
    <ContentError title={error || data.message} />
  </TabsContent>

  const orderHistoryClient = data.data;

  if (orderHistoryClient.orderHistory.length === 0) return <TabsContent value="retail">
    <ContentError className="mt-0" title="0 retails for this client!" />
  </TabsContent>

  return <TabsContent value="retail">
    {orderHistoryClient.orderHistory.map(order => <RetailOrderDetailCard
      key={order._id}
      order={order}
    />)}
  </TabsContent>
}

function RetailOrderDetailCard({ order }) {
  return <Card className="bg-[var(--comp-1)] mb-2 gap-2 border-1 shadow-none px-4 py-2 rounded-[4px]">
    <CardHeader className="px-0">
      {order.status === "Completed"
        ?
        <RetailCompletedLabel />
        : <RetailPendingLabel />}
    </CardHeader>
    <CardContent className="px-0 flex gap-4">
      <Image
        height={100}
        width={100}
        unoptimized
        src={order.productModule?.at(0)?.productImage}
        alt=""
        className="bg-black w-[64px] h-[64px] object-cover rounded-md"
      />
      <div>
        <h4>{order.productModule.map(product => product.productName).join(", ")}</h4>
        <p className="text-[12px] text-[var(--dark-1)]/25">{order.productModule?.at(0)?.productDescription}</p>
      </div>
      <div className="text-[20px] text-nowrap font-bold ml-auto">₹ {order.sellingPrice}</div>
    </CardContent>
    <CardFooter className="px-0 items-end justify-between">
      <div className="text-[12px]">
        <p className="text-[var(--dark-1)]/25">Order From: <span className="text-[var(--dark-1)]">{order?.clientId?.name}</span></p>
        <p className="text-[var(--dark-1)]/25">Order Date: <span className="text-[var(--dark-1)]">{order.createdAt}</span></p>
      </div>
      {/* <Link className="underline text-[var(--accent-1)] text-[12px] flex items-center" href="/">
        Order Now&nbsp;{">"}
      </Link> */}
    </CardFooter>
  </Card>
}

function RetailCompletedLabel() {
  return <div className="text-[#03632C] text-[14px] font-bold flex items-center gap-1">
    <Clock className="bg-[#03632C] text-white w-[28px] h-[28px] p-1 rounded-full" />
    <p>Completed</p>
  </div>
}

function RetailPendingLabel() {
  return <div className="text-[#FF964A] text-[14px] font-bold flex items-center gap-1">
    <Clock className="bg-[#FF964A] text-white w-[28px] h-[28px] p-1 rounded-full" />
    <p>Pending</p>
  </div>
}

function MarathonData({ clientData }) {
  const [date, setDate] = useState(format(new Date(), "dd-MM-yyyy"));
  const { isLoading, error, data } = useSWR(
    `client/marathon?clientId=${clientData._id}&date=${date}`,
    () => getMarathonClientTask(clientData._id, date)
  );

  if (isLoading) return <TabsContent value="marathon">
    <ContentLoader />
  </TabsContent>

  if (error || !Boolean(data) || data?.status_code !== 200) return <TabsContent value="retail">
    <ContentError className="mt-0" title={error || data?.message} />
  </TabsContent>
  const marathons = data.data;

  const totalPoints = marathons.reduce((acc, marathon) => acc + marathon.totalPoints, 0)

  return <TabsContent value="marathon">
    <div className="flex items-center justify-between">
      <h3 className="text-[var(--dark-1)] font-semibold text-lg">Marathon Tasks</h3>
      <DatePicker date={date} setDate={setDate} />
    </div>
    <p className="mb-8 px-2 pt-1">{totalPoints} points</p>
    <div className="w-full max-w-3xl mx-auto">
      <Accordion defaultValue={1} type="single" collapsible className="space-y-2">
        {marathons.map((marathon, index) => (
          <AccordionItem className="bg-[var(--comp-1)] border-0" key={index} value={index + 1}>
            <AccordionTrigger className="bg-[var(--dark-1)]/10 text-left font-semibold text-lg p-4">
              {marathon.marathonTitle} ({marathon.date})
            </AccordionTrigger>
            <p className="px-4 py-2">{marathon.totalPoints} points</p>
            <AccordionContent>
              <div className="space-y-4 px-4 mt-2">
                {marathon.tasks.map((task) => (
                  <div
                    key={task.taskId}
                    className="bg-white p-4 border rounded-lg"
                  >
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="text-sm mt-2 flex flex-wrap gap-3">
                      <span>🎯 Points: {task.points}</span>
                      <span>📽 Video: {task.videoSubmission ? 'Yes' : 'No'}</span>
                      <span>📷 Photo: {task.photoSubmission ? 'Yes' : 'No'}</span>
                      <span>{task.isCompleted ? '✅ Completed' : '❌ Incomplete'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </TabsContent>
}

function Header() {
  const { organisation } = useAppSelector(state => state.coach.data);

  return <TabsList className="w-full bg-transparent p-0 mb-4 grid grid-cols-6 border-b-2 rounded-none">
    <TabsTrigger
      className="mb-[-5px] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="statistics"
    >
      Statistics
    </TabsTrigger>
    <TabsTrigger
      className="mb-[-5px] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="meal"
    >
      Meal
    </TabsTrigger>
    <TabsTrigger
      className="mb-[-5px] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="workout"
    >
      Workout
    </TabsTrigger>
    {organisation.toLowerCase() === "herbalife" && <TabsTrigger
      className="mb-[-5px] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="retail"
    >
      Retail
    </TabsTrigger>}
    <TabsTrigger
      className="mb-[-5px] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="marathon"
    >
      Marathon
    </TabsTrigger>
    <TabsTrigger
      className="mb-[-5px] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="club"
    >
      Club
    </TabsTrigger>
  </TabsList>
}

function DatePicker({ date, setDate }) {
  return <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="w-[220px] justify-start text-left font-normal"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date || <span>Pick a date</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar
        mode="single"
        selected={date}
        onSelect={value => setDate(format(value, "dd-MM-yyyy"))}
        initialFocus
      />
    </PopoverContent>
  </Popover>
}

function WorkoutContainer({ id }) {
  const { isLoading, error, data } = useSWR("client/workouts", () => getClientWorkouts(id));
  if (isLoading) return <TabsContent value="workout">
    <ContentLoader />
  </TabsContent>

  if (error || !Boolean(data) || data?.status_code !== 200) return <TabsContent value="workout">
    <ContentError className="mt-0" title={error || data?.message} />
  </TabsContent>
  const workouts = data.data;

  return <TabsContent value="workout">
    <div className="grid grid-cols-2 gap-4">
      {workouts.map(workout => <div key={workout._id} className=" overflow-hidden bg-white">
        <div className="relative">
          <Link href={`/coach/workouts/${workout._id}`}>
            <Image
              src={workout?.thumbnail?.trim() || "/not-found.png"}
              alt="Total Core Workout"
              width={1024}
              height={1024}
              unoptimized
              onError={e => e.target.src = "/not-found.png"}
              className="w-full max-h-[250px] aspect-video object-cover rounded-xl border-1"
            />
          </Link>
        </div>
        <div className="text-md font-bold">{workout.title}</div>
      </div>)}
    </div>
  </TabsContent>
}