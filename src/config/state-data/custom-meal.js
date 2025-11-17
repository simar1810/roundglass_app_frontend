export const customMealInitialState = {
  stage: 1,
  mode: "daily", // e.g. daily, weekly, monthly, 
  title: "",
  file: "",
  image: "",
  description: "",
  selectedDate: "",
  selectedPlan: "daily",
  selectedMealType: "Breakfast",
  plans: {},
  noOfDays: 0,
  selectedPlans: {
    daily: [
      {
        mealType: "Breakfast",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Morning Snacks",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Lunch",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Evening Snacks",
        meals: [],
        defaultMealTiming: ""
      },
      {
        mealType: "Dinner",
        meals: [],
        defaultMealTiming: ""
      },
    ]
  }, // { daily: [{ mealType: "Breakfast", meals: [] }
}