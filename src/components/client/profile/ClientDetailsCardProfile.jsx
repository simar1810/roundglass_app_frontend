import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import Image from "next/image";
import { nameInitials } from "@/lib/formatter";
import { clientPortfolioFields } from "@/config/data/ui";
import UpdateClientGoalModal from "@/components/modals/client/UpdateClientGoalModal";
import UpdateClientDetailsOwnModal from "@/components/modals/client/UpdateClientDetailsOwnModal";

export default function ClientDetailsCardProfile({ clientData }) {
  const { activity_doc_ref: activities } = clientData;

  return <Card className="bg-[var(--comp-1)] rounded-[18px] shadow-none w-[90vw] md:w-auto">
    <Header clientData={clientData} />
    <CardContent>
      <div className="flex items-center justify-between">
        <h4>Goal</h4>
        <UpdateClientGoalModal
          id={clientData._id}
          clientData={clientData}
        />
      </div>
      {clientData.goal && <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2 mb-4">{clientData.goal}</p>}
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2">{clientData.notes}</p>
      {Boolean(activities) && <ClientActivities activities={activities} />}
      <div className="mt-4 flex items-center justify-between">
        <h4>Personal Information</h4>
        <UpdateClientDetailsOwnModal clientData={clientData} />
      </div>
      <div className="mt-4 pl-4">
        {clientPortfolioFields.map(field => <div key={field.id} className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
          <p>{field.title}</p>
          <p className="text-[var(--dark-2)] col-span-2">:&nbsp;{clientData[field.name]}</p>
        </div>)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h4>Training Information</h4>
      </div>
      <div className="mt-4 pl-4">
        {clientData?.trainingInfo?.trainingFrequency && (
          <div className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
            <p>Training Frequency</p>
            <p className="text-[var(--dark-2)] col-span-2">
              :&nbsp;{clientData.trainingInfo.trainingFrequency}
            </p>
          </div>
        )}
        {clientData?.trainingInfo?.trainingDuration && (
          <div className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
            <p>Duration</p>
            <p className="text-[var(--dark-2)] col-span-2">
              :&nbsp;{clientData.trainingInfo.trainingDuration}
            </p>
          </div>
        )}
        {clientData?.trainingInfo?.trainingIntensity && (
          <div className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
            <p>Intensity</p>
            <p className="text-[var(--dark-2)] col-span-2">
              :&nbsp;{clientData.trainingInfo.trainingIntensity}
            </p>
          </div>
        )}
        {clientData?.trainingInfo?.conditioningDays && (
          <div className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
            <p>Conditioning Days</p>
            <p className="text-[var(--dark-2)] col-span-2">
              :&nbsp;{clientData.trainingInfo.conditioningDays}
            </p>
          </div>
        )}
        {!clientData?.trainingInfo && (
          <p className="text-sm italic text-[#808080]">
            No training information added yet
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h4>Supplement Intake Tracker</h4>
      </div>
      <div className="mt-4 pl-4">
        {clientData?.supplementIntake && clientData.supplementIntake.length > 0 ? (
          <div className="space-y-4">
            {clientData.supplementIntake.map((supplement, index) => (
              <div
                key={index}
                className="p-3 border-1 rounded-[8px] bg-[var(--comp-1)] space-y-2"
              >
                {supplement.brand && (
                  <div className="text-[13px] grid grid-cols-4 items-center gap-2">
                    <p className="font-semibold">Brand</p>
                    <p className="text-[var(--dark-2)] col-span-3">
                      :&nbsp;{supplement.brand}
                    </p>
                  </div>
                )}
                {supplement.dosage && (
                  <div className="text-[13px] grid grid-cols-4 items-center gap-2">
                    <p className="font-semibold">Dosage</p>
                    <p className="text-[var(--dark-2)] col-span-3">
                      :&nbsp;{supplement.dosage}
                    </p>
                  </div>
                )}
                {supplement.frequency && (
                  <div className="text-[13px] grid grid-cols-4 items-center gap-2">
                    <p className="font-semibold">Frequency</p>
                    <p className="text-[var(--dark-2)] col-span-3">
                      :&nbsp;{supplement.frequency}
                    </p>
                  </div>
                )}
                {supplement.source && (
                  <div className="text-[13px] grid grid-cols-4 items-center gap-2">
                    <p className="font-semibold">Source</p>
                    <p className="text-[var(--dark-2)] col-span-3">
                      :&nbsp;{supplement.source}
                    </p>
                  </div>
                )}
                {supplement.purpose && (
                  <div className="text-[13px] grid grid-cols-4 items-center gap-2">
                    <p className="font-semibold">Purpose</p>
                    <p className="text-[var(--dark-2)] col-span-3">
                      :&nbsp;{supplement.purpose}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-[#808080]">
            No supplement information added yet
          </p>
        )}
      </div>
    </CardContent>
  </Card >
}

function ClientActivities({ activities }) {
  return <div className="mt-4 p-4 rounded-[10px] border-1">
    <div className="font-semibold pb-2 flex items-center gap-6 border-b-1">
      <div>
        {/* <p className="text-[var(--accent-1)]">{activities.dailyActivities.reduce((acc, activity) => acc + activity.steps, 0)}</p> */}
        <p>Steps</p>
      </div>
      <div>
        {/* <p className="text-[var(--accent-1)]">{activities.dailyActivities.reduce((acc, activity) => acc + activity.calories, 0).toFixed(2)}</p> */}
        <p>Calories</p>
      </div>
      <Image
        src="/svgs/circle-embedded.svg"
        height={64}
        width={64}
        alt=""
        className="ml-auto"
      />
    </div>
    <p className="text-[var(--dark-1)]/25 text-[12px] font-semibold mt-2">Last 7 Days</p>
  </div>
}

function Header({ clientData }) {
  return <CardHeader className="relative flex items-center gap-4 md:gap-8">
    <Avatar className="w-[100px] h-[100px]">
      <AvatarImage src={clientData.profilePhoto} />
      <AvatarFallback>{nameInitials(clientData.name)}</AvatarFallback>
    </Avatar>
    <div>
      <h3 className="mb-2">{clientData.name}</h3>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1]">ID #{clientData.clientId}</p>
        <div className="w-1 h-full bg-[var(--dark-1)]/50"></div>
      </div>
      <div className={`text-center rounded-[4px] ${clientData.isActive ? "bg-[var(--accent-1)] hover:bg-[var(--accent-1)]" : "bg-[var(--accent-2)] hover:bg-[var(--accent-2)]"} text-white font-bold py-[2px] px-2  text-[12px] gap-1`}>
        {clientData.isActive ? <>Active</> : <>In Active</>}
      </div>
    </div>
  </CardHeader>
}