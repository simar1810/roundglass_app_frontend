import { setCurrentStage, updateMatrices } from "@/config/state-reducers/add-client-checkup";
import { calculateBMI2, calculateBMR, calculateBodyAge, calculateBodyFatPercentage, calculateIdealWeight, calculateSkeletalMassPercentage } from "@/lib/client/statistics";
import useCurrentStateContext from "@/providers/CurrentStateContext"
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

  const heightinMetres = state.heightUnit === "Cm" ? Number(state.height) / 100 : Number(state.height) / 3.28084;

  const payload = {}
  payload.bmi = calculateBMI2(state);
  payload.muscle = calculateSkeletalMassPercentage(state);
  payload.fat = calculateBodyFatPercentage(state);
  payload.rm = calculateBMR(state);
  payload.ideal_weight = (21 * (heightinMetres * heightinMetres)).toFixed(2);
  payload.bodyAge = calculateBodyAge(state);

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
        Ideal Weight: <span className="font-semibold">{payload.idealWeight} KG</span>
      </div>
      <div>
        Age: <span className="font-semibold">25 yrs</span>
      </div>
      <div>
        Body Type: <span className="font-semibold">{state.bodyComposition}</span>
      </div>
      <div>
        Gender: <span className="font-semibold">{state.gender.split("")[0]?.toUpperCase() + state.gender.slice(1)}</span>
      </div>
    </div>
    <h3 className="font-semibold my-4">Statistics</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {formFields.filter(({ name }) => payload[name]).map(({ label, value, desc, info, icon, name }) => <div
        key={label}
        className="bg-[#F9F9F9] rounded-xl p-4 shadow-sm relative text-center"
      >
        <img
          src={icon}
          alt={`${label} icon`}
          className="w-5 h-5 absolute top-3 left-3"
        />
        <div className="mt-4 flex flex-col items-center">
          <div className="text-sm font-semibold mb-2">{label}</div>
          <div className="relative w-20 h-20 mb-2">
            <div className="w-full h-full rounded-full border-4 border-green-500 flex items-center justify-center text-xl font-bold text-black">
              {payload[name]}
            </div>
          </div>
          {desc && (
            <div className="text-green-600 text-sm font-medium">
              {desc}
            </div>
          )}
          <p className="text-[11px] text-gray-600 whitespace-pre-wrap mt-1">
            {info}
          </p>
        </div>
      </div>)}
    </div>
    <button onClick={() => dispatch(setCurrentStage(1))}>Previous</button>
    <div className="mt-6">
      <button onClick={() => dispatch(setCurrentStage(3))} className="bg-[var(--accent-1)] text-white font-bold w-full text-center px-4 py-3 rounded-[4px]">
        Next
      </button>
    </div>
  </div>
}