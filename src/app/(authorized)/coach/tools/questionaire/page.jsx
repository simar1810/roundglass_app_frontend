"use client";
import ContentError from "@/components/common/ContentError";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { questionaireInitialState } from "@/config/state-data/questionaire";
import questionaireReducer, { addNewQuestionToSection, newSection, removeQuestion, removeSection, saveSection } from "@/config/state-reducers/questionaire";
import { cn } from "@/lib/utils";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Minus, Pen, Plus } from "lucide-react";
import { useState } from "react";

export default function Page() {
  return <div className="content-container content-height-screen">
    <CurrentStateProvider
      state={questionaireInitialState}
      reducer={questionaireReducer}
    >
      <QuestionaireContainer />
    </CurrentStateProvider>
  </div>
}

function QuestionaireContainer() {
  const { sections } = useCurrentStateContext();
  if (Object.keys(sections).length === 0) return <div>
    <PageHeader />
    <ContentError
      title="Please add a section!"
      className="font-bold bg-[var(--comp-2)]"
    />
  </div>

  return <div>
    <PageHeader />
    <SectionList />
  </div>
}

function PageHeader() {
  const { dispatch } = useCurrentStateContext();
  return <div className="flex items-center justify-between">
    <h4>Onboarding Questions</h4>
    <Button onClick={() => dispatch(newSection())} variant="wz">
      <Plus strokeWidth={3} />
      Add New
    </Button>
  </div>
}

function SectionList() {
  const { sections } = useCurrentStateContext();
  return <div className="mt-10 grid grid-cols-2 gap-4">
    {Object.keys(sections).map(section => <SectionDetails
      key={section}
      sectionKey={section}
    />)}
  </div>
}

function SectionDetails({ sectionKey }) {
  const { sections, dispatch } = useCurrentStateContext();
  const { name, questions } = sections[sectionKey];
  return <Collapsible>
    <div className="bg-[var(--comp-2)] border-1 pr-2 flex items-center justify-between gap-4">
      <CollapsibleTrigger className={cn("text-left grow px-4 py-3",)}>
        <h5>{name}</h5>
      </CollapsibleTrigger>
      <UpdateSectionModal sectionKey={sectionKey} />
      <Minus
        className="w-[18px] h-[18px] bg-[var(--accent-2)] text-white p-[2px] rounded-full cursor-pointer"
        onClick={() => dispatch(removeSection(sectionKey))}
      />
    </div>
    <CollapsibleContent className="px-4 py-3 border-1 bg-[var(--comp-2)] rounded-b-[8px]">
      {questions.map((question, index) => <QuestionDetailsModal
        key={index}
        sectionKey={sectionKey}
        question={question}
        index={index}
      />)}
      <Button
        size="sm"
        variant="wz"
        className="mt-4 mx-auto block"
        onClick={() => dispatch(addNewQuestionToSection(sectionKey))}
      >Add Question</Button>
    </CollapsibleContent>
  </Collapsible>
}

function QuestionDetailsModal({ sectionKey, question, index }) {
  const { dispatch } = useCurrentStateContext();
  return <Dialog>
    <div className="bg-white flex items-center justify-between px-4 py-2 border-1 mb-2">
      <DialogTrigger className="grow flex items-center justify-between">
        <p>{question.name}</p>
      </DialogTrigger>
      <Minus
        className="w-[18px] h-[18px] bg-[var(--accent-2)] text-white p-[2px] rounded-full cursor-pointer"
        onClick={() => dispatch(removeQuestion({ sectionKey, index }))}
      />
    </div>
    <DialogContent className="p-0 max-w-[400px] w-full">
      <DialogTitle className="p-4 border-b-1">
        {question.name}
      </DialogTitle>
      <div className="p-4"></div>
    </DialogContent>
  </Dialog>
}

function UpdateSectionModal({ sectionKey }) {
  const { sections, dispatch } = useCurrentStateContext();
  const { name, questions } = sections[sectionKey];
  const [payload, setPayload] = useState({ name, questions });
  return <Dialog>
    <DialogTrigger asChild className="ml-auto">
      <Pen className="w-[18px] h-[18px] cursor-pointer" />
    </DialogTrigger>
    <DialogContent className="p-0 max-w-[400px] w-full gap-0">
      <DialogTitle className="p-4 border-b-1">
        {name}
      </DialogTitle>
      <div className="p-4">
        <FormControl
          value={payload.name}
          onChange={e => setPayload(prev => ({ ...prev, name: e.target.value }))}
          label="Name"
        />
        <div className=""></div>
        <Button
          variant="wz"
          size="sm"
          className="block mt-4 mx-auto"
          onClick={() => dispatch(saveSection({ sectionKey, values: payload }))}
        >Save</Button>
      </div>
    </DialogContent>
  </Dialog>
}