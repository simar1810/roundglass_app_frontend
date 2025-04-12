import {
  CircleAlert,
  CircleDollarSign,
  ClipboardPlus,
  ContactRound,
  FileText,
  Headset,
  Home,
  LayoutDashboard,
  Link,
  Logs,
  Newspaper,
  PersonStanding,
  PlusCircle,
  Projector,
  Settings,
  Soup,
  User,
  UserPlus,
  Users,
  Video
} from "lucide-react";

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
    title: "Clients",
    icon: <Users className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/clients",
    items: [
      {
        id: 1,
        icon: <Users className="icon min-w-[20px] min-h-[20px]" />,
        title: "All Clients",
        url: "/coach/clients"
      },
      {
        id: 2,
        icon: <PlusCircle className="icon min-w-[20px] min-h-[20px]" />,
        title: "Add Clients with Checkup",
        url: "/coach/schedule-overview"
      },
      {
        id: 3,
        icon: <FileText className="icon min-w-[20px] min-h-[20px]" />,
        title: "View Clients & Followup",
        url: "/coach/tools/clients"
      },
      {
        id: 4,
        icon: <UserPlus className="icon min-w-[20px] min-h-[20px]" />,
        title: "Quick Add",
        url: "/coach/tools/link-generator"
      }
    ]
  },
  {
    id: 4,
    title: "Meals & Recipes",
    icon: <Soup className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/meals",
    items: [
      {
        id: 1,
        icon: <Logs className="icon min-w-[20px] min-h-[20px]" />,
        title: "View Meal Plans",
        url: "/coach/meals"
      },
      {
        id: 2,
        icon: <ClipboardPlus className="icon min-w-[20px] min-h-[20px]" />,
        title: "Add Meal Plan",
        url: "/coach/tools/clients"
      },
      {
        id: 3,
        icon: <Soup className="icon min-w-[20px] min-h-[20px]" />,
        title: "Recipes",
        url: "/coach/tools/link-generator"
      }
    ]
  },
  {
    id: 5,
    title: "Feed",
    icon: <Newspaper className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/portfolio"
  },
  {
    id: 6,
    title: "Workout",
    icon: <PersonStanding className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/portfolio"
  },
  {
    id: 7,
    title: "Club",
    icon: <LayoutDashboard className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/portfolio",
    items: [
      {
        id: 1,
        icon: <Projector className="icon min-w-[20px] min-h-[20px]" />,
        title: "Meetings",
        url: "/coach/schedule-overview"
      },
      {
        id: 2,
        icon: <Link className="icon min-w-[20px] min-h-[20px]" />,
        title: "Link Generator",
        url: "/coach/tools/clients"
      },
      {
        id: 3,
        icon: <ContactRound className="icon min-w-[20px] min-h-[20px]" />,
        title: "Membership",
        url: "/coach/tools/link-generator"
      },
      {
        id: 4,
        icon: <Video className="icon min-w-[20px] min-h-[20px]" />,
        title: "Zoom Settings",
        url: "/coach/tools/link-generator"
      },
      {
        id: 5,
        icon: <Soup className="icon min-w-[20px] min-h-[20px]" />,
        title: "Free Trial",
        url: "/coach/tools/link-generator"
      }
    ]
  },
  {
    id: 8,
    title: "Other Tools",
    icon: <Settings className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/portfolio"
  },
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