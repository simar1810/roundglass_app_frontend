"use client";

import UpdateHealthMatrixModal from "@/components/modals/coach/UpdateHealthMatrixModal";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { Layers, Settings, Sparkles } from "lucide-react";
import Image from "next/image";

const SVG_ICONS = [
  "/svgs/body.svg",      // 0
  "/svgs/check.svg",     // 1
  "/svgs/checklist.svg", // 2
  "/svgs/bmi.svg",       // 3
  "/svgs/cutlery.svg",   // 4
  "/svgs/fat.svg",       // 5
  "/svgs/fats.svg",      // 6
  "/svgs/muscle.svg",    // 7
  "/svgs/meta.svg",      // 8
  "/svgs/person.svg",    // 9
  "/svgs/weight.svg",    // 10
  "/svgs/flame-icon.svg",// 11
  "/svgs/marathon.svg",  // 12
  "/svgs/users-icon.svg",// 13
];

const DEFAULT_FIELD_MAPPING = {
  bmi: { icon: "/svgs/bmi.svg", label: "BMI" },
  muscle: { icon: "/svgs/muscle.svg", label: "Muscle Mass" },
  fat: { icon: "/svgs/fats.svg", label: "Body Fat" },
  weight: { icon: "/svgs/weight.svg", label: "Weight" },
  rm: { icon: "/svgs/meta.svg", label: "Resting Metabolism" },
  idealWeight: { icon: "/svgs/weight.svg", label: "Ideal Weight" },
  bodyAge: { icon: "/svgs/body.svg", label: "Body Age" },
  visceral_fat: { icon: "/svgs/body.svg", label: "Visceral Fat" },
  sub_fat: { icon: "/svgs/body.svg", label: "Subcutaneous Fat" },
  ideal_weight: { icon: "/svgs/weight.svg", label: "Ideal Weight" },
};

function FieldCard({ title, icon, range, isDefault }) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 shadow-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full flex flex-col">
      {/* Gradient accent bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
        isDefault 
          ? "from-blue-500 to-blue-400" 
          : "from-purple-500 to-purple-400"
      )} />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-4">
        <div className="flex-1 min-w-0 pr-3">
          <CardTitle className="text-base font-semibold leading-tight text-slate-800 dark:text-slate-100">
            {title}
          </CardTitle>
        </div>
        {icon && (
          <div className="h-12 w-12 relative shrink-0 rounded-lg bg-primary/5 dark:bg-primary/10 p-2 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
            <Image
              src={icon}
              alt={title}
              fill
              className="object-contain"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        <div className="space-y-2">
          {range && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Range:</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                {range}
              </span>
            </div>
          )}
          {isDefault && (
            <div className="flex items-center gap-2 pt-1">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <Layers className="h-3 w-3 mr-1" />
                Default Field
              </Badge>
            </div>
          )}
          {!isDefault && (
            <div className="flex items-center gap-2 pt-1">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Custom Field
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const { coachHealthMatrixFields } = useAppSelector(state => state.coach.data);

  if (!coachHealthMatrixFields) {
    return (
      <div className="content-container content-height-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading matrix fields...</p>
        </div>
      </div>
    );
  }

  const { defaultFields, coachAddedFields } = coachHealthMatrixFields;
  const hasDefaultFields = defaultFields && defaultFields.length > 0;
  const hasCustomFields = coachAddedFields && coachAddedFields.length > 0;
  const totalFields = (defaultFields?.length || 0) + (coachAddedFields?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight mb-1">Health Matrix Fields</h1>
              <p className="text-muted-foreground">
                Manage default and custom health metrics for your clients
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-medium">
                {totalFields} {totalFields === 1 ? "field" : "fields"} total
              </Badge>
              {hasDefaultFields && (
                <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  {defaultFields.length} default
                </Badge>
              )}
              {hasCustomFields && (
                <Badge variant="outline" className="text-sm bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {coachAddedFields.length} custom
                </Badge>
              )}
            </div>
            <UpdateHealthMatrixModal data={coachHealthMatrixFields} />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Default Fields Section */}
          {hasDefaultFields && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold tracking-tight">Default Fields</h2>
                <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {defaultFields.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Standard health metrics available to all coaches
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {defaultFields.map((fieldKey, index) => {
                  const mapping = DEFAULT_FIELD_MAPPING[fieldKey] || {
                    icon: "/svgs/checklist.svg",
                    label: fieldKey
                  };
                  return (
                    <FieldCard
                      key={`default-${index}`}
                      title={mapping.label}
                      icon={mapping.icon}
                      isDefault={true}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Coach Added Fields Section */}
          {hasCustomFields && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold tracking-tight">Custom Fields</h2>
                <Badge variant="secondary" className="ml-2 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {coachAddedFields.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Custom metrics you've created for your clients
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {coachAddedFields.map((field, index) => {
                  // Determine icon: use svg index if valid, otherwise fallback
                  const iconPath = SVG_ICONS[field.svg] || "/svgs/checklist.svg";

                  return (
                    <FieldCard
                      key={`coach-${index}`}
                      title={field.title}
                      icon={iconPath}
                      range={`${field.minValue} - ${field.maxValue}`}
                      isDefault={false}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!hasDefaultFields && !hasCustomFields && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No health matrix fields configured</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Get started by configuring your default fields and adding custom metrics for your clients.
              </p>
              <UpdateHealthMatrixModal data={coachHealthMatrixFields} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
