"use client";
import Loader from "@/components/common/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectChatUser } from "@/config/state-reducers/chat-scoket";
import useDebounce from "@/hooks/useDebounce";
import useKeyPress from "@/hooks/useKeyPress";
import { sendDataWithFormData } from "@/lib/api";
import { formatMessage, getRelativeTime, nameInitials } from "@/lib/formatter";
import { cn, copyText, getObjectUrl } from "@/lib/utils";
import useChatSocketContext, {
  ChatSocketProvider,
} from "@/providers/ChatStateProvider";
import { useAppSelector } from "@/providers/global/hooks";
import {
  CheckCheck,
  ClipboardCheck,
  FileText,
  Image as ImageIcon,
  Paperclip,
  SendHorizontal,
  Video,
  X,
} from "lucide-react";
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
    <div className="mt-4 flex flex-col gap-6 md:gap-0 md:flex-row h-[calc(100vh-180px)]">
      <div className="md:w-[380px] md:pr-6 border-r border-slate-200">
        <AllChatListings />
      </div>
      {currentChat ? (
        <SelectedChat />
      ) : (
        <div className="bg-slate-50 grow flex items-center justify-center rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-slate-600">Select a conversation</p>
            <p className="text-sm text-slate-500">Choose a client to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AllChatListings() {
  const { chats, currentChat } = useChatSocketContext();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const selectedChats = useMemo(
    () =>
      chats.filter((chat) =>
        chat.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
      ),
    [chats, debouncedQuery],
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 relative">
        <Input
          placeholder="Search conversations..."
          className="w-full bg-slate-50 border-slate-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {debouncedQuery !== query && (
          <Loader className="!w-5 absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {selectedChats.map((chat) => (
          <ChatPersonCard
            key={chat._id}
            chat={chat}
            selectedId={currentChat?._id}
          />
        ))}
        {selectedChats.length === 0 && (
          <div className="min-h-[200px] flex items-center justify-center text-center">
            <div>
              <p className="text-slate-500 font-medium">No chats found</p>
              <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
            </div>
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
      className={cn(
        "px-3 py-3 flex items-center gap-3 relative cursor-pointer rounded-lg transition-colors",
        selectedId === chat._id
          ? "bg-[var(--accent-1)] text-white"
          : "hover:bg-slate-50 text-slate-700",
      )}
      onClick={() => dispatch(selectChatUser(chat))}
    >
      <Avatar className="h-12 w-12 rounded-full border-2 border-white/20">
        <AvatarImage src={chat.profilePhoto} className="rounded-full" />
        <AvatarFallback className="rounded-full bg-slate-200 text-slate-600">
          {nameInitials(chat.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{chat.name}</p>
        <p
          className={cn(
            "text-xs truncate mt-0.5",
            selectedId === chat._id
              ? "text-white/80"
              : "text-slate-500",
          )}
        >
          {chat.latestMessage || "No messages yet"}
        </p>
      </div>
      <span
        className={cn(
          "text-xs whitespace-nowrap",
          selectedId === chat._id ? "text-white/70" : "text-slate-400",
        )}
      >
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
      <div className="bg-slate-50 grow flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Loader className="mx-auto mb-3" />
          <p className="text-slate-600">Connecting to chat...</p>
        </div>
      </div>
    );

  return (
    <div className="relative grow flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <CurrentChatHeader />
      <ChatMessages />
      <CurrentChatMessageBox />
    </div>
  );
}

function CurrentChatHeader() {
  const { currentChat } = useChatSocketContext();
  return (
    <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-slate-200">
      <Avatar className="h-11 w-11 rounded-full">
        <AvatarImage src={currentChat.profilePhoto || "/"} className="rounded-full" />
        <AvatarFallback className="rounded-full bg-[var(--accent-1)] text-white">
          {nameInitials(currentChat.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-base font-semibold text-slate-900">{currentChat.name}</p>
        <p className="text-xs text-slate-500">Active now</p>
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
    <div
      ref={messsageContainerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50"
    >
      {currentChatMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <p className="text-slate-500 font-medium">No messages yet</p>
            <p className="text-sm text-slate-400">Start the conversation!</p>
          </div>
        </div>
      ) : (
        currentChatMessages.map((message, idx) =>
          message.person === "coach" ? (
            <CurrentUserMessage key={message.createdAt || idx} message={message} />
          ) : (
            <CompanionUserMessage key={message.createdAt || idx} message={message} />
          ),
        )
      )}
    </div>
  );
}

function CurrentChatMessageBox() {
  const [file, setFile] = useState(null);
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
      setFile();
    } catch (error) {
      toast.error(error?.message || "Failed to send the attachment.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-white border-t border-slate-200 p-4 space-y-3">
      {file && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <FilePreview file={file} onRemove={() => setFile(null)} />
        </div>
      )}
      <div className="flex items-end gap-3">
        <input
          hidden
          type="file"
          ref={inputRef}
          accept="image/*, audio/*, video/*, application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border-slate-200 focus:border-[var(--accent-1)] rounded-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          variant="wz"
          onClick={sendMessage}
          disabled={isSending || (!message.trim() && !file)}
          className="flex-shrink-0"
        >
          <SendHorizontal className="w-4 h-4" />
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

function CurrentUserMessage({ message }) {
  const [showOptions, setShowOptions] = useState(false);
  const coach = useAppSelector((state) => state.coach.data);
  if (!message || (!message?.message && !message?.attachment)) return null;

  return (
    <div
      className="flex items-end justify-end gap-2 group"
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="flex flex-col items-end max-w-[75%] md:max-w-[65%]">
        <div className="bg-[var(--accent-1)] text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm">
          {message.message && (
            <div
              className="text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{
                __html: formatMessage(message?.message),
              }}
            />
          )}
          {message.attachment && (
            <div className={cn(message.message && "mt-2")}>
              <MessageAttachment
                attachment={message.attachment}
                attachmentType={message.attachmentType}
                variant="accent"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <p className="text-xs text-slate-500">
            {getRelativeTime(message.createdAt)}
          </p>
          {message.seen && (
            <CheckCheck className="w-3.5 h-3.5 text-[var(--accent-1)]" />
          )}
          {showOptions && message.message && (
            <Options user="current" message={message?.message} />
          )}
        </div>
      </div>
      <Avatar className="h-8 w-8 rounded-full flex-shrink-0">
        <AvatarImage src={coach.profilePhoto || "/"} className="rounded-full" />
        <AvatarFallback className="rounded-full bg-slate-200 text-slate-600 text-xs">
          {nameInitials(coach.name)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

function CompanionUserMessage({ message }) {
  const [showOptions, setShowOptions] = useState(false);
  const { currentChat } = useChatSocketContext();
  if (!message || (!message?.message && !message?.attachment)) return null;

  return (
    <div
      className="flex items-end justify-start gap-2 group"
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <Avatar className="h-8 w-8 rounded-full flex-shrink-0">
        <AvatarImage src={currentChat.profilePhoto || "/"} className="rounded-full" />
        <AvatarFallback className="rounded-full bg-slate-200 text-slate-600 text-xs">
          {nameInitials(currentChat.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start max-w-[75%] md:max-w-[65%]">
        <div className="bg-white text-slate-900 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-slate-200">
          {message.message && (
            <div
              className="text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{
                __html: formatMessage(message?.message),
              }}
            />
          )}
          {message.attachment && (
            <div className={cn(message.message && "mt-2")}>
              <MessageAttachment
                attachment={message.attachment}
                attachmentType={message.attachmentType}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <p className="text-xs text-slate-500">
            {getRelativeTime(message.createdAt)}
          </p>
          {showOptions && message.message && (
            <Options message={message?.message} />
          )}
        </div>
      </div>
    </div>
  );
}

function Options({ user = "companion", message }) {
  return (
    <button
      onClick={() => {
        copyText(message);
        toast.success("Copied to clipboard!");
      }}
      className={cn(
        "p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors",
      )}
      title="Copy message"
    >
      <ClipboardCheck className="w-3.5 h-3.5" />
    </button>
  );
}

function FilePreview({ file, onRemove }) {
  if (!(file instanceof File)) return null;

  const previewType = getFilePreviewType(file.type);
  const fileName = file.name || "Untitled";
  const fileSize = formatFileSize(file.size);

  switch (previewType) {
    case "image":
      return <ImagePreview file={file} fileName={fileName} onRemove={onRemove} />;
    case "video":
      return <VideoPreview file={file} fileName={fileName} fileSize={fileSize} onRemove={onRemove} />;
    case "audio":
      return <AudioPreview file={file} fileName={fileName} fileSize={fileSize} onRemove={onRemove} />;
    case "pdf":
      return <PDFPreview file={file} fileName={fileName} fileSize={fileSize} onRemove={onRemove} />;
    default:
      return (
        <GenericFilePreview
          file={file}
          fileName={fileName}
          fileSize={fileSize}
          onRemove={onRemove}
        />
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

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function ImagePreview({ file, fileName, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="relative group">
      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white">
        <img
          src={src}
          alt={fileName}
          className="max-h-48 w-auto object-contain mx-auto"
        />
      </div>
      <div className="absolute top-2 right-2">
        <button
          onClick={onRemove}
          className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <ImageIcon className="w-4 h-4" />
        <span className="truncate flex-1">{fileName}</span>
      </div>
    </div>
  );
}

function VideoPreview({ file, fileName, fileSize, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="relative group">
      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
        <video
          src={src}
          controls
          className="max-h-48 w-full object-contain"
        >
          Your browser does not support video playback.
        </video>
      </div>
      <div className="absolute top-2 right-2">
        <button
          onClick={onRemove}
          className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <Video className="w-4 h-4" />
        <span className="truncate flex-1">{fileName}</span>
        {fileSize && <span className="text-slate-400">{fileSize}</span>}
      </div>
    </div>
  );
}

function AudioPreview({ file, fileName, fileSize, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
        <div className="p-2 bg-[var(--accent-1)]/10 rounded-lg">
          <FileText className="w-5 h-5 text-[var(--accent-1)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
          {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <audio controls className="w-full" src={src}>
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

function PDFPreview({ file, fileName, fileSize, onRemove }) {
  const src = file instanceof File ? getObjectUrl(file) : file;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
        <div className="p-2 bg-red-100 rounded-lg">
          <FileText className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
          {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <iframe
          src={src}
          title="PDF preview"
          className="w-full h-64 border-0"
        />
      </div>
    </div>
  );
}

function GenericFilePreview({ fileName, fileSize, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
      <div className="p-2 bg-slate-100 rounded-lg">
        <FileText className="w-5 h-5 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
        {fileSize && <p className="text-xs text-slate-500">{fileSize}</p>}
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
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
const FALLBACK_LABELS = {
  image: "Image attachment",
  video: "Video attachment",
  audio: "Audio file",
  pdf: "PDF Document",
  default: "File attachment",
};
const MEDIA_ERROR_DESCRIPTIONS = {
  image: "Image preview failed",
  video: "Video playback failed",
  audio: "Audio playback failed",
  pdf: "PDF preview failed",
};
const DEFAULT_FALLBACK_DESCRIPTION = "Preview unavailable";

export function MessageAttachment({ attachment, attachmentType, variant = "neutral" }) {
  const url = getAttachmentPreviewUrl(attachment);
  const resolvedType = determineAttachmentType(attachmentType, attachment);
  const label = getAttachmentLabel(attachment);

  if (!url) return null;

  const isAccent = variant === "accent";
  const [hasPreviewError, setHasPreviewError] = useState(false);

  useEffect(() => {
    setHasPreviewError(false);
  }, [url]);

  const handleMediaError = () => setHasPreviewError(true);

  const renderFallbackCard = (descriptionOverride) => {
    const fallbackTitle =
      label || FALLBACK_LABELS[resolvedType] || FALLBACK_LABELS.default;
    const description =
      descriptionOverride || DEFAULT_FALLBACK_DESCRIPTION;
    const actionLabel = resolvedType === "pdf" ? "Open" : "Download";

    return (
      <div
        className={cn(
          "p-3 rounded-lg border flex items-center gap-3",
          isAccent
            ? "bg-white/10 border-white/30"
            : "bg-white border-slate-200",
        )}
      >
        <FileText
          className={cn("w-5 h-5", isAccent ? "text-white/80" : "text-slate-600")}
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isAccent ? "text-white" : "text-slate-900",
            )}
          >
            {fallbackTitle}
          </p>
          <p
            className={cn(
              "text-xs mt-0.5",
              isAccent ? "text-white/70" : "text-slate-500",
            )}
          >
            {description}
          </p>
        </div>
        {/* <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "text-xs px-3 py-1 rounded-md font-medium transition-colors",
            isAccent
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          )}
        >
          {actionLabel}
        </a> */}
      </div>
    );
  };

  const renderMedia = () => {
    if (hasPreviewError) {
      return renderFallbackCard(MEDIA_ERROR_DESCRIPTIONS[resolvedType]);
    }

    switch (resolvedType) {
      case "image":
        return (
          <div className="relative">
            <img
              src={url}
              alt={label || "image attachment"}
              className={cn(
                "max-w-full rounded-lg object-contain",
                isAccent
                  ? "max-h-[240px] border border-white/30"
                  : "max-h-[240px] border border-slate-200",
              )}
              loading="lazy"
              onError={handleMediaError}
            />
          </div>
        );
      case "video":
        return (
          <video
            controls
            src={url}
            className={cn(
              "max-w-full rounded-lg",
              isAccent
                ? "max-h-[240px] border border-white/30"
                : "max-h-[240px] border border-slate-200 bg-black",
            )}
            onError={handleMediaError}
          >
            Your browser does not support video playback.
          </video>
        );
      case "audio":
        return (
          <div className={cn(
            "p-3 rounded-lg border",
            isAccent
              ? "bg-white/10 border-white/30"
              : "bg-white border-slate-200",
          )}>
            <div className="flex items-center gap-3 mb-2">
              <FileText className={cn("w-5 h-5", isAccent ? "text-white/80" : "text-slate-600")} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isAccent ? "text-white" : "text-slate-900",
                )}>
                  {label || "Audio file"}
                </p>
              </div>
            </div>
            <audio controls className="w-full" src={url} onError={handleMediaError}>
              Your browser does not support audio playback.
            </audio>
          </div>
        );
      case "pdf":
        return (
          <div className={cn(
            "rounded-lg border overflow-hidden",
            isAccent
              ? "bg-white/10 border-white/30"
              : "bg-white border-slate-200",
          )}>
            <div className={cn(
              "p-3 flex items-center gap-3 border-b",
              isAccent ? "border-white/20" : "border-slate-200",
            )}>
              <FileText className={cn("w-5 h-5", isAccent ? "text-white/80" : "text-red-600")} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isAccent ? "text-white" : "text-slate-900",
                )}>
                  {label || "PDF Document"}
                </p>
                <p className={cn(
                  "text-xs mt-0.5",
                  isAccent ? "text-white/70" : "text-slate-500",
                )}>
                  PDF Document
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "text-xs px-3 py-1 rounded-md font-medium transition-colors",
                  isAccent
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                )}
              >
                Open
              </a>
            </div>
            <iframe
              src={url}
              title={label || "pdf-attachment"}
              className="w-full h-64 border-0"
              onError={handleMediaError}
            />
          </div>
        );
      default:
        return renderFallbackCard();
    }
  };

  return <div className="mt-2">{renderMedia()}</div>;
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
