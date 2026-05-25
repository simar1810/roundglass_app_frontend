import { fetchData } from "@/lib/api";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { plansRegistry } from "./config";

export const loadScript = async function () {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async function (state) {
  const endpoint = buildUrlWithQueryParams(
    `app/razorpay-autopay`,
    {
      coachId: state.coachId,
      planId: state.planId,
      currency: state.currency,
      noOfMonths: state.noOfMonths,
      isAdmin: state.isAdmin,
      couponCode: state.appliedCoupon || ""
    }
  );
  return await fetchData(endpoint);
}

export const buildRazorpayOptions = function (order = {}, {
  onSuccess
}) {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,
    subscription_id: order.id,
    name: "Wellnessz",
    description: "Wellnessz Subscription",
    redirect: true,
    modal: {
      ondismiss: () => {
        console.log("dismiss hit")
      },
    },
    handler: async function () {
      if (typeof onSuccess === "function") {
        await onSuccess()
      }
    }
  }
}

export const resolvePlanChangeType = function ({
  prevPlan,
  nextPlan,
  prevNoOfMonths,
  nextNoOfMonths
}) {
  const prevPlanKey = `${prevPlan}${prevNoOfMonths}`;
  const nextPlanKey = `${nextPlan}${nextNoOfMonths}`;
  // console.log({
  //   prevPlan,
  //   nextPlan,
  //   prevNoOfMonths,
  //   nextNoOfMonths,
  //   prevPlanKey,
  //   nextPlanKey,

  // }, prevPlanKey ===
  // nextPlanKey)
  if (prevPlanKey === nextPlanKey) return "renew";
  if (prevPlanKey > nextPlanKey) return "downgrade";
  if (prevPlanKey < nextPlanKey) return "upgrade";
  return "new";
}

const isCurrentPlanType = function (active, checkFor) {
  if(
   [plansRegistry[active.planType], plansRegistry[active.planCode]].includes(checkFor)
  ) return true
  return false
}

export const detectIfCurrentPlan = function (active, options) {
  const duration = ["monthly", "yearly"].includes(active.duration)
    ? active.duration
    : active.noOfMonths === 1 ? "monthly" : "yearly"
  if (
    duration === options.duration &&
    isCurrentPlanType(active, options.planType)
  ) return true
  return false
}