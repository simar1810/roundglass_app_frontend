import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoggedIn: false,
  coach: null
}

const counterSlice = createSlice({
  name: 'coach',
  initialState,
  reducers: {
    store: function (state, action) {
      state.isLoggedIn = true;
      state.coach = action.payload
    },
    destroy: function (state) {
      state.isLoggedIn = false;
      state.coach = null;
    }
  },
})

export default counterSlice.reducer;
export const {
  store,
  destroy
} = counterSlice.actions;