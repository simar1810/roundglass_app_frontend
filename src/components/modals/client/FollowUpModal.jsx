import FormControl from "@/components/FormControl";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Label as ChartLabel } from "recharts";
import { RadioGroup } from "@/components/ui/radio-group";
import { CalendarRange } from "lucide-react";
import { PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import useCurrentStateContext, {
  CurrentStateProvider,
} from "@/providers/CurrentStateContext";
import {
  changeFieldvalue,
  followUpReducer,
  generateRequestPayload,
  init,
  setCurrentStage,
  setHealthMatrices,
  setNextFollowUpDate,
  stage1Completed,
} from "@/config/state-reducers/follow-up";
import {
  calculateBMI2,
  calculateBMR,
  calculateBodyAge,
  calculateBodyFatPercentage,
  calculateSkeletalMassPercentage,
} from "@/lib/client/statistics";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { sendData } from "@/lib/api";

export default function FollowUpModal({ clientData }) {
  return <Dialog>
    <DialogTrigger className="w-full bg-[var(--accent-1)] text-[var(--primary-1)] text-[14px] font-semibold pr-3 py-2 flex items-center justify-center gap-2 rounded-[8px]">
      <CalendarRange />
      Follow-up
    </DialogTrigger>
    <DialogContent className="!max-w-[650px] max-h-[70vh] border-b-1 p-0 gap-0 overflow-y-auto">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle className="text-[24px]">Follow Up</DialogTitle>
      </DialogHeader>
      <CurrentStateProvider
        state={init(clientData)}
        reducer={followUpReducer}
      >
        <FollowUpModalContainer clientId={clientData.clientId} />
      </CurrentStateProvider>
    </DialogContent>
  </Dialog>
}

function FollowUpModalContainer({ clientId, dob }) {
  const { stage } = useCurrentStateContext();
  if (stage === 1) return <Stage1 />;
  return <Stage2 clientId={clientId} dob={dob} />;
}

function Stage1() {
  const { followUpType, healthMatrix, dispatch, ...state } =
    useCurrentStateContext();

  return <div className="p-4">
    <FormControl
      label="Date"
      type="date"
      className="block w-1/2 [&_.label]:font-[400] [&_.input]:text-[14px]"
      value={healthMatrix.date}
      onChange={e => dispatch(changeFieldvalue("date", e.target.value))}
    />
    <h3 className="mt-4">Latest Old Weight {"-->"} 65.0 KG</h3>
    <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-4">
      <div>
        <div className="pr-2 flex items-center gap-2 justify-between">
          <p>Last Weight</p>
          <RadioGroup value={healthMatrix.weightUnit} className="flex items-center gap-1">
            <input
              id="weight-kg"
              value="Kg"
              type="radio"
              className="w-[14px] h-[14px]"
              checked={healthMatrix.weightUnit === "Kg"}
              onChange={() => dispatch(changeFieldvalue("weightUnit", "Kg"))}
            />
            <Label htmlFor="weight-kg" className="mr-3">Kg</Label>
            <input
              id="weight-pounds"
              value="Pounds"
              type="radio"
              checked={healthMatrix.weightUnit === "Pounds"}
              className="w-[14px] h-[14px]"
              onChange={() => dispatch(changeFieldvalue("weightUnit", "Pounds"))}
            />
            <Label htmlFor="weight-pounds">Pounds</Label>
          </RadioGroup>
        </div>
        <FormControl
          type="number"
          className="[&_.label]:font-[400] [&_.input]:text-[14px]"
          placeholder="Enter Weight"
          value={healthMatrix.weight}
          onChange={e => dispatch(changeFieldvalue("weight", e.target.value))}
        />
      </div>
      <FormControl
        label="Visceral Fat"
        type="number"
        placeholder="Visceral Fat"
        className="[&_.label]:font-[400] [&_.input]:text-[14px]"
        value={healthMatrix.visceral_fat}
        onChange={e => dispatch(changeFieldvalue("visceral_fat", e.target.value))}
      />
    </div>
    <SelectBodyComposition />
    <div className="mt-8 grid grid-cols-2 items-end gap-x-6">
      <div className="">
        <p>Follow Up Type</p>
        <RadioGroup value={healthMatrix.followUpType} className="mt-4 flex items-center gap-1">
          <input
            id="follow-up-8day"
            value="8day"
            type="radio"
            className="w-[14px] h-[14px]"
            checked={healthMatrix.followUpType === "8day"}
            onChange={() => dispatch(changeFieldvalue("followUpType", "8day"))}
          />
          <Label htmlFor="follow-up-8day" className="mr-3">8 Day</Label>
          <input
            id="follow-up-custom"
            value="custom"
            type="radio"
            checked={healthMatrix.followUpType === "custom"}
            className="w-[14px] h-[14px]"
            onChange={() => dispatch(changeFieldvalue("followUpType", "custom"))}
          />
          <Label htmlFor="follow-up-custom">Custom</Label>
        </RadioGroup>
      </div>
      {healthMatrix.followUpType === "custom" && <FormControl
        type="date"
        className="[&_.label]:font-[400] [&_.input]:text-[14px]"
        value={state.nextFollowUpDate}
        onChange={e => dispatch(setNextFollowUpDate(e.target.value))}
      />}
    </div>
    <Button
      onClick={() => {
        const completed = stage1Completed({ ...state, healthMatrix })
        if (!completed.success) toast.error(`Field ${completed.field} is required!`);
        else dispatch(setCurrentStage(2))
      }}
      variant="wz" className="block mx-auto mt-10 px-24">Continue</Button>
  </div>
}

const matrices = [
  {
    label: "BMI",
    desc: "Healthy",
    info: "Optimal: 18-23\nOverweight: 23-27\nObese: 27-32",
    icon: "/svgs/bmi.svg",
    name: "bmi",
    id: 1,
  },
  {
    label: "Muscle",
    info: "Optimal Range: 32-36% for men, 24-30% for women\nAthletes: 38-42%",
    icon: "/svgs/muscle.svg",
    name: "muscle",
    id: 2,
  },
  {
    label: "Fat",
    info: "Optimal Range:\n10-20% for Men\n20-30% for Women",
    icon: "/svgs/fats.svg",
    name: "fat",
    id: 3,
  },
  {
    label: "Resting Metabolism",
    info: "Optimal Range: Varies by age,\ngender, and activity level",
    icon: "/svgs/meta.svg",
    name: "rm",
    id: 4,
  },
  {
    label: "Weight",
    desc: "Ideal 75",
    info: "Ideal weight Range:\n118. This varies by height and weight",
    icon: "/svgs/weight.svg",
    name: "ideal_weight",
    id: 5,
  },
  {
    label: "Body Age",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "bodyAge",
    id: 6,
  },
];

function Stage2({ clientId }) {
  const { healthMatrix, dispatch, ...state } = useCurrentStateContext();
  const heightinMetres = healthMatrix.heightUnit === "Cm" ? Number(healthMatrix.height) / 100 : Number(healthMatrix.height) / 3.28084;

  const healthMatrices = {
    bmi: calculateBMI2({
      ...healthMatrix,
      bodyComposition: healthMatrix.body_composition,
    }),
    muscle: calculateSkeletalMassPercentage({
      ...healthMatrix,
      bodyComposition: healthMatrix.body_composition,
    }),
    fat: calculateBodyFatPercentage({
      ...healthMatrix,
      bodyComposition: healthMatrix.body_composition,
    }),
    rm: calculateBMR({
      ...healthMatrix,
      bodyComposition: healthMatrix.body_composition,
    }),
    ideal_weight: (21 * (heightinMetres * heightinMetres)).toFixed(2),
    bodyAge: calculateBodyAge({
      ...healthMatrix,
      bodyComposition: healthMatrix.body_composition,
    }),
    age: age,
  };

  async function createFollowUp() {
    try {
      const data = generateRequestPayload({ healthMatrix, ...state })
      const response = await sendData(`app/add-followup?clientId=${clientId}`, data)
      if (response.status_code !== 200) throw new Error(response.message || response.error);
      toast.success(response.message);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(function () {
    dispatch(setHealthMatrices(healthMatrices));
  }, []);

  return (
    <div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-6">
          {matrices.map((matrix) => (
            <div key={matrix.id} className="bg-[var(--comp-1)] p-4 rounded-[8px]">
              <div className="flex gap-4">
                <Avatar className="w-[20px] h-[20px] rounded-none">
                  <AvatarImage src={matrix.icon} />
                </Avatar>
                <p className="text-[12px] font-semibold">{matrix.label}</p>
              </div>
              <PieChart amount={healthMatrices[matrix.name]} />
              {matrix.info.split("\n").map((text) => (
                <p key={text} className="text-[12px] leading-[1.4]">
                  {text}
                </p>
              ))}
            </div>
          ))}
        </div>
        <Button
          onClick={createFollowUp}
          variant="wz"
          className="block mx-auto mt-10 px-24"
        >
          Done
        </Button>
      </div>
      <Button onClick={createFollowUp} variant="wz" className="block mx-auto mt-10 px-24">Done</Button>
    </div>
  )
}

const chartData = [{ visitors: 20, fill: "var(--accent-1)" }];

function PieChart({ amount }) {
  return (
    <ChartContainer config={{}} className="mx-auto aspect-square max-h-[250px]">
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
          <ChartLabel
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
                      {amount}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      {chartData[0].title}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}

function SelectBodyComposition() {
  const { healthMatrix, dispatch } = useCurrentStateContext();

  return (
    <div className="mt-4 col-span-2">
      <span className="label font-[600] block mb-2">Body Composition</span>
      <div className="grid grid-cols-5 gap-2">
        <div
          onClick={() => dispatch(changeFieldvalue("body_composition", "Slim"))}
          className={`border rounded p-3 text-center cursor-pointer w-24 ${healthMatrix.body_composition === "Slim" &&
            "border-[var(--accent-1)]"
            }`}
        >
          <div className="w-[83px] h-[106px] mx-auto mb-1 flex items-center justify-center overflow-hidden">
            <Image src="/svgs/slim.svg" width={60} height={60} alt="Slim SVG" />
          </div>
          <p className="text-xs">Slim</p>
        </div>
        <div
          onClick={() =>
            dispatch(changeFieldvalue("body_composition", "Medium"))
          }
          className={`border rounded p-3 text-center cursor-pointer w-24 ${healthMatrix.body_composition === "Medium" &&
            "border-[var(--accent-1)]"
            }`}
        >
          <div className="w-[83px] h-[106px] mx-auto mb-1 flex items-center justify-center overflow-hidden">
            <Image
              src="/svgs/medium.svg"
              width={50}
              height={60}
              alt="Medium SVG"
            />
          </div>
          <p className="text-xs">Medium</p>
        </div>

        {/* Fat */}
        <div
          onClick={() => dispatch(changeFieldvalue("body_composition", "Fat"))}
          className={`border rounded p-3 text-center cursor-pointer w-24 ${healthMatrix.body_composition === "Fat" &&
            "border-[var(--accent-1)]"
            }`}
        >
          <div className="w-[83px] h-[106px] mx-auto mb-1 flex items-center justify-center overflow-hidden">
            <Image src="/svgs/fat.svg" width={150} height={150} alt="Fat SVG" />
          </div>
          <p className="text-xs">Fat</p>
        </div>
      </div>
    </div>
  );
}
