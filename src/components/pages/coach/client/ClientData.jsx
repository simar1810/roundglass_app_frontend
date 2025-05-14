"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientMealPlanById, getClientOrderHistory } from "@/lib/fetchers/app";
import { Clock, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { useEffect, useState } from "react";
import ClientClubDataComponent from "./ClientClubDataComponent";

export default function ClientData({ clientData }) {
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="club">
      <Header />
      {/* <ClientStatisticsData clientId={clientId} /> */}
      <ClientMealData _id={clientData._id} />
      <ClientRetailData clientId={clientData.clientId} />
      <ClientClubDataComponent clientData={clientData} />
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
    <ContentError
      title={error || data.message}
    />
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
    {/* <Button
      variant="outline"
      className="w-full text-[var(--dark-1)]/25 my-4"
    >
      View Meal Section
    </Button> */}
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

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const orderHistoryClient = data.data;

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
      <Link className="underline text-[var(--accent-1)] text-[12px] flex items-center" href="/">
        Order Now&nbsp;{">"}
      </Link>
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

function Header() {
  return <TabsList className="w-full bg-transparent p-0 mb-4 grid grid-cols-4 border-b-2 rounded-none">
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="statistics"
    >
      Statistics
    </TabsTrigger>
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="meal"
    >
      Meal
    </TabsTrigger>
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="retail"
    >
      Retail
    </TabsTrigger>
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="club"
    >
      Club
    </TabsTrigger>
  </TabsList>
}