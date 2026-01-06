export const WORKOUT_EXERCISE = {

}

export const WORKOUT_WEEKLY_DAYS = [
  "Sunday", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday",
  "Saturday"
]

export const WORKOUT_STAGES = [
  { id: 1, label: "Workout Details" },
  { id: 2, label: "Exercises" },
];

export const META_FIELDS = {
  TITLE: "title",
  DESCRIPTION: "description",
  GUIDELINES: "guidelines",
  CATEGORY: "category",
  SUBCATEGORY: "subcategory",
};

export const META_REQUIRED_FIELDS = [
  META_FIELDS.TITLE,
  META_FIELDS.DESCRIPTION,
  META_FIELDS.GUIDELINES,
  META_FIELDS.CATEGORY,
  META_FIELDS.SUBCATEGORY,
  "file",
];

export const EXERCISE_DIFFICULTY_COLOR = {
  beginner: "text-green-600",
  intermediate: "text-orange-600",
  advanced: "text-red-600",
};

export const DEFAULT_EXERCISE_FILTERS = {
  person: "coach",
  page: 1,
  limit: 100000,
  category: "strength",
  bodyPart: "waist",
  target: "abs",
  equipment: "body weight",
};

export const EXERCISE_FILTER_KEYS = {
  CATEGORY: "category",
  BODY_PART: "bodyPart",
  TARGET: "target",
  EQUIPMENT: "equipment",
}