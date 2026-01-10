"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import Loader from "@/components/common/Loader";
import YouTubeEmbed from "@/components/common/YoutubeEmbed";
import FormControl from "@/components/FormControl";
import PDFRenderer from "@/components/modals/PDFRenderer";
import Paginate from "@/components/Paginate";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchData, sendData } from "@/lib/api";
import { getClientMealPlanById, getClientOrderHistory, getClientWorkouts, getMarathonClientTask, getWaterLog } from "@/lib/fetchers/app";
import { trimString } from "@/lib/formatter";
import { customMealDailyPDFData } from "@/lib/pdf";
import { youtubeVideoId } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { format, subMinutes } from "date-fns";
import { BarChart2, Bot, Briefcase, CalendarIcon, Clock, Droplet, Dumbbell, Eye, FileDown, FileText, Flag, MoreVertical, ShoppingBag, TrendingUp, Users, Utensils, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import DisplayClientQuestionaire from "../questionaire/display/DisplayClientQuestionaire";
import AIAgentHistory from "./AIAgentHistory";
import ClientClubDataComponent from "./ClientClubDataComponent";
import ClientReports from "./ClientReports";
import ClientStatisticsData from "./ClientStatisticsData";
import PhysicalClub from "./PhysicalClub";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";

const tabItems = [
  { icon: <BarChart2 className="w-[16px] h-[16px]" />, value: "statistics", label: "Statistics" },
  { icon: <Utensils className="w-[16px] h-[16px]" />, value: "meal", label: "Meal" },
  { icon: <Dumbbell className="w-[16px] h-[16px]" />, value: "workout", label: "Workout" },
  { icon: <ShoppingBag className="w-[16px] h-[16px]" />, value: "retail", label: "Retail", showIf: ({ organisation }) => organisation.toLowerCase() === "herbalife" },
  { icon: <Flag className="w-[16px] h-[16px]" />, value: "marathon", label: "Marathon" },
  { icon: <Users className="w-[16px] h-[16px]" />, value: "club", label: "Club" },
  { icon: <Droplet className="w-[16px] h-[16px]" />, value: "water-log", label: "Water Log" },
  { icon: <Bot className="w-[16px] h-[16px]" />, value: "ai-agent", label: "AI History" },
  { icon: <FileText className="w-[16px] h-[16px]" />, value: "client-reports", label: "Client Reports" },
  { icon: <FileText className="w-[16px] h-[16px]" />, value: "physical-club", label: "Physical Club", showIf: ({ features }) => features.includes(3) },
  { icon: <Briefcase className="w-[16px] h-[16px]" />, value: "case-file", label: "Questionaire", },
  { icon: <Briefcase className="w-[16px] h-[16px]" />, value: "adherence", label: "Adherence", },
]

const ADHERENCE_SCORE_RANGES = [
  {
    label: "Excellent",
    min: 80,
    max: 100,
    description: "You’re consistently performing at the top level and mastering your skills.",
  },
  {
    label: "Good",
    min: 60,
    max: 79,
    description: "You have a solid grasp and are on the right track, with room to improve.",
  },
  {
    label: "Average",
    min: 40,
    max: 59,
    description: "You’re doing okay, but there are key areas that need more focus.",
  },
  {
    label: "Below Average",
    min: 20,
    max: 39,
    description: "You may be struggling in some areas and should consider extra practice.",
  },
  {
    label: "Poor",
    min: 0,
    max: 19,
    description: "Significant improvement is needed; it’s time to reassess your approach and strategy.",
  },
];

const GAUGE_RADIUS = 90;
const GAUGE_LENGTH = Math.PI * GAUGE_RADIUS;

function tooltipVisibilityClass(isVisible) {
  return isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0";
}

function getAdherenceRangeForScore(score) {
  return ADHERENCE_SCORE_RANGES.find(range => score >= range.min) || ADHERENCE_SCORE_RANGES[ADHERENCE_SCORE_RANGES.length - 1];
}

export default function ClientData({ clientData }) {
  const router = useRouter();
  const pathname = usePathname();

  const params = useSearchParams();
  const selectedTab = tabItems.map(item => item.value).includes(params.get("tab"))
    ? params.get("tab")
    : "statistics"
  const { organisation } = useAppSelector(state => state.coach.data);

  function tabChange(value) {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("tab", value);
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };
  return <div className="bg-white h-auto px-2 py-4 md:p-4 rounded-[18px] border-1">
    <Tabs defaultValue={selectedTab} onValueChange={tabChange}>
      <Header />
      <ClientStatisticsData clientData={clientData} />
      <ClientMealData _id={clientData._id} client={clientData} />
      {organisation.toLowerCase() === "herbalife" && <ClientRetailData clientId={clientData.clientId} />}
      <ClientClubDataComponent clientData={clientData} />
      <MarathonData clientData={clientData} />
      <WorkoutContainer id={clientData._id} />
      <AIAgentHistory />
      <WaterLogData clientId={clientData._id} />
      <ClientReports />
      <CaseFile sections={clientData.onboarding_questionaire || []} />
      <PhysicalClub />
      <TabsContent value="adherence">
        <ClientAdherenceScore clientId={clientData.clientId} />
      </TabsContent>
    </Tabs>
  </div>
}

function ClientMealData({ _id, client }) {
  const { isLoading, error, data } = useSWR(`app/getClientMealPlanById?clientId=${_id}`, () => getClientMealPlanById(_id));

  if (isLoading) return <TabsContent value="meal">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200) return <TabsContent value="meal">
    <ContentError className="mt-0" title={error || data.message} />
  </TabsContent>
  const meals = data?.data?.plans || data?.data || [];
  return <TabsContent value="meal">
    {meals && meals?.map((meal, index) => <CustomMealDetails
      key={index}
      meal={meal}
      client={client}
    />)}
    {meals.length === 0 && <ContentError title="No Meal plan assigned to this client" />}
  </TabsContent>
}

