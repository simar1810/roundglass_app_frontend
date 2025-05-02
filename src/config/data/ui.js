import { FaFacebookSquare, FaLinkedin, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { MdContactSupport } from "react-icons/md";
import { FaSquareInstagram } from "react-icons/fa6";

export const dashboardCards = {
  app: [
    { id: 1, title: "Total Clients", name: "clients", icon: "/svgs/users-icon.svg" },
    { id: 2, title: "Active Members", name: "members", icon: "/svgs/person.svg" },
    { id: 3, title: "Meals Plans", name: "meals", icon: "/svgs/cutlery.svg" },
    { id: 4, title: "Orders", name: "orders", icon: "/svgs/checklist.svg" },
  ],
  club: [
    { id: 1, title: "Meetings", name: "", icon: "/svgs/checklist.svg" }
  ]
};

export const coachPortfolioFields = [
  { id: 1, title: "Email ID", name: "email" },
  { id: 2, title: "Contact No.", name: "mobileNumber" },
  { id: 3, title: "Joined", name: "joiningDate" },
  { id: 4, title: "Coach ID", name: "coachId" }
]

export const coachPortfolioSocialLinks = [
  { id: 1, social: "Facebook", name: "facebookLink", icon: <FaFacebookSquare className="min-w-[24px] min-h-[24px] text-blue-400" /> },
  { id: 2, social: "Instagram", name: "instagramLink", icon: <FaSquareInstagram className="min-w-[24px] min-h-[24px] text-pink-500" /> },
  { id: 3, social: "LinkedIn", name: "linkedinLink", icon: <FaLinkedin className="min-w-[24px] min-h-[24px] text-blue-300" /> },
  { id: 4, social: "WhatsApp", name: "whatsappNumber", icon: <FaWhatsapp className="min-w-[24px] min-h-[24px] text-green-600" /> },
  { id: 5, social: "Youtube", name: "youtubeLink", icon: <FaYoutube className="min-w-[24px] min-h-[24px] text-[var(--accent-2)]" /> },
  { id: 6, social: "Support", name: "supportNumber", icon: <MdContactSupport className="min-w-[24px] min-h-[24px]" /> },
]

export const coachDetailsFields = [
  { id: 1, label: "Name", name: "name" },
  { id: 2, label: "Mobile No.", name: "mobileNumber" },
  { id: 3, label: "Email ID", name: "email" },
  { id: 4, label: "No. of Clients", name: "expectedNoOfClients" },
]

export const clientPortfolioFields = [
  { id: 1, title: "Email ID", name: "email" },
  { id: 2, title: "Contact No.", name: "mobileNumber" },
  { id: 3, title: "Joined", name: "joiningDate" },
  { id: 4, title: "Client ID", name: "clientId" },
  { id: 5, title: "DOB", name: "dob" },
  { id: 6, title: "Age", name: "age" },
  { id: 7, title: "Weight Lost Till Date", name: "age" },
]

export const clientDetailsFields = [
  { id: 1, label: "Name", name: "name" },
  { id: 2, label: "Mobile No.", name: "mobileNumber", type: "number" },
  { id: 3, label: "Email", name: "email", type: "email" },
  { id: 4, label: "DOB", name: "dob", type: "date", format: "dd-mm-yyyy" },
  { id: 5, label: "Age", name: "age", type: "number" },
  {
    id: 6, label: "Gender", name: "gender", type: 4,
    options: [
      { id: 1, name: "Male", value: "Male" },
      { id: 2, name: "Female", value: "Female" },
    ]
  },
  { id: 7, label: "Weight", name: "weight", type: 3 },
  { id: 8, label: "Height", name: "height", type: 2 },
]

export const linkGeneratorFields = [
  { id: 1, label: "Meeting Topic", inputtype: 1, placeholder: "Enter Topic", name: "topics" },
  {
    id: 2, label: "Meeting Type", inputtype: 2, name: "meetingType", options: [
      { id: 1, title: "Quick", value: "quick" },
      { id: 2, title: "Scheduled", value: "scheduled" },
      { id: 3, title: "Reoccurring", value: "reocurr" },
      { id: 4, title: "Event", value: "event" }
    ]
  },
  { id: 3, label: "Date", type: "date", inputtype: 1, name: "date" },
  { id: 4, label: "Time", type: "time", inputtype: 1, name: "time" },
  { id: 5, label: "Repeat", inputtype: 4, name: "reOcurred" },
  { id: 6, label: "Meeting Description", inputtype: 3, placeholder: "Enter Description", name: "description" },
  { id: 7, label: "Meeting Duration", type: "number", inputtype: 1, placeholder: "Meeting Duration", name: "duration" },
  { id: 8, label: "Enter required Volume Points", type: "number", inputtype: 1, placeholder: "Enter Volume Points", name: "eventVolumePointAmount" },
];

export const quickAddClientFormFields = [
  { id: 1, label: "Client Name", name: "name", placeholder: "Enter Name" },
  { id: 2, label: "Mobile Number", name: "mobileNumber", placeholder: " Mobile number" }
]