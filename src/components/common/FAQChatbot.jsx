"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, ArrowLeft, ChevronRight } from "lucide-react"
import { useAppSelector } from "@/providers/global/hooks"
import useClickOutside from "@/hooks/useClickOutside"
import Link from "next/link"

const faqData = [
  {
    category: "Text",
    questions: [
      {
        id: 1,
        question: "Can I use WellnessZ without a branded app?",
        answer: "Yes, you can use the main WellnessZ app without branding. However, branding adds professionalism and trust for clients."
      },
      {
        id: 2,
        question: "Is my data safe on WellnessZ?",
        answer: "Yes, WellnessZ uses industry-standard encryption and secure cloud storage to keep your data safe."
      },
      {
        id: 3,
        question: "How do I update my profile details?",
        answer: "Go to Portfolio > Edit. Update your name, photo, contact details, and save changes."
      },
      {
        id: 4,
        question: "Can I change my phone number or email later?",
        answer: "Yes, you can change it from your portfolio. For non clearance talk with my manager."
      },
      {
        id: 5,
        question: "What if my client is not receiving app notifications?",
        answer: "Ask them to enable notifications in their phone settings and allow WellnessZ notifications."
      },
      {
        id: 6,
        question: "How do I send broadcast messages to all clients?",
        answer: "Use the Feed tab to post updates visible to all connected clients. For private messages, use the chat feature. You can also send Notification through notification feature in app"
      },
      {
        id: 7,
        question: "Can I delete a client?",
        answer: "Yes. Go to their profile > options > Remove. This action is irreversible."
      },
      {
        id: 8,
        question: "Can I track client weight and inches?",
        answer: "Yes. The progress tracking section allows you to input and monitor client weight, measurements, and photos."
      },
      {
        id: 9,
        question: "How do I assign tasks to clients?",
        answer: "Use the Planner tab to schedule workouts, meals, and reminders directly to your client app."
      },
      {
        id: 10,
        question: "What is the difference between Quick Add and Checkup Add?",
        answer: "Quick Add is for instant entries, while Checkup Add includes health stats and custom notes."
      },
      {
        id: 11,
        question: "What is the client limit for free users?",
        answer: "Free users can manage up to 5 clients. Upgrade to a paid plan for unlimited access."
      },
      {
        id: 12,
        question: "How can I track subscription status?",
        answer: "Visit Settings > Subscription. You’ll see your current plan, validity, and renewal date."
      },
      {
        id: 13,
        question: "Is WellnessZ available on iOS and Android?",
        answer: "Yes. Both the WellnessZ and branded apps are available on Play Store and App Store."
      },
      {
        id: 14,
        question: "How do I access client feedback?",
        answer: "Inside the customer profile, scroll to the follow-up or chat section to view notes and comments."
      },
      {
        id: 15,
        question: "Can I import my existing clients from Excel?",
        answer: "Yes, use the bulk import option available on the web dashboard under the ‘Add Clients’ section."
      },
      {
        id: 16,
        question: "What if my app is crashing or freezing?",
        answer: "Update to the latest version, clear cache, or reinstall. Contact support if it continues."
      },
      {
        id: 17,
        question: "How do I enable dark mode in the app?",
        answer: "Go to Settings > Appearance > Dark Mode to switch themes."
      },
      {
        id: 18,
        question: "How can I change my branded app icon and name?",
        answer: "Request a branding update through support. Charges may apply."
      },
      {
        id: 19,
        question: "Can clients log their own weight and meals?",
        answer: "Yes. The client app allows them to self-log weight, steps, meals, and workouts."
      },
      {
        id: 20,
        question: "What is the WZ Sessions feature?",
        answer: "WZ Sessions allows coaches to enroll clients in live group workouts hosted by WellnessZ instructors."
      },
      {
        id: 21,
        question: "How do I view all workouts assigned to a client?",
        answer: "Open the client profile > Workouts tab > View all assigned plans by date."
      },
      {
        id: 22,
        question: "How to give rewards to clients?",
        answer: "Use the ‘Rewards’ tab to log milestone achievements and assign digital badges or gifts."
      },
      {
        id: 23,
        question: "Can I use multiple accounts on one phone?",
        answer: "No, the app supports only one login session at a time. Use incognito browser on web as a workaround."
      },
      {
        id: 24,
        question: "How can I contact WellnessZ support?",
        answer: "Use the in-app support chat or email support@wellnessz.in for help within 24–48 hours."
      },
      {
        id: 25,
        question: "Can I export my data?",
        answer: "Yes, subscription users can download client records, progress charts, and reports from the web dashboard."
      }
    ]
  },
  {
    category: "Video Solutions",
    questions: [
      {
        id: 26,
        question: "Overview: How WellnessZ Helps Grow Your Business",
        answer: "WellnessZ is an all-in-one system built for wellness coaches to manage clients, automate tasks, and scale their business. From branded apps to lead funnels and live sessions, it provides everything you need to grow your brand. Our value propositions are Customer Management, Customer Experience, Customer Retention & Customer Acquisition.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 27,
        question: "Add Clients or Customers",
        answer: "On the App: Use the ‘Checkup Add’ feature to quickly add clients during consultations. On Web: Use ‘Quick Add’ to fill in client details manually or upload in bulk.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 28,
        question: "Customer Onboarding in App",
        answer: "Clients can download the WellnessZ app or your branded app from Play Store or App Store. Once installed, they can enter the coach invite code or link to connect automatically. Just click on the link again after downloading the app and you are in.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 29,
        question: "Customer Onboarding Without Registration",
        answer: "You can onboard clients via invite links, QR codes —without them needing to manually register or search for your profile. Your Invite Link is “{INVITE LINK}”",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 30,
        question: "Settings, General Controls & Portfolio Overview",
        answer: "Access Settings from the top menu to customize your profile, notifications, and branding. Use the Portfolio section to showcase your client transformations and services.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 31,
        question: "How to Sync Coaches with Your Account",
        answer: "Go to Club >> ‘Coach Sync’ >> share link with coach if the coach is logined the coach sync will be done directly otherwise login click on tools >> workouts >> join meetings and click on connect. Add ID ‘{Invite ID}’ and done",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 32,
        question: "Switching Between WellnessZ Club Systems",
        answer: "Use the system toggle (top-right menu) in Club >> Meetings.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 33,
        question: "Follow-Ups & Report Generation: Customer Profile",
        answer: "Visit the customer profile and scroll to the follow-up section. You can log stats, update notes, and download PDF reports anytime.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 34,
        question: "Using Feed for Client Engagement",
        answer: "Use the Feed tab to post updates, challenges, and educational content. Your clients will see it in their app and can react or comment.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 35,
        question: "Guide: How Clients Use the App",
        answer: "Clients can log meals, follow workouts, join marathons, and chat with their coach. The app is intuitive and supports progress tracking.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 36,
        question: "Marathon Feature: Client View",
        answer: "Clients can view upcoming marathons in the app, join them, log their steps, and compete in leaderboard-based challenges.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 37,
        question: "How Clients Join via Meeting Link",
        answer: "Client can join meeting through either application where notification and things will flash by their own or log to app.wellnessz.in/meetings and get all meetings for him.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 38,
        question: "Workout Following Guide for Clients",
        answer: "Clients can go to the Workout tab to see assigned plans. Each workout includes video demos, reps, and tracking options.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 39,
        question: "Connecting Health Connect with App",
        answer: "Go to Home>> Click on Activity Center >> Connect health connect if not connected. This will sync step data, calories, and activity stats.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 40,
        question: "Create a Personalized Meal Plan",
        answer: "Click on ‘Meal Plans’ > ‘Create New’. Choose template or custom mode. Add meals, descriptions, and assign to clients.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 41,
        question: "Copy, Edit & Assign Meal Plans",
        answer: "Use the three-dot menu on any existing meal plan to duplicate or edit. After changes, select clients to assign it.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 42,
        question: "Create Workout Routine",
        answer: "Click ‘Create Workout’ > Add exercises, sets, reps, rest. Save as template for future use or assign instantly.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 43,
        question: "Assign Workouts to Clients",
        answer: "Go to a client profile > ‘Assign Workout’ > Choose from templates or custom routine. Set schedule and confirm.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 44,
        question: "How to Use Retail Section (Orders + Products)",
        answer: "In the Retail tab, you can manage products, view orders, add pricing, and track client retail purchases.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 45,
        question: "Subscription Purchase Guide",
        answer: "Go to Subscription > Choose a plan and pay via Razorpay. Invoice will be mailed automatically.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 46,
        question: "Connecting Zoom to Club Tool",
        answer: "In Club Settings > Integrations > Connect Zoom. Log in and authorize access for automated session links.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 47,
        question: "Generate Club Zoom Session Link",
        answer: "Go to Link Generator > Choose how to generate Link > You Can create Link using zoom or without zoom too, fill up the details and get live link through out the app",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      },
      {
        id: 48,
        question: "Generate Attendance Roll Numbers & Add Members",
        answer: "Go to All Clients > Click Customer > Generate Roll No. You can download CSV lists or view attendance logs.",
        cta: "Check now",
        link: "https://youtu.be/13fGaXswmO4?si=IARLxKk1VVTDsmjP"
      }
    ]
  },
  // {
  //   category: "Programs & Templates",
  //   questions: [
  //     {
  //       id: 7,
  //       question: "Create a plan template?",
  //       answer:
  //         "Go to Templates → Create New → Choose plan type (workout/meal/hybrid). Build your template with drag-and-drop exercises, set nutrition guidelines, and save for future use with multiple clients.",
  //       cta: "Create template now",
  //     },
  //     {
  //       id: 8,
  //       question: "Duplicate a 4-week program?",
  //       answer:
  //         "Find your existing program in Templates, click the 3-dot menu, select 'Duplicate'. Modify the copy as needed and assign to new clients. This saves hours of recreation time.",
  //       cta: "Browse templates",
  //     },
  //     {
  //       id: 9,
  //       question: "Send push reminders?",
  //       answer:
  //         "Enable automated reminders in Settings → Notifications. Set workout reminders, meal prep alerts, and check-in notifications. Clients receive push notifications on their mobile devices.",
  //       cta: "Set up reminders",
  //     },
  //   ],
  // },
  // {
  //   category: "Billing & Plans",
  //   questions: [
  //     {
  //       id: 10,
  //       question: "What are the prices?",
  //       answer:
  //         "Starter Plan: $29/month (up to 25 clients), Professional: $59/month (up to 100 clients), Enterprise: $99/month (unlimited clients + advanced features). All plans include mobile apps and basic support.",
  //       cta: "View full pricing table",
  //       hasTable: true,
  //     },
  //     {
  //       id: 11,
  //       question: "How do I upgrade?",
  //       answer:
  //         "Go to Settings → Billing → Upgrade Plan. Choose your new plan, confirm payment method, and upgrade instantly. Your existing data and clients transfer automatically to the new plan.",
  //       cta: "Upgrade now",
  //     },
  //     {
  //       id: 12,
  //       question: "Which payment methods?",
  //       answer:
  //         "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. Payments are processed securely through Stripe with 256-bit SSL encryption.",
  //       cta: "Update payment method",
  //     },
  //   ],
  // },
  // {
  //   category: "Troubleshooting",
  //   questions: [
  //     {
  //       id: 13,
  //       question: "App not syncing steps",
  //       answer:
  //         "Check if Health Connect permissions are enabled → Restart the app → Ensure internet connection → If issue persists, try logging out and back in. Most sync issues resolve within 5 minutes.",
  //       cta: "If still stuck → WhatsApp",
  //       isDecisionTree: true,
  //     },
  //     {
  //       id: 14,
  //       question: "Health Connect permission error",
  //       answer:
  //         "Go to phone Settings → Apps → WellnessZ → Permissions → Enable Health Connect. Then open our app → Settings → Sync → Grant all health permissions. Restart both apps after enabling.",
  //       cta: "Contact support if needed",
  //     },
  //     {
  //       id: 15,
  //       question: "Forgot password",
  //       answer:
  //         "Click 'Forgot Password' on login screen → Enter your email → Check inbox for reset link → Create new password → Login with new credentials. Link expires in 24 hours for security.",
  //       cta: "Reset password now",
  //     },
  //   ],
  // },
  // {
  //   category: "Sales & Demo",
  //   questions: [
  //     {
  //       id: 16,
  //       question: "How will WellnessZ grow my business?",
  //       answer:
  //         "WellnessZ helps coaches scale by automating client management, providing professional meal plans, and enabling remote coaching. Our users typically see 40% more client retention and 60% time savings on admin tasks.",
  //       cta: "Book a live demo",
  //     },
  //     {
  //       id: 17,
  //       question: "Book a live demo",
  //       answer:
  //         "Schedule a personalized 30-minute demo with our team. We'll show you how WellnessZ can transform your coaching business and answer all your questions. Available Monday-Friday, 9 AM - 6 PM EST.",
  //       cta: "Schedule demo call",
  //     },
  //   ],
  // },
  // {
  //   category: "Community & Events",
  //   questions: [
  //     {
  //       id: 18,
  //       question: "Join WZ Sessions?",
  //       answer:
  //         "WZ Sessions are weekly group coaching calls for our community. Join live Q&As, masterclasses, and networking with other coaches. Sessions are recorded and available in your member portal.",
  //       cta: "View upcoming sessions",
  //     },
  //     {
  //       id: 19,
  //       question: "Upcoming webinars?",
  //       answer:
  //         "We host monthly webinars on topics like client retention, nutrition coaching, and business growth. Next events: 'Advanced Meal Planning' (Jan 15), 'Client Psychology' (Jan 22), 'Marketing for Coaches' (Jan 29).",
  //       cta: "Register for webinars",
  //       hasCarousel: true,
  //     },
  //   ],
  // },
  // {
  //   category: "Custom Query",
  //   questions: [
  //     {
  //       id: 20,
  //       question: "Talk to a human",
  //       answer:
  //         "Connect with our support team for personalized assistance. We're available via live chat, email, or WhatsApp. Average response time is under 2 hours during business hours.",
  //       cta: "Start WhatsApp chat",
  //       isHandover: true,
  //     },
  //     {
  //       id: 21,
  //       question: "WhatsApp support",
  //       answer:
  //         "Get instant help via WhatsApp! Send us a message and our support team will respond quickly. Perfect for urgent issues or when you prefer mobile messaging over email.",
  //       cta: "Open WhatsApp",
  //       isHandover: true,
  //     },
  //   ],
  // },
]

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState("categories")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const chatbotRef = useRef();
  useClickOutside(chatbotRef, () => setIsOpen(false));

  const coachName = useAppSelector(state => state.coach.data.name)
    ?.split(" ")[0] || "Coach";

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setCurrentView("questions")
  }

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question)
    setCurrentView("answer")
  }

  const handleBack = () => {
    if (currentView === "answer") {
      setCurrentView("questions")
      setSelectedQuestion(null)
    } else if (currentView === "questions") {
      setCurrentView("categories")
      setSelectedCategory(null)
    }
  }

  const renderCategories = () => (
    <div className="space-y-0">
      {faqData.map((category, index) => (
        <div key={category.category}>
          <button
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
            onClick={() => handleCategorySelect(category)}
          >
            <div>
              <span className="text-gray-900 font-medium">{category.category}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>
          {index < faqData.length - 1 && <div className="border-b border-[var(--dark-1)]/10" />}
        </div>
      ))}
    </div>
  )

  const renderQuestions = () => (
    <div className="space-y-0">
      <div className="p-4 border-b border-[var(--dark-1)]/10 bg-gray-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-gray-900">{selectedCategory.category}</span>
        </div>
      </div>

      {selectedCategory.questions.map((question, index) => (
        <div key={question.id}>
          <button
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
            onClick={() => handleQuestionSelect(question)}
          >
            <span className="text-gray-900">{question.question}</span>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>
          {index < selectedCategory.questions.length - 1 && <div className="border-b border-[var(--dark-1)]/10" />}
        </div>
      ))}
    </div>
  )

  const renderAnswer = () => (
    <div>
      <div className="flex items-center gap-3 mb-6 p-4 border-b border-[var(--dark-1)]/10">
        <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-gray-900">{selectedQuestion.question}</span>
      </div>

      <div className="space-y-4 p-4 pt-0">
        <div className="bg-gray-50 rounded-lg">
          <p className="text-gray-800 leading-relaxed">{selectedQuestion.answer}</p>
        </div>

        {selectedQuestion.cta && (
          <Link target="_blank" href={selectedQuestion.link} className="w-full bg-green-500 hover:bg-green-600 text-center text-[14px] text-white block py-2 px-4 rounded-[8px]">{selectedQuestion.cta}</Link>
        )}

        {selectedQuestion.hasScreenshot && (
          <div className="text-xs text-gray-500 text-center">📸 Screenshot available in full article</div>
        )}

        {selectedQuestion.hasTable && (
          <div className="text-xs text-gray-500 text-center">📊 View complete pricing table</div>
        )}

        {selectedQuestion.hasCarousel && (
          <div className="text-xs text-gray-500 text-center">🎠 Browse all upcoming events</div>
        )}
        <Button variant="outline" onClick={handleBack} className="w-full mt-0">
          Back to {currentView === "answer" ? "questions" : "categories"}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <Button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-green-500 hover:bg-green-600"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chatbot Modal - No backdrop */}
      {isOpen && (<>
        <div className="fixed h-screen w-screen bg-[var(--dark-1)]/20 top-0 left-0 z-[110]" />
        <div ref={chatbotRef} className="h-[80vh] flex flex-col fixed bottom-24 right-6 z-[110] overflow-y-auto border-1 border-[#DEDEDE] rounded-xl">
          <Card className="w-96 !bg-[var(--comp-2)] grow pt-0 shadow-2xl border-0 overflow-x-hidden gap-0">
            {/* Green Header */}
            <div className="bg-green-500 text-white p-6 relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white hover:bg-green-600"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="pr-20">
                <h2 className="text-2xl font-bold mb-2">
                  Hi {coachName}! <span className="text-2xl">👋</span>
                </h2>
                <p className="text-green-100 text-lg">How can we help you?</p>
              </div>
            </div>

            {/* Content Area */}
            <CardContent className="!bg-[var(--comp-2)] p-0 bg-white">
              <ScrollArea className="grow">
                {currentView === "categories" && renderCategories()}
                {currentView === "questions" && renderQuestions()}
                {currentView === "answer" && renderAnswer()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </>)}
    </>
  )
}