export function CustomMealDetails({ meal, client }) {
  async function unassignClient(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData(
        "app/meal-plan/custom/unassign",
        { clients: [client._id], id: meal._id },
        "POST"
      );
      if (response.status_code !== 200) throw new Error(response.message || "Please try again later!");
      mutate(`app/getClientMealPlanById?clientId=${client._id}`)
      toast.success(response.message);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message || "Please try again Later!");
    } finally {
      setLoading(false);
    }
  }

  if (meal.custom) return <div className="relative border-1 rounded-[10px] overflow-clip block mb-4">
    <Link href={`/coach/meals/list-custom/${meal._id}`} className="block">
      <Image
        alt=""
        src={meal.image || "/not-found.png"}
        height={400}
        width={400}
        className="w-full object-cover max-h-[200px]"
      />
      <Badge className="absolute top-4 right-4 font-bold" variant="wz_fill">Custom</Badge>
    </Link>
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h3>{meal.title}</h3>
        <div className="flex items-center gap-2">
          <MealPDFGenerator meal={meal} client={client} />
          <Badge className="capitalize">{meal.mode}</Badge>
        </div>
      </div>
      <p>{trimString(meal.description, 80)}</p>
      <DualOptionActionModal
        description="Are you sure unassign this client from the meal plan?"
        action={(setLoading, closeBtnRef) => unassignClient(setLoading, closeBtnRef)}
      >
        <AlertDialogTrigger className="ml-auto block" asChild>
          <Button size="sm" variant="wz">Unassign</Button>
        </AlertDialogTrigger>
      </DualOptionActionModal>
    </div>
  </div>
  if (meal?.isRoutine) return <Link href={`/coach/meals/list/${meal._id}`} className="relative border-1 rounded-[10px] overflow-clip block mb-4">
    <Image
      alt=""
      src={meal.image || "/not-found.png"}
      height={400}
      width={400}
      className="w-full object-cover max-h-[200px]"
    />
    <Badge className="absolute top-4 right-4 font-bold" variant="wz_fill">Routine</Badge>
    <div className="p-4">
      <h3 className="mb-2">{meal.name}</h3>
      <p className="text-sm leading-tight">{trimString(meal.description, 80)}</p>
    </div>
  </Link>
}

