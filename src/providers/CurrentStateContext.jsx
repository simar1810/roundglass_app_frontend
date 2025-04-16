"use client"
import {
  useContext,
  useReducer,
  createContext
} from "react";

const CurrentStateContext = createContext();

export function CurrentStateProvider({
  children,
  reducer,
  initialStae
}) {
  const [state, dispatch] = useReducer(reducer, initialStae);
  return <CurrentStateContext.Provider value={{ ...state, dispatch }}>
    {children}
  </CurrentStateContext.Provider>
}

export default function useCurrentStateContext() {
  const context = useContext(CurrentStateContext);
  return context;
}