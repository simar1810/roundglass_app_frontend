import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addClientCheckupInitialState } from "@/config/state-data/add-client-checkup";
import { addClientCheckupReducer } from "@/config/state-reducers/add-client-checkup";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import CheckupStage1 from "../add-client/CheckupStage1";
import CheckupStage2 from "../add-client/CheckupStage2";
import CheckupStage3 from "../add-client/CheckupStage3";
import ClientCreatedNotify from "../add-client/ClientCreatedNotify";

export default function AddClientWithCheckup({ setModal }) {
  return <Dialog open={true} onOpenChange={() => setModal()}>
    <DialogTrigger />
    <CurrentStateProvider
      state={addClientCheckupInitialState}
      reducer={addClientCheckupReducer}
    >
      <AddClientCheckupContainer />
    </CurrentStateProvider>
  </Dialog>
}

function AddClientCheckupContainer() {
  const { stage } = useCurrentStateContext();
  const Component = selectComponent(stage)

  return <DialogContent className="!max-w-[656px] h-[692px] border-0 p-0 overflow-y-auto">
    <DialogHeader className="p-4 border-b-2 border-[var(--dark-1)]/25">
      <DialogTitle className="text-left text-black text-lg font-semibold">
        Add Client
      </DialogTitle>
      <Component />
    </DialogHeader>
  </DialogContent>
}

function selectComponent(stage) {
  switch (stage) {
    case 1:
      return CheckupStage1;
    case 2:
      return CheckupStage2;
    case 3:
      return CheckupStage3;
    case 4:
      return ClientCreatedNotify;
    default:
      return () => <></>
  }
}