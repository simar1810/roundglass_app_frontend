import { configureStore } from '@reduxjs/toolkit';
import coach from "./slices/coach"

export const makeStore = function () {
  return configureStore({
    reducer: {
      coach
    },
  })
}