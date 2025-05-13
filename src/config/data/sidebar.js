import QuickAddClient from "@/components/modals/add-client/QuickAddClient";
import AddClientWithCheckup from "@/components/modals/add-client/AddClientWithCheckup";
import {
  CircleDollarSign,
  ClipboardPlus,
  Clock12,
  ContactRound,
  FileCheck,
  FileText,
  Flame,
  Headset,
  Home,
  LayoutDashboard,
  Link,
  Logs,
  MessageCircle,
  Newspaper,
  PersonStanding,
  PlusCircle,
  Projector,
  Settings,
  Soup,
  Store,
  User,
  UserPlus,
  Users,
  Video
} from "lucide-react";
import { FaWeightScale } from "react-icons/fa6";

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
        type: "modal",
        Component: AddClientWithCheckup
      },
      // {
      //   id: 3,
      //   icon: <FileText className="icon min-w-[20px] min-h-[20px]" />,
      //   title: "View Clients & Followup",
      //   url: "/coach/tools/clients"
      // },
      {
        id: 4,
        icon: <UserPlus className="icon min-w-[20px] min-h-[20px]" />,
        title: "Quick Add",
        type: "modal",
        Component: QuickAddClient
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
        url: "/coach/meals/list"
      },
      {
        id: 2,
        icon: <ClipboardPlus className="icon min-w-[20px] min-h-[20px]" />,
        title: "Add Meal Plan",
        url: "/coach/meals/add-plan"
      },
      {
        id: 3,
        icon: <Soup className="icon min-w-[20px] min-h-[20px]" />,
        title: "Recipes",
        url: "/coach/meals/recipes"
      }
    ]
  },
  {
    id: 5,
    title: "Feed",
    icon: <Newspaper className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/feed"
  },
  {
    id: 6,
    title: "Retail",
    icon: <Store className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/retail"
  },
  {
    id: 7,
    title: "Chats",
    icon: <MessageCircle className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/chats"
  },
  // {
  //   id: 8,
  //   title: "Workout",
  //   icon: <PersonStanding className="min-w-[20px] min-h-[20px]" />,
  //   url: "/coach/workouts"
  // },
  // {
  //   id: 9,
  //   title: "Marathon",
  //   icon: <PersonStanding className="min-w-[20px] min-h-[20px]" />,
  //   url: "/coach/marathons"
  // },
  {
    id: 10,
    title: "Club",
    icon: <LayoutDashboard className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/club",
    items: [
      {
        id: 1,
        icon: <Projector className="icon min-w-[20px] min-h-[20px]" />,
        title: "Meetings",
        url: "/coach/club/meetings"
      },
      {
        id: 2,
        icon: <Link className="icon min-w-[20px] min-h-[20px]" />,
        title: "Link Generator",
        url: "/coach/club/link-generator"
      },
      {
        id: 3,
        icon: <ContactRound className="icon min-w-[20px] min-h-[20px]" />,
        title: "Membership",
        url: "/coach/club/membership"
      },
      // {
      //   id: 4,
      //   icon: <Video className="icon min-w-[20px] min-h-[20px]" />,
      //   title: "Zoom Settings",
      //   url: "/coach/club/zoom-settings"
      // },
      {
        id: 5,
        icon: <Soup className="icon min-w-[20px] min-h-[20px]" />,
        title: "Free Trial",
        url: "/coach/club/free-trial"
      }
    ]
  },
  {
    id: 11,
    title: "Other Tools",
    icon: <Settings className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/tools",
    items: [
      {
        id: 1,
        icon: <FileCheck className="icon min-w-[20px] min-h-[20px]" />,
        title: "Notes",
        url: "/coach/tools/notes"
      },
      {
        id: 2,
        icon: <Clock12 className="icon min-w-[20px] min-h-[20px]" />,
        title: "Reminders",
        url: "/coach/tools/reminders"
      },
      {
        id: 3,
        icon: <Flame className="icon min-w-[20px] min-h-[20px]" />,
        title: "Calorie Counter",
        url: "/coach/tools/calorie-counter"
      },
      {
        id: 4,
        icon: <FaWeightScale className="icon min-w-[20px] min-h-[20px]" />,
        title: "Ideal Weight",
        url: "/coach/tools/ideal-weight"
      }
    ]
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
  // {
  //   id: 3,
  //   title: "About",
  //   icon: <CircleAlert className="min-w-[20px] min-h-[20px]" />,
  //   url: "/coach/about"
  // },
]