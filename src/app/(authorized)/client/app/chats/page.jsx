"use client";
import { MessageAttachment } from "@/app/(authorized)/coach/chats/page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendDataWithFormData } from "@/lib/api";
import { formatMessage, getRelativeTime, nameInitials } from "@/lib/formatter";
import { cn, copyText, getObjectUrl } from "@/lib/utils";
import useClientChatSocketContext, { ClientChatStateProvider } from "@/providers/ClientChatStateProvider";
import { useAppSelector } from "@/providers/global/hooks";
import { CheckCheck, ClipboardCheck, FileText, Image as ImageIcon, Paperclip, SendHorizontal, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  return (
    <div className="content-container bg-white p-4 pt-0 rounded-4xl border-1">
      <ClientChatStateProvider>
        <SelectedChat />
      </ClientChatStateProvider>
    </div>
  );
}

function SelectedChat() {
  const { state } = useClientChatSocketContext();

  if (state === "joining-room")
    return (
      <div className="bg-[var(--comp-1)] content-height-screen grow flex items-center justify-center">
        <h4 className="italic text-zinc-500">Please Wait Opening Chat 😊</h4>
      </div>
    );

  return (
    <div className="relative grow mt-4 flex flex-col shadow-md rounded-4xl  overflow-x-clip">
      <CurrentChatHeader />
      <div className="w-full text-[12px] font-semibold py-2 px-6">
        <ChatMessages />
      </div>
      <CurrentChatMessageBox />
    </div>
  );
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
function UploadProgressBar({ progress }) {
  if (typeof progress !== "number") return null;

  return (
    <div className="mt-2 h-1.5 w-full bg-slate-200 rounded">
      <div
        className="h-full bg-[var(--accent-1)] rounded transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function startPreviewProgress(setProgress, onComplete) {
  let value = 0;

  const interval = setInterval(() => {
    value += Math.random() * 12;
    if (value >= 100) {
      value = 100;
      clearInterval(interval);
      onComplete?.();
    }
    setProgress(Math.floor(value));
  }, 150);

  return () => clearInterval(interval);
}
function CurrentChatMessageBox() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { clientId, coachId } = useAppSelector(state => state.client.data);
  const { socket } = useClientChatSocketContext();
  const inputRef = useRef();
  const [previewProgress, setPreviewProgress] = useState(null);
  const [isReadyToSend, setIsReadyToSend] = useState(false);

  async function sendMessage() {
    if (isSending) return;
    if (!message.trim() && !file) return;
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file && file.size > MAX_FILE_SIZE) { 
      toast.error("File size exceeds the maximum limit of 15 MB.");
      return;
    }
    setIsSending(true);
    try {
      let attachment;
      let attachmentType;

      if (file) {
        const uploadResult = await uploadFileToBackendClient(file);
        attachment = uploadResult?.data;
        attachmentType = uploadResult?.fileType;
      }

      socket.emit("sendMessage", {
        coachId,
        clientId,
        person: "client",
        message,
        ...(attachment ? { attachment } : {}),
        ...(attachmentType ? { attachmentType } : {}),
      });

      setMessage("");
      setFile(null);
    } catch (error) {
      toast.error(error?.message || "Failed to send the attachment.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-4 py-3 mb-3 mt-auto flex flex-col gap-3 border-t border-zinc-100">
      {file && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <FilePreview
            file={file}
            progress={previewProgress}
            onRemove={() => {
              setFile(null)
              setPreviewProgress(null);
              setIsReadyToSend(false);
            }} />
        </div>
      )}
      <div className="flex items-end gap-3">
        <input
          hidden
          type="file"
          ref={inputRef}
          accept="image/*,audio/*,video/*,application/pdf"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) return;
            setFile(e.target.files?.[0] || null)
            setIsReadyToSend(false);
            setPreviewProgress(0);

            startPreviewProgress(setPreviewProgress, () => {
                setIsReadyToSend(true);
            });
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 px-4 rounded-full py-3 shadow-md shadow-zinc-200 focus:shadow-none border-slate-200"
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
          disabled={isSending || (!message.trim() && !file) || (file && !isReadyToSend) }
          className="flex items-center gap-1 flex-shrink-0 rounded-full px-4 py-3"
        >
          <SendHorizontal className="w-4 h-4" />
          {file && !isReadyToSend ? "Preparing..." : isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

function CurrentUserMessage({ message }) {
  const [showOptions, setShowOptions] = useState(false);
  const client = useAppSelector(state => state.client.data)
  if (!message || (!message?.message && !message?.attachment)) return null;
  return (
    <div
      className="mb-4 flex flex-wrap items-end justify-end gap-3 group"
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="flex flex-col items-end md:max-w-[80%]">
        <div className="max-w-[80ch] bg-[var(--accent-1)] text-white text-xs md:text-sm relative px-4 py-2.5 rounded-[20px] rounded-br-md shadow-sm">
          {message.message && (
            <div
              dangerouslySetInnerHTML={{ __html: formatMessage(message?.message) }}
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
          {message.seen && (
            <CheckCheck className="w-3 h-3 text-[#0045CC] absolute bottom-[2px] right-[4px]" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <p className="text-[10px] text-[var(--dark-1)]/40">
            {getRelativeTime(message.createdAt)}
          </p>
          {showOptions && message.message && (
            <Options user="current" message={message?.message} />
          )}
        </div>
      </div>
      <Avatar className="rounded-full mt-1 h-8 w-8 flex-shrink-0">
        <AvatarImage src={client.profilePhoto || "/"} />
        <AvatarFallback className="bg-green-400 font-bold text-white rounded-full">
          {nameInitials(client.name || "You")}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

function CompanionUserMessage({ message }) {
  const [showOptions, setShowOptions] = useState(false);
  const { coachName, coachProfilePhoto } = useAppSelector(state => state.client.data)
  if (!message || (!message?.message && !message?.attachment)) return null;
  return (
    <div
      className="mb-4 flex flex-wrap items-end justify-start gap-3 group"
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <Avatar className="rounded-full mt-1 h-8 w-8 flex-shrink-0">
        <AvatarImage src={coachProfilePhoto || "/"} />
        <AvatarFallback className="bg-green-200 font-bold text-black rounded-full">
          {nameInitials(coachName || "Coach")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start md:max-w-[75%]">
        <div
          className="max-w-[40ch] bg-[var(--comp-1)] text-zinc-600 text-xs md:text-sm px-4 py-2.5 rounded-[20px] rounded-bl-md"
        >
          {message.message && (
            <div
              dangerouslySetInnerHTML={{ __html: formatMessage(message?.message) }}
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
          <p className="text-[10px] text-[var(--dark-1)]/40">
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

function FilePreview({ file, progress, onRemove }) {
  if (!(file instanceof File)) return null;

  const previewType = getFilePreviewType(file.type);
  const fileName = file.name || "Untitled";
  const fileSize = formatFileSize(file.size);

  switch (previewType) {
    case "image":
      return <ImagePreview file={file} fileName={fileName} progress={progress} onRemove={onRemove} />;
    case "video":
      return (
        <VideoPreview
          file={file}
          fileName={fileName}
          progress={progress}
          fileSize={fileSize}
          onRemove={onRemove}
        />
      );
    case "audio":
      return (
        <AudioPreview
          file={file}
          fileName={fileName}
          progress={progress}
          fileSize={fileSize}
          onRemove={onRemove}
        />
      );
    case "pdf":
      return (
        <PDFPreview
          file={file}
          fileName={fileName}
          progress={progress}
          fileSize={fileSize}
          onRemove={onRemove}
        />
      );
    default:
      return (
        <GenericFilePreview
          file={file}
          fileName={fileName}
          progress={progress}
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

function ImagePreview({ file, fileName, onRemove, progress }) {
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
      <UploadProgressBar progress={progress} />
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

function VideoPreview({ file, fileName, fileSize, onRemove, progress }) {
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

function AudioPreview({ file, fileName, fileSize, onRemove, progress }) {
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
        <UploadProgressBar progress={progress} />
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

function PDFPreview({ file, fileName, fileSize, onRemove, progress }) {
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
        <UploadProgressBar progress={progress} />
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-[var(--accent-1)] hover:underline inline-flex items-center gap-1"
      >
        <FileText className="w-3 h-3" />
        Open PDF
      </a>
    </div>
  );
}

function GenericFilePreview({ file, fileName, progress, fileSize, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
      <div className="p-2 bg-slate-100 rounded-lg">
        <FileText className="w-5 h-5 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {fileName}
        </p>
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

async function uploadFileToBackendClient(file) {
  if (!(file instanceof File)) {
    throw new Error("uploadFileToBackendClient expects a File instance");
  }
  const formData = new FormData();
  formData.append("file", file);

  const response = await sendDataWithFormData(
    "app/chat/upload-file?person=client",
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