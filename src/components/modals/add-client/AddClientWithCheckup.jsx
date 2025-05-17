import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addClientCheckupReducer, init } from "@/config/state-reducers/add-client-checkup";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import CheckupStage1 from "../add-client/CheckupStage1";
import CheckupStage2 from "../add-client/CheckupStage2";
import CheckupStage3 from "../add-client/CheckupStage3";
import ClientCreatedNotify from "../add-client/ClientCreatedNotify";

export default function AddClientWithCheckup({ children, type, data, setModal }) {
  return <Dialog open={true} onOpenChange={() => setModal()}>
    {children}
    {!children && <DialogTrigger />}
    <CurrentStateProvider
      state={init(type, data)}
      reducer={addClientCheckupReducer}
    >
      <AddClientCheckupContainer />
    </CurrentStateProvider>
  </Dialog>
}

function AddClientCheckupContainer() {
  const { stage } = useCurrentStateContext();
  const Component = selectComponent(stage)

  return <DialogContent className="!max-w-[800px] h-[692px] border-0 p-0 overflow-y-auto">
    <DialogHeader className="p-0 sticky top-0 border-b-2 border-[var(--dark-1)]/25 z-[100]">
      <DialogTitle className="bg-white p-4 text-left text-black text-lg font-semibold ">
        Client Details
      </DialogTitle>
    </DialogHeader>
    <div className="px-4">
      <Component />
    </div>
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