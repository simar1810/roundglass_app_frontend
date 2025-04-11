import { CircleAlert, CircleDollarSign, Gem, Headset, Home, Link as LinkIcon, Newspaper, PanelsTopLeft, Presentation, User, Users } from "lucide-react";

export const sidebar__coachContent = [
  {
    id: 1,
    title: "Home",
    icon: <Home className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/dashboard"
  },
  {
    id: 2,
    title: "Portfolio",
    icon: <User className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/portfolio"
  },
  {
    id: 3,
    title: "Tools",
    icon: <PanelsTopLeft className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/tools",
    items: [
      {
        id: 1,
        icon: <PanelsTopLeft className="min-w-[20px] min-h-[20px]" />,
        title: "Schedule Overview",
        url: "/coach/schedule-overview"
      },
      {
        id: 2,
        icon: <Users className="min-w-[20px] min-h-[20px]" />,
        title: "Clients",
        url: "/coach/tools/clients"
      },
      {
        id: 3,
        icon: <LinkIcon className="min-w-[20px] min-h-[20px]" />,
        title: "Link Generator",
        url: "/coach/tools/link-generator"
      },
      {
        id: 4,
        icon: <Presentation className="min-w-[20px] min-h-[20px]" />,
        title: "Meetings",
        url: "/coach/tools/meetings"
      },
      {
        id: 5,
        icon: <Gem className="min-w-[20px] min-h-[20px]" />,
        title: "Free Trial Clients",
        url: "/coach/tools/free-trial-clients"
      },
      {
        id: 6,
        icon: <Newspaper className="min-w-[20px] min-h-[20px]" />,
        title: "Feed",
        url: "/coach/tools/feed"
      }
    ]
  }
]

export const sidebar__coachFooter = [
  {
    id: 1,
    title: "Subscription",
    icon: <CircleDollarSign className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/subscription"
  },
  {
    id: 2,
    title: "Support",
    icon: <Headset className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/support"
  },
  {
    id: 3,
    title: "About",
    icon: <CircleAlert className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/about"
  },
]