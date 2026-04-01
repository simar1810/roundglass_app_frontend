import HealthMetrics from "@/components/common/HealthMatrixPieCharts";
import { Button } from "@/components/ui/button";
import { setCurrentStage, updateMatrices, changeFieldvalue } from "@/config/state-reducers/add-client-checkup";
import { calculateBMIFinal, calculateBMRFinal, calculateBodyAgeFinal, calculateBodyFatFinal, calculateIdealWeightFinal, calculateSMPFinal, calculateSubcutaneousFat } from "@/lib/client/statistics";
import { useHealthMatrixFieldsConfig } from "@/hooks/useHealthMatrixFieldsConfig";
import useCurrentStateContext from "@/providers/CurrentStateContext"
import { differenceInYears, parse } from "date-fns";
import { useEffect, useMemo } from "react";

function getWeight(state) {
  if (["kgs", "kg"].includes(state.weightUnit?.toLowerCase())) return `${state.weightInKgs} Kgs`
  return `${state.weightInPounds} Lbs`
}

export default function CheckupStage2() {
  const { dispatch, ...state } = useCurrentStateContext();
  const { formFields, isLoading, isFallback } = useHealthMatrixFieldsConfig("client-add");


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
    {isLoading && <p className="text-xs text-muted-foreground mb-3">Loading health matrix field settings...</p>}
    {isFallback && process.env.NODE_ENV !== "production" && (
      <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Health matrix settings API unavailable. Rendering fallback defaults in dev mode.
      </div>
    )}
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-1 text-sm border-b border-gray-200 py-4">
      <div>
        Name: <span className="font-semibold">{state.name}</span>
      </div>
      <div>
        Weight: <span className="font-semibold">{getWeight(state)}</span>
      </div>
      <div>
        Height:&nbsp;
        <span className="font-semibold">
          {["cm", "cms"].includes(state.heightUnit.toLowerCase())
            ? `${state.heightCms} cm`
            : `${state.heightFeet} ft. ${state.heightInches} in`}
        </span>
      </div>
      {state.dob && <div>
        D.O.B: <span className="font-semibold">
          {state.dob.split("-").reverse().join("-")}
        </span>
      </div>}
      {(state.age || state.dob) && <div>
        Age: <span className="font-semibold">
          {
            state.age
              ? state.age
              : differenceInYears(new Date(), parse(state.dob, 'yyyy-MM-dd', new Date()))
          }
          yrs</span>
      </div>}
      <div>
        Gender: <span className="font-semibold">{state.gender.split("")[0]?.toUpperCase() + state.gender.slice(1)}</span>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <h3 className="font-semibold my-4">Statistics</h3>
    </div>
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
