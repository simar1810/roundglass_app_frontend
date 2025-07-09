"use client";
import useClientChatSocketContext, { ClientChatStateProvider } from "@/providers/ClientChatStateProvider";

export default function Page() {
  return <div className="content-container bg-white p-4 pt-0 rounded-md border-1">
    <ClientChatStateProvider>
      <ChatContainer />
    </ClientChatStateProvider>
  </div>
}

function ChatContainer() {
  const data = useClientChatSocketContext()
  return <div>This is really cool</div>
}