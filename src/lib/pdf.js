import { format } from "date-fns"

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

export function invoicePDFData(order, coach) {
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
    { productName: 'Subtotal', quantity: "", price: 3500 },
    { productName: 'Discount', quantity: "", price: 500 },
    { productName: 'Total', quantity: "", price: 3000 },
    ]
  }
}