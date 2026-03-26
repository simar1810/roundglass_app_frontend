export const USER_PERMISSION_IDS = {
  MEAL_PLANS: 1,
  GROWTH_TRACKING: 10,
  ANALYTICS: 11,
  HEALTH_MATRIX_FIELDS: 12,
  QUESTIONAIRE: 9,
  CATEGORIES: 8,
};

export const AVAILABLE_USER_PERMISSIONS = [
  {
    id: USER_PERMISSION_IDS.GROWTH_TRACKING,
    name: "Growth Tracking",
    description: "Access growth dashboard and groups"
  },
  {
    id: USER_PERMISSION_IDS.ANALYTICS,
    name: "Analytics",
    description: "Access analytics dashboard and data export"
  },
  {
    id: USER_PERMISSION_IDS.MEAL_PLANS,
    name: "Meal Plans",
    description: "Access meals, meal plans and recipes"
  },
  {
    id: USER_PERMISSION_IDS.HEALTH_MATRIX_FIELDS,
    name: "Health Matrix Fields",
    description: "Manage health matrix fields"
  },
  {
    id: USER_PERMISSION_IDS.QUESTIONAIRE,
    name: "Questionaire",
    description: "Manage questionaire forms"
  },
  {
    id: USER_PERMISSION_IDS.CATEGORIES,
    name: "Categories",
    description: "Manage categories"
  }
];
