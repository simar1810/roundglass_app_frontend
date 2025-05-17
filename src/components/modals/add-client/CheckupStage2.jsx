import HealthMetrics from "@/components/common/HealthMatrixPieCharts";
import { Button } from "@/components/ui/button";
import { setCurrentStage, updateMatrices } from "@/config/state-reducers/add-client-checkup";
import { calculateBMI2, calculateBMIFinal, calculateBMR, calculateBMRFinal, calculateBodyAge, calculateBodyAgeFinal, calculateBodyFatFinal, calculateBodyFatPercentage, calculateIdealWeight, calculateIdealWeightFinal, calculateSkeletalMassPercentage, calculateSMPFinal } from "@/lib/client/statistics";
import useCurrentStateContext from "@/providers/CurrentStateContext"
import { differenceInYears, parse } from "date-fns";
import { useEffect } from "react";

const formFields = [
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
]

export default function CheckupStage2() {
  const { dispatch, ...state } = useCurrentStateContext();

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
  }
  useEffect(function () {
    dispatch(updateMatrices(formFields, payload));
  }, []);

  return <div className="p-6 pt-0">
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-1 text-sm border-b border-gray-200 py-4">
      <div>
        Name: <span className="font-semibold">{state.name}</span>
      </div>
      <div>
        Height: <span className="font-semibold">5 Feet 8 Inches</span>
      </div>
      <div>
        D.O.B: <span className="font-semibold">{state.dob}</span>
      </div>
      <div>
        Age: <span className="font-semibold">25 yrs</span>
      </div>
      <div>
        Gender: <span className="font-semibold">{state.gender.split("")[0]?.toUpperCase() + state.gender.slice(1)}</span>
      </div>
    </div>
    <h3 className="font-semibold my-4">Statistics</h3>
    <div className="grid grid-cols-3 gap-4">
      <HealthMetrics data={{ ...state, age }} />
    </div>
    <div className="mt-6 flex items-center gap-4">
      <Button variant="wz_outline" onClick={() => dispatch(setCurrentStage(1))}>Previous</Button>
      <Button
        onClick={() => dispatch(setCurrentStage(3))}
        variant="wz"
      >
        Next
      </Button>
    </div>
  </div>
}