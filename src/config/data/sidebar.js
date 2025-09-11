import QuickAddClient from "@/components/modals/add-client/QuickAddClient";
import AddClientWithCheckup from "@/components/modals/add-client/AddClientWithCheckup";
import {
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  CirclePlus,
  ClipboardPlus,
  Clock,
  Clock12,
  ContactRound,
  Dumbbell,
  FileChartColumn,
  FileCheck,
  FileText,
  Flame,
  Footprints,
  ForkKnife,
  Globe,
  Headset,
  Home,
  Hourglass,
  LayoutDashboard,
  Library,
  Link,
  List,
  ListTodo,
  Logs,
  MessageCircle,
  Newspaper,
  PersonStanding,
  Plus,
  PlusCircle,
  Projector,
  Settings,
  Soup,
  Store,
  Sun,
  Tags,
  Unlink,
  User,
  UserPlus,
  Users,
  Video
} from "lucide-react";
import { FaWeightScale } from "react-icons/fa6";
import CreateWorkoutModal from "@/components/modals/tools/CreateWorkoutModal";

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
        icon: <FileChartColumn className="icon min-w-[20px] min-h-[20px]" />,
        title: "Reports",
        url: "/coach/reports"
      },
      {
        id: 3,
        icon: <PlusCircle className="icon min-w-[20px] min-h-[20px]" />,
        title: "Add Clients with Checkup",
        type: "modal",
        Component: AddClientWithCheckup
      },
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
        title: "Add Meal Plan",
        url: "/coach/meals/add-custom",
        items: [
          {
            id: 1,
            icon: <Sun className="icon min-w-[20px] min-h-[20px]" />,
            title: "Daily",
            url: "/coach/meals/add-custom/daily"
          },
          {
            id: 2,
            icon: <CalendarDays className="icon min-w-[20px] min-h-[20px]" />,
            title: "Weekly",
            url: "/coach/meals/add-custom/weekly"
          },
          {
            id: 3,
            icon: <CalendarRange className="icon min-w-[20px] min-h-[20px]" />,
            title: "Monthly",
            url: "/coach/meals/add-custom/monthly"
          }
        ]
      },
      {
        id: 2,
        icon: <ClipboardPlus className="icon min-w-[20px] min-h-[20px]" />,
        title: "View Meal Plan",
        url: "/coach/meals/list-custom",
        items: [
          {
            id: 1,
            icon: <Sun className="icon min-w-[20px] min-h-[20px]" />,
            title: "Daily",
            url: "/coach/meals/list-custom/?mode=daily"
          },
          {
            id: 2,
            icon: <CalendarDays className="icon min-w-[20px] min-h-[20px]" />,
            title: "Weekly",
            url: "/coach/meals/list-custom/?mode=weekly"
          },
          {
            id: 3,
            icon: <CalendarRange className="icon min-w-[20px] min-h-[20px]" />,
            title: "Monthly",
            url: "/coach/meals/list-custom/?mode=monthly"
          }
        ]
      },
      {
        id: 3,
        icon: <Hourglass className="icon min-w-[20px] min-h-[20px]" />,
        title: "Routine Meal Plan",
        url: "/coach/meals/list/",
        items: [
          {
            id: 1,
            icon: <ForkKnife className="icon min-w-[20px] min-h-[20px]" />,
            title: "All Plans",
            url: "/coach/meals/list/"
          },
          {
            id: 2,
            icon: <PlusCircle className="icon min-w-[20px] min-h-[20px]" />,
            title: "Add",
            url: "/coach/meals/add-plan"
          }
        ]
      },
      {
        id: 4,
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
  {
    id: 8,
    title: "Workout",
    icon: <PersonStanding className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/workouts",
    items: [
      {
        id: 1,
        icon: <Logs className="icon min-w-[20px] min-h-[20px]" />,
        title: "Add Workouts",
        url: "/coach/workouts/add/",
        items: [
          {
            id: 1,
            icon: <Sun className="icon min-w-[20px] min-h-[20px]" />,
            title: "Daily",
            url: "/coach/workouts/add/daily"
          },
          {
            id: 2,
            icon: <CalendarDays className="icon min-w-[20px] min-h-[20px]" />,
            title: "Weekly",
            url: "/coach/workouts/add/weekly"
          },
          {
            id: 3,
            icon: <CalendarRange className="icon min-w-[20px] min-h-[20px]" />,
            title: "Monthly",
            url: "/coach/workouts/add/monthly"
          }
        ]
      },
      {
        id: 2,
        icon: <ClipboardPlus className="icon min-w-[20px] min-h-[20px]" />,
        title: "View Workouts",
        url: "/coach/workouts/list-custom",
        items: [
          {
            id: 1,
            icon: <Sun className="icon min-w-[20px] min-h-[20px]" />,
            title: "Daily",
            url: "/coach/workouts/list-custom/?mode=daily"
          },
          {
            id: 2,
            icon: <CalendarDays className="icon min-w-[20px] min-h-[20px]" />,
            title: "Weekly",
            url: "/coach/workouts/list-custom/?mode=weekly"
          },
          {
            id: 3,
            icon: <CalendarRange className="icon min-w-[20px] min-h-[20px]" />,
            title: "Monthly",
            url: "/coach/workouts/list-custom/?mode=monthly"
          }
        ]
      },
      {
        id: 3,
        icon: <Hourglass className="icon max-w-[20px] max-h-[20px]" />,
        title: "Routine Workouts Plan",
        url: "/coach/workouts/list/",
        items: [
          {
            id: 1,
            icon: <Dumbbell className="icon max-w-[20px] max-h-[20px]" />,
            title: "All Workouts",
            url: "/coach/workouts/list/"
          },
          {
            id: 2,
            icon: <PlusCircle className="icon max-w-[20px] max-h-[20px]" />,
            title: "Add",
            type: "modal",
            Component: CreateWorkoutModal
          }
        ]
      },
      {
        id: 4,
        icon: <Clock className="max-w-[20px] max-h-[20px]" />,
        title: "Sessions",
        url: "/coach/workouts/sessions",
        items: [
          {
            id: 1,
            icon: <Globe className="max-w-[20px] max-h-[20px]" />,
            title: "All Sessions",
            url: "/coach/workouts/sessions/list"
          },
          {
            id: 2,
            icon: <PlusCircle className="max-w-[20px] max-h-[20px]" />,
            title: "Add Session",
            url: "/coach/workouts/sessions/add"
          },
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Marathon",
    icon: <Footprints className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/marathons"
  },
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
      },
      {
        id: 6,
        icon: <Unlink className="icon min-w-[20px] min-h-[20px]" />,
        title: "Coach Sync",
        url: "/coach/club/coach-sync"
      },
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
      },
      {
        id: 5,
        icon: <CalendarRange className="icon min-w-[20px] min-h-[20px]" />,
        title: "Programs",
        url: "/coach/tools/programs"
      },
      {
        id: 9,
        icon: <Tags className="icon min-w-[20px] min-h-[20px]" />,
        title: "Categories",
        url: "/coach/tools/categories"
      },
      // {
      //   id: 10,
      //   icon: <ListTodo className="icon min-w-[20px] min-h-[20px]" />,
      //   title: "Questionaire",
      //   url: "/coach/tools/questionaire"
      // },
    ]
  },
  {
    id: 12,
    title: "Courses",
    icon: <Library className="min-w-[20px] min-h-[20px]" />,
    url: "/coach/courses",
    items: [
      {
        id: 1,
        title: "Dashboard",
        icon: <LayoutDashboard />,
        url: "/coach/courses/dashboard",
      },
      {
        id: 2,
        title: "Courses",
        icon: <List />,
        url: "/coach/courses/list",
      },
      {
        id: 3,
        title: "Create New",
        icon: <CirclePlus />,
        url: "/coach/courses/create",
      },
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
  // {
  //   id: 3,
  //   title: "About",
  //   icon: <CircleAlert className="min-w-[20px] min-h-[20px]" />,
  //   url: "/coach/about"
  // },
]