function MealPDFGenerator({ meal, client }) {
  const coach = useAppSelector(state => state.coach.data);
  const coachName = coach?.name || "";

  const defaultVariant = useMemo(() => {
    if (meal?.mode === "weekly") return "landscape";
    if (meal?.mode === "monthly") return "compact";
    return "portrait";
  }, [meal?.mode]);

  const [selectedPdfVariant, setSelectedPdfVariant] = useState(defaultVariant);
  const [includeMacros, setIncludeMacros] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeGuidelines, setIncludeGuidelines] = useState(true);
  const [includeSupplements, setIncludeSupplements] = useState(true);

  const pdfData = useMemo(() => {
    if (!meal) return null;
    return customMealDailyPDFData(meal, null, { name: coachName }, { includeMacros, includeDescription, includeGuidelines, includeSupplements, client });
  }, [coachName, meal, includeMacros, includeDescription, includeGuidelines, includeSupplements, client]);

  const pdfTemplateMap = {
    portrait: "PDFCustomMealPortrait",
    landscape: "PDFCustomMealLandscape",
    compact: "PDFCustomMealCompactLandscape",
    compactPortrait: "PDFCustomMealCompactPortrait",
  };

  const pdfDisabled = !pdfData || !pdfData?.plans?.some(plan => Array.isArray(plan?.meals) && plan.meals.length > 0);
  const pdfTemplateKey = pdfTemplateMap[selectedPdfVariant] || "PDFDailyMealSchedule";

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <PDFRenderer pdfTemplate={pdfTemplateKey} data={pdfData || {}}>
        <DialogTrigger
          className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={pdfDisabled}
        >
          <FileDown className="w-5 h-5" />
        </DialogTrigger>
      </PDFRenderer>

      <Select
        value={selectedPdfVariant}
        onValueChange={setSelectedPdfVariant}
        disabled={pdfDisabled}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs hidden md:flex">
          <SelectValue placeholder="Layout" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="portrait">Portrait Overview</SelectItem>
          <SelectItem value="landscape">Landscape Matrix</SelectItem>
          <SelectItem value="compact">Compact Landscape</SelectItem>
          <SelectItem value="compactPortrait">Compact Portrait</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={pdfDisabled}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            checked={includeMacros}
            onCheckedChange={setIncludeMacros}
            onSelect={(e) => e.preventDefault()}
          >
            Show Macros
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={includeDescription}
            onCheckedChange={setIncludeDescription}
            onSelect={(e) => e.preventDefault()}
          >
            Show Description
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={includeGuidelines}
            onCheckedChange={setIncludeGuidelines}
            onSelect={(e) => e.preventDefault()}
          >
            Show Guidelines
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={includeSupplements}
            onCheckedChange={setIncludeSupplements}
            onSelect={(e) => e.preventDefault()}
          >
            Show Supplements
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center font-bold cursor-pointer">
            Close
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ClientRetailData({ clientId }) {
  const { id } = useParams()
  const { isLoading, error, data } = useSWR(`app/getClientOrderHistory/${clientId}`, () => getClientOrderHistory(id));

  if (isLoading) return <TabsContent value="meal">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200) return <TabsContent value="meal">
    <ContentError title={error || data.message} />
  </TabsContent>

  const orderHistoryClient = data?.data;
  const completed = data?.data?.Completed || {}
  const incomplete = data?.data?.Pending || {}

  if (orderHistoryClient?.orderHistory?.length === 0) return <TabsContent value="retail">
    <ContentError className="mt-0" title="0 retails for this client!" />
  </TabsContent>

  return <TabsContent value="retail">
    {(completed?.orders || []).map(order => <RetailOrderDetailCard
      key={order._id}
      order={order}
    />)}
    {(incomplete?.orders || []).map(order => <RetailOrderDetailCard
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
        <h4>{order.productModule.map(product => `${product.productName} (x${product.quantity || 1})`).join(", ")}</h4>
        <p className="text-[12px] text-[var(--dark-1)]/25">{order.productModule?.at(0)?.productDescription}</p>
      </div>
      <div className="text-[20px] text-nowrap font-bold ml-auto">₹ {order.sellingPrice}</div>
    </CardContent>
    <CardFooter className="px-0 items-end justify-between">
      <div className="text-[12px]">
        <p className="text-[var(--dark-1)]/25">Order From: <span className="text-[var(--dark-1)]">{order?.clientId?.name}</span></p>
        <p className="text-[var(--dark-1)]/25">Order Date: <span className="text-[var(--dark-1)]">{order.createdAt}</span></p>
        <p className="text-[var(--dark-1)]/25">Pending Amount: <span className="text-[var(--dark-1)]">₹ {Math.max(order.pendingAmount, 0)}</span></p>
        <p className="text-[var(--dark-1)]/25">Paid Amount: <span className="text-[var(--dark-1)]">₹ {Math.max(order.paidAmount, 0)}</span></p>
      </div>
      {/* <Link className="underline text-[var(--accent-1)] text-[12px] flex items-center" href="/">
        Order Now&nbsp;{">"}
      </Link> */}
      {/* {order.pendingAmount > 0
        ? <UpdateClientOrderAmount order={order} />
        : <Badge variant="wz">Paid</Badge>} */}
    </CardFooter>
  </Card>
}

export function UpdateClientOrderAmount({ order, swrKey }) {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");

  async function updateRetailAmount() {
    try {
      setLoading(true);
      const response = await sendData(
        `app/client/retail-order/${order.clientId?._id}`,
        { orderId: order._id, amount: value },
        "PUT"
      );
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      if(typeof swrKey !== "string") location.reload()
      mutate(swrKey)
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger className="px-4 py-2 rounded-[10px] bg-[var(--accent-1)] font-bold text-white text-[14px]">Pay</DialogTrigger>
    <DialogContent className="p-0 gap-0">
      <DialogTitle className="p-4 border-b-1">Order Amount</DialogTitle>
      <div className="p-4">
        <p> Pending Amount - ₹{order.pendingAmount}</p>
        <p> Paid Amount - ₹{order.paidAmount}</p>
        <FormControl
          label="Add Amount"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Enter Amount"
          className="block mt-4"
        />
        <Button
          variant="wz"
          className="block mt-4"
          disabled={loading}
          onClick={updateRetailAmount}
        >
          Update
        </Button>
      </div>
    </DialogContent>
  </Dialog>
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
  const [selectedMedia, setSelectedMedia] = useState(null); // { type: 'video' | 'photo', url: string, title: string }
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

  // Helper function to get video URL from task (checking multiple possible field names)
  const getVideoUrl = (task) => {
    return task.video || task.videoUrl || task.submittedVideo || task.submittedVideoUrl || null;
  };

  // Helper function to get photo URL from task (checking multiple possible field names)
  const getPhotoUrl = (task) => {
    return task.photo || task.photoUrl || task.submittedPhoto || task.submittedPhotoUrl || null;
  };

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
                {marathon.tasks.map((task) => {
                  const videoUrl = getVideoUrl(task);
                  const photoUrl = getPhotoUrl(task);
                  const hasMedia = task.isCompleted && (videoUrl || photoUrl);

                  return (
                    <div
                      key={task.taskId}
                      className="bg-white p-4 border rounded-lg"
                    >
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="text-sm mt-2 flex flex-wrap gap-3 items-center">
                        <span>🎯 Points: {task.points}</span>
                        <span>📽 Video: {task.videoSubmission ? 'Yes' : 'No'}</span>
                        <span>📷 Photo: {task.photoSubmission ? 'Yes' : 'No'}</span>
                        <span>{task.isCompleted ? '✅ Completed' : '❌ Incomplete'}</span>
                      </div>
                      {hasMedia && (
                        <div className="mt-3 flex gap-2">
                          {videoUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMedia({ type: 'video', url: videoUrl, title: task.title })}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Video
                            </Button>
                          )}
                          {photoUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMedia({ type: 'photo', url: photoUrl, title: task.title })}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Photo
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>

    {/* Video/Photo View Modal */}
    {selectedMedia && (
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
          <DialogTitle className="p-4 border-b">{selectedMedia.title}</DialogTitle>
          <div className="p-4">
            {selectedMedia.type === 'video' ? (
              <div className="aspect-video w-full">
                {youtubeVideoId(selectedMedia.url) ? (
                  <YouTubeEmbed link={selectedMedia.url} />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full h-full rounded-lg"
                    style={{ maxHeight: '70vh' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  width={1200}
                  height={1200}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  unoptimized
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
  </TabsContent>
}

function Header() {
  const { organisation, features } = useAppSelector(state => state.coach.data);
  return <TabsList className="w-full h-auto bg-transparent p-0 mb-10 flex items-start gap-x-2 gap-y-3 flex-wrap rounded-none no-scrollbar">
    {tabItems.map(({ icon, value, label, showIf }) => {
      if (showIf && !showIf({ organisation, features })) return null;
      return (
        <TabsTrigger
          key={value}
          className="min-w-[110px] mb-[-5px] px-2 font-semibold flex-1 basis-0 flex items-center gap-1 rounded-[10px] py-2
             data-[state=active]:bg-[var(--accent-1)] data-[state=active]:text-[var(--comp-1)]
             data-[state=active]:shadow-none text-[#808080] bg-[var(--comp-1)] border-1 border-[#EFEFEF]"
          value={value}
        >
          {icon}
          {label}
        </TabsTrigger>
      );
    })}
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
  const workouts = data?.data;

  return <TabsContent value="workout">
    {workouts && workouts?.map((workout, index) => <WorkoutDetails
      key={index}
      workout={workout}
    />)}
  </TabsContent>
}

function WaterLogData({ clientId }) {
  const [date, setDate] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const dateString = date || null;

  // Fetch all records (API might return all regardless of pagination params)
  const { isLoading, error, data, mutate } = useSWR(
    `app/water-log?person=coach&clientId=${clientId}${dateString ? `&date=${dateString}` : ""}`,
    () => getWaterLog(clientId, dateString)
  );

  if (isLoading) return <TabsContent value="water-log">
    <ContentLoader />
  </TabsContent>

  if (error || !Boolean(data) || data?.status_code !== 200) return <TabsContent value="water-log">
    <ContentError className="mt-0" title={error?.message || data?.message} />
  </TabsContent>

  // Get all water logs from API
  const allWaterLogs = data?.data?.results || data?.data || [];

  // Apply client-side pagination
  const totalResults = allWaterLogs.length;
  const totalPages = Math.ceil(totalResults / pagination.limit);
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const waterLogs = allWaterLogs.slice(startIndex, endIndex);

  // Format date to dd-MM-yyyy
  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    try {
      const dateObj = new Date(dateValue);
      if (isNaN(dateObj.getTime())) {
        // If it's already in dd-MM-yyyy format, return as is
        if (typeof dateValue === "string" && dateValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
          return dateValue;
        }
        return dateValue;
      }
      return format(dateObj, "dd-MM-yyyy");
    } catch {
      return dateValue;
    }
  };

  return <TabsContent value="water-log">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[var(--dark-1)] font-semibold text-lg">Water Log</h3>
      <div className="flex items-center gap-2">
        {/* <AddWaterLogModal clientId={clientId} /> */}
        <DatePicker
          date={date}
          setDate={(newDate) => {
            setDate(newDate);
            setPagination({ page: 1, limit: pagination.limit });
          }}
        />
        {date && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDate(null);
              setPagination({ page: 1, limit: pagination.limit });
            }}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
    <div className="bg-white overflow-x-auto rounded-[10px] border-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Amount (ml)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waterLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No water log entries found
              </TableCell>
            </TableRow>
          ) : (
            waterLogs.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{formatDate(item.date || item.createdAt || item.createdDate)}</TableCell>
                <TableCell>{format(subMinutes(item.date, 330), "hh:mm a")}</TableCell>
                <TableCell>{item.amount || item.quantity || item.waterAmount} ml</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    {allWaterLogs.length > 0 && (
      <div className="mt-4">
        <Paginate
          totalPages={totalPages}
          totalResults={totalResults}
          limit={pagination.limit}
          page={pagination.page}
          onChange={(newPagination) => {
            setPagination(newPagination);
          }}
        />
      </div>
    )}
  </TabsContent>
}

export function WorkoutDetails({ workout }) {
  if (workout.custom) return <Link
    href={`/coach/workouts/list-custom/${workout._id}`}
    className="relative border-1 rounded-[10px] overflow-clip block mb-4"
  >
    <Image
      alt=""
      src={workout?.image?.trim() || "/not-found.png"}
      height={400}
      width={400}
      className="w-full object-cover max-h-[200px]"
    />
    <Badge className="absolute top-4 right-4 font-bold" variant="wz_fill">Custom</Badge>
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h3>{workout.title}</h3>
        <Badge className="capitalize">{workout.mode}</Badge>
      </div>
      <p className="text-sm leading-tight mt-2">{trimString(workout.description, 80)}</p>
    </div>
  </Link>
  const routineWorkout = workout?.plans?.daily
  if (routineWorkout) return <Link
    href={`/coach/workouts/list/${routineWorkout._id}`}
    className="relative border-1 rounded-[10px] overflow-clip block mb-4"
  >
    <Image
      alt=""
      src={routineWorkout?.thumbnail?.trim() || "/not-found.png"}
      height={400}
      width={400}
      className="w-full object-cover max-h-[200px]"
    />
    <Badge className="absolute top-4 right-4 font-bold" variant="wz_fill">Routine</Badge>
    <div className="p-4">
      <h3 className="mb-2">{routineWorkout.title}</h3>
      <p className="text-sm leading-tight">{trimString(routineWorkout.instructions, 80)}</p>
    </div>
  </Link>
}

function CaseFile({ sections }) {
  if (sections?.length === 0) return <TabsContent
    className="h-[200px] leading-[200px] text-center bg-[var(--comp-1)] border-1 rounded-[10px]"
    value="case-file"
  >
    No Questions Answered
  </TabsContent>
  return <TabsContent value="case-file">
    <DisplayClientQuestionaire data={sections} />
  </TabsContent>
}

function ClientAdherenceScore({ clientId }) {
  const [date, setDate] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

  const endpoint = useMemo(() => `app/client/adherence-score?person=coach&clientId=${clientId}`, [clientId])
  const { isLoading, error, data, mutate } = useSWR(
    endpoint, () => fetchData(endpoint)
  );


  const adherenceData = data?.data || {};
  const currentScore = adherenceData.adherenceScore;
  let history = adherenceData.adherenceScoreHistory || [];

  const formatDateHelper = (dateValue) => {
    if (!dateValue) return "";
    try {
      const dateObj = new Date(dateValue);
      if (isNaN(dateObj.getTime())) {
        if (typeof dateValue === "string" && dateValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
          return dateValue;
        }
        return dateValue;
      }
      return format(dateObj, "dd-MM-yyyy");
    } catch {
      return dateValue;
    }
  };

  // Filter by date if selected
  if (date) {
    history = history.filter(item => {
      const itemDate = formatDateHelper(item.date);
      return itemDate === date;
    });
  }

  const handleDatePickerChange = (newDate) => {
    setDate(newDate);
    setPagination(prev => ({ page: 1, limit: prev.limit }));
  };

  const clearDateFilter = () => {
    setDate(null);
    setPagination(prev => ({ page: 1, limit: prev.limit }));
  };

  const parsedScore = parseFloat(currentScore);
  const hasScore = Number.isFinite(parsedScore);
  const normalizedScore = hasScore ? Math.min(Math.max(parsedScore, 0), 100) : 0;
  const targetRatio = hasScore ? normalizedScore / 100 : 0;
  const gradientId = useMemo(() => `adherence-gradient-${clientId}`, [clientId]);
  const [animatedRatio, setAnimatedRatio] = useState(0);
  const animationStartRef = useRef(null);
  const activeRange = hasScore ? getAdherenceRangeForScore(normalizedScore) : null;

  useEffect(() => {
    animationStartRef.current = null;
    let frame;
    const duration = 1200;
    const animate = (timestamp) => {
      if (animationStartRef.current === null) {
        animationStartRef.current = timestamp;
      }
      const elapsed = timestamp - animationStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedRatio(progress * targetRatio);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      animationStartRef.current = null;
    };
  }, [targetRatio]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Sort by date
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    return sortedHistory.map((item, index) => ({
      date: formatDateHelper(item.date),
      score: parseFloat(item.score) || 0,
      fullDate: item.date
    }));
  }, [history]);

  const getScoreColor = (label) => {
    switch (label) {
      case "Excellent": return "text-emerald-600";
      case "Good": return "text-green-600";
      case "Average": return "text-yellow-600";
      case "Below Average": return "text-orange-600";
      case "Poor": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (isLoading) return <Loader />

  if (error || !data || data?.status_code !== 200) return <div>
    <Button onClick={mutate}>Retry</Button>
    {error?.message || data?.message || "Error loading data"}
  </div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[var(--dark-1)] mb-1">Adherence Score</h3>
          <p className="text-sm text-muted-foreground">
            Track your progress and consistency over time
          </p>
        </div>
        <Dialog open={isHistoryModalOpen} onOpenChange={setHistoryModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              View History
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-xl font-bold mb-4">Adherence Score History</DialogTitle>
            {chartData.length > 0 ? (
              <div className="space-y-6">
                <div className="h-80 w-full">
                  <ChartContainer
                    config={{
                      score: {
                        label: "Adherence Score",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value.toFixed(1)}`, "Score"]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth={3}
                          fill="url(#scoreGradient)"
                          dot={{ fill: "rgb(59, 130, 246)", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="border-t pt-4">
                  <div className="max-h-64 overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chartData.slice().reverse().map((item, index) => {
                          const range = getAdherenceRangeForScore(item.score);
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.date}</TableCell>
                              <TableCell className="text-right font-semibold">{item.score.toFixed(1)}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className={getScoreColor(range?.label)}>
                                  {range?.label || "N/A"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No history data available yet</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Score Card */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Gauge Section */}
          <div className="flex-1 max-w-md">
            <div className="flex flex-col items-center space-y-6">
              {/* Gauge */}
              <div className="relative w-full max-w-[320px] h-32">
                <svg viewBox="0 0 220 120" className="h-full w-full">
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M20 110 A 90 90 0 0 1 200 110"
                    fill="transparent"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 110 A 90 90 0 0 1 200 110"
                    fill="transparent"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray={GAUGE_LENGTH.toFixed(2)}
                    strokeDashoffset={(GAUGE_LENGTH * (1 - animatedRatio)).toFixed(2)}
                    style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
                  />
                </svg>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                <p className={`text-6xl font-bold ${getScoreColor(activeRange?.label)} mb-4`}>
                  {hasScore ? normalizedScore.toFixed(0) : "N/A"}
                </p>
                <Badge
                  variant="outline"
                  className={`text-base font-semibold px-4 py-2 ${getScoreColor(activeRange?.label)} border-current`}
                >
                  {activeRange?.label ?? "No Data"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Score Details Section */}
          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-[var(--dark-1)] mb-4">Score Breakdown</h4>
              <div className="space-y-3">
                {ADHERENCE_SCORE_RANGES.map(range => (
                  <div
                    key={range.label}
                    className={`p-3 rounded-lg border-2 transition-colors ${range.label === activeRange?.label
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-slate-50 hover:bg-slate-100"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold text-sm ${range.label === activeRange?.label
                            ? getScoreColor(range.label)
                            : "text-slate-700"
                            }`}>
                            {range.label}
                          </span>
                          {range.label === activeRange?.label && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {range.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {range.min}-{range.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
