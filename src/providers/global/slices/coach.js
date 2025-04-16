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
      state.data = { ...action.payload, clubSystem: 2 }
    },
    destroy: function (state) {
      state.isLoggedIn = false;
      state.data = null;
    }
  },
})

export default counterSlice.reducer;
export const {
  store,
  destroy
} = counterSlice.actions;