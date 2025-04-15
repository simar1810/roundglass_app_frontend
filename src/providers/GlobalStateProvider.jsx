"use client"
import { useRef } from "react"
import { Provider } from "react-redux"
import { makeStore } from "./global/store"

export default function GlobalStateProvider({ children }) {
  const storeRef = useRef(undefined)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}