import FormControl from "@/components/FormControl";
import { changeFieldvalue, changeHeightUnit, setCurrentStage, stage1Completed } from "@/config/state-reducers/add-client-checkup";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";

export default function CheckupStage1() {
  const { dispatch, ...state } = useCurrentStateContext();
  return <div className="p-6 pt-4">
    <p className="text-sm font-semibold mb-1">Lets add a New Client</p>
    <p className="text-xs text-gray-500 mb-6">
      But before that, we will need some details about them. Select when
      your customer joined you, New (now or Recently) and Existing (old)
    </p>
    <div className="flex items-center gap-6 mb-6">
      <div>
        <p className="font-semibold text-sm">Select Customer type</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              onChange={e => dispatch(changeFieldvalue("clientType", "new"))}
              checked={state.clientType === "new"}
              type="radio"
            />
            New
          </label>
          <label className="flex items-center gap-2">
            <input
              onChange={e => dispatch(changeFieldvalue("clientType", "existing"))}
              checked={state.clientType === "existing"}
              type="radio"
            />
            Existing
          </label>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <FormControl
        label="Client Name"
        type="text"
        placeholder="Enter Name"
        value={state.name}
        onChange={e => dispatch(changeFieldvalue("name", e.target.value))}
      />
      <FormControl
        label="DOB (mandatory or 01/01/2000)"
        type="date"
        placeholder="DD/MM/YYYY"
        className="w-full"
        value={state.dob}
        onChange={e => dispatch(changeFieldvalue("dob", e.target.value))}
      />
      <div>
        <span className="label font-[600] block mb-1">Gender</span>
        <div className="flex gap-4">
          <button
            onClick={() => dispatch(changeFieldvalue("gender", "male"))}
            className={`flex-1 p-2 border rounded text-sm ${state.gender === "male" && "border-[var(--accent-1)] text-[var(--accent-1)]"}`}
          >
            ♂ Male
          </button>
          <button
            onClick={() => dispatch(changeFieldvalue("gender", "female"))}
            className={`flex-1 p-2 border rounded text-sm ${state.gender === "female" && "border-[var(--accent-1)] text-[var(--accent-1)]"}`}
          >
            ♀ Female
          </button>
        </div>
      </div>

      <FormControl
        label="Date of Joining"
        type="date"
        placeholder="DD/MM/YYYY"
        className="w-full"
        onChange={(e) => state.clientType !== "new"
          ? dispatch(changeFieldvalue("joiningDate", e.target.value))
          : {}
        }
        value={state.clientType === "new" ? format(new Date(), 'yyyy-MM-dd') : state.joiningDate}
      />

      <div>
        <span className="label font-[600] block mb-1">Height</span>
        <div className="flex items-center gap-4 text-sm mb-2">
          <label className="flex items-center gap-1">
            <input
              onChange={e => dispatch(changeHeightUnit("Inches"))}
              checked={state.heightUnit === "Inches"}
              type="radio"
            />
            Ft In
          </label>
          <label className="flex items-center gap-1">
            <input
              onChange={e => dispatch(changeHeightUnit("Cm"))}
              checked={state.heightUnit === "Cm"}
              type="radio"
            />
            CM
          </label>
        </div>
        <Selectheight />
      </div>
      <div>
        <span className="label font-[600] block mb-2">Weight</span>
        <div className="flex gap-3 text-sm mb-2">
          <label className="flex items-center gap-1">
            <input
              onChange={e => dispatch(changeFieldvalue("weightUnit", "Kg"))}
              checked={state.weightUnit === "Kg"}
              type="radio"
            />
            Kg
          </label>
          <label className="flex items-center gap-1">
            <input
              onChange={e => dispatch(changeFieldvalue("weightUnit", "Pounds"))}
              checked={state.weightUnit === "Pounds"}
              type="radio"
            />
            Lbs
          </label>
        </div>
        <FormControl
          placeholder="Enter weight"
          value={state.weight}
          onChange={e => dispatch(changeFieldvalue("weight", e.target.value))}
          type="number"
        />
      </div>
      <div className="mr-[-10px]">
        <FormControl
          label="Visceral Fat (optional)"
          type="text"
          placeholder="Enter Visceral Fat"
          value={state.visceral_fat}
          onChange={e => dispatch(changeFieldvalue("visceral_fat", e.target.value))}
        />
      </div>
      <div className="col-span-2">
        <span className="label font-[600] block mb-2">
          Body Composition
        </span>
        <div className="flex gap-2">
          <div
            onClick={() => dispatch(changeFieldvalue("bodyComposition", "Slim"))}
            className={`border rounded p-3 text-center cursor-pointer w-24 ${state.bodyComposition === "Slim" && "border-[var(--accent-1)]"}`}
          >
            <div className="w-[83px] h-[106px] mx-auto mb-1 flex items-center justify-center overflow-hidden">
              <Image
                src="/svgs/slim.svg"
                width={60}
                height={60}
                alt="Slim SVG"
              />
            </div>
            <p className="text-xs">Slim</p>
          </div>
          <div
            onClick={() => dispatch(changeFieldvalue("bodyComposition", "Medium"))}
            className={`border rounded p-3 text-center cursor-pointer w-24 ${state.bodyComposition === "Medium" && "border-[var(--accent-1)]"}`}
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
            onClick={() => dispatch(changeFieldvalue("bodyComposition", "Fat"))}
            className={`border rounded p-3 text-center cursor-pointer w-24 ${state.bodyComposition === "Fat" && "border-[var(--accent-1)]"}`}
          >
            <div className="w-[83px] h-[106px] mx-auto mb-1 flex items-center justify-center overflow-hidden">
              <Image
                src="/svgs/fat.svg"
                width={150}
                height={150}
                alt="Fat SVG"
              />
            </div>
            <p className="text-xs">Fat</p>
          </div>
        </div>
      </div>
    </div>

    <button
      onClick={() => {
        const completed = stage1Completed(state, "stage1");
        if (!completed.success) toast.error("Please fill the field - " + completed.field)
        else dispatch(setCurrentStage(2))
      }}
      className="bg-[var(--accent-1)] text-white font-bold w-full items-center text-center px-4 py-3 rounded-[4px] mt-6"
    >
      Next
    </button>
  </div>
}

function Selectheight() {
  const { heightCms, heightFeet, heightInches, dispatch, heightUnit } = useCurrentStateContext();

  if (heightUnit !== "Inches") return <div className="flex">
    <FormControl
      value={heightCms}
      placeholder="Cm"
      onChange={(e) => dispatch(changeFieldvalue("heightCms", e.target.value))}
      type="number"
      className="grow"
    />
  </div>
  return <div className="flex gap-2">
    <FormControl
      value={heightFeet}
      label="Ft"
      onChange={(e) => {
        const value = Number(e.target.value);
        if (value >= 0 && value <= 12) {
          dispatch(changeFieldvalue("heightFeet", value));
        } else {
          toast.error("Inches should be between 0 and 12");
        }
      }}
      placeholder="Ft"
      className="w-full"
      type="number"
    />
    <FormControl
      value={heightInches}
      label="Inch"
      onChange={(e) => {
        const value = Number(e.target.value);
        if (value >= 0 && value <= 12) {
          dispatch(changeFieldvalue("heightInches", value));
        } else {
          toast.error("Inches should be between 0 and 12");
        }
      }}
      placeholder="In"
      className="w-full"
      type="number"
    />
  </div>
}