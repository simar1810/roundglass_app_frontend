"use client"
import { Input } from "../ui/input";
import { X, ChevronUp, ChevronDown, LogOut, Search, Menu, Image as ImageIcon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "../ui/avatar";
import { useAppDispatch, useAppSelector } from "@/providers/global/hooks";
import { useEffect, useRef, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { destroy } from "@/providers/global/slices/coach";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import useClickOutside from "@/hooks/useClickOutside";
import { nameInitials } from "@/lib/formatter";
import { useSidebar } from "../ui/sidebar";
import { Bell, Bot } from "lucide-react";
import useSWR from "swr";
import { getClientNotifications, sendHealthMessages, sendHealthImage, sendHealthQueryWithImage, getAnalyzation, editAnalyzationQuestion } from "@/lib/fetchers/app";
import { Calendar } from "@/components/ui/calendar";

export default function AppClientNavbar() {
  const data = useAppSelector(state => state.client.data)
  const [openNotif, setOpenNotif] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const {toggleSidebar} = useSidebar()
  if (!data) return <></>

  const { profilePhoto, name } = data;
  const openSidebar = () => {
    toggleSidebar();
  }
  return <nav className="bg-white h-16 sticky top-0 py-4 px-5 md:px-10 flex items-center justify-between md:justify-end font-bold gap-4 border-b-1 z-[30]">
    <div className="flex items-center justify-start gap-4">
      <Menu onClick={openSidebar} size={30} className="text-gray-400 font-normal md:hidden" />
      <div className="relative">
        
        <div className="flex items-center justify-center gap-2 md:gap-6">
          <div>
            <Bot className="text-zinc-500 cursor-pointer" onClick={() => setAgentOpen(true)}/>
            <HealthAgentPopup
              open={agentOpen}
              onClose={() => setAgentOpen(false)}
            />
          </div>
            
            <div className={`${openNotif ? "bg-[var(--accent-1)] text-white" : "bg-white text-[var(--accent-1)]"} p-2 rounded-full cursor-pointer transition-all duration-500`}>
            <Bell
              onClick={() => setOpenNotif(!openNotif)}
            />
            <NotificationsPopup
              isOpen={openNotif}
              onClose={() => setOpenNotif(false)}
            />
          </div>
        </div>

    </div>
    </div>
    <UserOptions
      profilePhoto={profilePhoto}
      name={name}
    />
  </nav>
}

const features = [
  { id: 1, title: "Meal", link: "/coach/meals/list" },
  { id: 2, title: "Recipes", link: "/coach/meals/recipes" },
  { id: 3, title: "Meetings", link: "/coach/club/meetings" },
  { id: 4, title: "Link Generator", link: "/coach/club/link-generator" },
  { id: 5, title: "Notes", link: "/coach/tools/notes" },
  { id: 6, title: "Reminders", link: "/coach/tools/reminders" },
  { id: 7, title: "Calorie Counter", link: "/coach/tools/calorie-counter" },
  { id: 8, title: "Ideal Weight", link: "/coach/tools/ideal-weight" },
  { id: 9, title: "Workout", link: "/coach/tools/workouts" },
  { id: 10, title: "Feed", link: "/coach/feed" },
  { id: 11, title: "Clients", link: "/coach/clients" },
]

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [previousSearches, setPreviousSearces] = useLocalStorage("searches");

  const router = useRouter();
  const containerRef = useRef();

  const parsedDataLocalStorage = JSON.parse(previousSearches || "[]");

  function storeInhistory(link, title) {
    const newResults = parsedDataLocalStorage
      .filter(feature => feature.link !== link)
      .map((feature, index) => ({ ...feature, id: index }));
    setPreviousSearces(JSON.stringify([...newResults, { id: parsedDataLocalStorage.length, title, link }]));
    router.push(link);
    setOpen(false);
    setQuery("");
  }

  const queriedFeatures = features
    .filter(feature => feature.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const localStorageSearches = parsedDataLocalStorage
    .filter(feature => feature.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return <div className="bg-[var(--dark-4)] pl-2 pr-4 pt-10">
    <div ref={containerRef} className="w-full mx-auto z-[111] relative">
      <Search className="w-[18px] h-[18px] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
      <Input
        onClick={() => {
          setOpen(!open);
        }}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search Feature..."
        className="bg-[var(--dark-1)] md:max-w-[450px] pl-8 !focus:outline-none border-1 border-[#808080]/40 focus:bg-black"
      />
      {open && <div className="max-w-[450px] w-full bg-black text-white absolute top-12 p-4 rounded-[8px] border-1">
        {queriedFeatures.length > 0 && <h3 className="mb-2">Suggested</h3>}
        {queriedFeatures.map(item => <SearchItem
          key={item.id}
          link={item.link}
          title={item.title}
          storeInhistory={storeInhistory}
        />)}
        {localStorageSearches.length > 0 && <h3 className="my-2">Previously Searched</h3>}
        {localStorageSearches.map(item => <SearchItem
          key={item.id}
          link={item.link}
          title={item.title}
          storeInhistory={storeInhistory}
        />)}
        {queriedFeatures.length === 0 && localStorageSearches.length === 0 && <div className="min-h-[200px] font-bold flex items-center justify-center">
          No Results Found!
        </div>}
      </div>}
    </div>
    {open && <div className="h-screen w-screen bg-[var(--dark-1)]/20 backdrop-blur-[4px] fixed top-0 left-0 z-[110]" />}
  </div>
}

function SearchItem({
  link,
  title,
  storeInhistory
}) {
  return <div
    onClick={() => storeInhistory(link, title)}
    className="text-[var(--primary-1)]/50 hover:text-[var(--primary-1)] text-[14px] mb-2 flex items-center gap-2 cursor-pointer"
  >
    <Search className="w-[16px] h-[16px]" />
    {title}
  </div>
}

function UserOptions({ profilePhoto, name }) {
  const [Modal, setModal] = useState();
  const [opened, setOpened] = useState(false)
  const dispatchRedux = useAppDispatch();
  const { cache } = useSWRConfig();
  const dropDownContentRef = useRef()

  useClickOutside(dropDownContentRef, () => {
    setModal()
    setOpened(false)
  })

  const router = useRouter();

  async function expireUserSession() {
    try {
      const response = await fetch("/api/logout", { method: "DELETE" });
      const data = await response.json();
      if (data.status_code !== 200) throw new Error(data.message);
      for (const [field] of cache.entries()) {
        cache.delete(field)
      }
      dispatchRedux(destroy());
      router.push("/client/login");
    } catch (error) {
      toast.error(error.message || "Please try again later")
    }
  }

  return <>
    {Modal || <></>}
    <DropdownMenu open={opened}>
      <DropdownMenuTrigger
        onClick={() => setOpened(!opened)}
      >
        <div className="px-4 py-2 flex items-center gap-2 border-1 rounded-[8px]">
          <Avatar className="w-[24px] h-[24px] border-1  border-[var(--accent-1)]">
            <AvatarImage src={profilePhoto} />
            <AvatarFallback className="bg-[#172A3A] text-white uppercase">{nameInitials(name)}</AvatarFallback>
          </Avatar>
          <p className="text-[var(--dark-1)]/50 text-[14px] leading-[1] font-[500]">{name}</p>
          <ChevronDown className="w-[16px] h-[16px]" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent ref={dropDownContentRef}>
        <DropdownMenuItem onClick={expireUserSession}>
          <DropdownMenuLabel className="text-[14px] text-[var(--accent-2)] py-0 flex items-center gap-2 cursor-pointer">
            <LogOut className="w-[12px] h-[12px] text-[var(--accent-2)]" />
            Logout
          </DropdownMenuLabel>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
}

function NotificationsPopup({ isOpen, onClose }) {
  const popupRef = useRef(null);
  useClickOutside(popupRef, onClose);

  const { data, error, isLoading } = useSWR(
    isOpen ? "notifications" : null,
    () => getClientNotifications()
  );
  return isOpen ? (
    <div className="absolute top-10 md:right-0 z-50 transition-all duration-500">
      <div
        ref={popupRef}
        className="w-[280px] md:w-[420px] max-h-[400px] bg-white shadow-lg rounded-xl border overflow-y-auto no-scrollbar"
      >
        <h3 className="font-semibold mb-4 bg-gray-50 border-b py-3 md:py-4 px-5 text-lg">Notifications</h3>

        {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
        {error && <p className="text-sm text-red-500">Error loading data</p>}

        {data?.data?.length === 0 && <p className="text-sm text-gray-500 px-5 pb-4">No notifications</p>}

        {data?.data?.map((n, idx) => (
          <div
            key={idx}
            className="mb-4 rounded text-sm flex justify-start items-start gap-3 px-5"
          >
            <div className="rounded-full bg-[var(--accent-1)] p-2">
              <p className="text-white text-sm">WZ</p>
            </div>
            <div>
              <p className="text-base font-medium text-[var(--accent-1)]">{n.subject || "NA"}</p>
              <p className="text-sm font-normal text-zinc-600 break-all">{n.message || "No message"}</p>
              <p className="text-[15px] font-bold text-gray-600 mt-1 italic">
              {n.createdDate || n.date}
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  ) : null;
}

function HealthAgentPopup({ open, onClose }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);

  const [summaryData, setSummaryData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editQuery, setEditQuery] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const editFileInputRef = useRef(null);

  async function loadAnalyzation() {
    try {
      const dateStr = formatDateForApi(selectedDate);
      const res = await getAnalyzation(dateStr);

      if (!res) {
        setSummaryData(null);
        setHistoryData([]);
        return;
      }

      const incomingSummary = {
        calories: Number((res.calories || 0).toFixed(2)),
        protein: Number((res.protein || 0).toFixed(2)),
        carbohydrates: Number((res.carbohydrates || 0).toFixed(2)),
        fats: Number((res.fats || 0).toFixed(2)),
        calories_burned: Number((res.calories_burned || 0).toFixed(2)),
      };
      setHistoryData((prev) => {
        const incoming = Array.isArray(res.history) ? res.history : [];
        const prevMap = Object.fromEntries(prev.map((p) => [p._id, p]));

        return incoming.map((item) => {
          const prevItem = prevMap[item._id];

          if (prevItem) {
            return {
              ...item,
              macros: prevItem.macros || item.macros,
              reference: prevItem.reference || item.reference,
            };
          }
          return item;
        });
      });
      setSummaryData((prev) => {
        if (!prev) return incomingSummary;

        let editedDelta = {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fats: 0,
        };

        const incomingHist = Array.isArray(res.history) ? res.history : [];
        const prevMap = Object.fromEntries(historyData.map((h) => [h._id, h]));

        incomingHist.forEach((item) => {
          const prevItem = prevMap[item._id];
          if (!prevItem) return;

          const be = item.macros || {};
          const ed = prevItem.macros || {};

          editedDelta.calories += (ed.calories || 0) - (be.calories || 0);
          editedDelta.protein += (ed.protein || 0) - (be.protein || 0);
          editedDelta.carbohydrates += (ed.carbohydrates || 0) - (be.carbohydrates || 0);
          editedDelta.fats += (ed.fats || 0) - (be.fats || 0);
        });

        return {
          ...incomingSummary,
          calories: incomingSummary.calories + editedDelta.calories,
          protein: incomingSummary.protein + editedDelta.protein,
          carbohydrates: incomingSummary.carbohydrates + editedDelta.carbohydrates,
          fats: incomingSummary.fats + editedDelta.fats,
        };
      });
    } catch (err) {
      console.error("Analyzation error:", err);
      setSummaryData(null);
      setHistoryData([]);
    }
  }

  useEffect(() => {
    loadAnalyzation();
  }, [selectedDate]);

  const generateWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(new Date(d));
    }
    return days;
  };
  const weekDays = generateWeek();

  const formatDay = (date) =>
    date.toLocaleDateString("en-US", { weekday: "short" });

  const formatDateTop = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-GB");
  };

  const formatDateForApi = (date) => {
    if (!date) return undefined;
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const sendMessage = async () => {
    const trimmedText = input.trim();
    if (!trimmedText && !pendingImage) return;

    const userMsg = {
      from: "user",
      text: trimmedText || null,
      image: pendingImagePreview || null,
    };

    setMessages((prev) => [...prev, userMsg]);

    const textToSend = trimmedText;
    const fileToSend = pendingImage;

    setInput("");
    setPendingImage(null);
    setPendingImagePreview(null);

    const processingId = Date.now();
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "I am processing your request…", _id: processingId },
    ]);

    try {
      const dateStr = formatDateForApi(selectedDate);
      let apiRes;

      if (fileToSend && textToSend) {
        apiRes = await sendHealthQueryWithImage(fileToSend, textToSend, dateStr);
      } else if (fileToSend) {
        apiRes = await sendHealthImage(fileToSend, dateStr);
      } else {
        apiRes = await sendHealthMessages(textToSend, dateStr);
      }

      let botText = "I couldn't understand the response.";
      if (apiRes?.type === "Food") {
        const d = apiRes.data;
        botText = `Food: ${d.name}. Calories: ${d.calories}. Serving: ${d.serving_size}. Protein: ${d.protein}, Carbs: ${d.carbohydrates}, Fats: ${d.fats}.`;
      } else if (apiRes?.type === "Exercise") {
        const d = apiRes.data;
        botText = `Exercise: ${d.name}. Calories burned: ${d.calories_burned}. Duration: ${d.duration_min} min.`;
      } else if (apiRes?.type === "Mood") {
        const d = apiRes.data;
        botText = `Mood: ${d.mood_label}. Advice: ${d.advice || "No advice available."}`;
      } else if (apiRes?.type === "Guidance") {
        botText = `Guidance: ${apiRes.data?.message || "No guidance available."}`;
      }

      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== processingId);
        return [...filtered, { from: "bot", text: botText }];
      });

      await loadAnalyzation();
    } catch (err) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== processingId);
        return [...filtered, {
          from: "bot",
          text: `Error: ${err.message || err}`
        }];
      });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
  };

  const openMenuFor = (id) => {
    setMenuOpenId((prev) => (prev === id ? null : id));
  };

  const startEdit = (item) => {
    setMenuOpenId(null);
    setEditingId(item._id);
    setEditQuery(item.question || "");
    setEditFile(null);
    setEditFilePreview(null);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuery("");
    setEditFile(null);
    setEditFilePreview(null);
    setIsEditing(false);
  };

  const onEditFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setEditFile(f);
    setEditFilePreview(URL.createObjectURL(f));
  };
  async function submitEdit(item) {
    if (!editingId) return;
    if ((!editQuery || !editQuery.trim()) && !editFile) {
      return;
    }

    try {
      setIsEditing(true);
      const dateStr = formatDateForApi(selectedDate);

      const res = await editAnalyzationQuestion(
        item?._id?.toString(),
        editQuery.trim(),
        editFile || null,
        dateStr
      );

      const updatedMacros = {
        calories: Number(res?.data?.calories?.replace(/[^0-9.]/g, "")) || 0,
        carbohydrates: Number(
          res?.data?.carbohydrates?.replace(/[^0-9.]/g, "")
        ) || 0,
        fats: Number(res?.data?.fats?.replace(/[^0-9.]/g, "")) || 0,
        protein: Number(res?.data?.protein?.replace(/[^0-9.]/g, "")) || 0,
      };
      setHistoryData((prev) =>
        prev.map((h) =>
          h._id === item._id
            ? {
                ...h,
                question: editQuery.trim() || h.question,
                reference: {
                  ...h.reference,
                  calories: res?.data?.calories,
                  carbohydrates: res?.data?.carbohydrates,
                  fats: res?.data?.fats,
                  protein: res?.data?.protein,
                  serving_size: res?.data?.serving_size,
                  name: res?.data?.name,
                },
                macros: updatedMacros,
              }
            : h
        )
      );
      setSummaryData((prev) => ({
        ...prev,
        calories:
          prev.calories -
          (item.macros.calories || 0) +
          updatedMacros.calories,
        protein:
          prev.protein -
          (item.macros.protein || 0) +
          updatedMacros.protein,
        carbohydrates:
          prev.carbohydrates -
          (item.macros.carbohydrates || 0) +
          updatedMacros.carbohydrates,
        fats: prev.fats - (item.macros.fats || 0) + updatedMacros.fats,
      }));

      cancelEdit();
    } catch (err) {
      console.error("Edit failed", err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: `Edit failed: ${err.message || err}` },
      ]);
      setIsEditing(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9999] flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-md h-[90vh] rounded-2xl shadow-xl overflow-hidden relative">

        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-gray-500 p-2 rounded-full z-50"
        >
          <X size={20} color="white" />
        </button>

        <div className="h-full overflow-y-auto no-scrollbar pb-24 text-black">
          <div className="flex items-center gap-3 p-5">
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="flex items-center gap-1 text-gray-600 font-normal text-lg"
            >
              {formatDateTop(selectedDate)}
              {calendarOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>

          {calendarOpen && (
            <div className="px-6 pb-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full h-[400px] shadow-sm"
              />
            </div>
          )}

          <div className="flex w-[85vw] md:w-auto space-x-[5px] px-5 mb-3 overflow-x-auto no-scrollbar">
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`${
                  selectedDate.toDateString() === day.toDateString()
                    ? "bg-green-600 text-white border-green-700"
                    : "bg-gray-50 text-gray-700"
                } flex flex-col items-center p-1 rounded-xl cursor-pointer border min-w-[54px]`}
              >
                <span className="text-sm font-medium">
                  {formatDay(day)}
                </span>
                <span className="text-base font-semibold">
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-green-600 text-white p-6 rounded-2xl mx-5 mb-4">
            <h2 className="font-medium text-base mb-3">
              What you can search?
            </h2>
            <p className="font-normal text-sm">- Diets</p>
            <p className="font-normal text-sm">- Workout Plans</p>
            <p className="font-normal text-sm">- Recipes</p>
            <p className="font-normal text-sm">- Guidelines</p>
          </div>

          {summaryData && (
            <div className="mx-5 mb-4 p-4 border rounded-xl bg-gray-50">
              <h2 className="text-lg text-gray-700 font-normal italic mb-2">
                Daily Summary
              </h2>
              <div className="grid gap-1 text-sm font-normal italic text-gray-500">
                <p>Calories: {summaryData.calories} Kcal</p>
                <p>Protein: {summaryData.protein} g</p>
                <p>Carbs: {summaryData.carbohydrates} g</p>
                <p>Fats: {summaryData.fats} g</p>
                <p>Calories Burned: {summaryData.calories_burned}</p>
              </div>
            </div>
          )}

          <div className="mx-5 mb-4">
            {historyData.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-2xl p-3 mb-3 bg-white relative"
              >
                <button
                  onClick={() => openMenuFor(item._id)}
                  className="absolute right-3 top-3 text-gray-500 text-lg"
                  aria-label="menu"
                >
                  ⋯
                </button>

                {menuOpenId === item._id && (
                  <div className="absolute right-3 top-8 z-50 bg-white border rounded-md shadow-sm">
                    <button
                      onClick={() => startEdit(item)}
                      className="block px-3 py-2 font-normal text-sm w-full text-left hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setMenuOpenId(null)}
                      className="block px-3 py-2 text-sm font-normal w-full text-left hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>
                )}

                {typeof item.question === "string" &&
                /\.(png|jpg|jpeg|webp)$/i.test(item.question.trim()) ? (
                  <img
                    src={item?.question}
                    alt="uploaded"
                    className="max-h-48 w-full rounded-xl object-cover"
                  />
                ) : (
                  <p className="text-sm font-medium break-all">
                    {item.question}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-1 font-normal">
                  {item.time}
                </p>

                {item.type === "Food" && item.macros && (
                  <table className="w-full mt-2 text-xs border font-normal">
                    <tbody>
                      <tr>
                        <td className="border p-1">Calories</td>
                        <td className="border p-1">{item.macros.calories}</td>
                      </tr>
                      <tr>
                        <td className="border p-1">Protein</td>
                        <td className="border p-1">{item.macros.protein}</td>
                      </tr>
                      <tr>
                        <td className="border p-1">Carbs</td>
                        <td className="border p-1">
                          {item.macros.carbohydrates}
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-1">Fats</td>
                        <td className="border p-1">{item.macros.fats}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {item.type === "Guidance" && (
                  <p className="text-sm mt-1">{item.reference?.message}</p>
                )}

                {item.type === "Exercise" && (
                  <p className="text-sm mt-1">
                    Burned {item.reference?.calories_burned} kcal, Duration{" "}
                    {item.reference?.duration_min} min
                  </p>
                )}

                {item.type === "Mood" && (
                  <p className="text-sm mt-1">
                    Mood: {item.reference?.mood_label} <br />
                    Advice: {item.reference?.advice}
                  </p>
                )}

                {editingId === item._id && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-md">
                    {typeof editQuery === "string" &&
                    /\.(png|jpg|jpeg|webp)$/i.test(editQuery.trim()) ? (
                      <img
                        src={editQuery}
                        alt="uploaded"
                        className="max-h-48 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <textarea
                        value={editQuery}
                        onChange={(e) => setEditQuery(e.target.value)}
                        className="w-full font-normal p-2 rounded-md text-sm border"
                        rows={2}
                        placeholder="Edit question..."
                      />
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <label className="cursor-pointer text-sm text-gray-600">
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden font-normal"
                          onChange={onEditFileChange}
                        />
                        <span className="inline-flex items-center gap-2 font-normal px-2 py-1 border rounded-md">
                          <ImageIcon size={16} />
                          Replace Image
                        </span>
                      </label>

                      {editFilePreview && (
                        <img
                          src={editFilePreview}
                          className="w-12 h-12 rounded-md object-cover"
                          alt="preview"
                        />
                      )}

                      <div className="ml-auto flex gap-2">
                        <button
                          onClick={() => cancelEdit()}
                          className="px-3 py-1 text-sm border rounded-md font-normal"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={isEditing}
                          onClick={() => submitEdit(item)}
                          className="px-3 py-1 bg-green-500 font-normal text-white text-sm rounded-md"
                        >
                          {isEditing ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Box - go craaazzyyy- HALA MADRID SIUUUU */}
          <div className="px-5 pb-4">
            {messages.map((m, idx) => (
              <div key={idx} className="mb-3 border rounded-2xl p-2">
                {m.text && (
                  <div
                    className={`p-3 rounded-2xl text-sm font-normal ${
                      m.from === "user" ? "bg-gray-50" : "bg-gray-100"
                    }`}
                  >
                    {m.text}
                  </div>
                )}

                {m.image && (
                  <img
                    src={m.image}
                    alt="upload"
                    className="rounded-xl max-h-48 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-white p-3 flex gap-2 items-center">
          <label className="cursor-pointer">
            <ImageIcon size={22} className="text-gray-500" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          {pendingImagePreview && (
            <img
              src={pendingImagePreview}
              className="w-12 h-12 rounded-md object-cover"
            />
          )}

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2 text-sm font-normal bg-gray-100 rounded-full outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center"
            onClick={sendMessage}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
