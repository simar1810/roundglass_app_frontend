"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import ActivityTool from "@/components/pages/coach/dashboard/ActivityTool";
import Stories from "@/components/pages/coach/dashboard/Stories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClientHome, getMarathonLeaderBoard, getSmartActivity } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import { useAppSelector } from "@/providers/global/hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { useState, useEffect } from "react";
import { X, Plus, Flame, Footprints, Flag} from "lucide-react";
import { toast } from "sonner";

export default function Page() {
  return <div className="mt-8">
    <Container />
  </div>
}

function Container() {
  const [showPopup, setShowPopup] = useState(true);
  const { _id } = useAppSelector(state => state.client.data)
  const client = useAppSelector(state => state.client.data)
  const { isLoading, error, data } = useSWR("clientHome", () => getClientHome(_id));
  if (isLoading) return <ContentLoader />
  if (data?.status_code === 407) return <div>
    {showPopup && <NotActivePopup onClose={() => setShowPopup(false)} />}
  </div>
  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const clientHomeData = data.data;
  const nextMeals = clientHomeData?.next5MealTimings || null;

  return <div className="space-y-2">
    <ActivityTool activities={clientHomeData.programs} />
    <div className="flex flex-col md:flex-row justify-start items-start gap-2">
      <div className="flex flex-col gap-2 items-start justify-center">
        <GoalsSection goal={clientHomeData?.user?.goal} />
        <WaterIntake />
        <NextMeals nextMeals={nextMeals} />
      </div>
      <div className="flex flex-col justify-start items-start gap-2">
      <div className="flex flex-col md:flex-row items-center gap-2 justify-between">
        <MealDetails meal={clientHomeData.meal} />
        <Sessions meetings={clientHomeData.closestMeeting} />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 justify-between">
          <ActivityCard />
          <WeightLog/>
        </div>
      </div>
    </div>
      <Stories stories={clientHomeData.story} />
  </div>
}
function WeightLog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="rounded-2xl shadow-md shadow-gray-200 w-full xl:w-[275px] 2xl:w-[400px] bg-white px-4 py-8 flex items-center justify-start gap-5 cursor-pointer"
      >
        <div className="bg-[var(--accent-1)] rounded-2xl p-2">
          <Image src="/weight-scale.png" alt="weight" width={500} height={500} className="w-20 h-20" />
        </div>
        <div className="">
          <p className="xl:text-base 2xl:text-lg text-gray-700">Log Weight/Checkups</p>
          <p className="text-sm font-bold text-[var(--accent-1)] animate-pulse">Check Now</p>
        </div>
      </div>

      {open && <WeightLogPopup onClose={() => setOpen(false)} />}
    </>
  );
}
function WeightLogPopup({ onClose }) {
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [fatType, setFatType] = useState("Slim");
  const [visceralFat, setVisceralFat] = useState("");
  const [followUpType, setFollowUpType] = useState("8-day");
  const [customDate, setCustomDate] = useState("");

  const client = useAppSelector((state) => state.client.data);

  const handleSubmit = async () => {
    if (!date || !weight) {
      alert("Date and Weight are required");
      return;
    }

    const nextFollowUpDate =
      followUpType === "8-day"
        ? new Date(new Date(date).getTime() + 8 * 24 * 60 * 60 * 1000)
            .toISOString()
        : customDate;

    const healthMatrix = {
      date,
      weight,
      fat: fatType,
      visceral_fat: visceralFat,
      weightUnit: "kg",
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/app/add-followup?clientId=${client.clientId}&person=client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${client.refreshToken}`,
          },
          body: JSON.stringify({
            healthMatrix,
            nextFollowUpDate,
            weightUnit: "kg",
          }),
        }
      );

      const result = await res.json();
      if (result.status_code !== 200) {
        console.error(result);
        toast.error(result.message || "Something went wrong");
        return;
      }
      toast.success("FOLLOW-UP SUCCESS!");
      onClose();
    } catch (err) {
      console.error("API ERROR:", err);
      toast.error("Failed to submit follow-up");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-3">
      <div className="bg-white w-full max-w-[420px] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Log Weight</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={22} />
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Enter weight"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Fat Type</label>
          <select
            value={fatType}
            onChange={(e) => setFatType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="Slim">Slim</option>
            <option value="Medium">Medium</option>
            <option value="Fat">Fat</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Visceral Fat (Number)</label>
          <input
            type="number"
            value={visceralFat}
            onChange={(e) => setVisceralFat(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Enter visceral fat"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Follow-Up Type</label>
          <select
            value={followUpType}
            onChange={(e) => setFollowUpType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="8-day">8-day</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        {followUpType === "Custom" && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Custom Follow-Up Date
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
        <button
          onClick={handleSubmit}
          className="w-full bg-[var(--accent-1)] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
function ActivityCard() {
  const [open, setOpen] = useState(false);
   const client = useAppSelector(state => state.client.data);
  const token = client?.refreshToken;
  const now = new Date();
  let start = new Date(now.setHours(0, 0, 0, 0));
  let end = new Date();
  const format = (d) => `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
  const { data } = useSWR(
    ["smartActivity", "daily"],
    () =>
      getSmartActivity({
        person: "client",
        token,
        startDate: format(start),
        endDate: format(end),
      })
  );
  const stats = data?.data || { totalSteps: 0, totalCalories: 0, totalDistance: 0 };
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="w-full md:w-[450px] xl:w-[350px] 2xl:w-[450px] bg-white shadow-md shadow-gray-200 rounded-2xl px-5 py-6 cursor-pointer"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-gray-800 text-lg font-semibold flex items-center gap-2">
            <span className="w-[3px] h-6 bg-[var(--accent-1)] rounded-md"></span>
            Activity
          </h3>
          <p className="text-gray-400 text-sm font-medium italic">Data by System</p>
        </div>
        <div className="flex justify-between items-center mt-10">
          <div className="flex flex-col items-center">
            <Flame className="text-[var(--accent-1)] text-sm"/>
            <p className="text-gray-500 mt-1 text-sm">{stats.totalCalories} <span className="text-xs">KCal</span></p>
          </div>
          <div className="flex flex-col items-center">
            <Flag className="text-[var(--accent-1)] text-sm"/>
            <p className="text-gray-500 mt-1 text-sm">{stats.totalDistance} <span className="text-xs">Km</span></p>
          </div>
          <div className="flex flex-col items-center">
            <Footprints className="text-[var(--accent-1)] text-sm"/>
            <p className="text-gray-500 mt-1 text-sm">{stats.totalSteps} <span className="text-xs">Steps</span></p>
          </div>
        </div>
      </div>

      {open && <ActivityPopup onClose={() => setOpen(false)} />}
    </>
  );
}
function ActivityPopup({ onClose }) {
  const client = useAppSelector(state => state.client.data);
  const token = client?.refreshToken;

  const [activeTab, setActiveTab] = useState("daily");
  const getDateRange = () => {
    const now = new Date();
    let start, end;
    if (activeTab === "daily") {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date();
    } else if (activeTab === "weekly") {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      start = weekStart;
      end = new Date();
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      start = monthStart;
      end = new Date();
    }
    const format = (d) =>
      `${String(d.getDate()).padStart(2, "0")}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;

    return {
      startDate: format(start),
      endDate: format(end),
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data, isLoading, error } = useSWR(
    ["smartActivity", activeTab],
    () =>
      getSmartActivity({
        person: "client",
        token,
        startDate,
        endDate,
      })
  );

  const stats = data?.data || { totalSteps: 0, totalCalories: 0, totalDistance: 0 };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[360px] p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-gray-800 text-lg font-semibold">Activity Summary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-around mb-6">
          {["daily", "weekly", "monthly"].map((t) => {
            const active = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition
                  ${
                    active
                      ? "bg-black text-white shadow-md"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
        {isLoading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : error ? (
          <p className="text-center text-red-500 text-sm">Unable to fetch activity</p>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-xl bg-gray-50">
              <p className="text-gray-700 text-sm font-medium">Total Steps Walked:</p>
              <p className="text-gray-900 font-semibold text-base">
                {stats.totalSteps} steps{" "}
                <span className="text-gray-500 text-sm">
                  ({stats.totalDistance} km)
                </span>
              </p>
            </div>
            <div className="p-4 border rounded-xl bg-gray-50">
              <p className="text-gray-700 text-sm font-medium">Total Calories Burnt:</p>
              <p className="text-gray-900 font-semibold text-base">
                {stats.totalCalories} kcal
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function WaterIntake() {
  const [intakeList, setIntakeList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const STORAGE_KEY = "waterIntake";
  const TODAY_KEY = "waterIntakeDate";
  const MAX_WATER = 2500;

  useEffect(() => {
    const storedDate = localStorage.getItem(TODAY_KEY);
    const today = new Date().toLocaleDateString();

    if (storedDate !== today) {
      localStorage.setItem(TODAY_KEY, today);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      setIntakeList([]);
    } else {
      const storedIntake = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setIntakeList(storedIntake);
    }
  }, []);

  const totalWater = intakeList.reduce((sum, g) => sum + g.amount, 0);
  const addGlass = () => {
    if (totalWater + 250 > MAX_WATER) {
      alert(`You cannot drink more than ${MAX_WATER}ml of water per day.`);
      return;
    }

    const newEntry = {
      id: Date.now(),
      amount: 250,
      time: new Date().toLocaleTimeString(),
    };
    const updatedList = [...intakeList, newEntry];
    setIntakeList(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };
  const removeGlass = (id) => {
    const updatedList = intakeList.filter((g) => g.id !== id);
    setIntakeList(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  return (
    <>
      <div className="bg-white text-gray-800 rounded-2xl p-5 w-full max-w-[400px] shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Water Intake</h2>
          <button
            onClick={() => setShowHistory(true)}
            className="text-[var(--accent-1)] text-sm hover:underline"
          >
            View History
          </button>
        </div>

        <p className="text-gray-600 text-sm">
          You drank <span className="font-semibold text-gray-400">{totalWater} ml</span> of water today
        </p>

        <div className="flex items-center gap-4 pt-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-3">
            {intakeList.map((glass) => (
              <div key={glass.id} className="relative">
                <div className="w-10 h-12 border-2 border-black/80 rounded-md flex items-end justify-center pb-1">
                  <div className="w-6 h-4 bg-blue-300 rounded-sm"></div>
                </div>

                <button
                  onClick={() => removeGlass(glass.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-[2px]"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addGlass}
            className="bg-[var(--accent-1)] hover:bg-green-600 transition text-white rounded-full p-3"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Water History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {intakeList.length === 0 ? (
              <p className="text-gray-500 text-sm">No water added yet.</p>
            ) : (
              <div className="space-y-2 h-[500px] overflow-y-auto no-scrollbar">
                {intakeList.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-2 flex justify-between items-center"
                  >
                    <span className="text-gray-700">{item.amount} ml</span>
                    <span className="text-gray-400 text-xs">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
function Sessions({ meetings }) {
  const meeting = meetings?.meeting;

  if (!meeting) {
    return (
      <div className="w-full h-[300px] md:w-[380px] 2xl:w-[600px] bg-white rounded-2xl shadow-md px-5 py-3 shadow-gray-200">
        <p className="text-gray-500 text-sm italic">No upcoming meetings</p>
      </div>
    );
  }
  return (
    <div className="w-full h-[300px] md:w-[380px] 2xl:w-[600px] bg-white rounded-2xl shadow-md shadow-gray-200 px-5 py-3 space-y-8">
      <h3 className="font-semibold text-lg text-gray-800">Upcoming Session</h3>
      <div className="flex  items-center justify-start gap-4">
        <div className="flex items-center justify-between">
          <Image className="w-38 h-32 rounded-xl" src={meetings?.banner || "/not-found.png"} alt="banner" width={500} height={500}/>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border space-y-1 w-full">
        <p className="text-base font-semibold text-gray-700">
          {meeting.description || "Meeting"}
        </p>

        <p className="text-sm text-gray-500">
          {meeting.meetingType === "reocurr" ? "Recurring" : "One-Time"} session
        </p>

        <p className="text-sm italic text-gray-600">
          <span className="font-medium">Topics:</span> {meeting.topics || "NA"}
          </p>
          
        <p className="text-sm text-gray-700">
          <span className="font-medium">Next </span>•{" "}
          {new Date(meeting.nextOccurrence).toLocaleDateString("en-IN")} •{" "}
          {new Date(meeting.nextOccurrence).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        </div>
      </div>
      <a
        href={meeting.wellnessZLink}
        target="_blank"
        className="w-full block text-center bg-[var(--accent-1)] py-4 rounded-xl font-bold text-white shadow hover:opacity-90 transition text-base"
      >
        Join Session <span className="font-semibold">•{" "}{meeting.duration} mins</span>
      </a>
    </div>
  );
}
function NextMeals({ nextMeals }) {
  if (!nextMeals || Object.keys(nextMeals).length === 0) {
    return (
      <div className="px-4 py-3 shadow-md shadow-gray-400 rounded-2xl">
        <p className="text-gray-500 text-sm italic">No upcoming meals</p>
      </div>
    );
  }
  const dates = Object.keys(nextMeals);
  const [activeDate, setActiveDate] = useState(dates[0]);
  return (
    <div className="rounded-2xl bg-white shadow-md shadow-gray-300 px-4 pt-4 pb-8 w-[400px]">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">Next Meals</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6">
        {dates.map((date) => {
          const isActive = activeDate === date;
          return (
            <button
              key={date}
              onClick={() => setActiveDate(date)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl border text-sm font-medium transition-all
               ${
                 isActive
                   ? "bg-[var(--primary-1)] text-black border-[var(--primary-1)] shadow"
                   : "bg-gray-100 text-gray-600 border-gray-300"
               }`}
            >
              {date}
            </button>
          );
        })}
      </div>
      <div className="max-h-[230px] overflow-y-auto pr-1 space-y-3 no-scrollbar">
        {nextMeals[activeDate]?.map((meal, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50 shadow-sm"
          >
            <Image
              alt={meal?.dish_name}
              src={meal?.image || "/not-found.png"}
              width={64}
              height={64}
              className="w-[60px] h-[60px] rounded-lg object-cover"
            />

            <div className="flex flex-col">
              <p className="font-semibold text-sm">{meal.dish_name}</p>
              <p className="text-xs text-gray-500">{meal.meal_time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MealDetails({ meal }) {
  if (!meal) return <div className="bg-[var(--primary-1)] h-[305px] px-4 py-5 md:py-3 text-left rounded-2xl shadow-md shadow-gray-200 w-full md:w-[250px]">
    <p className="text-normal italic text-sm md:text-base text-center text-gray-400 mt-4">No Current Meal</p>
    <Image src="/not-found.png" alt="not-found" className="w-full rounded-xl mt-4" width={500} height={500}/>
  </div>
  return <div className="bg-[var(--primary-1)] px-4 py-5 md:py-3 text-left rounded-2xl shadow-md shadow-gray-200 w-full md:w-[250px]">
    <h1 className="text-gray-800 font-bold text-base mb-4">Current Meal</h1>
    <div className="flex flex-row md:flex-col">
    <Image
      alt="img"
      height={400}
      width={400}
      src={meal?.image}
      className="w-58 h-40 object-contain object-center rounded-xl"
    />
    <div>
      <h3 className="my-2 text-gray-700 font-semibold text-base">{meal?.name || "NA"}</h3>
      <p className="mb-1 text-gray-400 font-medium text-sm break-all">{meal?.description || "NA"}</p>
      <p className="text-gray-600 text-sm font-normal">{meal?.meal_time || "NA"}</p>
    </div>
    </div>
  </div>
}
function getBgColor(index) {
  switch (index) {
    case 0:
      return "bg-[#FFDA47]";
    case 1:
      return "bg-[#F1EAEA]";
    case 2:
      return "bg-[#D7A07C]";

    default:
      return "bg-[var(--comp-1)]";
  }
}
function MarathonLeaderBoard() {
  const router = useRouter();
  const { cache } = useSWRConfig();
  const { isLoading, error, data } = useSWR(`app/marathon-points/monthly`, () => getMarathonLeaderBoard(null, router, cache));

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const clients = data.data;
  return <div className="content-container max-h-[50vh] overflow-y-auto">
    <div className="flex items-center gap-4">
      <h4 className="leading-[1] mb-4 mr-auto">Marathon Leaderboard</h4>
    </div>
    <div>
      {clients.map((client, index) => <div
        className={`mb-4 p-4 flex items-center gap-4 border-1 rounded-[10px] ${getBgColor(index)}`}
        key={index}>
        <span>{index + 1}</span>
        <Avatar>
          <AvatarImage src={client.client.profilePhoto} />
          <AvatarFallback>{nameInitials(client.client.name)}</AvatarFallback>
        </Avatar>
        <h3>{client.client.name}</h3>
        <p className="ml-auto">{client.totalPointsInRange}&nbsp;pts</p>
      </div>)}
    </div>
  </div>;
}
function GoalsSection({goal}) {
  return (
    <div className="w-full md:w-[400px] rounded-xl shadow-md bg-white shadow-gray-200 px-5 py-4 pb-6">
      <p className="text-gray-600 text-sm font-medium md:text-base italic"><span className="not-italic font-semibold">GOAL: </span>{goal}</p>
    </div>
  )
}
function NotActivePopup({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white p-6 w-[90%] max-w-lg py-10 text-center shadow-lg rounded-2xl">
        <h2 className="text-2xl md:text-4xl font-semibold text-red-400 ">Woop!</h2>
        <p className="font-semibold text-base md:text-xl italic text-gray-500 mt-1">You are not active !!</p> 
        <p className="text-gray-700 font-bold text-base md:text-lg mt-6">
          Contact your coach for assistance.
        </p>
      </div>
    </div>
  );
}
