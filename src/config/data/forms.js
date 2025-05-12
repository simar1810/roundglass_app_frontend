import { format, parse } from "date-fns";

export const meetingEditFormControls = [
  {
    id: 1,
    label: "Base Link",
    placeholder: "Please Enter Base Link",
    name: "baseLink",
    getvalue: (obj) => obj.baseLink
  },
  {
    id: 2,
    label: "Scheduled Date",
    placeholder: "Scheduled Date",
    type: "date",
    name: "date",
    getvalue: (obj) => obj.schedulueDate ? format(parse(obj.schedulueDate, 'dd-MM-yyyy HH:mm:ss', new Date()), 'yyyy-MM-dd') : ""
  },
  {
    id: 3,
    label: "Time",
    placeholder: "Scheduled Time",
    type: "time",
    name: "time",
    getvalue: (obj) => obj.schedulueDate ? format(parse(obj.schedulueDate, 'dd-MM-yyyy HH:mm:ss', new Date()), 'HH:mm') : ""
  },
]

export const meetingEditSelectControls = [
  {
    id: 1,
    label: "Meeting Type",
    options: [
      { id: 1, value: "quick", name: "Quick" },
      { id: 2, value: "scheduled", name: "Scheduled" },
      { id: 3, value: "reocurr", name: "Reoccur" },
      { id: 4, value: "event", name: "Event" },
    ],
    name: "meetingType"
  },
  {
    id: 2,
    label: "Club Type",
    options: [
      { id: 1, value: "training", name: "Training" },
      { id: 2, value: "morning", name: "Morning" },
      { id: 3, value: "evening", name: "Evening" },
      { id: 4, value: "others", name: "Others" },
    ],
    name: "clubType"
  },
]

export const reviewVPFormControls = [
  {
    id: 1,
    label: "Roll No",
    placeholder: "Enter Roll No",
    type: "text",
    name: "rollno"
  },
  {
    id: 2,
    label: "Date",
    placeholder: "Enter Date",
    type: "date",
    name: "date"
  },
  {
    id: 3,
    label: "Points",
    placeholder: "Enter Requested Points",
    type: "number",
    name: "points"
  },
]

export const requestSubscriptionFormControls = [
  {
    id: 1,
    label: "Roll No",
    placeholder: "Enter Roll No",
    type: "text",
    name: "rollno"
  },
  {
    id: 2,
    label: "Date",
    placeholder: "Enter Date",
    type: "date",
    name: "date"
  },
  {
    id: 3,
    label: "Subscription Amount",
    placeholder: "Enter Amount",
    type: "number",
    name: "amount"
  },
]