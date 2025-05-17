export function clientStatisticsPDFData(data, statistics) {
  return {
    clientName: data.name,
    age: data.age || 0,
    gender: data.gender,
    joined: data.joiningDate,
    weight: statistics?.at(0).weight,
    height: `${statistics?.at(0)?.height} ${statistics?.at(0)?.heightUnit}`,
    bmi: statistics?.at(0)?.bmi,
    fatPercentage: statistics?.at(0)?.fat,
    musclePercentage: statistics?.at(0)?.muscle,
    restingMetabolism: statistics?.at(0)?.rm,
    bodyComposition: statistics?.at(0)?.body_composition,
    coachName: "Wellness Coach",
    coachDescription: "A certified wellness coach helping you transform your lifestyle through science-backed fitness and meal plans.",
    coachProfileImage: ""
  }
}

export function comparisonPDFData(data, statistics) {
  return {
    clientName: data.name,
    age: data.age || 0,
    gender: data.gender,
    joined: data.joiningDate,
    weight: statistics?.at(0).weight,
    height: `${statistics?.at(0)?.height} ${statistics?.at(0)?.heightUnit}`,
    brandLogo: "/brandLogo.png",
    sideImage: "/side.png",
    bottomStripImage: "/bottom.png",
    allStatsList: statistics
  }
}