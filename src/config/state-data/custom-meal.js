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
        meals: []
      },
      {
        mealType: "Morning Snacks",
        meals: []
      },
      {
        mealType: "Lunch",
        meals: []
      },
      {
        mealType: "Evening Snacks",
        meals: []
      },
      {
        mealType: "Dinner",
        meals: []
      },
    ]
  }, // { daily: [{ mealType: "Breakfast", meals: [] }
  recipeCaloriesMap: new Map(), // string: { carbs, proteins, fats, proteins, }
}