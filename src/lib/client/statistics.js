export function calculateBMI({
  height,
  heightUnit,
  weight,
  weightUnit
}) {
  let heightInMeters;
  // if (height == null) throw new Error("Height in cms is required.");

  if (heightUnit?.toLowerCase() === 'cms' || heightUnit?.toLowerCase() === 'cm') {
    heightInMeters = cms / 100;
  } else if (heightUnit?.toLowerCase() === 'inches') {
    const [feet, inches] = height.split(".");
    heightInMeters = ((Number(feet) || 0) * 30.48) + ((Number(inches) || 0) * 2.54)
  } else {
    // throw new Error('Invalid height unit. Use "cms" or "inches".');
  }

  const weightInKgs = weightUnit?.toLowerCase() === 'pounds' ? weight / 2.20462 : weight;
  const bmi = weightInKgs / (heightInMeters * heightInMeters);

  return parseFloat(bmi.toFixed(1));
}

export function calculateIdealWeight({
  cms,
  heightUnit,
  feet,
  inches,
  gender,
  unit,
  referenceBMI = 23.0
}) {
  let heightInCM;

  if (heightUnit?.toLowerCase() === 'cms') {
    // if (cms == null) throw new Error("Height in cms is required.");
    heightInCM = cms;
  } else if (heightUnit?.toLowerCase() === 'inches') {
    if (feet == null || feet <= 0) {
      // throw new Error('Feet value is required for height in feet.');
    }
    heightInCM = ((feet * 12) + (inches || 0)) * 2.54;
  } else {
    // throw new Error('Invalid height unit. Use "cms" or "inches".');
  }

  const heightInMeters = heightInCM / 100;
  let idealWeight = referenceBMI * (heightInMeters ** 2);

  if (unit?.toLowerCase() === 'pounds') {
    idealWeight *= 2.20462;
  }

  return Math.round(idealWeight);
}

export function calculateBMI2({ height, heightUnit, feet, inches, weight, weightUnit }) {
  let heightInMeters;

  if (heightUnit?.toLowerCase() === 'cm' || heightUnit?.toLowerCase() === 'cms') {
    // if (height == null) throw new Error("Height in cm is required.");
    heightInMeters = height / 100.0;
  } else if (heightUnit?.toLowerCase() === 'inches') {
    heightInMeters = height / 3.28084;
  } else {
    // throw new Error('Invalid height unit. Use "cms" or "inches".');
  }

  const weightInKgs = weightUnit?.toLowerCase() === 'pounds' ? weight / 2.20462 : weight;
  const bmi = weightInKgs / (heightInMeters * heightInMeters);

  return parseFloat(bmi.toFixed(1));
}

export function calculateSkeletalMassPercentage({
  gender,
  weight,
  heightFeet,
  heightInches,
  heightCms,
  age,
  bodyAge,
  bodyComposition,
  weightUnit,
  heightUnit
}) {
  const weightInKgs = weightUnit?.toLowerCase() === 'pounds' ? Number(weight || 0) * 0.453592 : Number(weight);
  const heightInCms = heightUnit?.toLowerCase() === 'cms'
    ? Number(heightCms)
    : (Number(heightFeet) * 12 + Number(heightInches || 0)) * 2.54;
  const heightInMeters = Number(heightInCms || 0) / 100.0;

  const genderInt = gender?.toLowerCase() === 'male' ? 1 : 0;

  let skeletalMuscleMass =
    0.22 * weightInKgs +
    6.5 * heightInMeters -
    0.1 * Number(age || bodyAge || 0) +
    5.8 * genderInt -
    3.5;

  let skeletalMassPercentage = (skeletalMuscleMass / Number(weightInKgs || 0)) * 100;

  switch (bodyComposition?.toLowerCase()) {
    case 'slim':
      skeletalMassPercentage += 0.5;
      break;
    case 'medium':
      skeletalMassPercentage += 1.0;
      break;
    case 'fat':
      skeletalMassPercentage -= 2.0;
      break;
    default:
    // throw new Error('Invalid body composition. Use "slim", "medium", or "fat".');
  }

  skeletalMassPercentage = Math.max(25.0, Math.min(42.0, skeletalMassPercentage));
  return parseFloat(skeletalMassPercentage.toFixed(1));
}

export function calculateBodyFatPercentage({ bmi, bodyAge, age, gender, bodyComposition }) {
  const g = gender?.toLowerCase() === 'male' ? 1 : 0;
  let fat = 0;

  switch (bodyComposition?.toLowerCase()) {
    case 'slim':
      fat = 1.30 * Number(bmi) + 0.23 * Number(age || bodyAge || 0) - 10.8 * g - 5.4 - 2.5;
      break;
    case 'medium':
      fat = 1.30 * Number(bmi) + 0.23 * Number(age || bodyAge || 0) - 10.8 * g - 5.4;
      break;
    case 'fat':
      fat = 1.30 * Number(bmi) + 0.23 * Number(age || bodyAge || 0) - 10.8 * g - 5.4 + 2.5;
      break;
    default:
    // throw new Error('Invalid body composition. Use "slim", "medium", or "fat".');
  }

  fat = Math.max(5.0, Math.min(35.0, fat));
  return parseFloat(fat.toFixed(1));
}

export function calculateBMR({
  gender,
  weight,
  height,
  age,
  bodyAge,
  weightUnit,
  heightUnit
}) {
  const weightInKgs = weightUnit?.toLowerCase() === 'pounds' ? Number(weight || 0) * 0.453592 : Number(weight || 0);
  const heightInCms = heightUnit?.toLowerCase() === 'cms' || heightUnit?.toLowerCase() === 'cm'
    ? Number(height || 0)
    : (Number(height || 0) * 12 + Number(height || 0)) * 2.54;

  let bmr = 0;

  if (gender?.toLowerCase() === 'male') {
    bmr = 88.362 + (13.397 * weightInKgs) + (4.799 * heightInCms) - (5.677 * Number(age || bodyAge || 0));
  } else if (gender?.toLowerCase() === 'female') {
    bmr = 447.593 + (9.247 * weightInKgs) + (3.098 * heightInCms) - (4.33 * Number(age || bodyAge || 0));
  } else {
    // throw new Error('Invalid gender.');
  }

  return Math.round(bmr);
}

export function calculateBodyAge({
  bmi,
  bodyFatPercentage,
  bmr,
  age,
  bodyAge: age2,
  gender,
  bodyComposition
}) {
  let bodyAge = Number(age || age2 || 0);

  if (bmi < 18.5) {
    bodyAge += 2.0;
  } else if (bmi > 25.0) {
    bodyAge += 3.0;
  } else {
    bodyAge -= 1.0;
  }

  if (gender?.toLowerCase() === 'male') {
    if (bodyFatPercentage < 8.0) {
      bodyAge -= 2.0;
    } else if (bodyFatPercentage > 25.0) {
      bodyAge += 4.0;
    }
  } else if (gender?.toLowerCase() === 'female') {
    if (bodyFatPercentage < 21.0) {
      bodyAge -= 2.0;
    } else if (bodyFatPercentage > 32.0) {
      bodyAge += 4.0;
    }
  }

  const comp = bodyComposition?.toLowerCase();
  if (comp === 'slim') {
    bodyAge -= 1.0;
  } else if (comp === 'fat') {
    bodyAge += 2.0;
  }

  return Math.round(bodyAge);
}