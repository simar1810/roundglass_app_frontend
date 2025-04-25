export function calculateBMI({
  height,
  heightUnit,
  weight,
  weightUnit
}) {
  let heightInMeters;
  if (height == null) throw new Error("Height in cms is required.");

  if (heightUnit.toLowerCase() === 'cms') {
    heightInMeters = cms / 100;
  } else if (heightUnit.toLowerCase() === 'inches') {
    const [feet, inches] = height.split(".");
    heightInMeters = ((Number(feet) || 0) * 30.48) + ((Number(inches) || 0) * 2.54)
  } else {
    throw new Error('Invalid height unit. Use "cms" or "inches".');
  }

  const weightInKgs = weightUnit.toLowerCase() === 'pounds' ? weight / 2.20462 : weight;
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

  if (heightUnit.toLowerCase() === 'cms') {
    if (cms == null) throw new Error("Height in cms is required.");
    heightInCM = cms;
  } else if (heightUnit.toLowerCase() === 'inches') {
    if (feet == null || feet <= 0) {
      throw new Error('Feet value is required for height in feet.');
    }
    heightInCM = ((feet * 12) + (inches || 0)) * 2.54;
  } else {
    throw new Error('Invalid height unit. Use "cms" or "inches".');
  }

  const heightInMeters = heightInCM / 100;
  let idealWeight = referenceBMI * (heightInMeters ** 2);

  if (unit.toLowerCase() === 'pounds') {
    idealWeight *= 2.20462;
  }

  return Math.round(idealWeight);
}
