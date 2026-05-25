"use client";
import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeSearchQuery, decreaseQuantity, increaseQuantity, setCalorieResult, setView, toggleRecipe, updateMeasure } from "@/config/state-reducers/calorie-counter";
import useDebounce from "@/hooks/useDebounce";
import { fetchData, sendData } from "@/lib/api";
import { getServingNutrition } from "@/lib/nutrition/per100g";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Beef, ChevronDown, Droplet, Info, Minus, Plus, Sandwich, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SuggestFeatureModal from "@/components/modals/SuggestFeatureModal";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Helper function to get consistent ID format across all calorie counter views
function getItemId(item) {
  if (item?._id?.$oid) return item._id.$oid;
  if (item?._id) return item._id;
  return null;
}

// Helper to get best available image for a dish/recipe
function getDishImage(dish) {
  if (!dish) return null;

  const urlRegex = /^(https?:\/\/).*\.((jpg)|(jpeg)|(png)|(webp))$/i;

  // Prefer explicit image if it looks like a valid URL
  if (typeof dish.image === "string" && urlRegex.test(dish.image)) {
    return dish.image;
  }

  // Fallback to s3 field if present (used in other meal/recipe flows)
  if (typeof dish.s3 === "string" && urlRegex.test(dish.s3)) {
    return dish.s3;
  }

  // As a last resort, if image is at least a non-empty string, return it
  if (typeof dish.image === "string" && dish.image.trim().length > 0) {
    return dish.image;
  }

  return null;
}

export default function CalorieContainer() {
  const { query, dishesData, selected, dispatch } = useCurrentStateContext();

  async function fetchDishedData() {
    try {
      dispatch(setView(3));
      const response = await sendData("app/recipees", { recipes: selected })
      if (!response.success) throw new Error(response.message || response.error);
      dispatch(setCalorieResult(response.data));
    } catch (error) {
      toast.error(error.message);
    }
  }

  return <div className="py-4 content-height-screen">
    <Input
      value={query}
      onChange={e => dispatch(changeSearchQuery(e.target.value))}
      placeholder="search..."
      className="font-semibold w-full max-w-[47vw] h-12"
    />
    <div className="mt-4 grid grid-cols-1 md:grid-cols-[55%_45%] items-start gap-1">
      <div className="md:border-r-3 border-[#8cc63f] md:pr-2 pr-0"><RecipesSearchResults fetchDishedData={fetchDishedData} /></div>
      <div className="md:pl-2"><CalorieResult /></div>
    </div>
  </div>
}

