"use client";

import { useAppSelector } from "@/providers/global/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import UpdateHealthMatrixModal from "@/components/modals/coach/UpdateHealthMatrixModal";

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

function FieldCard({ title, label, icon, range, isDefault }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-none truncate pr-2">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-8 w-8 relative shrink-0 opacity-80">
            <Image
              src={icon}
              alt={title}
              fill
              className="object-contain"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground space-y-1">
          {label && (
            <div className="flex justify-between">
              <span className="font-medium">Key:</span>
              <span className="opacity-70">{label}</span>
            </div>
          )}
          {range && (
            <div className="flex justify-between">
              <span className="font-medium">Range:</span>
              <span className="opacity-70">{range}</span>
            </div>
          )}
          {isDefault && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                Default
              </span>
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
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted"></div>
          <p className="text-sm text-muted-foreground">Loading matrix fields...</p>
        </div>
      </div>
    );
  }

  const { defaultFields, coachAddedFields } = coachHealthMatrixFields;

  return (
    <div className="content-container min-h-screen p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Health Matrix</h1>
          <p className="text-muted-foreground">
            Manage and view your health matrix configuration.
          </p>
        </div>
        <UpdateHealthMatrixModal data={coachHealthMatrixFields} />
      </div>

      <div className="space-y-6">
        {/* Default Fields Section */}
        {defaultFields && defaultFields.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Default Fields</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {defaultFields.map((fieldKey, index) => {
                const mapping = DEFAULT_FIELD_MAPPING[fieldKey] || {
                  icon: "/svgs/checklist.svg",
                  label: fieldKey
                };
                return (
                  <FieldCard
                    key={`default-${index}`}
                    title={mapping.label}
                    label={fieldKey}
                    icon={mapping.icon}
                    isDefault={true}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Coach Added Fields Section */}
        {coachAddedFields && coachAddedFields.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Custom Fields</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {coachAddedFields.map((field, index) => {
                // Determine icon: use svg index if valid, otherwise fallback
                const iconPath = SVG_ICONS[field.svg] || "/svgs/checklist.svg";

                return (
                  <FieldCard
                    key={`coach-${index}`}
                    title={field.title}
                    label={field.fieldLabel}
                    icon={iconPath}
                    range={`${field.minValue} - ${field.maxValue}`}
                  />
                );
              })}
            </div>
          </section>
        )}

        {(!coachAddedFields || coachAddedFields.length === 0) && (!defaultFields || defaultFields.length === 0) && (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No health matrix fields configured.</p>
          </div>
        )}
      </div>
    </div>
  );
}
