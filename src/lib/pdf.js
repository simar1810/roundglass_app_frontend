import { differenceInYears, format, isValid, parse } from "date-fns"
import { calculateBMIFinal, calculateBMRFinal, calculateBodyFatFinal, calculateSMPFinal } from "./client/statistics"

function calcAge(data) {
  if (data?.dob?.split("-")[0]?.length === 2) return differenceInYears(new Date(), parse(data.dob, 'dd-MM-yyyy', new Date()));
  return data.age || 0
}

export function clientStatisticsPDFData(data, statistics, coach, index) {
  return {
    clientName: data.name,
    age: calcAge(data),
    bodyAge: statistics?.at(index)?.bodyAge || 0,
    gender: data.gender,
    joined: statistics?.at(index).createdDate,
    weight: statistics?.at(index).weight,
    height: `${statistics?.at(index)?.height} ${statistics?.at(index)?.heightUnit}`,
    bmi: statistics?.at(index)?.bmi || calculateBMIFinal(statistics?.at(index)),
    fatPercentage: statistics?.at(index)?.fat || calculateBodyFatFinal(statistics?.at(index)),
    musclePercentage: statistics?.at(index)?.muscle || calculateSMPFinal(statistics?.at(index)),
    restingMetabolism: statistics?.at(index)?.rm || calculateBMRFinal(statistics?.at(index)),
    bodyComposition: statistics?.at(index)?.body_composition,
    coachName: coach.name,
    coachDescription: coach.specialization,
    coachProfileImage: coach.profilePhoto
  }
}

function standardWeight({
  weightUnit,
  weight
}) {
  if (weightUnit) {
    return Number(weight);
  }
  return Number(weight) * 0.453592;
}

export function comparisonPDFData(data, statistics, coach, index) {
  return {
    clientName: data.name,
    age: data.age || 0,
    gender: data.gender,
    joined: data.joiningDate,
    weight: statistics?.at(index).weight,
    avgWeight: (statistics.reduce((acc, curr) => acc + standardWeight(curr), 0) / statistics.length).toFixed(1),
    height: `${statistics?.at(index)?.height} ${statistics?.at(index)?.heightUnit}`,
    bmi: statistics[index].bmi,
    avgBmi: (statistics.reduce((acc, curr) => acc + (Number(curr.bmi) || calculateBMIFinal(curr)), 0) / statistics.length).toFixed(1),
    rm: statistics[index].rm,
    avgRm: (statistics.reduce((acc, curr) => acc + (Number(curr.rm) || calculateBMRFinal(curr)), 0) / statistics.length).toFixed(1),
    muscle: statistics[index].muscle,
    avgMuscle: (statistics.reduce((acc, curr) => acc + (Number(curr.muscle) || calculateSMPFinal(curr)), 0) / statistics.length).toFixed(1),
    fat: statistics[index].fat,
    avgFat: (statistics.reduce((acc, curr) => acc + (Number(curr.fat) || calculateBodyFatFinal(curr)), 0) / statistics.length).toFixed(1),
    brandLogo: "/brandLogo.png",
    sideImage: "/side.png",
    bottomStripImage: "/bottom.png",
    allStatsList: statistics,
    coachName: coach.name,
    coachDescription: coach.specialization,
    coachProfileImage: coach.profilePhoto,
    coachWeightLoss: coach.weightLoss,
  }
}

export function mealPlanDetailsPDFData(plan) {
  return {
    id: plan._id,
    planName: plan.name,
    coachName: 'John Doe',
    coachDescription: 'Certified Health Coach',
    coachImage: '/coach.jpg',
    brandLogo: '/logo.png',
    mealTypes: ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'After Dinner'],
    meals: []
  }
}

function formatCustomPlanLabel(planKey, mode, explicitLabel) {
  if (explicitLabel) return explicitLabel;
  if (!planKey) return "";

  if (mode === "monthly") {
    const parsedDate = parse(planKey, "dd-MM-yyyy", new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, "LLL dd, yyyy EEE");
    }
  }

  if (mode === "weekly") {
    return planKey.charAt(0).toUpperCase() + planKey.slice(1);
  }

  if (mode === "daily") {
    return "Daily Schedule";
  }

  return planKey;
}

function normalizeMealEntries(planForDay) {
  if (!planForDay) return [];
  if (Array.isArray(planForDay)) return planForDay;
  if (Array.isArray(planForDay.meals)) return planForDay.meals;
  return [];
}

