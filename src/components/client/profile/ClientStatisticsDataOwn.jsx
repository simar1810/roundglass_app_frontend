import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import HealthMetrics from "@/components/common/HealthMatrixPieCharts";
import PDFRenderer from "@/components/modals/PDFRenderer";
import { Button } from "@/components/ui/button"
import { DialogTrigger } from "@/components/ui/dialog";
import { TabsContent } from "@/components/ui/tabs";
import { getClientMatrices, getClientStatsForCoach } from "@/lib/fetchers/app";
import { clientStatisticsPDFData, comparisonPDFData } from "@/lib/pdf";
import { useAppSelector } from "@/providers/global/hooks";
import { differenceInYears, parse } from "date-fns";
import { FilePen } from "lucide-react"
import { useState, useMemo } from "react";
import useSWR from "swr";

const SVG_ICONS = [
  "/svgs/body.svg",      // 0
  "/svgs/check.svg",     // 1
  "/svgs/checklist.svg", // 2
  "/svgs/bmi.svg",       // 3
  "/svgs/cutlery.svg",   // 4
  "/svgs/fat.svg",       // 5
  "/svgs/fats.svg",      // 6
  "/svgs/muscle.svg",    // 7
  "/svgs/meta.svg",      // 8
  "/svgs/person.svg",    // 9
  "/svgs/weight.svg",    // 10
  "/svgs/flame-icon.svg",// 11
  "/svgs/marathon.svg",  // 12
  "/svgs/users-icon.svg",// 13
];

const DEFAULT_FORM_FIELDS = [
  {
    label: "BMI",
    value: "23.4",
    desc: "Healthy",
    info: "Optimal: 18–23\nOverweight: 23–27\nObese: 27–32",
    icon: "/svgs/bmi.svg",
    name: "bmi",
    title: "BMI",
    id: 1,
    getMaxValue: () => 25,
    getMinValue: () => 18,
  },
  {
    label: "Muscle",
    value: "15%",
    info: "Optimal Range: 32–36% for men, 24–30% for women\nAthletes: 38–42%",
    icon: "/svgs/muscle.svg",
    name: "muscle",
    title: "Muscle",
    id: 2,
    getMaxValue: () => 45,
    getMinValue: () => 30,
  },
  {
    label: "Fat",
    value: "15%",
    info: "Optimal Range:\n10–20% for Men\n20–30% for Women",
    icon: "/svgs/fats.svg",
    name: "fat",
    title: "Fat",
    id: 3,
    getMaxValue: () => 20,
    getMinValue: () => 10,
  },
  {
    label: "Resting Metabolism",
    value: "15%",
    info: "Optimal Range: Varies by age,\ngender, and activity level",
    icon: "/svgs/meta.svg",
    name: "rm",
    title: "Resting Metabolism",
    id: 4,
    getMaxValue: () => 3000,
    getMinValue: () => 1500,
  },
  {
    label: "Weight",
    value: "65 Kg",
    desc: "Ideal 75",
    info: "Ideal weight Range:\n118. This varies by height and weight",
    icon: "/svgs/weight.svg",
    name: "ideal_weight",
    title: "Ideal Weight",
    id: 5,
    getMaxValue: ({ value }) => value + 5,
    getMinValue: ({ value }) => value - 5,
  },
  {
    label: "Body Age",
    value: "26",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "bodyAge",
    title: "Body Age",
    id: 6,
    getMaxValue: () => 67,
    getMinValue: () => 33,
  },
  {
    label: "Subcuatneous Fat",
    value: "26",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "sub_fat",
    title: "Subcutaneous Fat",
    id: 7,
    getMaxValue: ({ gender }) => gender === "male" ? 5 : 20,
    getMinValue: ({ gender }) => gender === "male" ? 2 : 10,
  },
  {
    label: "Visceral Fat",
    value: "26",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "visceral_fat",
    title: "Visceral Fat",
    id: 8,
    getMaxValue: () => 12,
    getMinValue: () => 1,
  },
];

