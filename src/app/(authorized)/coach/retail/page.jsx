"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import RetailMarginDropDown from "@/components/drop-down/RetailMarginDropDown";
import AddRetailModal from "@/components/modals/tools/AddRetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderHistory, getRetail } from "@/lib/fetchers/app";
import { useAppSelector } from "@/providers/global/hooks";
import { PenLine, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";

export default function Page() {
  const {
    isLoading: retailLoading,
    error: retailError,
    data: retailData
  } = useSWR("app/coach-retail", getRetail);
  const {
    isLoading: ordersLoading,
    error: ordersError,
    data: ordersData
  } = useSWR("app/order-history", getOrderHistory);
  if (retailLoading || ordersLoading) return <ContentLoader />

  if (
    ordersError || retailError ||
    retailData.status_code !== 200 || ordersData.status_code !== 200
  ) return <ContentError title={ordersError || retailError || ordersData.message || retailData.message} />

  const retails = retailData.data;
  const orders = ordersData.data;

  return <div className="mt-4">
    <RetailStatisticsCards
      totalSales={retails.totalSale}
      totalOrders={orders.myOrder.length}
    />
    <div className="content-container">
      <Brands brands={retails.brands} />
    </div>
  </div>
}

function RetailStatisticsCards({ totalSales, totalOrders }) {
  return <div className="grid grid-cols-3 gap-4">
    <Card className="bg-linear-to-tr from-[var(--accent-1)] to-[#04BE51] p-4 rounded-[10px]">
      <CardHeader className="text-white p-0 mb-0">
        <CardTitle>Total Sales</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <h4 className="text-white !text-[28px]">₹ {totalSales}</h4>
      </CardContent>
    </Card>
    <Card className="p-4 rounded-[10px] shadow-none">
      <CardHeader className="p-0 mb-0">
        <CardTitle>Total Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <h4 className="!text-[28px]">₹ {totalOrders}</h4>
      </CardContent>
    </Card>
  </div>
}

function Brands({ brands }) {
  return <div>
    <div className="flex items-center gap-2 justify-between">
      <h4>Brands</h4>
      {/* <Button variant="wz" size="sm">
        <Plus />
        Add New Kit
      </Button> */}
    </div>
    <div className="mt-4 grid grid-cols-6">
      {brands.map(brand => <Brand key={brand._id} brand={brand} />)}
    </div>
  </div>
}

function Brand({ brand }) {
  const [margin, setMargin] = useState();
  const coachId = useAppSelector(state => state.coach.data._id);
  return <Card className="p-0 shadow-none border-0 gap-2 relative">
    <Image
      src={brand.image || "/not-found.png"}
      alt=""
      height={540}
      width={540}
      className="object-cover shadow-md shadow-[#808080]/80"
    />
    <p className="px-1">{brand.name}</p>
    <RetailMarginDropDown margins={brand.margins} setMargin={setMargin} />
    {(margin || margin === 0) && <AddRetailModal
      payload={{
        coachId,
        margin,
        selectedBrandId: brand._id,
        margins: brand.margins
      }}
      setMargin={setMargin}
    />}
  </Card>
}