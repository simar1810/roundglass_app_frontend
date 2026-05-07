export const featuresList = {
  "workouts": {
    "feature": "workouts",
    "mutateKey": "app/newWorkout/categories",
    "featureType": "workouts",
    "requiredScope": ["workout:manage"],
    "title": "Workout Categories",
    "href": "",
    "subtitle": "Group exercises in your library for faster plan building",
    "emptyIcon": "dumbbell",
    "emptyHeading": "No workout categories yet",
    "emptyDescription":
      "Create categories such as Strength, Mobility, or Cardio to organize exercises when you build plans.",
    "emptyCtaLabel": "Add your first category",
  },
  "sessions": {
    "feature": "sessions",
    "mutateKey": "app/feature-categories/sessions",
    "featureType": "sessions",
    "requiredScope": ["workout:manage"],
    "title": "Session Categories",
    "href": "/coach/workouts/sessions/categories",
    "subtitle": "Label session templates so you can filter and assign them quickly",
    "emptyIcon": "calendar-clock",
    "emptyHeading": "No session categories yet",
    "emptyDescription":
      "Add categories like Full body, Beginner, or 30-minute sessions to keep templates tidy and easy to find.",
    "emptyCtaLabel": "Add your first category",
  },
  "recipes": {
    "feature": "recipes",
    "mutateKey": "app/feature-categories/recipes",
    "featureType": "recipes",
    "requiredScope": ["meal_plans:manage"],
    "title": "Recipe Categories",
    "href": "/coach/meals/recipes/categories",
    "subtitle": "Organize recipes for meal plans and client recommendations",
    "emptyIcon": "chef-hat",
    "emptyHeading": "No recipe categories yet",
    "emptyDescription":
      "Create categories such as Breakfast, High protein, or Meal prep so recipes are easy to browse and assign.",
    "emptyCtaLabel": "Add your first category",
  },
}

export const initialActiveCategory = {
  name: "",
  level: "category",
  categoryId: ""
}