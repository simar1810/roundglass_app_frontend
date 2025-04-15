import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoggedIn: false,
  coach: null
}

const counterSlice = createSlice({
  name: 'coach',
  initialState,
  reducers: {
  },
})

export const { } = counterSlice.actions
export default counterSlice.reducer