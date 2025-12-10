"use client";
import Loader from "@/components/common/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectChatUser } from "@/config/state-reducers/chat-scoket";
import useDebounce from "@/hooks/useDebounce";
import useKeyPress from "@/hooks/useKeyPress";
import { formatMessage, getRelativeTime, nameInitials } from "@/lib/formatter";
import { cn, copyText, getObjectUrl } from "@/lib/utils";
import { sendDataWithFormData } from "@/lib/api";
import useChatSocketContext, {
  ChatSocketProvider,
} from "@/providers/ChatStateProvider";
import { useAppSelector } from "@/providers/global/hooks";
import {
  CheckCheck,
  Clipboard,
  ClipboardCheck,
  Copy,
  EllipsisVertical,
  Paperclip,
  SendHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  return (
    <div className="content-container bg-white p-4 pt-0 rounded-md border-1">
      <ChatSocketProvider>
        <ChatContainer />
      </ChatSocketProvider>
    </div>
  );
}

function ChatContainer() {
  const { currentChat } = useChatSocketContext();

  return (
    <div className="mt-4 flex flex-col gap-10 md:gap-0 md:flex-row">
      <div className="md:w-[400px] md:pr-10">
        {/* <div className="pb-4 flex items-center gap-2 border-b-1">
        <Button variant="wz" size="sm" className="rounded-full">All Chats</Button>
        <Button variant="wz" size="sm" className="rounded-full">Personal</Button>
      </div> */}
        <AllChatListings />
      </div>
      {currentChat ? (
        <SelectedChat />
      ) : (
        <div className="bg-[var(--comp-1)] content-height-screen grow flex items-center justify-center">
          <h4>Please Select a Chat 😊</h4>
        </div>
      )}
    </div>
  );
}