function RecipesSearchResults({ fetchDishedData }) {
  const { query, selected, dispatch } = useCurrentStateContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const debouncedQuery = useDebounce(query, 1000);
  const isQueryEmpty = !query || query.trim().length === 0;
  
  // Determine if user is coach or client based on pathname
  const person = pathname?.includes("/client/") ? "client" : "coach";

  useEffect(function () {
    ; (async function () {
      try {
        setLoading(true);
        let response;
        
        // If query is empty, fetch most searched recipes
        if (isQueryEmpty) {
          response = await fetchData(`app/mostSearchedRecipes?person=${person}`);
        }
        // If query has content, do normal search (require at least 3 characters)
        else if (debouncedQuery.trim().length >= 3) {
          response = await fetchData(`app/recipees?query=${debouncedQuery}`);
        } else {
          // Query is too short, don't fetch
          setLoading(false);
          return;
        }
        
        if (!response.success) throw new Error(response.message || "Internal Server Error!");
        setData(response);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQuery, isQueryEmpty, person]);

  if (loading) return <div className="h-[60vh] flex items-center justify-center">
    <Loader />
  </div>

  if (data?.status_code !== 200) return <ContentError className="mt-0" title={data?.message} />
  const dishes = data?.data || [];
  if (dishes.length === 0 && !isQueryEmpty) return <ContentError className="mt-0" title={"No recipes found for this query!"} />
  if (dishes.length === 0 && isQueryEmpty) return <ContentError className="mt-0" title={"No popular recipes available"} />
  
  return <div className="md:sticky top-20">
    <div className="bg-white p-4 rounded-[8px] border-1 h-[72vh] w-full overflow-y-auto ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {dishes.map((item) => {
          const itemId = getItemId(item);
          if (!itemId) return null; // Skip items without valid ID
          
          return <div
            key={itemId}
            className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              {getDishImage(item)  && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <Image
                    src={getDishImage(item)}
                    alt={item.dish_name || item.title || "Food image"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-[18px] text-gray-900 mb-3">{item.dish_name || item.title}</h3>
                {typeof item.calories === "object"
                  ? <RecipeMacros item={item} />
                  : <DishMacros item={item} />}
              </div>
            </div>

            <div className="flex items-end justify-between mt-4">
              <span className="text-[14px] text-gray-400 font-medium">Serving: 1 Portion</span>
              <Button
                variant="wz"
                className={`px-4 py-2 text-[14px] font-bold rounded-lg transition-all !w-auto !h-auto ${selected.includes(itemId)
                  ? "bg-[#8cc63f] text-white hover:bg-[#7db238]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                onClick={() => dispatch(toggleRecipe(itemId))}
              >
                {selected.includes(itemId) ? "+ Added" : "+ Add"}
              </Button>
            </div>
          </div>
        })}
      </div>
    </div>
    {selected?.length > 0 && (
      <div
        // className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        className="sticky bottom-4 flex justify-center md:fixed md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-50"
      >
        <Button
          variant="wz"
          className="w-auto flex items-center gap-3 px-8 py-7 rounded-2xl text-white font-bold bg-gradient-to-b from-[#8cc63f] to-[#1b5e20] hover:opacity-90 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
          onClick={fetchDishedData}
        >
          <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[#1b5e20] text-sm font-black shadow-inner">
            {selected.length}
          </span>
          <span className="text-lg tracking-tight">Calculate Calories</span>
        </Button>
      </div>
    )}

  </div>
}

function RecipeMacros({ item }) {
  const nutrition = getServingNutrition(item);
  return <p className="text-[14px] text-[#000000]/40">
    <span className="pr-4 text-black font-bold">Kcal&nbsp;{nutrition.calories}</span>
    <span className="pr-4  text-black font-bold">Carbs&nbsp;{nutrition.carbohydrates}</span>
    <span className="pr-4">Protein&nbsp;{nutrition.protein}</span>
    <span className="pr-4">Fat&nbsp;{nutrition.fats}</span>
  </p>
}

function DishMacros({ item }) {
  const nutrition = getServingNutrition(item);
  return <div className="flex flex-wrap gap-4 text-[13px]">
    <span className="flex items-center gap-1">
      <Droplet size={20} className="text-[#8cc63f]" />
      <span className="font-semibold text-black">Calories:</span>
      <span className="text-gray-700">&nbsp;{nutrition.calories}</span>
    </span>
    <span className="flex items-center gap-1">
      <Sandwich size={20} className="text-[#8cc63f]" />
      <span className="font-semibold text-black">Carbs:</span>
      <span className="text-gray-700">&nbsp;{nutrition.carbohydrates}</span>
    </span>
    <span className="flex items-center gap-1">
      <Beef size={20} className="text-[#8cc63f]" />
      <span className="font-semibold text-black">Protein:</span>
      <span className="text-gray-700">&nbsp;{nutrition.protein}</span>
    </span>
    <span className="flex items-center gap-1">
      <Droplet size={20} className="text-[#8cc63f]" />
      <span className="font-semibold text-black">Fats:</span>
      <span className="text-gray-700">&nbsp;{nutrition.fats}</span>
    </span>
  </div>
}

function CalorieResult() {
  const { view, dishesData } = useCurrentStateContext();

  if (view === 3) return (
    <div className="min-h-[400px] bg-white flex items-center justify-center border-1 rounded-[8px]">
      <Loader />
    </div>
  )

  if (view === 1) return <>
    <ContentError className="mt-0" title="Please search For A Recipe" />
  </>

  const dishes = dishesData?.dishes;
  return <>
    <GlycemicIndex dishesData={dishesData} />
  </>
}

function RetrievedRecipees({ dish }) {
  const nutrition = getServingNutrition(dish);
  return <div className="py-4 flex items-start justify-between">
    <div>
      <div className="mb-2 flex items-start gap-1">
        <h3 className="w-fit font-semibold text-[16px] lg:text-[20px] leading-[1] mb-0 inline">{dish.dish_name}</h3>
        <span className="bg-[#67BC2A]/10 text-[10px] px-2 py-1 rounded-[4px]">Main</span>
      </div>
      <p className="text-[14px] text-[#000000]/50">{dish.staple_areas}</p>
    </div>
    <div>
      <span className="bg-[#67BC2A]/10 text-[16px] leading-[1] px-2 py-2 rounded-md">{nutrition.calories}</span>&nbsp;
      <span>Kcal</span>
    </div>
  </div>
}

function BreakDown({ dishesData }) {
  return <div className="bg-[var(--primary-1)] mt-4 p-4 border-1 rounded-[8px]">
    <h3 className="font-bold text-[20px] mb-4">Nutrition Break Down</h3>
    <div className="mb-1 py-1 flex items-center justify-between border-b-[2px]">
      <h3 className="font-semibold text-[16px] text-[#444444]">Serving Size</h3>
      <h3 className="font-semibold text-[16px] text-[#444444]">{dishesData?.nutritionBreakDown?.serving_size}</h3>
    </div>
    <div className="mb-1 py-1 flex items-center justify-between border-b-[2px] border-gray-800">
      <h3 className="font-semibold text-[16px] text-[#444444]">Calories</h3>
      <h3 className="font-semibold text-[16px] text-[#444444]">{dishesData?.nutritionBreakDown?.calories}</h3>
    </div>
    <div className="divide-y-[2px]">
      {dishesData?.nutritionBreakDown?.nutrition?.map((nutrition, index) => <div key={index} className="py-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14px] text-[#444444]">{nutrition?.title}</h3>
          <p className="mr-auto">{nutrition?.amount}</p>
          <p>{nutrition?.percent}</p>
        </div>
        <div className="pl-4">
          {nutrition.children.map((subnutrition, index) => <div key={index} className="flex items-center justify-between gap-2 hover:bg-[#CCCCCC33]">
            <h3 className="text-[14px] font-medium text-[#444444]">{subnutrition.title}</h3>
            <p className="text-[14px] mr-auto">{subnutrition.amount}</p>
            <p>{subnutrition.percent}</p>
          </div>)}
        </div>
      </div>)}
    </div>
  </div>
}

function GlycemicIndex({ dishesData }) {
  const { selected, quantities, selectedMeasures } = useCurrentStateContext();
  const [suggestFeatureOpen, setSuggestFeatureOpen] = useState(false);
  const dishes = dishesData?.dishes || [];

  // Calculate dynamic totals based on quantities and selected measures
  // Only include dishes that are in the selected array
  const totals = dishes
    .filter(dish => {
      const dishId = getItemId(dish);
      return dishId && selected.includes(dishId);
    })
    .reduce((acc, dish) => {
      const dishId = getItemId(dish);
      const qty = quantities[dishId] || 1;
      const currentMeasureName = selectedMeasures[dishId] || dish.default_measure?.name;
      const currentMeasure = dish.measures?.find(m => m.name === currentMeasureName) || dish.default_measure;
      const nutrition = getServingNutrition(dish, {
        quantity: qty,
        measureName: currentMeasureName,
        measure: currentMeasure,
      });

      return {
        calories: acc.calories + (parseFloat(nutrition.calories) || 0),
        protein: acc.protein + (parseFloat(nutrition.protein) || 0),
        carbs: acc.carbs + (parseFloat(nutrition.carbohydrates) || 0),
        fats: acc.fats + (parseFloat(nutrition.fats) || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return <div>
    <div className="bg-[var(--primary-1)] p-4 border-1 rounded-[8px] w-full h-[72vh] overflow-y-scroll">
      <NewNutritionCard
        totalCalories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fats={totals.fats}
      />

      {/* Selected foods list */}
      <SelectedFoodsList />
      {selected?.length > 0 && (
        <>
          <p className="text-sm text-black/50 text-left mt-4">
            We're constantly improving our data. If you notice anything unusual,
            please share your{" "}
            <button
              type="button"
              onClick={() => setSuggestFeatureOpen(true)}
              className="text-[var(--accent-1)] underline font-medium"
            >
              Feedback
            </button>{" "}
            with us.
          </p>
          <SuggestFeatureModal
            open={suggestFeatureOpen}
            onClose={() => setSuggestFeatureOpen(false)}
          />
        </>
      )}

    </div>
  </div>
}

function SelectedFoodItem({ dish }) {
  const { quantities, selectedMeasures, dispatch } = useCurrentStateContext();
  const [showDetails, setShowDetails] = useState(false);
  const dishId = getItemId(dish);
  const qty = quantities[dishId] || 1;
  const currentMeasureName = selectedMeasures[dishId] || dish.default_measure?.name;
  const currentMeasure = dish.measures?.find(m => m.name === currentMeasureName) || dish.default_measure;
  const nutrition = getServingNutrition(dish, {
    quantity: qty,
    measureName: currentMeasureName,
    measure: currentMeasure,
  });

  return (
    <div className="bg-white rounded-lg p-3 mt-5 shadow-md border border-gray-50 relative group">
      <button
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors p-1"
        onClick={() => dispatch(toggleRecipe(dishId))}
        title="Remove item"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        {getDishImage(dish) && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <Image
              src={getDishImage(dish)}
              alt={dish.dish_name || dish.title || "Food image"}
              fill
              className="object-cover"
            />
          </div>
        )}
        <h4 className="font-semibold text-[15px] mb-3 text-gray-900 pr-8 flex-1">
          {dish.dish_name || dish.title}
        </h4>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Macros Section */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] flex-1">
          <span className="flex items-center gap-1">
            <Droplet size={18} className="text-[#8cc63f]" />
            <span className="font-semibold text-gray-800">Calories:</span>
            <span className="text-gray-500">{nutrition.calories} Kcal</span>
          </span>
          <span className="flex items-center gap-1">
            <Beef size={18} className="text-[#8cc63f]" />
            <span className="font-semibold text-gray-800">Protein:</span>
            <span className="text-gray-500">{nutrition.protein} g</span>
          </span>
          <span className="flex items-center gap-1">
            <Beef size={18} className="text-[#8cc63f]" />
            <span className="font-semibold text-gray-800">Carbs:</span>
            <span className="text-gray-500">{nutrition.carbohydrates} g</span>
          </span>
          <span className="flex items-center gap-1">
            <Droplet size={18} className="text-[#8cc63f]" />
            <span className="font-semibold text-gray-800">Fats:</span>
            <span className="text-gray-500">{nutrition.fats} g</span>
          </span>
        </div>

        {/* Quantity Controls Section */}
        <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100 shrink-0">
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#1b5e20] bg-[#8cc63f] transition-colors"
            onClick={() => dispatch(decreaseQuantity(dishId))}
          >
            <Minus size={14} color="white" />
          </button>
          <span className="w-8 text-center font-bold text-gray-900">{qty}</span>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#1b5e20] bg-[#8cc63f] transition-colors"
            onClick={() => dispatch(increaseQuantity(dishId))}
          >
            <Plus size={14} color="white" />
          </button>

          <div className="ml-2 pl-2 border-l border-gray-200">
            <select
              className="text-[12px] font-bold text-gray-700 px-2 py-1 bg-white border rounded-md outline-none cursor-pointer hover:border-[#8cc63f] transition-colors"
              value={currentMeasureName}
              onChange={(e) => dispatch(updateMeasure(dishId, e.target.value))}
            >
              {dish.measures?.map((m, idx) => (
                <option key={idx} value={m.name}>
                  {m.name} ({m.grams}g)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p
        className="flex items-center text-[13px] text-[#8cc63f] mt-4 pl-1 font-bold hover:cursor-pointer hover:opacity-80 w-fit"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? "Hide" : "View"} Recipe / Method
        <span className={`ml-1 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}>
          <ChevronDown size={15} />
        </span>
      </p>

      {showDetails && (
        <div className="mt-3 space-y-3 border-t pt-3 border-gray-100">
          <div>
            <h4 className="font-semibold text-[14px] text-gray-800">Recipe:</h4>
            {!dish.recipe || dish.recipe.length === 0 ? (
              <p className="text-[13px] text-gray-600 leading-relaxed">No recipe available</p>
            ) : (
              <ul className="text-[13px] text-gray-600 leading-relaxed list-disc pl-5 mt-1 space-y-1">
                {dish.recipe.map((step, index) => (
                  <li key={index} className="pl-1">{step}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>)
}

function SelectedFoodsList() {
  const { selected, dishesData } = useCurrentStateContext();
  const dishes = dishesData?.dishes || [];

  const selectedDishes = dishes.filter(dish => {
    const dishId = getItemId(dish);
    return dishId && selected.includes(dishId);
  });

  if (selectedDishes.length === 0) {
    return null;
  }

  return (
    <div>
      {
        selectedDishes.map(dish => (
          <SelectedFoodItem key={dish._id} dish={dish} />
        ))
      }
    </div>
  )
}

function MacroStat({ value, unit, label }) {
  return (
    <div className="border-r border-white/50 last:border-0 px-2 border-r-2 text-center">
      <p className="text-[18px] font-bold leading-tight">
        {value} <span className="text-[15px] font-bold">{unit}</span>
      </p>
      <p className="text-[11px] tracking-wide opacity-80 mt-1">
        {label}
      </p>
    </div>
  );
}


function NewNutritionCard({ totalCalories, protein, carbs, fats }) {
  const { selected } = useCurrentStateContext();
  const nutritionData = [
    { name: "PROTEIN", value: protein, color: "#57D163" },
    { name: "CARBS", value: carbs, color: "#03632C" },
    { name: "FATS", value: fats, color: "#F84135" },
  ]

  return (
    <div className="bg-gradient-to-b from-[#8cc63f] to-[#1b5e20] rounded-[12px] p-4 text-white">
      {/* Header */}
      <div 
      // className="flex items-center justify-between mb-3"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2"
      >
        <h3 
        // className="font-bold text-[20px]"
        className="font-bold text-[18px] sm:text-[20px]"
        >
          Selected Foods ({selected?.length})
        </h3>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[20px]">Total Macros</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-white/70 hover:text-white transition-colors cursor-pointer">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4} className="max-w-[240px]">
              Combined calories, protein, carbs, and fats across all selected food items adjusted by quantity and serving size.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Inner transparent box */}
      <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

          <MacroStat
            value={totalCalories.toFixed(0)}
            unit="kcal"
            label="CALORIES"
          />

          {nutritionData.map((item) => (
            <MacroStat
              key={item.name}
              value={item.value.toFixed(1)}
              unit="g"
              label={item.name}
            />
          ))}
        </div>
      </div>
    </div>

  );
}

function NutritionCard({
  protein,
  carbs,
  fats
}) {
  const totalCalories = 498;
  const nutritionData = [
    { name: "Protein", value: protein, color: "#57D163" },
    { name: "Carbs", value: carbs, color: "#03632C" },
    { name: "Fat", value: fats, color: "#F84135" },
  ];

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div>
      <div className="flex items-center">
        {/* Circular Progress Chart */}
        <div className="relative w-54 h-54">
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#E0E0E0"
              strokeWidth="8"
            />
            {/* Progress Segments */}
            {nutritionData.map((item, index) => {
              const dash = (item.value / 100) * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const strokeDashOffset = circumference - offset;
              offset += dash;
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={dashArray}
                  strokeDashoffset={strokeDashOffset.toString()}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              );
            })}
          </svg>
          {/* Centered Text */}
          <div className="absolute inset-0 flex items-center justify-center font-semibold text-lg">
            {totalCalories} Kcal
          </div>
        </div>

        {/* Nutrition Details */}
        <div className="ml-4 w-full">
          {nutritionData.map((item) => (
            <div key={item.name} className="mb-2">
              <div className="flex justify-between text-gray-600">
                <span>{item.name}</span>
                <span className="font-semibold">{item.value}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};