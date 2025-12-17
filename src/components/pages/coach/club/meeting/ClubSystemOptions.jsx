import { clubSystemInitialState, clubSystemData } from "@/config/state-data/clubsystem";
import { clubSystemReducer } from "@/config/state-reducers/clubsystem";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import ChangeClubSystem from "./ChangeClubSystem";
import { useMemo } from "react";

function getClubSystemOptions(organisation) {
  if (organisation.toLowerCase() !== "herbalife") return clubSystemData
    .filter(item => item.id !== 2)
  return clubSystemData
}

export default function ClubSystemOptions() {
  const { clubSystem: curentClubSystem, organisation } = useAppSelector(state => state.coach.data);
  const options = useMemo(() => getClubSystemOptions(organisation), [])

  return <CurrentStateProvider
    state={clubSystemInitialState}
    reducer={clubSystemReducer}
  >
    <div value={curentClubSystem} className="flex items-center gap-8">
      {options.map(clubSystem => <div key={clubSystem.id} className="flex items-center space-x-2">
        <ChangeClubSystem curentClubSystem={curentClubSystem} clubSystem={clubSystem} />
      </div>)}
    </div>
  </CurrentStateProvider>
}