"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, ArrowLeft, ChevronRight } from "lucide-react"
import { useAppSelector } from "@/providers/global/hooks"
import useClickOutside from "@/hooks/useClickOutside"

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        id: 1,
        question: "How do I sign-up as a coach?",
        answer:
          "To sign up as a coach, visit our registration page and complete the 3-step process: 1) Enter your basic information, 2) Verify your credentials, 3) Set up your profile. Watch our 90-second video tutorial for a complete walkthrough.",
        cta: "See 90-sec video",
      },
      {
        id: 2,
        question: "How to add clients?",
        answer:
          "Navigate to your dashboard and click 'Add Client'. Fill in their details including name, email, contact information, and fitness goals. You can also send them an invitation link to complete their own profile.",
        cta: "Add your first client",
      },
      {
        id: 3,
        question: "Can I import clients from Excel?",
        answer:
          "Yes! Go to Clients → Import → Upload Excel file. Use our template format with columns: Name, Email, Phone, Goals. The system will validate and import up to 100 clients at once.",
        cta: "Download Excel template",
      },
    ],
  },
  {
    category: "Client Management",
    questions: [
      {
        id: 4,
        question: "Assign meal plan / change workout?",
        answer:
          "Go to the client's profile, select 'Plans' tab, then choose 'Assign Meal Plan' or 'Update Workout'. You can select from templates or create custom plans. Changes sync instantly to their mobile app.",
        cta: "Open Clients → Plans",
        hasScreenshot: true,
      },
      {
        id: 5,
        question: "Schedule a club-meeting Zoom link?",
        answer:
          "In the 'Meetings' section, click 'Schedule Group Session'. Set date, time, and invite clients. The system automatically generates a Zoom link and sends calendar invites to all participants.",
        cta: "Schedule meeting now",
      },
      {
        id: 6,
        question: "Track a client's progress?",
        answer:
          "Access the Progress Dashboard from any client profile. View weight trends, workout completion rates, meal adherence, and photo comparisons. Set up automated progress reports to be sent weekly.",
        cta: "View progress demo",
      },
    ],
  },
  {
    category: "Programs & Templates",
    questions: [
      {
        id: 7,
        question: "Create a plan template?",
        answer:
          "Go to Templates → Create New → Choose plan type (workout/meal/hybrid). Build your template with drag-and-drop exercises, set nutrition guidelines, and save for future use with multiple clients.",
        cta: "Create template now",
      },
      {
        id: 8,
        question: "Duplicate a 4-week program?",
        answer:
          "Find your existing program in Templates, click the 3-dot menu, select 'Duplicate'. Modify the copy as needed and assign to new clients. This saves hours of recreation time.",
        cta: "Browse templates",
      },
      {
        id: 9,
        question: "Send push reminders?",
        answer:
          "Enable automated reminders in Settings → Notifications. Set workout reminders, meal prep alerts, and check-in notifications. Clients receive push notifications on their mobile devices.",
        cta: "Set up reminders",
      },
    ],
  },
  {
    category: "Billing & Plans",
    questions: [
      {
        id: 10,
        question: "What are the prices?",
        answer:
          "Starter Plan: $29/month (up to 25 clients), Professional: $59/month (up to 100 clients), Enterprise: $99/month (unlimited clients + advanced features). All plans include mobile apps and basic support.",
        cta: "View full pricing table",
        hasTable: true,
      },
      {
        id: 11,
        question: "How do I upgrade?",
        answer:
          "Go to Settings → Billing → Upgrade Plan. Choose your new plan, confirm payment method, and upgrade instantly. Your existing data and clients transfer automatically to the new plan.",
        cta: "Upgrade now",
      },
      {
        id: 12,
        question: "Which payment methods?",
        answer:
          "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. Payments are processed securely through Stripe with 256-bit SSL encryption.",
        cta: "Update payment method",
      },
    ],
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        id: 13,
        question: "App not syncing steps",
        answer:
          "Check if Health Connect permissions are enabled → Restart the app → Ensure internet connection → If issue persists, try logging out and back in. Most sync issues resolve within 5 minutes.",
        cta: "If still stuck → WhatsApp",
        isDecisionTree: true,
      },
      {
        id: 14,
        question: "Health Connect permission error",
        answer:
          "Go to phone Settings → Apps → WellnessZ → Permissions → Enable Health Connect. Then open our app → Settings → Sync → Grant all health permissions. Restart both apps after enabling.",
        cta: "Contact support if needed",
      },
      {
        id: 15,
        question: "Forgot password",
        answer:
          "Click 'Forgot Password' on login screen → Enter your email → Check inbox for reset link → Create new password → Login with new credentials. Link expires in 24 hours for security.",
        cta: "Reset password now",
      },
    ],
  },
  {
    category: "Sales & Demo",
    questions: [
      {
        id: 16,
        question: "How will WellnessZ grow my business?",
        answer:
          "WellnessZ helps coaches scale by automating client management, providing professional meal plans, and enabling remote coaching. Our users typically see 40% more client retention and 60% time savings on admin tasks.",
        cta: "Book a live demo",
      },
      {
        id: 17,
        question: "Book a live demo",
        answer:
          "Schedule a personalized 30-minute demo with our team. We'll show you how WellnessZ can transform your coaching business and answer all your questions. Available Monday-Friday, 9 AM - 6 PM EST.",
        cta: "Schedule demo call",
      },
    ],
  },
  {
    category: "Community & Events",
    questions: [
      {
        id: 18,
        question: "Join WZ Sessions?",
        answer:
          "WZ Sessions are weekly group coaching calls for our community. Join live Q&As, masterclasses, and networking with other coaches. Sessions are recorded and available in your member portal.",
        cta: "View upcoming sessions",
      },
      {
        id: 19,
        question: "Upcoming webinars?",
        answer:
          "We host monthly webinars on topics like client retention, nutrition coaching, and business growth. Next events: 'Advanced Meal Planning' (Jan 15), 'Client Psychology' (Jan 22), 'Marketing for Coaches' (Jan 29).",
        cta: "Register for webinars",
        hasCarousel: true,
      },
    ],
  },
  {
    category: "Custom Query",
    questions: [
      {
        id: 20,
        question: "Talk to a human",
        answer:
          "Connect with our support team for personalized assistance. We're available via live chat, email, or WhatsApp. Average response time is under 2 hours during business hours.",
        cta: "Start WhatsApp chat",
        isHandover: true,
      },
      {
        id: 21,
        question: "WhatsApp support",
        answer:
          "Get instant help via WhatsApp! Send us a message and our support team will respond quickly. Perfect for urgent issues or when you prefer mobile messaging over email.",
        cta: "Open WhatsApp",
        isHandover: true,
      },
    ],
  },
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
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white">{selectedQuestion.cta}</Button>
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
