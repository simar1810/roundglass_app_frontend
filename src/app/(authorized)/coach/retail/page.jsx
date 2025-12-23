"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import Loader from "@/components/common/Loader";
import RetailMarginDropDown from "@/components/drop-down/RetailMarginDropDown";
import FormControl from "@/components/FormControl";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import PDFRenderer from "@/components/modals/PDFRenderer";
import AddRetailModal from "@/components/modals/tools/AddRetailModal";
import CreateRetailPurchaseModal from "@/components/modals/tools/CreateRetailPurchaseModal";
import { UpdateClientOrderAmount } from "@/components/pages/coach/client/ClientData";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { fetchData, sendData } from "@/lib/api";
import { excelRetailOrdersData, exportToExcel } from "@/lib/excel";
import { getOrderHistory, getRetail } from "@/lib/fetchers/app";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { invoicePDFData, salesReportPDFData } from "@/lib/pdf";
import { sortByPriority } from "@/lib/retail";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { TabsTrigger } from "@radix-ui/react-tabs";
import { endOfMonth, endOfWeek, endOfYear, isValid, parse, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { ListFilterPlus, Clock, EllipsisVertical, Eye, EyeClosed, FileText, NotebookPen, Pen, RefreshCcw, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function Page() {
  const { isWhitelabel } = useAppSelector(state => state.coach.data)

  const {
    isLoading: retailLoading,
    error: retailError,
    data: retailData
  } = useSWR("app/coach-retail", () => getRetail(isWhitelabel ? "thewellnessspot" : false));
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
      totalSales={retails?.totalSale || 0}
      totalOrders={orders?.myOrder?.length || 0}
      acumulatedVP={Number(orders?.acumulatedVP || 0)}
      orders={orders || null}
    />
    <div className="content-container">
      <RetailContainer
        orders={ordersData.data}
        retails={retails}
      />
    </div>
  </div>
}

// Helper function to parse date from order
function parseOrderDate(dateString) {
  try {
    if (!dateString) return null;

    // Convert to string if it's not already
    const dateStr = String(dateString).trim();
    if (!dateStr) return null;

    // Try dd-MM-yyyy first (most common format from backend based on codebase)
    const formats = ["dd-MM-yyyy", "dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yy", "d-M-yyyy", "d/MM/yyyy"];

    for (const format of formats) {
      try {
        const parsed = parse(dateStr, format, new Date());
        if (isValid(parsed) && !isNaN(parsed.getTime())) {
          // Check if the parsed date makes sense (not too far in past/future)
          const year = parsed.getFullYear();
          if (year >= 2000 && year <= 2100) {
            parsed.setHours(0, 0, 0, 0);
            return parsed;
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: try native Date parsing
    try {
      const nativeDate = new Date(dateStr);
      if (isValid(nativeDate) && !isNaN(nativeDate.getTime())) {
        const year = nativeDate.getFullYear();
        if (year >= 2000 && year <= 2100) {
          nativeDate.setHours(0, 0, 0, 0);
          return nativeDate;
        }
      }
    } catch (e) {
      // Ignore
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Helper function to get date range based on period
function getDateRange(period) {
  try {
    const now = new Date();
    if (!isValid(now)) {
      console.error("Invalid date");
      return null;
    }

    // Create a new date to avoid mutating the original
    const currentDate = new Date(now);
    currentDate.setHours(23, 59, 59, 999);

    switch (period) {
      case "weekly": {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        if (!isValid(start) || !isValid(end)) return null;
        // Ensure end time is end of day
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "monthly": {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        if (!isValid(start) || !isValid(end)) return null;
        // Ensure end time is end of day
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "yearly": {
        const start = startOfYear(currentDate);
        const end = endOfYear(currentDate);
        if (!isValid(start) || !isValid(end)) return null;
        // Ensure end time is end of day
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      default:
        return null; // All time
    }
  } catch (error) {
    console.error("Error getting date range:", error);
    return null;
  }
}

// Calculate filtered stats
function calculateFilteredStats(orders, period) {
  try {
    if (!orders) {
      return { totalSales: 0, totalOrders: 0, volumePoints: 0 };
    }

    const allOrders = [...(orders.myOrder || []), ...(orders.retailRequest || [])];
    const saleOrders = allOrders.filter(order =>
      order && (order.orderType === "sale" || !order.orderType)
    );

    if (period === "all") {
      const totalSales = saleOrders.reduce((sum, order) =>
        sum + (Number(order?.sellingPrice) || 0), 0
      );
      const totalOrders = saleOrders.length;
      // Volume points calculation - try to sum from orders, fallback to accumulated VP
      let volumePoints = saleOrders.reduce((sum, order) => {
        // Try order.volumePoints first
        if (order?.volumePoints !== undefined && order?.volumePoints !== null) {
          return sum + (Number(order.volumePoints) || 0);
        }
        // Try order.volume_points (snake_case)
        if (order?.volume_points !== undefined && order?.volume_points !== null) {
          return sum + (Number(order.volume_points) || 0);
        }
        // Try calculating from productModule if it has VP data
        if (order?.productModule && Array.isArray(order.productModule)) {
          const orderVP = order.productModule.reduce((vpSum, product) => {
            const productVP = Number(product?.volumePoints || product?.volume_points || product?.VP || 0);
            const quantity = Number(product?.quantity || 1);
            return vpSum + (productVP * quantity);
          }, 0);
          if (orderVP > 0) {
            return sum + orderVP;
          }
        }
        return sum;
      }, 0);

      // If no VP found in orders, use accumulated VP
      if (volumePoints === 0 && orders?.acumulatedVP) {
        volumePoints = Number(orders.acumulatedVP) || 0;
      }

      return { totalSales, totalOrders, volumePoints };
    }

    const dateRange = getDateRange(period);
    if (!dateRange || !dateRange.start || !dateRange.end) {
      return { totalSales: 0, totalOrders: 0, volumePoints: 0 };
    }

    // Normalize date range
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    const filteredOrders = saleOrders.filter(order => {
      try {
        if (!order || !order.createdAt) return false;

        const orderDate = parseOrderDate(order.createdAt);
        if (!orderDate || !isValid(orderDate)) {
          return false;
        }

        // Normalize order date to start of day for comparison
        const orderDateNormalized = new Date(orderDate);
        orderDateNormalized.setHours(0, 0, 0, 0);

        // Check if order date is within range
        const isInRange = orderDateNormalized >= startDate && orderDateNormalized <= endDate;

        return isInRange;
      } catch (error) {
        return false;
      }
    });


    const totalSales = filteredOrders.reduce((sum, order) =>
      sum + (Number(order?.sellingPrice) || 0), 0
    );
    const totalOrders = filteredOrders.length;

    // Calculate volume points - check multiple possible locations
    const volumePoints = filteredOrders.reduce((sum, order) => {
      // Try order.volumePoints first
      if (order?.volumePoints !== undefined && order?.volumePoints !== null) {
        return sum + (Number(order.volumePoints) || 0);
      }
      // Try order.volume_points (snake_case)
      if (order?.volume_points !== undefined && order?.volume_points !== null) {
        return sum + (Number(order.volume_points) || 0);
      }
      // Try calculating from productModule - products have VP in the product table
      if (order?.productModule && Array.isArray(order.productModule)) {
        const orderVP = order.productModule.reduce((vpSum, product) => {
          // Check multiple possible VP field names in product
          const productVP = Number(
            product?.volumePoints ||
            product?.volume_points ||
            product?.VP ||
            product?.vp ||
            product?.volumePoint ||
            product?.volume_point ||
            0
          );
          const quantity = Number(product?.quantity || 1);
          return vpSum + (productVP * quantity);
        }, 0);
        if (orderVP > 0) {
          return sum + orderVP;
        }
      }
      return sum;
    }, 0);

    return { totalSales, totalOrders, volumePoints };
  } catch (error) {
    console.error("Error calculating filtered stats:", error);
    return { totalSales: 0, totalOrders: 0, volumePoints: 0 };
  }
}

function RetailStatisticsCards({
  totalSales = 0,
  totalOrders = 0,
  acumulatedVP = 0,
  orders = null
}) {
  const [hide, setHide] = useState(true);
  const [period, setPeriod] = useState("all"); // all, weekly, monthly, yearly

  const filteredStats = useMemo(() => {
    try {
      if (period === "all") {
        return {
          totalSales: Number(totalSales || 0),
          totalOrders: Number(totalOrders || 0),
          volumePoints: Number(acumulatedVP || 0),
          // Also include aliases for backward compatibility
          sales: Number(totalSales || 0),
          orders: Number(totalOrders || 0)
        };
      }
      if (!orders || typeof orders !== 'object') {
        return { totalSales: 0, totalOrders: 0, volumePoints: 0, sales: 0, orders: 0 };
      }
      const result = calculateFilteredStats(orders, period);
      // Add aliases for consistency
      return {
        ...result,
        sales: result.totalSales,
        orders: result.totalOrders
      };
    } catch (error) {
      console.error("Error in filteredStats useMemo:", error);
      return { sales: 0, orders: 0, volumePoints: 0 };
    }
  }, [period, totalSales, totalOrders, acumulatedVP, orders]);

  return <div className="space-y-4">
    {/* Period Filter */}
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Period:</span>
        {["all", "weekly", "monthly", "yearly"].map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "wz" : "outline"}
            className="text-xs capitalize"
            onClick={() => setPeriod(p)}
          >
            {p === "all" ? "All Time" : p}
          </Button>
        ))}
      </div>
      <RetailReportGenerator orders={orders} period={period} />
    </div>

    {/* Statistics Cards */}
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      <Card className="bg-linear-to-tr from-[var(--accent-1)] to-[#04BE51] p-4 rounded-[10px]">
        <CardHeader className="text-white p-0 mb-0">
          <CardTitle className="">
            <span className="w-full text-base md:text-lg mr-2">Total Sales</span>
            {hide
              ? <EyeClosed
                className="w-[16px] h-[16px] cursor-pointer inline-block ml-auto"
                onClick={() => setHide(false)}
              />
              : <Eye
                className="w-[16px] h-[16px] cursor-pointer inline-block ml-auto"
                onClick={() => setHide(true)}
              />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <h4 className={cn("text-white text-sm md:!text-[28px]", hide && "text-transparent")}>
            ₹ {period === "all"
              ? Number(totalSales || 0).toFixed(2)
              : Number(filteredStats?.totalSales || filteredStats?.sales || 0).toFixed(2)}
          </h4>
        </CardContent>
      </Card>
      <Card className="p-4 rounded-[10px] shadow-none">
        <CardHeader className="p-0 mb-0">
          <CardTitle className={"text-base md:text-lg mr-2"}>Total Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <h4 className="text-base md:!text-[28px]">
            {period === "all"
              ? totalOrders
              : Number(filteredStats?.totalOrders || filteredStats?.orders || 0)}
          </h4>
        </CardContent>
      </Card>
      <Card className="p-4 rounded-[10px] shadow-none">
        <CardHeader className="p-0 mb-0">
          <CardTitle className={"text-base md:text-lg mr-2"}>Volume Points</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <h4 className="text-[10px] md:!text-[28px]">
            {period === "all"
              ? Number(acumulatedVP || 0).toFixed(2)
              : Number(filteredStats?.volumePoints || 0).toFixed(2)}
          </h4>
        </CardContent>
      </Card>
    </div>
  </div>
}

function RetailContainer({ orders, retails }) {
  return <Tabs defaultValue="brands">
    <TabsList className="w-full bg-transparent p-0 mb-4 flex justify-start gap-4 border-b-2 rounded-none">
      <TabsTrigger
        className="pb-4 md:pb-2 px-2 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="brands"
      >
        <p className="text-sm md:text-lg">New Order</p>
      </TabsTrigger>
      <TabsTrigger
        className="pb-4 md:pb-2 px-2 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="order-history"
      >
        <p className="text-sm md:text-lg">Order History</p>
      </TabsTrigger>
      <TabsTrigger
        className="pb-4 md:pb-2 px-2 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="purchase-history"
      >
        <p className="text-sm md:text-lg">Purchase History</p>
      </TabsTrigger>
      <TabsTrigger
        className="pb-4 md:pb-2 px-2 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="inventory"
      >
        <p className="text-sm md:text-lg">Inventory</p>
      </TabsTrigger>
    </TabsList>
    <TabsContent value="purchase-history">
      <PurchaseHistory />
    </TabsContent>
    <Brands brands={retails.brands} />
    <Orders orders={orders} />
    <Inventory />
  </Tabs>
}

function Brands({ brands }) {
  return <TabsContent value="brands">
    <div className="flex items-center gap-2 justify-between">
      <h4>Brands</h4>
    </div>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-6">
      {brands.map(brand => <Brand key={brand._id} brand={brand} />)}
    </div>
  </TabsContent>
}

function Brand({
  brand,
  children
}) {
  const [margin, setMargin] = useState();
  const coachId = useAppSelector(state => state.coach.data._id);
  const [retailModal, setRetailModal] = useState(false)
  return <Card className="p-0 shadow-none border-0 gap-2 relative">
    <div className="relative md:hover:[&_.badge]:opacity-100">
      <Image
        src={brand.image || "/not-found.png"}
        alt=""
        height={540}
        width={540}
        className="object-cover shadow-md shadow-[#808080]/80"
      />
      <RetailMarginDropDown
        margins={brand.margins}
        setMargin={setMargin}
        setOpen={setRetailModal}
        brand={brand}
        children={children}
      />
      <AddRetailModal
        payload={{
          coachId,
          margin,
          selectedBrandId: brand._id,
          margins: brand.margins,
          clientId: brand.clientId && String(brand.clientId)?.trim() !== "" ? brand.clientId : null,
          productModule: brand.productModule || [],
          orderId: brand.orderId || "",
          status: brand.status || "Completed",
        }}
        open={retailModal}
        setOpen={setRetailModal}
      />
      <CreateRetailPurchaseModal brandId={brand._id} />
    </div>
    <p className="px-1 text-left mt-2 font-bold">{brand.name}</p>
  </Card>
}

function Orders({ orders }) {
  const [filter, setFilter] = useState("all"); // all | pending | completed | cancelled

  const rawOrders = [...orders.myOrder, ...orders.retailRequest];

  const myOrders = rawOrders
    .filter((order) => {
      if (filter === "all") return true;
      if (filter === "pending") {
        // Exclude cancelled orders from pending filter
        const isCancelled = (order.status || "").toLowerCase() === "cancelled";
        if (isCancelled) return false;

        const isPendingStatus = (order.status || "").toLowerCase() === "pending";
        const isClientRequest = Array.isArray(orders.retailRequest) && orders.retailRequest.some((req) => req._id === order._id);
        return isPendingStatus || isClientRequest;
      }
      if (filter === "completed") return (order.status || "").toLowerCase() === "completed";
      if (filter === "cancelled") return (order.status || "").toLowerCase() === "cancelled";
      return true;
    })
    .sort((a, b) => {
      const dateA = parse(a.createdAt, 'dd-MM-yyyy', new Date());
      const dateB = parse(b.createdAt, 'dd-MM-yyyy', new Date());
      return dateB - dateA;
    })
    .sort((a, b) => {
      // Sort by status: Completed first, then others
      if (a.status === "Completed" && b.status !== "Completed") return -1;
      if (a.status !== "Completed" && b.status === "Completed") return 1;
      return 0;
    });

  return <TabsContent value="order-history">
    <ExportOrdersoExcel orders={orders} />

    <div className="flex flex-wrap items-center gap-2 mb-3">
      {["all", "pending", "completed", "cancelled"].map((item) => (
        <Button
          key={item}
          size="sm"
          variant={filter === item ? "wz" : "outline"}
          className="text-xs capitalize"
          onClick={() => setFilter(item)}
        >
          {item}
        </Button>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {myOrders.map(order => <Order key={order._id} order={order} />)}
      {myOrders.length === 0 && (
        <div className="col-span-full">
          <ContentError title="No orders found for this filter." />
        </div>
      )}
    </div>
  </TabsContent>
}

function Order({ order }) {
  // Handle orders with explicit orderType
  if (order.orderType === "purchase") {
    return <PurchaseOrder order={order} />
  }
  if (order.orderType === "sale") {
    return <SaleOrder order={order} />
  }

  // Handle orders without orderType field - assume they are sale orders
  // This is based on the pattern we see in the data where missing orderType usually means sale
  if (!order.orderType) {
    return <SaleOrder order={order} />
  }

  // Fallback for unknown order types
  return <div>Unknown order type: {order.orderType}</div>
}

function PurchaseOrder({ order }) {
  const coach = useAppSelector(state => state.coach.data);
  return <Card className="bg-[var(--comp-1)] mb-2 gap-2 border-1 shadow-none px-4 py-2 rounded-[4px]">
    <CardHeader className="px-0">
      <div className="flex justify-between items-center">
        <div className="text-yellow-600 text-[14px] font-bold flex items-center gap-1">
          <ShoppingCart className="bg-yellow-600 text-white w-[28px] h-[28px] p-1 rounded-full" />
          <p>Purchase Order</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
            {order.orderType || 'Purchase'}
          </span>
        </div>
      </div>
    </CardHeader>
    <CardContent className="px-0">
      <div className="flex gap-4">
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
          <p className="text-[10px] text-[var(--dark-1)]/25 leading-[1.2]">{order.productModule?.at(0)?.productDescription}</p>
          {order.sellingPrice && <div className="text-[20px] text-nowrap font-bold ml-auto">₹ {order.sellingPrice}</div>}
        </div>
      </div>
    </CardContent>
  </Card>
}

function SaleOrder({ order }) {
  const coach = useAppSelector(state => state.coach.data);
  const status = (order.status || "").toLowerCase();
  const pendingAmount = Math.max(order.pendingAmount || 0, 0);
  const paidAmount = Math.max(order.paidAmount || 0, 0);

  return <Card className="bg-[var(--comp-1)] mb-2 gap-2 border-1 shadow-none px-4 py-2 rounded-[4px]">
    <CardHeader className="px-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {status === "completed" && <RetailCompletedLabel status={order.status} />}
          {status === "pending" && <RetailPendingLabel status={order.status} />}
          {status === "cancelled" && <RetailCancelledLabel status={order.status} />}
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
            {order.orderType || 'Sale'}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="text-black w-[16px]">
            <EllipsisVertical className="cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="font-semibold w-1 px-2 py-[6px]">
            <PDFRenderer pdfTemplate="PDFInvoice" data={invoicePDFData(order, coach)}>
              <DialogTrigger className="w-full text-[12px] font-bold flex items-center gap-2">
                Invoice
              </DialogTrigger>
            </PDFRenderer>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="px-0">
      <div className="flex gap-4">
        <Image
          height={100}
          width={100}
          unoptimized
          src={order.productModule?.at(0)?.productImage}
          alt=""
          className="bg-black w-[64px] h-[64px] object-cover rounded-md"
        />
        <div>
          <h4 className="text-xs md:text-lg">{order.productModule.map(product => product.productName).join(", ")}</h4>
          <p className="text-[10px] text-[var(--dark-1)]/25 leading-[1.2]">{order.productModule?.at(0)?.productDescription}</p>
          {order.sellingPrice && <div className="text-[20px] text-nowrap font-bold ml-auto">₹ {order.sellingPrice}</div>}
        </div>
      </div>
    </CardContent>
    <CardFooter className="px-0 items-end justify-between gap-2">
      <div className="text-[12px] mr-auto">
        <p className="text-[var(--dark-1)]/25">Order From: <span className="text-[var(--dark-1)]">{order.clientName || "-"}</span></p>
        <p className="text-[var(--dark-1)]/25">Order Date: <span className="text-[var(--dark-1)]">{order.createdAt || "-"}</span></p>
        <p className="text-[var(--dark-1)]/25">Pending Amount: <span className="text-[var(--dark-1)]">₹ {pendingAmount}</span></p>
        <p className="text-[var(--dark-1)]/25">Paid Amount: <span className="text-[var(--dark-1)]">₹ {paidAmount}</span></p>
      </div>
      {pendingAmount > 0
        ? <UpdateClientOrderAmount order={order} />
        : status === "pending"
          ? <RetailPendingLabel status={order.status} />
          : <Badge variant="wz">Paid</Badge>}
      <OrderNote
        notes={order.notes}
        orderId={order._id}
      />
      <DeleteOrder orderId={order._id} />
      <UpdateOrder order={order} />
    </CardFooter>
    <div>
      {order.status === "Pending" && <AcceptRejectOrder order={order} />}
    </div>
  </Card>
}

export function RetailCompletedLabel({ status }) {
  return <div className="text-[#03632C] text-[14px] font-bold flex items-center gap-1">
    <Clock className="bg-[#03632C] text-white w-[28px] h-[28px] p-1 rounded-full" />
    <p>{status}</p>
  </div>
}

export function RetailPendingLabel({ status }) {
  return <div className="text-[#FF964A] text-[14px] font-bold flex items-center gap-1">
    <Clock className="bg-[#FF964A] text-white w-[28px] h-[28px] p-1 rounded-full" />
    <p>{status}</p>
  </div>
}

export function RetailCancelledLabel({ status }) {
  return <div className="text-red-600 text-[14px] font-bold flex items-center gap-1">
    <Clock className="bg-red-600 text-white w-[28px] h-[28px] p-1 rounded-full" />
    <p>{status}</p>
  </div>
}

function ExportOrdersoExcel({ orders }) {
  const [dates, setDates] = useState({
    startDate: "",
    endDate: ""
  });

  function exportExcelSheet() {
    try {
      if (!dates.startDate || !dates.endDate) {
        toast.error("Please select both start and end dates");
        return;
      }

      const allOrders = [...(orders.myOrder || []), ...(orders.retailRequest || [])];

      const saleOrders = allOrders.filter(order => {
        return order.orderType === "sale" || !order.orderType;
      });

      if (saleOrders.length === 0) {
        toast.error("No sale orders found to export");
        return;
      }

      const data = excelRetailOrdersData(saleOrders, dates);

      if (!data || data.length === 0) {
        toast.error("No orders found in the selected date range");
        return;
      }

      exportToExcel(data, "Retail Orders", "orders.xlsx")
      toast.success(`Exported ${data.length} orders successfully`);
    } catch (error) {
      toast.error(error.message)
    }
  }
  return <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="wz"
        className="block mb-4 ml-auto"
      >Export</Button>
    </DialogTrigger>
    <DialogContent className="p-0">
      <DialogTitle className="p-4 border-b-1">Export Orders Via Excel</DialogTitle>
      <div className="p-4 gap-0">
        <div className="grid grid-cols-2 gap-4">
          <FormControl
            type="date"
            label="Start Date"
            value={dates.startDate}
            onChange={e => setDates(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <FormControl
            type="date"
            label="End Date"
            value={dates.endDate}
            onChange={e => setDates(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        <Button
          variant="wz"
          className="block mt-8 mx-auto"
          onClick={exportExcelSheet}
        >Export Now</Button>
      </div>
    </DialogContent>
  </Dialog>
}

function AcceptRejectOrder({ order = {} }) {
  return (
    <div className="mt-4 flex items-center gap-3 justify-end flex-wrap">
      <AcceptRetailsOrder order={order} />
      <RejectOrderAction status="cancel" id={order.orderId} />
    </div>
  );
}

function RejectOrderAction({
  status,
  id
}) {
  async function handleOrderStatus(setLoading) {
    try {
      setLoading(true);
      const endpoint = buildUrlWithQueryParams(
        "app/accept-order",
        { id, status }
      )
      const response = await sendData(endpoint, {}, "PUT");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      location.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <DualOptionActionModal
    description="Are you sure of this. This action cannot be undone."
    action={(setLoading, btnRef) => handleOrderStatus(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      <Button
        className="text-[12px] font-bold"
        size="sm"
        variant="destructive"
      >Reject</Button>
    </AlertDialogTrigger>
  </DualOptionActionModal>
}

function AcceptRetailsOrder({ order }) {
  const [open, setOpen] = useState(false);
  const coach = useAppSelector(state => state.coach.data);

  return (
    <>
      <Button size="sm" variant="wz" onClick={() => setOpen(true)}>
        Accept
      </Button>
      <AddRetailModal
        payload={{
          stage: 2,
          acceptFlow: true,
          coachId: coach?._id,
          clientId: order.clientId && String(order?.clientId)?.trim() !== "" ? order.clientId : null,
          clientName: order.clientName || "",
          productModule: order.productModule || [],
          status: order.status || "Pending",
          orderId: order.orderId || "",
          margins: order.brand?.margins || [],
          selectedBrandId: order.brand?._id,
          margin: order.brand?.margins?.[0] || 0,
          brand: order.brand || {},
        }}
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}

function Inventory() {
  return <TabsContent value="inventory">
    <InventoryContainer />
  </TabsContent>
}

function InventoryContainer() {
  const [query, setQuery] = useState("")
  const { isWhitelabel } = useAppSelector(state => state.coach.data)
  const [stockFilter, setStockFilter] = useState("all");
  const { isLoading, error, data, mutate } = useSWR(
    "app/getAllReminder?person=coach",
    () => fetchData(
      buildUrlWithQueryParams(
        "app/inventory",
        isWhitelabel && { whitelabel: "thewellnessspot" }
      )
    )
  );
  const sortedProducts = useMemo(() => {
    if (!data?.data || data.status_code !== 200) return [];
    return data.data.length > 0
      ? sortByPriority(data.data || [], isWhitelabel)
      : [];
  }, [data?.data, data?.status_code, isWhitelabel]);
  const products = useMemo(() => {
    if (!sortedProducts.length) return [];
    const regex = new RegExp(query, "i");
    let filtered = sortedProducts.filter(product =>
      regex.test(product.productName)
    );

    if (stockFilter === "in-stock") {
      filtered = filtered
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);
    }

    if (stockFilter === "out-of-stock") {
    filtered = filtered.filter(p => p.quantity === 0);
    }

    return filtered;
  }, [sortedProducts, query, stockFilter]);
  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error?.message || data?.message} />

  return <div>
    <div className="mb-8 flex flex-wrap gap-4 md:gap-0 items-center justify-between">
      <h5>Products</h5>
      <div className="flex items-center justify-start md:justify-end gap-1 md:gap-4">
      <div className="ml-auto ring-1 flex items-center ring-gray-200 text-gray-500 rounded-[8px] overflow-hidden px-4 py-2 bg-[var(--comp-1)]">
          <ListFilterPlus size={18}/>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          >
          <option value="all">All Products</option>
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Product Name..."
        className="w-32 md:max-w-[400px] bg-[var(--comp-1)] ml-auto"
      />
      <Button onClick={mutate} variant="icon">
        <RefreshCcw />
        </Button>
      </div>
    </div>
    <Table className="border-1">
      <TableHeader>
        <TableRow className="bg-[var(--comp-1)] [&_th]:font-bold">
          <TableHead>Sr No.</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>Quantity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => <TableRow key={product._id}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>{product.productName}</TableCell>
          <TableCell>
            <span className={getQuantityStatusColor(product.quantity)}>{product.quantity}</span>
          </TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </div>
}

function getQuantityStatusColor(quantity) {
  if (isNaN(quantity)) return ""
  if (quantity === 0) return "w-[8ch] block bg-red-300 text-black px-4 py-1 rounded-[2px] text-center"
  if (quantity <= 3) return "w-[8ch] block bg-yellow-300 text-black px-4 py-1 rounded-[2px] text-center"
  return "w-[8ch] block bg-green-300 text-black px-4 py-1 rounded-[2px] text-center"
}


function PurchaseHistory() {
  const { isLoading, error, data, mutate } = useSWR(
    "order/history-by-status?orderType=purchase",
    () => fetchData("app/order/history-by-status?orderType=purchase")
  );

  if (isLoading) return <Loader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const orders = data.data || []

  if (orders.length === 0) return <div className="min-h-[200px] flex items-center justify-center">
    0 orders created
  </div>

  return <TabsContent value="purchase-history">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {orders.map(order => <Order key={order._id} order={order} />)}
      {orders.length === 0 && (
        <div className="col-span-full">
          <ContentError title="0 orders created" />
        </div>
      )}
    </div>
  </TabsContent>
}

function OrderNote({ notes = "", orderId }) {
  const [value, setValue] = useState(notes)
  const [loading, setLoading] = useState(false)

  const closeBtnRef = useRef()

  async function updateNote() {
    try {
      setLoading(true);
      const response = await sendData("app/order/note", { notes: value, orderId });
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("app/order-history");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogClose ref={closeBtnRef} />
    <DialogTrigger>
      <NotebookPen className="w-[28px] h-[28px] text-white bg-[var(--accent-1)] p-1 rounded-[4px]" />
    </DialogTrigger>
    <DialogContent className="p-0 !space-y-0">
      <DialogTitle className="border-b-1 p-4">Order Notes</DialogTitle>
      <div className="p-4">
        {/* <p className="italics"></p>
        {!notes && <div className="text-center">No note added</div>} */}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Please add a note"
        />
        <Button
          variant="wz"
          className="mt-4"
          disabled={!value || loading || value === notes}
          onClick={updateNote}
        >
          Save
        </Button>
      </div>
    </DialogContent>
  </Dialog>
}

function DeleteOrder({ orderId }) {
  async function deleteOrder(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const endpoint = buildUrlWithQueryParams("app/delete-order", { id: orderId })
      const response = await sendData(endpoint, {}, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("app/order-history");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    description="Are you sure of deleting this order!"
    action={(setLoading, btnRef) => deleteOrder(setLoading, btnRef)}
  >
    <AlertDialogTrigger>
      <Trash2 className="w-[28px] h-[28px] text-white bg-[var(--accent-2)] p-[6px] rounded-[4px]" />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}

function UpdateOrder({ order }) {
  const [open, setOpen] = useState(false)
  return <div>
    <Button onClick={() => setOpen(true)}>
      <Pen />
    </Button>
    <AddRetailModal
      open={open}
      payload={{
        stage: 2,
        acceptFlow: false,
        coachId: order.coachId,
        margin: order.coachMargin,
        selectedBrandId: order.brand?._id,
        margins: order.brand?.margins || [],
        brand: {
          margins: order.brand?.margins || [],
          _id: order.brand?._id
        },
        clientId: order.clientId?._id,
        productModule: order.productModule,
        status: order.status,
        clientName: order?.clientId?.name || "",
        orderId: order._id || "",
        actionType: "update"
      }}
      setOpen={setOpen}
    />
  </div>
}

function RetailReportGenerator({ orders, period: currentPeriod }) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("summary"); // summary, detailed
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod || "all");
  const [pdfData, setPdfData] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const handleGenerateReport = () => {
    try {
      if (!orders) {
        toast.error("No orders data available");
        return;
      }

      const stats = calculateFilteredStats(orders, selectedPeriod);
      const reportData = salesReportPDFData(stats, orders, selectedPeriod, reportType);

      setPdfData(reportData);
      setOpen(false);
      // Open PDF after a brief delay to ensure state is updated
      setTimeout(() => {
        setPdfOpen(true);
      }, 100);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to generate report");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="wz" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-xl font-bold mb-4">Generate Sales Report</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Period</label>
              <div className="grid grid-cols-2 gap-2">
                {["all", "weekly", "monthly", "yearly"].map((p) => (
                  <Button
                    key={p}
                    variant={selectedPeriod === p ? "wz" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(p)}
                    className="text-xs capitalize"
                  >
                    {p === "all" ? "All Time" : p}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <div className="flex gap-2">
                <Button
                  variant={reportType === "summary" ? "wz" : "outline"}
                  size="sm"
                  onClick={() => setReportType("summary")}
                  className="flex-1"
                >
                  Summary
                </Button>
                <Button
                  variant={reportType === "detailed" ? "wz" : "outline"}
                  size="sm"
                  onClick={() => setReportType("detailed")}
                  className="flex-1"
                >
                  Detailed
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Report Includes:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {reportType === "summary" ? (
                  <>
                    <li>Total Sales Amount</li>
                    <li>Total Orders Count</li>
                    <li>Volume Points</li>
                    <li>Average Order Value</li>
                  </>
                ) : (
                  <>
                    <li>All order details</li>
                    <li>Client information</li>
                    <li>Product details</li>
                    <li>Financial breakdown</li>
                    <li>Volume points per order</li>
                  </>
                )}
              </ul>
            </div>

            <Button
              variant="wz"
              className="w-full gap-2"
              onClick={handleGenerateReport}
            >
              <FileText className="h-4 w-4" />
              Generate PDF Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pdfData && (
        <PDFRenderer
          pdfTemplate="PDFSalesReport"
          data={pdfData}
          open={pdfOpen}
          onOpenChange={setPdfOpen}
        >
          <Button
            variant="wz"
            className="hidden"
          >
            View Report
          </Button>
        </PDFRenderer>
      )}
    </>
  );
}