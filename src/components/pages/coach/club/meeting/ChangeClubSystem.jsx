import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import ClubSystemChangeAlert from "./ClubSystemChangeAlert";
import ClubSystemConfirmation from "./ClubSystemConfirmation";
import { alertClubSystemChange } from "@/config/state-reducers/clubsystem";

function selectAlertComponent(stage) {
  switch (stage) {
    case "alert":
      return ClubSystemChangeAlert;
    case "confirmation":
      return ClubSystemConfirmation;
  }
}

export default function ChangeClubSystem({ clubSystem }) {
  const { stage, dispatch } = useCurrentStateContext();
  const Component = selectAlertComponent(stage)

  return <AlertDialog>
    <AlertDialogTrigger
      onClick={() => dispatch(alertClubSystemChange(clubSystem.id))}
    >{clubSystem.title}</AlertDialogTrigger>
    <Component clubSystem={clubSystem} />
  </AlertDialog>
}