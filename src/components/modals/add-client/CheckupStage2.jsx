import HealthMetrics from "@/components/common/HealthMatrixPieCharts";
import { Button } from "@/components/ui/button";
import { setCurrentStage, updateMatrices, changeFieldvalue } from "@/config/state-reducers/add-client-checkup";
import { calculateBMIFinal, calculateBMRFinal, calculateBodyAgeFinal, calculateBodyFatFinal, calculateIdealWeightFinal, calculateSMPFinal, calculateSubcutaneousFat } from "@/lib/client/statistics";
import useCurrentStateContext from "@/providers/CurrentStateContext"
import { useAppSelector } from "@/providers/global/hooks";
import { differenceInYears, parse } from "date-fns";
import { useEffect, useMemo } from "react";

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
    name: "bmi"
  },
  {
    label: "Muscle",
    value: "15%",
    info: "Optimal Range: 32–36% for men, 24–30% for women\nAthletes: 38–42%",
    icon: "/svgs/muscle.svg",
    name: "muscle"
  },
  {
    label: "Fat",
    value: "15%",
    info: "Optimal Range:\n10–20% for Men\n20–30% for Women",
    icon: "/svgs/fats.svg",
    name: "fat"
  },
  {
    label: "Resting Metabolism",
    value: "15%",
    info: "Optimal Range: Varies by age,\ngender, and activity level",
    icon: "/svgs/meta.svg",
    name: "rm"
  },
  {
    label: "Weight",
    value: "65 Kg",
    desc: "Ideal 75",
    info: "Ideal weight Range:\n118. This varies by height and weight",
    icon: "/svgs/weight.svg",
    name: "ideal_weight"
  },
  {
    label: "Body Age",
    value: "26",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "bodyAge"
  },
  {
    label: "Subcuatneous Fat",
    value: "26",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "sub_fat"
  },
  {
    label: "Visceral Fat",
    value: "26",
    info: "Optimal Range:\nMatched actual age or lower,\nHigher Poor Health",
    icon: "/svgs/body.svg",
    name: "visceral_fat"
  },
]

export default function CheckupStage2() {
  const { dispatch, ...state } = useCurrentStateContext();
  const { coachHealthMatrixFields } = useAppSelector(state => state.coach.data);

  const formFields = useMemo(() => {
    if (!coachHealthMatrixFields) return DEFAULT_FORM_FIELDS;

    const { defaultFields = [], coachAddedFields = [] } = coachHealthMatrixFields;

    // Filter default fields
    const activeDefaultFields = DEFAULT_FORM_FIELDS.filter(field =>
      defaultFields.includes(field.name) ||
      // Handle mapping discrepancies if any (e.g., ideal_weight vs idealWeight)
      (field.name === "ideal_weight" && (defaultFields.includes("ideal_weight") || defaultFields.includes("idealWeight")))
    );

    // Map coach added fields
    const customFields = coachAddedFields.map(field => ({
      label: field.title,
      value: "0", // Default or placeholder
      info: `Range: ${field.minValue} - ${field.maxValue}`,
      icon: SVG_ICONS[field.svg] || "/svgs/checklist.svg",
      name: field.fieldLabel,
      title: field.title, // For HealthMetrics to use as title
      id: field._id || field.fieldLabel, // Unique ID
      getMaxValue: () => field.maxValue,
      getMinValue: () => field.minValue,
    }));

    return [...activeDefaultFields, ...customFields];
  }, [coachHealthMatrixFields]);


  const age = state.dob
    ? differenceInYears(new Date(), parse(state.dob, 'yyyy-MM-dd', new Date()))
    : 0

  const payload = {
    bmi: calculateBMIFinal(state),
    muscle: calculateSMPFinal({ ...state, age }),
    fat: calculateBodyFatFinal({ ...state, age }),
    rm: calculateBMRFinal({ ...state, age }),
    ideal_weight: calculateIdealWeightFinal(state),
    bodyAge: calculateBodyAgeFinal({ ...state, age }),
    sub_fat: calculateSubcutaneousFat({ ...state, age })?.subcutaneousPercent
  }
  useEffect(function () {
    dispatch(updateMatrices(formFields, payload));
  }, [formFields]); // Depend on formFields to update when they change

  return <div className="p-6 pt-0">
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-1 text-sm border-b border-gray-200 py-4">
      <div>
        Name: <span className="font-semibold">{state.name}</span>
      </div>
      <div>
        Height:&nbsp;
        <span className="font-semibold">
          {["cm", "cms"].includes(state.heightUnit.toLowerCase())
            ? `${state.heightCms} cm`
            : `${state.heightFeet} ft. ${state.heightInches} in`}
        </span>
      </div>
      <div>
        D.O.B: <span className="font-semibold">
          {state.dob.split("-").reverse().join("-")}
        </span>
      </div>
      <div>
        Age: <span className="font-semibold">{differenceInYears(new Date(), parse(state.dob, 'yyyy-MM-dd', new Date()))} yrs</span>
      </div>
      <div>
        Gender: <span className="font-semibold">{state.gender.split("")[0]?.toUpperCase() + state.gender.slice(1)}</span>
      </div>
    </div>
    <h3 className="font-semibold my-4">Statistics</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HealthMetrics
        onUpdate={(payload, fieldName, closeBtnRef) => {
          dispatch(changeFieldvalue(fieldName, payload[fieldName]));
          closeBtnRef.current.click()
        }}
        data={{ ...state, age }}
        fields={formFields}
        showAll={true}
      />
    </div>
    <div className="mt-10 flex items-center gap-4">
      <Button className="grow" variant="wz_outline" onClick={() => dispatch(setCurrentStage(1))}>Previous</Button>
      <Button
        onClick={() => dispatch(setCurrentStage(3))}
        variant="wz"
        className="grow"
      >
        Next
      </Button>
    </div>
  </div>
}
