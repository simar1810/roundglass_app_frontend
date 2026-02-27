const state = {
  stage: 1,
  mobileNumber: "",
  otp: "",
  isFirstTime: false,
  loginType: "coach", // "coach" or "user"
  userLogin: {
    userId: "",
    password: ""
  }
}

export default state;