function AllChatListings() {
  const { chats, currentChat } = useChatSocketContext();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 1000);

  const selectedChats = useMemo(() =>
    chats.filter((chat) =>
      chat.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
    ),
  );

  return (
    <div className="w-full">
      <div className="mb-4 relative">
        <Input
          placeholder="Search messages"
          className="w-full bg-[#F4F4F4]/25"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {debouncedQuery !== query && (
          <Loader className="!w-6 absolute right-2 top-1/2 translate-y-[-50%]" />
        )}
      </div>
      <div className="w-full pb-4 h-[450px] divide-y-2 divide-[var(--comp-1)] overflow-y-auto">
        {selectedChats.map((chat) => (
          <ChatPersonCard
            key={chat._id}
            chat={chat}
            selectedId={currentChat?._id}
          />
        ))}
        {selectedChats.length === 0 && (
          <div className="min-h-[400px] leading-[400px] font-bold text-center">
            No Chats Found!
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPersonCard({ chat, selectedId }) {
  const { dispatch } = useChatSocketContext();
  return (
    <div
      className={`px-4 py-1 flex items-center gap-4 relative cursor-pointer hover:bg-[var(--comp-1)] rounded-[8px] ${selectedId === chat._id && "bg-[var(--comp-1)]"}`}
      onClick={() => dispatch(selectChatUser(chat))}
    >
      <Avatar className="h-[48px] w-[48px] rounded-[4px]">
        <AvatarImage src={chat.profilePhoto} className="rounded-[8px]" />
        <AvatarFallback className="rounded-[8px]">
          {nameInitials(chat.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-[16px] font-semibold mb-[2px]">{chat.name}</p>
        <p className="leading-[1] text-[#82867E] text-[12px]">
          {chat.latestMessage}
        </p>
      </div>
      <span className="text-[11px] text-[#82867E] absolute top-4 right-2">
        {getRelativeTime(chat.latestMessageTime)}
      </span>
    </div>
  );
}

function SelectedChat() {
  const { socket, currentChat, state } = useChatSocketContext();
  useEffect(
    function () {
      const data = {
        coachId: currentChat.coachID,
        clientId: currentChat.clientID,
        person: "coach",
      };
      socket.emit("joinRoom", data);
      socket.emit("seenMessages", data);
    },
    [currentChat._id],
  );

  if (state === "joining-room")
    return (
      <div className="bg-[var(--comp-1)] content-height-screen grow flex items-center justify-center">
        <h4>Please Wait Opening Chat 😊</h4>
      </div>
    );

  return (
    <div className="relative grow md:w-[200px] flex flex-col border-1 overflow-x-clip">
      <CurrentChatHeader />
      <div className="text-[12px] font-semibold py-2 px-6">
        <ChatMessages />
      </div>
      <CurrentChatMessageBox />
    </div>
  );
}

function CurrentChatHeader() {
  const { currentChat } = useChatSocketContext();
  return (
    <div className="bg-[var(--primary-1)] px-4 py-4 flex items-center gap-4 sticky top-0 z-[10] border-b-1">
      <Avatar className="h-[48px] w-[48px] rounded-[4px]">
        <AvatarImage
          src={currentChat.profilePhoto || "/"}
          className="rounded-[8px]"
        />
        <AvatarFallback className="bg-gray-200 rounded-[8px]">
          {nameInitials(currentChat.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-[16px] font-semibold mb-[2px]">{currentChat.name}</p>
      </div>
    </div>
  );
}

function ChatMessages() {
  const { currentChatMessages } = useChatSocketContext();
  const messsageContainerRef = useRef();

  useEffect(
    function () {
      if (messsageContainerRef.current) {
        messsageContainerRef.current.scrollTop =
          messsageContainerRef.current.scrollHeight;
      }
    },
    [currentChatMessages.length],
  );

  return (
    <div ref={messsageContainerRef} className="h-96 pr-4 overflow-y-auto">
      {currentChatMessages.map((message) =>
        message.person === "coach" ? (
          <CurrentUserMessage key={message.createdAt} message={message} />
        ) : (
          <CompanionUserMessage key={message.createdAt} message={message} />
        ),
      )}
    </div>
  );
}

function CurrentChatMessageBox() {
  const [file, setFile] = useState();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { socket, currentChat } = useChatSocketContext();
  const inputRef = useRef();

  useKeyPress("Enter", sendMessage);

  async function sendMessage() {
    if (!message.trim() && !file) return;

    setIsSending(true);
    try {
      let attachment;
      let attachmentType;

      if (file) {
        const uploadResult = await uploadFileToBackend(file);
        attachment = uploadResult?.data;
        attachmentType = uploadResult?.fileType;
      }

      socket.emit("sendMessage", {
        coachId: currentChat.coachID,
        clientId: currentChat.clientID,
        person: "coach",
        message,
        ...(attachment ? { attachment } : {}),
        ...(attachmentType ? { attachmentType } : {}),
      });

      setMessage("");
      if (file) setFile();
    } catch (error) {
      toast.error(error?.message || "Failed to send the attachment.");
    } finally {
      setIsSending(false);
    }
  }
  console.log(file)
  return (
    <div className="px-4 py-4 mt-auto flex items-center gap-4 border-t-1 relative">
      <input
        hidden
        type="file"
        ref={inputRef}
        accept="image/*, audio/*, video/*, application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <Paperclip
        onClick={() => inputRef.current.click()}
        className="text-[#535353] w-[20px] cursor-pointer"
      />
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a Message"
        className="px-0 border-0 shadow-none focus:shadow-none"
      />
      <Button variant="wz" onClick={sendMessage} disabled={isSending}>
        <SendHorizontal />
        Send
      </Button>
      {file && <div className="bg-[#0000001A] w-full absolute left-0 top-0 translate-y-[-100%]">
        <FilePreview file={file} onRemove={() => setFile()} />
      </div>}
    </div>
  );
}

function CurrentUserMessage({ message }) {
  const [showOptions, setShowOptions] = useState(false);
  const coach = useAppSelector((state) => state.coach.data);
  if (!message || !message?.message) return;
  return (
    <div
      className="mb-4 flex flex-wrap items-start justify-end gap-4"
      onMouseOver={() => setShowOptions(true)}
      onMouseOut={() => setShowOptions(false)}
    >
      <div className="relative">
        <div
          className="max-w-[80ch] bg-[var(--accent-1)] text-white relative px-4 py-2 rounded-[20px] rounded-br-0"
          style={{ borderBottomRightRadius: 0 }}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: formatMessage(message?.message),
            }}
          />
          {message.attachment && (
            <MessageAttachment
              attachment={message.attachment}
              attachmentType={message.attachmentType}
              variant="accent"
            />
          )}
          {message.seen && (
            <CheckCheck className="w-3 h-3 text-[#0045CC] absolute bottom-[2px] right-[2px]" />
          )}
        </div>
        <p className="text-[var(--dark-1)]/25 mt-1 text-right">
          {getRelativeTime(message.createdAt)}
        </p>
        {showOptions && <Options user="current" message={message?.message} />}
      </div>
      <Avatar className="rounded-[4px] mt-1">
        <AvatarImage src={coach.profilePhoto || "/"} />
        <AvatarFallback className="rounded-[4px]">
          {nameInitials(coach.name)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

function CompanionUserMessage({ message }) {
  const [showOptions, setShowOptions] = useState(false);
  const { currentChat } = useChatSocketContext();
  if (!message || !message?.message) return;
  return (
    <div
      onMouseOver={() => setShowOptions(true)}
      onMouseOut={() => setShowOptions(false)}
      className="mb-4 flex flex-wrap items-start justify-start gap-4 relative"
    >
      <Avatar className="rounded-[4px] mt-1">
        <AvatarImage src={currentChat.profilePhoto || "/"} />
        <AvatarFallback className="rounded-[4px]">
          {nameInitials(currentChat.name)}
        </AvatarFallback>
      </Avatar>
      <div className="relative">
        <div
          className="max-w-[40ch] bg-[var(--comp-1)] text-black px-4 py-2 rounded-[20px] rounded-br-0 space-y-2"
          style={{ borderBottomLeftRadius: 0 }}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: formatMessage(message?.message),
            }}
          />
          {message.attachment && (
            <MessageAttachment
              attachment={message.attachment}
              attachmentType={message.attachmentType}
            />
          )}
        </div>
        <p className="text-[var(--dark-1)]/25 mt-1">
          {getRelativeTime(message.createdAt)}
        </p>
        {showOptions && <Options message={message?.message} />}
      </div>
    </div>
  );
}

export function Options({ user = "companion", message }) {
  return (
    <button
      className={cn(
        "absolute top-0 translate-y-1 p-1 bg-[var(--comp-1)] border-1 hover:rounded-[4px] hover:scale-[1.1]",
        user === "companion"
          ? "left-full translate-x-2"
          : "right-full -translate-x-2",
      )}
    >
      <ClipboardCheck
        onClick={() => {
          copyText(message);
          toast.success("Copied!");
        }}
        className="h-[14px] w-[14px] "
      />
    </button>
  );
}

function FilePreview({ file, onRemove }) {
  if (!(file instanceof File)) return <></>;

  const previewType = getFilePreviewType(file.type);

  switch (previewType) {
    case "image":
      return <ImagePreview file={file} onRemove={onRemove} />;
    case "video":
      return <VideoPreview file={file} onRemove={onRemove} />;
    case "audio":
      return <AudioPreview file={file} onRemove={onRemove} />;
    case "pdf":
      return <PDFPreview file={file} onRemove={onRemove} />;
    default:
      return (
        <div className="relative px-4 py-2 text-sm text-[#5A5858] bg-[#F8F8F8] rounded-md">
          <p>Preview unavailable for this file type.</p>
          <RemoveSelectedFile onRemove={onRemove} />
        </div>
      );
  }
}

function getFilePreviewType(fileType) {
  if (!fileType) return "unknown";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "audio";
  if (fileType === "application/pdf") return "pdf";
  return "unknown";
}

function ImagePreview({ file, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="relative inline-block">
      <Image
        src={src}
        alt=""
        height={400}
        width={400}
        className="object-contain max-h-[200px] object-left"
      />
      <RemoveSelectedFile onRemove={onRemove} />
    </div>
  );
}

function AudioPreview({ file, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="relative w-full">
      <audio controls className="w-full max-w-full" src={src}>
        Your browser does not support audio playback.
      </audio>
      <RemoveSelectedFile onRemove={onRemove} />
    </div>
  );
}

function VideoPreview({ file, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="relative w-full">
      <video
        controls
        className="w-full max-h-[250px] rounded-md bg-black"
        src={src}
      >
        Your browser does not support video playback.
      </video>
      <RemoveSelectedFile onRemove={onRemove} />
    </div>
  );
}

function PDFPreview({ file, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="relative w-full">
      <iframe
        src={src}
        title="PDF preview"
        className="w-full h-[250px] rounded-md border-0"
      />
      <RemoveSelectedFile onRemove={onRemove} />
    </div>
  );
}

function RemoveSelectedFile({ onRemove }) {
  return (
    <X
      className="absolute top-0 left-0 bg-red-500 rounded-full text-white cursor-pointer"
      onClick={onRemove}
    />
  );
}

async function uploadFileToBackend(file) {
  if (!(file instanceof File)) {
    throw new Error("uploadFileToBackend expects a File instance");
  }
  const formData = new FormData();
  formData.append("file", file);

  const response = await sendDataWithFormData(
    "app/chat/upload-file?person=coach",
    formData,
    "POST",
  );

  if (response?.status_code && response.status_code !== 200) {
    throw new Error(response.message || "Unable to upload the attachment");
  }

  return {
    data: response?.data,
    fileType: mapFileTypeForUpload(file.type),
  };
}

function mapFileTypeForUpload(fileType) {
  if (!fileType) return "unknown";
  const [group] = fileType.split("/");
  if (group === "application") return "pdf";
  if (["image", "video", "audio"].includes(group)) {
    return group;
  }
  return "unknown";
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif", "svg"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "avi", "mkv"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a"]);
const PDF_EXTENSIONS = new Set(["pdf"]);

function MessageAttachment({ attachment, attachmentType, variant = "neutral" }) {
  const url = getAttachmentPreviewUrl(attachment);
  const resolvedType = determineAttachmentType(attachmentType, attachment);
  const label = getAttachmentLabel(attachment);

  if (!url) return null;

  const palette =
    variant === "accent"
      ? {
        border: "border-white/30 bg-white/10 text-white shadow-[0px_12px_26px_rgba(15,23,42,0.45)]",
        label: "text-white/70",
        link: "text-white font-semibold",
      }
      : {
        border: "border-gray-200 bg-white text-gray-900 shadow-[0px_8px_20px_rgba(15,23,42,0.08)]",
        label: "text-gray-500",
        link: "text-[var(--accent-1)] font-semibold",
      };

  const typeLabel =
    resolvedType === "pdf"
      ? "PDF"
      : ["image", "video", "audio"].includes(resolvedType)
        ? resolvedType.charAt(0).toUpperCase() + resolvedType.slice(1)
        : "File";

  const renderMedia = () => {
    switch (resolvedType) {
      case "image":
        return (
          <img
            src={url}
            alt={label || "image attachment"}
            className={`h-[180px] w-full rounded-[10px] border object-contain ${variant === "accent" ? "border-white/40" : "border-gray-200"}`}
            loading="lazy"
          />
        );
      case "video":
        return (
          <video
            controls
            src={url}
            className={`h-[200px] w-full rounded-[10px] border bg-black object-contain ${variant === "accent" ? "border-white/20" : "border-gray-200"}`}
          >
            Your browser does not support video playback.
          </video>
        );
      case "audio":
        return (
          <audio
            controls
            src={url}
            className={`w-full rounded-[10px] border ${variant === "accent" ? "border-white/20" : "border-gray-200"}`}
          >
            Your browser does not support audio playback.
          </audio>
        );
      case "pdf":
        return (
          <iframe
            src={url}
            title={label || "pdf-attachment"}
            className={`h-[220px] w-full rounded-[10px] border ${variant === "accent" ? "border-white/30" : "border-gray-200"}`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mt-3 max-w-[320px] rounded-[14px] border px-3 py-3 ${palette.border}`}>
      <div className="space-y-2">
        {renderMedia()}
        {resolvedType === "unknown" && (
          <p className={`text-xs italic ${variant === "accent" ? "text-white/70" : "text-gray-500"}`}>
            Preview unavailable for this file type.
          </p>
        )}
        <div className={`flex items-center justify-between text-[11px] uppercase tracking-[0.2em] ${palette.label}`}>
          <span>{label || "Attachment"}</span>
          <span>{typeLabel}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={palette.link}
          >
            View
          </a>
        </div>
      </div>
    </div>
  );
}

function getAttachmentPreviewUrl(attachment) {
  if (!attachment) return null;
  if (typeof attachment === "string") return attachment;
  return (
    attachment.url ||
    attachment.fileUrl ||
    attachment.path ||
    attachment.link ||
    attachment.src ||
    null
  );
}

function getAttachmentLabel(attachment) {
  if (!attachment) return null;
  if (typeof attachment === "string") {
    return attachment.split("/").pop();
  }
  return (
    attachment.name ||
    attachment.fileName ||
    attachment.title ||
    attachment.label ||
    getAttachmentPreviewUrl(attachment)?.split("/").pop() ||
    null
  );
}

function determineAttachmentType(attachmentType, attachment) {
  if (attachmentType) {
    return attachmentType.toLowerCase();
  }

  const mimeType = attachment?.mimeType || attachment?.type;
  const normalized = mapFileTypeForUpload(mimeType);
  if (normalized !== "unknown") return normalized;

  const url = getAttachmentPreviewUrl(attachment);
  const extension = getFileExtension(url);
  if (!extension) return "unknown";

  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (PDF_EXTENSIONS.has(extension)) return "pdf";
  return "unknown";
}

function getFileExtension(url) {
  if (!url) return null;
  const parts = url.split(".");
  if (parts.length === 0) return null;
  return parts[parts.length - 1].toLowerCase().split(/\#|\?/)[0];
}
