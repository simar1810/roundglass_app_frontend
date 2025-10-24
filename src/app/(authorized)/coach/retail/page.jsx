"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
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
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { fetchData, sendData } from "@/lib/api";
import { excelRetailOrdersData, exportToExcel } from "@/lib/excel";
import { getOrderHistory, getRetail } from "@/lib/fetchers/app";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { invoicePDFData } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { TabsTrigger } from "@radix-ui/react-tabs";
import { parse } from "date-fns";
import { Clock, EllipsisVertical, Eye, EyeClosed, RefreshCcw, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

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
      totalSales={retails.totalSale}
      totalOrders={orders.myOrder.length}
      acumulatedVP={(orders?.acumulatedVP || 0).toFixed(2)}
      />
    <div className="content-container">
      <RetailContainer
        orders={ordersData.data}
        retails={retails}
      />
    </div>
  </div>
}

function RetailStatisticsCards({
  totalSales,
  totalOrders,
  acumulatedVP
}) {
  const [hide, setHide] = useState(true);
  return <div className="grid grid-cols-3 gap-4">
    <Card className="bg-linear-to-tr from-[var(--accent-1)] to-[#04BE51] p-4 rounded-[10px]">
      <CardHeader className="text-white p-0 mb-0">
        <CardTitle className="">
          <span className="w-full">Total Sales</span>
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
        <h4 className={cn("text-white !text-[28px]", hide && "text-transparent")}>₹ {totalSales}</h4>
      </CardContent>
    </Card>
    <Card className="p-4 rounded-[10px] shadow-none">
      <CardHeader className="p-0 mb-0">
        <CardTitle>Total Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <h4 className="!text-[28px]">{totalOrders}</h4>
      </CardContent>
    </Card>
    <Card className="p-4 rounded-[10px] shadow-none">
      <CardHeader className="p-0 mb-0">
        <CardTitle>Volume Points</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <h4 className="!text-[28px]">{acumulatedVP}</h4>
      </CardContent>
    </Card>
  </div>
}

function RetailContainer({ orders, retails }) {
  return <Tabs defaultValue="brands">
    <TabsList className="w-full bg-transparent p-0 mb-4 flex justify-start gap-4 border-b-2 rounded-none">
      <TabsTrigger
        className="pb-4 px-4 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="brands"
      >
        New Order
      </TabsTrigger>
      <TabsTrigger
        className="pb-4 px-4 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="order-history"
      >
        Order History
      </TabsTrigger>
      <TabsTrigger
        className="pb-4 px-4 font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
        value="inventory"
      >
        Inventory
      </TabsTrigger>
    </TabsList>
    <Brands brands={retails.brands} />
    <Orders orders={orders} />
    <Inventory />
  </Tabs>
}

function Brands({ brands }) {
  return <TabsContent value="brands">
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
    <div className="relative hover:[&_.badge]:opacity-100">
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
          clientId: brand.clientId && brand.clientId.trim() !== "" ? brand.clientId : null,
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
  const myOrders = [...orders.myOrder, ...orders.retailRequest]
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
    <div className="grid grid-cols-3 gap-4">
      {myOrders.map(order => <Order key={order._id} order={order} />)}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="text-black w-[16px]">
              <EllipsisVertical className="cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="font-semibold px-2 py-[6px]">
              <PDFRenderer pdfTemplate="PDFInvoice" data={invoicePDFData(order, coach)}>
                <DialogTrigger className="w-full text-[12px] font-bold flex items-center gap-2">
                  Invoice
                </DialogTrigger>
              </PDFRenderer>
            </DropdownMenuContent>
          </DropdownMenu>
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
  return <Card className="bg-[var(--comp-1)] mb-2 gap-2 border-1 shadow-none px-4 py-2 rounded-[4px]">
    <CardHeader className="px-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {order.status === "Completed" && <RetailCompletedLabel status={order.status} />}
          {order.status === "Pending" && <RetailPendingLabel status={order.status} />}
          {order.status === "Cancelled" && <RetailCancelledLabel status={order.status} />}
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
            {order.orderType || 'Sale'}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="text-black w-[16px]">
            <EllipsisVertical className="cursor-pointer" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="font-semibold px-2 py-[6px]">
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
          <h4>{order.productModule.map(product => product.productName).join(", ")}</h4>
          <p className="text-[10px] text-[var(--dark-1)]/25 leading-[1.2]">{order.productModule?.at(0)?.productDescription}</p>
          {order.sellingPrice && <div className="text-[20px] text-nowrap font-bold ml-auto">₹ {order.sellingPrice}</div>}
        </div>
      </div>
    </CardContent>
    <CardFooter className="px-0 items-end justify-between">
      <div className="text-[12px]">
        <p className="text-[var(--dark-1)]/25">Order From: <span className="text-[var(--dark-1)]">{order?.clientId?.name || "-"}</span></p>
        <p className="text-[var(--dark-1)]/25">Order Date: <span className="text-[var(--dark-1)]">{order.createdAt || "-"}</span></p>
        <p className="text-[var(--dark-1)]/25">Pending Amount: <span className="text-[var(--dark-1)]">₹ {Math.max(order.pendingAmount || 0)}</span></p>
        <p className="text-[var(--dark-1)]/25">Paid Amount: <span className="text-[var(--dark-1)]">₹ {Math.max(order.paidAmount || 0)}</span></p>
      </div>
      {order.pendingAmount > 0
        ? <UpdateClientOrderAmount order={order} />
        : <Badge variant="wz">Paid</Badge>}
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
      const filteredOrders = orders.myOrder.filter(order => order.orderType === "sale");
      const data = excelRetailOrdersData(filteredOrders, dates)
      exportToExcel(data, "Retail Orders", "orders.xlsx")
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
  return <div className="mt-4 flex items-center gap-2">
    <AcceptRetailsOrder order={order} />
    <RejectOrderAction
      status="cancel"
      id={order.orderId}
    />
  </div>
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
  return <div>
    <Brand
      brand={{
        ...order.brand,
        clientId: order.clientId && order.clientId.trim() !== "" ? order.clientId : null,
        productModule: order.productModule,
        status: order.status,
        orderId: order.orderId,
        status: "Pending"
      }}
    >
      <Button
        size="sm"
        variant="wz">Accept</Button>
    </Brand>
  </div >
}

function Inventory() {
  return <TabsContent value="inventory">
    <InventoryContainer />
  </TabsContent>
}

function InventoryContainer() {
  const [query, setQuery] = useState("")

  const { isLoading, error, data, mutate } = useSWR(
    "app/getAllReminder?person=coach",
    () => fetchData("app/inventory?whitelabel=thewellnessspot")
  );

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const regex = new RegExp(query, "i")
  const products = data.data.filter(
    product => regex.test(product.productName)
  ) || []

  return <div>
    <div className="mb-8 flex items-center justify-between">
      <h5>Products</h5>
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Product Name..."
        className="max-w-[400px] bg-[var(--comp-1)] ml-auto"
      />
      <Button onClick={mutate} variant="icon">
        <RefreshCcw />
      </Button>
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
          <TableCell>{product.quantity}</TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </div>
}