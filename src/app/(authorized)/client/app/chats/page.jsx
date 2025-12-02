"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMessage, getRelativeTime, nameInitials } from "@/lib/formatter";
import useClientChatSocketContext, { ClientChatStateProvider } from "@/providers/ClientChatStateProvider";
import { useAppSelector } from "@/providers/global/hooks";
import { CheckCheck, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  return <div className="content-container bg-white p-4 pt-0 rounded-4xl border-1">
    <ClientChatStateProvider>
      <SelectedChat />
    </ClientChatStateProvider>
  </div>
}

function SelectedChat() {
  const { socket, state } = useClientChatSocketContext();
  const { clientId, coachId } = useAppSelector(state => state.client.data)
  useEffect(function () {
    const data = {
      coachId: coachId,
      clientId: clientId,
      person: "coach"
    }
    socket.emit("joinRoom", data);
    socket.emit("seenMessages", data);
  }, []);

  if (state === "joining-room") return <div className="bg-[var(--comp-1)] content-height-screen grow flex items-center justify-center">
    <h4 className="italic text-zinc-500">Please Wait Opening Chat 😊</h4>
  </div>

  return <div className="relative grow mt-4 flex flex-col shadow-md rounded-4xl  overflow-x-clip">
    <CurrentChatHeader />
    <div className="w-full text-[12px] font-semibold py-2 px-6">
      <ChatMessages />
    </div>  
    <CurrentChatMessageBox />
  </div>
}

function CurrentChatHeader() {
  const { coachName, coachProfilePhoto } = useAppSelector(state => state.client.data)
  return <div className="bg-zinc-50 px-4 py-4 flex items-center gap-4 sticky rounded-t-4xl top-0 z-[10] border-b-1 border-zinc-100">
    <Avatar className="h-[48px] w-[48px] rounded-[4px]">
      <AvatarImage src={coachProfilePhoto || "/"} className="rounded-full" />
      <AvatarFallback className="bg-green-400 font-bold text-white rounded-full">{nameInitials(coachName)}</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-[16px] md:text-[20px] text-zinc-600 font-bold mb-[2px]">{coachName}</p>
      <p className="leading-[1] text-[var(--accent-1)] animate-pulse text-[12px] italic">Active Now</p>
    </div>
  </div>
}

function ChatMessages() {
  const { currentChatMessages } = useClientChatSocketContext();
  const messsageContainerRef = useRef();

  useEffect(function () {
    if (messsageContainerRef.current) {
      messsageContainerRef.current.scrollTop = messsageContainerRef.current.scrollHeight;
    }
  }, [currentChatMessages.length])

  return <div ref={messsageContainerRef} className="h-96 pr-4 overflow-y-auto no-scrollbar">
    {currentChatMessages.map((message, index) => message.person === "client"
      ? <CurrentUserMessage key={index} message={message} />
      : <CompanionUserMessage key={index} message={message} />)}
  </div>
}

function CurrentChatMessageBox() {
  const [message, setMessage] = useState("");
  const { clientId, coachId } = useAppSelector(state => state.client.data)
  const { socket } = useClientChatSocketContext();

  function sendMessage() {
    const data = {
      coachId: coachId,
      clientId: clientId,
      person: "client",
      message
    }
    socket.emit("sendMessage", data);
    setMessage("");
  }

  return <div className="mx-4 py-2 mb-3 mt-auto flex items-center relative gap-4">
    <Input
      value={message}
      onChange={e => setMessage(e.target.value)}
      placeholder="Write a Message"
      className="px-6 rounded-full py-[25px] shadow-md shadow-zinc-200 focus:shadow-none"
    />
    <Button variant="wz" onClick={sendMessage} className={"absolute right-0 py-[25px] rounded-r-full"}>
      <Send />
      Send
    </Button>
  </div>
}

function CurrentUserMessage({ message }) {
  const { coachProfilePhoto, coachName } = useAppSelector(state => state.client.data)
  if (!message || !message?.message) return;
  return <div className="mb-4 flex flex-wrap items-start justify-end gap-4">
    <div>
      <div
        className="max-w-[80ch] bg-[var(--accent-1)] text-white text-xs md:text-sm relative px-4 py-2 rounded-[20px] rounded-br-0"
        style={{ borderBottomRightRadius: 0 }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: formatMessage(message?.message) }}
        />
        {message.seen && <CheckCheck className="w-3 h-3 text-[#0045CC] absolute bottom-[2px] right-[2px]" />}
      </div>
      <p className="text-[var(--dark-1)]/25 mt-1 text-right">{getRelativeTime(message.createdAt)}</p>

    </div>
    <Avatar className="rounded-full mt-1">
      <AvatarImage src={coachProfilePhoto || "/"} />
      <AvatarFallback className="bg-green-400 font-bold text-white rounded-full">{nameInitials(coachName)}</AvatarFallback>
    </Avatar>
  </div>
}

function CompanionUserMessage({ message }) {
  const { coachName, coachProfilePhoto } = useClientChatSocketContext();
  if (!message || !message?.message) return;
  return <div className="mb-4 flex flex-wrap items-start justify-start gap-4">
    <Avatar className="rounded-[4px] mt-1">
      <AvatarImage src={coachProfilePhoto || "/"} />
      <AvatarFallback className="bg-green-200 font-bold text-black rounded-full">{nameInitials(coachName)}</AvatarFallback>
    </Avatar>
    <div>
      <div
        className="max-w-[40ch] bg-[var(--comp-1)] text-zinc-600 text-xs md:text-sm px-4 py-2 rounded-[20px] rounded-br-0"
        style={{ borderBottomLeftRadius: 0 }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: formatMessage(message?.message) }}
        />
      </div>
      <p className="text-[var(--dark-1)]/25 mt-1">{getRelativeTime(message.createdAt)}</p>
    </div>
  </div>
}