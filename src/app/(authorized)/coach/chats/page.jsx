import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EllipsisVertical, Paperclip, SendHorizontal } from "lucide-react";

export default function Page() {
  return <div className="content-conta iner bg-white p-4 rounded-md border-1">
    {/* <h3>Chats</h3> */}
    <div className="mt-4 content-height-screen flex">
      <div className="w-[400px] content-height-screen pr-10">
        <Input placeholder="Search messages" className="bg-[#F4F4F4]/25 mb-4" />
        <div className="pb-4 flex items-center gap-2 border-b-1">
          <Button variant="wz" size="sm" className="rounded-full">All Chats</Button>
          <Button variant="wz" size="sm" className="rounded-full">Personal</Button>
        </div>
        <div className="py-4">
          {Array.from({ length: 5 }, (_, i) => i).map(item => <ChatPersonSelect key={item} />)}
        </div>
      </div>
      <div className="relative grow content-height-screen h-[200px] w-[200px] flex flex-col border-1">
        <CurrentChatHeader />
        <div className="text-[12px] font-semibold py-2 px-6">
          <CurrentUserMessage />
          <CompanionUserMessage />
        </div>
        <CurrentChatMessageBox />
      </div>
    </div>
  </div>
}

function ChatPersonSelect() {
  return <div className="px-4 py-3 flex items-center gap-4 relative">
    <Avatar className="h-[48px] w-[48px] rounded-[4px]">
      <AvatarImage src="/" className="rounded-[8px]" />
      <AvatarFallback className="bg-gray-200 rounded-[8px]">SW</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-[16px] font-semibold mb-[2px]">Symond Write</p>
      <p className="leading-[1] text-[#82867E] text-[12px]">Hi, How are you?</p>
    </div>
    <span className="text-[11px] text-[#82867E] absolute top-4 right-2">10 min ago</span>
  </div>
}

function CurrentChatHeader() {
  return <div className="px-4 py-4 flex items-center gap-4 relative border-b-1">
    <Avatar className="h-[48px] w-[48px] rounded-[4px]">
      <AvatarImage src="/" className="rounded-[8px]" />
      <AvatarFallback className="bg-gray-200 rounded-[8px]">SW</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-[16px] font-semibold mb-[2px]">Symond Write</p>
      <p className="leading-[1] text-[#82867E] text-[12px]">Active Now</p>
    </div>
    <EllipsisVertical className="ml-auto text-[#D9D9D9]" />
  </div>
}

function CurrentChatMessageBox() {
  return <div className="mx-4 py-4 mt-auto flex items-center gap-4 border-t-1">
    <Paperclip className="text-[#535353] w-[18px]" />
    <Input placeholder="Write a Message" className="px-0 border-0 shadow-none focus:shadow-none" />
    <Button variant="wz">
      <SendHorizontal />
      Send
    </Button>
  </div>
}

function CurrentUserMessage() {
  return <div className="mb-4 flex flex-wrap items-start justify-end gap-4">
    <div>
      <div className="max-w-[80ch] bg-[var(--accent-1)] text-white px-4 py-2 rounded-[20px] rounded-br-0" style={{ borderBottomRightRadius: 0 }}>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type
      </div>
      <p className="text-[var(--dark-1)]/25 mt-1 text-right">11:46 PM</p>
    </div>
    <Avatar className="rounded-[4px] mt-1">
      <AvatarImage src="/" />
      <AvatarFallback className="rounded-[4px]">SN</AvatarFallback>
    </Avatar>
  </div>
}

function CompanionUserMessage() {
  return <div className="mb-4 flex flex-wrap items-start justify-start gap-4">
    <Avatar className="rounded-[4px] mt-1">
      <AvatarImage src="/" />
      <AvatarFallback className="rounded-[4px]">SN</AvatarFallback>
    </Avatar>
    <div>
      <div className="max-w-[40ch] bg-[var(--comp-1)] text-black px-4 py-2 rounded-[20px] rounded-br-0" style={{ borderBottomLeftRadius: 0 }}>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type </div>
      <p className="text-[var(--dark-1)]/25 mt-1">11:46 PM</p>
    </div>
  </div>
}