function buildMealItemsForPDF(mealEntry) {
  if (!mealEntry) return [];
  const dishes = Array.isArray(mealEntry.meals) ? mealEntry.meals : [];

  return dishes.map((dish, index) => {
    const title = dish?.dish_name || dish?.name || dish?.title || `Item ${index + 1}`;

    const detailsParts = [];
    if (dish?.measure) detailsParts.push(dish.measure);
    if (dish?.quantity) detailsParts.push(dish.quantity);
    if (dish?.description) detailsParts.push(dish.description);

    const macroParts = [];
    if (dish?.calories) macroParts.push(`${dish.calories} kcal`);
    if (dish?.protein) macroParts.push(`Protein ${dish.protein}g`);
    if (dish?.carbohydrates) macroParts.push(`Carbs ${dish.carbohydrates}g`);
    if (dish?.fats) macroParts.push(`Fats ${dish.fats}g`);
    if (macroParts.length) detailsParts.push(macroParts.join(", "));

    return {
      title,
      details: detailsParts.filter(Boolean).join(" | ")
    };
  });
}

export function customMealDailyPDFData(customPlan, planKey, coach) {
  if (!customPlan || !planKey) return null;

  const rawPlan = customPlan?.plans?.[planKey];
  const normalizedMeals = normalizeMealEntries(rawPlan);
  if (!Array.isArray(normalizedMeals) || normalizedMeals.length === 0) return null;

  const scheduleMeals = normalizedMeals.map((mealEntry, index) => {
    const dishes = Array.isArray(mealEntry?.meals) ? mealEntry.meals : [];
    const firstTimedDish = dishes.find(dish => dish?.meal_time);

    return {
      name: mealEntry?.mealType || mealEntry?.title || `Meal ${index + 1}`,
      timeWindow: mealEntry?.time || mealEntry?.meal_time || firstTimedDish?.meal_time || "",
      items: buildMealItemsForPDF(mealEntry)
    };
  });

  const planMeta = Array.isArray(rawPlan) ? {} : rawPlan || {};
  const explicitLabel = planMeta?.dateLabel || planMeta?.displayDate || planMeta?.title;
  const dateLabel = formatCustomPlanLabel(planKey, customPlan.mode, explicitLabel);

  const collectNotes = [];
  const planNotes = planMeta?.notes;
  if (Array.isArray(planNotes)) {
    collectNotes.push(...planNotes.filter(Boolean));
  } else if (typeof planNotes === "string" && planNotes.trim()) {
    collectNotes.push(planNotes.trim());
  }

  const generalNotes = customPlan?.notes;
  if (Array.isArray(generalNotes)) {
    collectNotes.push(...generalNotes.filter(Boolean));
  } else if (typeof generalNotes === "string" && generalNotes.trim()) {
    collectNotes.push(generalNotes.trim());
  }

  const normalizedNotes = collectNotes.filter(note => typeof note === "string" && note.trim());

  return {
    title: customPlan?.title || "Custom Meal Plan",
    coachName: coach?.name || "",
    dateLabel,
    meals: scheduleMeals,
    notes: normalizedNotes.length > 0 ? normalizedNotes : undefined,
  };
}

export function invoicePDFData(order, coach) {
  const subtotal = order.productModule
    .reduce((acc, product) =>
      acc + (Number(product.quantity) * Number(product.productMrpList["0"]))
      , 0)

  return {
    clientName: order.clientName,
    age: order?.clientId?.age || '21',
    address: 'New Amritsar, Punjab',
    city: 'Amritsar',
    phone: order?.clientId?.mobileNumber || '9XXXXXXXXX',
    invoiceNo: order?.invoiceNumber || 'INVXXXXXX',
    date: order.createdAt || format(new Date(), 'dd-MM-yyyy'),
    coachName: 'Wellness Coach',
    coachPhone: '9876543210',
    coachCity: coach?.city || 'Ludhiana',
    subtotal: (order.sellingPrice * 100 * Number(coach.margin)) || "0",
    discount: 100 - Number(coach.margin), // how to get this field
    total: '3000',
    logoUrl: '/logo.png',
    products: [...order.productModule.map(product => (
      {
        productName: product.productName || "Product",
        quantity: product.quantity || 1,
        price: product?.productMrpList["50"] || 0
      })),
    { productName: 'Subtotal', quantity: "", price: subtotal },
    { productName: 'Discount', quantity: "", price: Math.abs(subtotal - (Number(order.sellingPrice) || subtotal)) },
    { productName: 'Total', quantity: "", price: order.sellingPrice || subtotal },
    ]
  }
}