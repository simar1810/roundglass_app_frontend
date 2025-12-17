import ContentLoader from "@/components/common/ContentLoader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { addClientCheckupReducer, init } from "@/config/state-reducers/add-client-checkup";
import { fetchData } from "@/lib/api";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CheckupStage1 from "../add-client/CheckupStage1";
import CheckupStage2 from "../add-client/CheckupStage2";
import CheckupStage3 from "../add-client/CheckupStage3";
import ClientCreatedNotify from "../add-client/ClientCreatedNotify";
import OnBoardingQuestionaire from "./OnBoardingQuestionaire";

export default function AddClientWithCheckup({ children, type, data, setModal }) {
  const [dataGenerated, setDataGenerated] = useState(false);
  const [initialState, setInitialState] = useState(() => data)
  const [clientDetails, setClientDetails] = useState(null);

  useEffect(function () {
    if (!dataGenerated) {
      // Set client details from initial data first (for pending clients)
      if (type === "add-details" && data) {
        setClientDetails({
          mobileNumber: data.mobileNumber
        });
      }
      
      if (Boolean(data?._id)) {
        ; (async function () {
          try {
            const response = await fetchData(`app/clientProfile?id=${data._id}`);
            if (response.status_code !== 200) throw new Error(response.message);
            
            // Update client details with API response data, but keep initial data as fallback
            setClientDetails(prev => ({
              mobileNumber: response.data.mobileNumber || prev?.mobileNumber || data.mobileNumber
            }));
            
            setInitialState(prev => ({
              ...prev,
              mobileNumber: response.data.mobileNumber,
              clientId: response.data.clientId,
              dob: response.data.dob
            }))
            setDataGenerated(true);
          } catch (error) {
            toast.error(error.message || "Please try again later!");
            setDataGenerated(true);
          }
        })();
      } else {
        setDataGenerated(true);
      }
    }
  }, []);

  if (!dataGenerated) return <Dialog open={true} onOpenChange={() => setModal()}>
    <DialogContent className="!max-w-[800px] max-h-[85vh] h-full border-0 p-0 overflow-y-auto block">
      <DialogTitle />
      <ContentLoader />
    </DialogContent>
  </Dialog>

  return <Dialog open={true} onOpenChange={() => setModal()}>
    {children}
    {!children && <DialogTrigger />}
    <CurrentStateProvider
      state={init(type, initialState)}
      reducer={addClientCheckupReducer}
    >
      <AddClientCheckupContainer clientDetails={clientDetails} type={type} clientName={data?.name} />
    </CurrentStateProvider>
  </Dialog>
}

function AddClientCheckupContainer({ clientDetails, type, clientName }) {
  const { stage, name } = useCurrentStateContext();
  const Component = selectComponent(stage);

  const displayName = name || clientName;
  const showClientDetails = type === "add-details" && clientDetails && clientDetails.mobileNumber;

  return <DialogContent className="w-[600px] md:!max-w-[800px] max-h-[85vh] h-full border-0 p-0 overflow-y-auto block">
    <DialogHeader className="!p-0 !h-auto border-b-2 border-[var(--dark-1)]/25 z-[100]">
      <DialogTitle className="bg-white p-4 text-left text-black text-lg font-semibold">
        Client Details
      </DialogTitle>
      {showClientDetails && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            {displayName && (
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium mb-1.5">Client Name</p>
                <p className="text-base font-semibold text-gray-900">{displayName}</p>
              </div>
            )}
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gray-200 flex-shrink-0">
                <Phone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1.5">Mobile Number</p>
                <p className="text-base font-semibold text-gray-900">{clientDetails.mobileNumber}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogHeader>
    <div className="grow px-4">
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
      return OnBoardingQuestionaire
    case 5:
      return ClientCreatedNotify;
    default:
      return () => <></>
  }
}