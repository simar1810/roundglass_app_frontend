export default function reducer(state, action) {
  switch (action.type) {
    case "UPDATE_MOBILE_NUMBER":
      return { ...state, mobileNumber: action.payload }
    case "UPDATE_CURRENT_STATE":
      const newState = {
        ...state,
        stage: action.payload.stage
      }
      if (action.payload.stage === 2) {
        newState.refreshToken = action.payload.user.refreshToken;
        newState.user = action.payload.user;
      }
      return newState;
    case "UPDATE_OTP":
      return { ...state, otp: action.payload }
    default:
      return state;
  }
}