import { FaFacebookSquare, FaLinkedin, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { MdContactSupport } from "react-icons/md";
import { FaSquareInstagram } from "react-icons/fa6";

export const dashboardCards = {
  app: [
    { id: 1, title: "Total Clients", name: "clients", icon: "/svgs/users-icon.svg" },
    { id: 2, title: "Active Members", name: "members", icon: "/svgs/person.svg" },
    { id: 3, title: "Plans", name: "plans", icon: "/svgs/cutlery.svg" },
    { id: 4, title: "Orders", name: "orders", icon: "/svgs/checklist.svg" },
  ],
  club: [
    { id: 1, title: "Meetings", name: "", icon: "/svgs/checklist.svg", isSubscribed: true }
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