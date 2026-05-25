/** Map API / profile gender values to TDEE calculator values. */
export function normalizeTdeeGender(raw) {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim().toLowerCase();
  if (["male", "m", "man", "1"].includes(s)) return "male";
  if (["female", "f", "woman", "2"].includes(s)) return "female";
  if (s.startsWith("male")) return "male";
  if (s.startsWith("fem")) return "female";
  return "";
}

export const calculateTdee = function (formData) {
  const { age, gender, height, weight, activity } = formData;

  if (!age || !gender || !height || !weight || !activity) {
    return null;
  }

  const A = Number(age);
  const H = Number(height);
  const W = Number(weight);
  const activityFactor = Number(activity);

  let bmr;
  if (gender === "male") {
    bmr = 10 * W + 6.25 * H - 5 * A + 5;
  } else {
    bmr = 10 * W + 6.25 * H - 5 * A - 161;
  }

  const tdee = Math.round(bmr * activityFactor);
  const calc = (percent) => Math.round(tdee * percent);

  return {
    bmr: Math.round(bmr),
    tdee,

    cut: {
      mild: {
        calories: calc(0.9),
        percent: "90%",
        change: "-0.25 kg/week",
      },
      aggressive: {
        calories: calc(0.79),
        percent: "79%",
        change: "-0.5 kg/week",
      },
    },

    maintain: {
      calories: tdee,
      percent: "100%",
      change: "",
    },

    bulk: {
      mild: {
        calories: calc(1.1),
        percent: "110%",
        change: "+0.25 kg/week",
      },
      lean: {
        calories: calc(1.21),
        percent: "121%",
        change: "+0.5 kg/week",
      },
      aggressive: {
        calories: calc(1.41),
        percent: "141%",
        change: "+1 kg/week",
      },
    },
    breakdown: {
      calories: 0,
      proteins: 0,
      fats: 0,
      carbohydrates: 0
    }
  };
};