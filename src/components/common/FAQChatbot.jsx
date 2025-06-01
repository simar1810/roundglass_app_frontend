"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, ArrowLeft, ChevronRight } from "lucide-react"
import useClickOutside from "@/hooks/useClickOutside"
import Link from "next/link"
import useSWR from "swr"
import { getChatBotData } from "@/lib/fetchers/app"
import Loader from "./Loader"
import ContentError from "./ContentError"

export default function FAQChatbot() {
  const { isLoading, error, data } = useSWR("/chatbot", getChatBotData)

  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState("categories")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [searchQuery, setSearchQuery] = useState("");

  const chatbotRef = useRef();
  useClickOutside(chatbotRef, () => setIsOpen(false));

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
    } else if (["search-answer", "questions"].includes(currentView)) {
      setCurrentView("categories")
      setSelectedCategory(null)
    }
  }

  const categories = {};
  for (const item of data?.data || []) {
    const key = item.category;
    if (!categories[key]) {
      categories[key] = [];
    }
    categories[key].push(item);
  }
  const faqData = []
  for (const field in categories) {
    faqData.push(
      {
        category: field,
        questions: categories[field]
      }
    )
  }

  const RenderCategories = () => (
    <div key="categories" className="space-y-0">
      {faqData.map((category, index) => (
        <div key={index}>
          <button
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
            onClick={() => handleCategorySelect(category)}
          >
            <div>
              <span className="text-gray-900 font-medium">{category.category}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>
          {index < faqData.length - 1 && <div className="border-b border-gray-900/10" />}
        </div>
      ))}
    </div>
  )

  const RenderQuestions = () => (
    <div key="questions" className="space-y-0">
      <div className="p-4 border-b border-gray-900/10 bg-gray-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-gray-900">{selectedCategory?.category}</span>
        </div>
      </div>

      {(selectedCategory?.questions || []).map((question, index) => (
        <div key={index}>
          <button
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
            onClick={() => handleQuestionSelect(question)}
          >
            <span className="text-gray-900">{question.question}</span>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>
          {index < selectedCategory.questions.length - 1 && <div className="border-b border-gray-900/10" />}
        </div>
      ))}
    </div>
  )

  const RenderAnswer = () => (
    <div key="answers">
      <div className="flex items-center gap-3 mb-6 p-4 border-b border-gray-900/10">
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
          <Link target="_blank" href={selectedQuestion.link} className="w-full !bg-green-500 hover:!bg-green-600 text-center text-[14px] !text-white block py-2 px-4 rounded-[8px]">{selectedQuestion.cta}</Link>
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
          Back to {["answer", "search-answer"].includes(currentView) ? "questions" : "categories"}
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
        <div className="fixed h-screen w-screen bg-gray-900/20 top-0 left-0 z-[110]" />
        <div ref={chatbotRef} className="h-[80vh] flex flex-col fixed bottom-24 right-6 z-[110] overflow-y-auto border-1 border-[#DEDEDE] rounded-xl">
          {isLoading && <div className="w-96 h-full !bg-gray-100 flex items-center justify-center">
            <Loader />
          </div>}
          {!isLoading && !Boolean(error) && <Card className="w-96 !bg-gray-100 grow pt-0 shadow-2xl border-0 overflow-x-hidden gap-0">
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
                <h2 className="text-2xl font-bold !mb-0 leading-[1]">
                  Hello <span className="text-2xl">👋</span>
                </h2>
                <p className="text-green-100 text-lg">How can we help you?</p>
              </div>
            </div>

            {/* Content Area */}
            <CardContent className="!bg-gray-100 p-0 bg-white">
              <ScrollArea className="grow">
                <SearchResults
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  data={faqData}
                  handleQuestionSelect={handleQuestionSelect}
                />
                {currentView === "categories" && <RenderCategories />}
                {currentView === "questions" && <RenderQuestions />}
                {["answer", "search-answer"].includes(currentView) && <RenderAnswer />}
              </ScrollArea>
            </CardContent>
          </Card>}
          {error && data.status_code !== 200 && <div className="w-96 h-full !bg-gray-100 flex items-center justify-center">
            <ContentError title={error || data.message || "Something went wrong"} className="w-full h-full border-0" />
          </div>}
        </div>
      </>)
      }
    </>
  )
}


function SearchResults({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  data,
  handleQuestionSelect
}) {
  function onChange(value) {
    if (searchQuery.length !== 0 && value.length > 0) {
      setCurrentView("search")
    }
    if (value.length === 0) {
      setCurrentView("categories")
    }
    setSearchQuery(value.toLowerCase())
  }
  return <div className="px-4 py-2">
    <input
      value={searchQuery}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-gray-200 px-4 py-2 rounded-[8px] focus:outline-none"
      placeholder="Search for results.."
    />
    {currentView === "search" && <>
      <CategorySearch
        searchQuery={searchQuery}
        data={data}
      />
      <QuestionSearch
        searchQuery={searchQuery}
        data={data}
        setCurrentView={setCurrentView}
        handleQuestionSelect={handleQuestionSelect}
      />
    </>}
  </div>
}

function CategorySearch({
  searchQuery,
  data
}) {
  const categories = data.filter(category => category.category.toLowerCase().includes(searchQuery))
  return <div></div>
}

function QuestionSearch({
  setCurrentView,
  handleQuestionSelect,
  searchQuery,
  data
}) {
  const questions = data
    .flatMap(category => category.questions)
    .filter(question => question.question.toLowerCase().includes(searchQuery))
  if (questions.length <= 0) return <></>
  return <div>
    <div className="flex items-center justify-between">
      <h5>Questions</h5>
      <p className="!text-[12px]">{questions.length} results</p>
    </div>
    {questions.map((question, index) => (
      <div key={index}>
        <button
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
          onClick={() => {
            handleQuestionSelect(question)
            setCurrentView("search-answer")
          }}
        >
          <span className="text-gray-900">{question.question}</span>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
        </button>
        {index < questions.length - 1 && <div className="border-b border-gray-900/10" />}
      </div>
    ))}
  </div>
}