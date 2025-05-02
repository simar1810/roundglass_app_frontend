import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { clubSystemInitialState, clubSystemData } from "@/config/state-data/clubsystem";
import { clubSystemReducer } from "@/config/state-reducers/clubsystem";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import ChangeClubSystem from "./ChangeClubSystem";

export default function ClubSystemOptions() {
  const curentClubSystem = useAppSelector(state => state.coach.data?.clubSystem);

  return <CurrentStateProvider
    state={clubSystemInitialState}
    reducer={clubSystemReducer}
  >
    <RadioGroup value={curentClubSystem} className="flex items-center gap-4">
      {clubSystemData.map(clubSystem => <div key={clubSystem.id} className="flex items-center space-x-2">
        <RadioGroupItem
          value={clubSystem.id}
          id={clubSystem.id}
          className="w-[20px] h-[20px] relative after:absolute after:w-[28px] after:h-[28px] after:top-[-5px] after:left-[-5px] data-[state=checked]:after:border-2 after:rounded-full after:border-[var(--accent-1)] data-[state=checked]:border-[var(--accent-1)] data-[state=checked]:bg-[var(--accent-1)]"
        />
        <Label htmlFor={clubSystem.id}>
          <ChangeClubSystem clubSystem={clubSystem} />
        </Label>
      </div>)}
    </RadioGroup>
  </CurrentStateProvider>
}