export default function ClientStatisticsDataOwn({ clientData }) {
  try {
    const { dob, gender } = clientData
    const [selectedDate, setSelectedDate] = useState(0);
    const { coachHealthMatrixFields } = useAppSelector(state => state.coach.data);

    function formatDate(dateString) {
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    }

    const formFields = useMemo(() => {
      if (!coachHealthMatrixFields) return DEFAULT_FORM_FIELDS;

      const { defaultFields = [], coachAddedFields = [] } = coachHealthMatrixFields;

      // Filter default fields
      const activeDefaultFields = DEFAULT_FORM_FIELDS.filter(field =>
        defaultFields.includes(field.name) ||
        (field.name === "ideal_weight" && (defaultFields.includes("ideal_weight") || defaultFields.includes("idealWeight")))
      );

      // Map coach added fields
      const customFields = coachAddedFields.map(field => ({
        label: field.title,
        value: "0",
        info: `Range: ${field.minValue} - ${field.maxValue}`,
        icon: SVG_ICONS[field.svg] || "/svgs/checklist.svg",
        name: field.fieldLabel,
        title: field.title,
        id: field._id || field.fieldLabel,
        getMaxValue: () => field.maxValue,
        getMinValue: () => field.minValue,
      }));

      return [...activeDefaultFields, ...customFields];
    }, [coachHealthMatrixFields]);

    const { isLoading, error, data } = useSWR("clientStatistics", () => getClientMatrices("client"));

    if (isLoading) return <ContentLoader />

    if (error || data.status_code !== 200 || isNaN(selectedDate)) return <TabsContent value="statistics">
      <ContentError title={error || data.message} className="mt-0" />
    </TabsContent>
    const clientStats = data?.data?.at(0)?.healthMatrix || [];
    const payload = {
      ...clientStats?.at(selectedDate),
      age: dob
        ? differenceInYears(new Date(), parse(dob, 'dd-MM-yyyy', new Date()))
        : 0,
      bodyComposition: clientStats?.at(selectedDate)?.body_composition,
      gender,
      heightCms: clientStats?.at(selectedDate)?.heightUnit?.toLowerCase() === "cm"
        ? clientStats?.at(selectedDate)?.height
        : "",
      heightFeet: clientStats?.at(selectedDate)?.heightUnit?.toLowerCase() === "inches"
        ? (clientStats?.at(selectedDate)?.height?.split("."))[0]
        : "",
      heightInches: clientStats?.at(selectedDate)?.heightUnit?.toLowerCase() === "inches"
        ? (clientStats?.at(selectedDate)?.height?.split("."))[1]
        : "",
      weightInKgs: clientStats?.at(selectedDate)?.weightUnit?.toLowerCase() === "kg"
        ? clientStats?.at(selectedDate)?.weight
        : "",
      weightInPounds: clientStats?.at(selectedDate)?.weightUnit?.toLowerCase() === "pounds"
        ? clientStats?.at(selectedDate)?.weight
        : "",
    }
    const weightDifference = Math.abs(Number(clientStats?.at(0)?.weight) - Number(clientStats?.at(1)?.weight))

    return <TabsContent value="statistics">
      <div className="pb-4 flex items-center gap-2 border-b-1 overflow-x-auto no-scrollbar">
        {clientStats.map((stat, index) => <Button
          key={index}
          variant={selectedDate === index ? "wz" : "outline"}
          className={selectedDate !== index && "text-[var(--dark-1)]/25"}
          onClick={() => setSelectedDate(index)}
        >
          {stat.createdDate || formatDate(stat.date)}
        </Button>)}
      </div>
      <DownLoadPdf
        clientData={clientData}
        clientStats={clientStats}
        selectedDate={selectedDate}
      />
      {!isNaN(weightDifference) && <h5 className="text-[16px] mt-4">Weight Difference Between Last Check-up: {weightDifference} KG</h5>}
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <HealthMetrics data={payload} fields={formFields} />
      </div>
    </TabsContent>
  } catch (error) {
    return <TabsContent value="statistics">
      <ContentError title={error.message} className="mt-0" />
    </TabsContent>
  }
}

function StatisticsExportingOptions({
  clientData,
  clientStats,
  selectedDate
}) {
  const coach = useAppSelector(state => state.coach.data);

  return <div className="py-4 text-[12px] flex items-center gap-2 border-b-1 overflow-x-auto">
    <PDFRenderer pdfTemplate="PDFComparison" data={comparisonPDFData(clientData, clientStats, coach, selectedDate)}>
      <DialogTrigger className="h-9 px-4 flex items-center gap-2 border-1 rounded-[8px]">
        <FilePen className="w-[14px]" />
        Share & View Comparison PPT
      </DialogTrigger>
    </PDFRenderer>
    <PDFRenderer pdfTemplate="PDFShareStatistics" data={clientStatisticsPDFData(clientData, clientStats, coach, selectedDate)}>
      <DialogTrigger className="h-9 px-4 flex items-center gap-2 border-1 rounded-[8px]">
        <FilePen className="w-[14px]" />
        Share Statistics ({clientStats?.at(selectedDate).createdDate})
      </DialogTrigger>
    </PDFRenderer>
  </div>
}

function DownLoadPdf({ clientData, clientStats, selectedDate }) {
  const coach = {
    name: clientData?.coachName || "NA",
    specialization: clientData?.coachDescription || "NA",
    profilePhoto: clientData?.coachProfile || ""
  }
  return (
    <PDFRenderer
      pdfTemplate="PDFShareStatistics"
      data={clientStatisticsPDFData(clientData, clientStats, coach, selectedDate)}
    >
      <DialogTrigger asChild>
        <div className="w-full text-center mx-auto my-2 cursor-pointer">
          <div className="ring-1 ring-[var(--accent-1)] text-center py-2 w-full md:w-[30vw] rounded-full mx-auto">
            <p className="text-[var(--accent-1)] font-semibold text-base">Download PDF</p>
          </div>
        </div>
      </DialogTrigger>
    </PDFRenderer>
  );
}
