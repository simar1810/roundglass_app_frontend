import { format } from "date-fns";

export const addClientCheckupInitialState = {
  stage: 1,
  name: "",//done
  email: "",
  mobileNumber: "",
  age: "",
  dob: "", //done
  gender: "male",//done
  coachId: "",
  notes: "",
  weightUnit: "Kg", // e.g. Kg Pounds
  weightInKgs: "",
  weightInPounds: "",
  heightUnit: "Cm", // e.g. Inches, Cm
  heightCms: "",
  heightFeet: "",
  heightInches: "",
  bmi: "",
  visceral_fat: "",
  followUpDate: "",
  activeType: "",
  rm: "",
  joiningDate: format(new Date(), 'yyyy-MM-dd'),
  muscle: "",
  fat: "",
  bodyComposition: "Medium",
  ideal_weight: "",
  bodyAge: "",
  pendingCustomer: "",
  existingClientID: "",
  nextFollowup: "",
  clientType: "new",// e.g. new, existing
  file: null,
  pendingCustomer: false,
  existingClientID: ""
}