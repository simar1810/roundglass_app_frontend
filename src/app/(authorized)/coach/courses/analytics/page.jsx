"use client";

import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { BarChartComponent } from "@/components/common/charts/Barchart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchData } from "@/lib/api";
import { copyText } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Page() {
  const { isLoading, error, data } = useSWR(
    "/app/courses/",
    () => fetchData("app/courses/analytics")
  );

  if (isLoading) return <ContentLoader />;

  if (error || data.status_code !== 200)
    return <ContentError title={error || data.message} />;

  const analytics = data.data;
  const totalCourses = toNumber(analytics.totalCoursesCount);
  const publishedCount = toNumber(analytics.publishedCoursesCount);
  const draftCount = toNumber(analytics.draftCoursesCount);

  const stats = [
    {
      label: "Total courses",
      value: formatNumber(totalCourses),
      helper: "Across every status",
    },
    {
      label: "Published courses",
      value: formatNumber(publishedCount),
      helper: totalCourses
        ? `${calculateShare(publishedCount, totalCourses)} of catalog`
        : "No live courses yet",
    },
    {
      label: "Draft courses",
      value: formatNumber(draftCount),
      helper: totalCourses
        ? `${calculateShare(draftCount, totalCourses)} awaiting publish`
        : "No drafts yet",
    },
    {
      label: "Average price",
      value: formatCurrency(analytics.averagePrice),
      helper: "Mean listing price",
    },
    {
      label: "Average discount",
      value: formatPercent(analytics.averageDiscount),
      helper: "Avg. promotional cut",
    },
    {
      label: "Avg. teachings",
      value: formatNumber(toNumber(analytics.averageTeachingsCount)),
      helper: "Modules per course",
    },
  ];

  const distributions = [
    {
      title: "Category distribution",
      description: "Where the catalog is concentrated",
      data: buildDistributionData(analytics.categoryDistribution),
    },
    {
      title: "Language distribution",
      description: "Preferred course languages",
      data: buildDistributionData(analytics.languageDistribution),
    },
    {
      title: "Subscription type distribution",
      description: "Enrollment types chosen by clients",
      data: buildDistributionData(analytics.subscriptionTypeDistribution),
    },
  ];

  return (
    <div className="content-container conttent-height-screen flex flex-col gap-6 py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {distributions.map((distribution) => (
          <DistributionChart key={distribution.title} {...distribution} />
        ))}
      </section>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <Card className="border-1 shadow-none bg-[var(--comp-1)]">
      <CardHeader className="gap-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </CardHeader>
    </Card>
  );
}

function DistributionChart({ title, description, data = [] }) {
  const hasValues = data.some((item) => item.value > 0);

  if (!data.length || !hasValues) {
    return (
      <Card className="border-1 shadow-none bg-[var(--comp-1)]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough data to render this view yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <BarChartComponent
      className="h-full"
      xAxis={{ data, XAxisDataKey: "label" }}
      yAxis={{ YAxisDataKey: "value", YAxisDataLabel: "Courses" }}
      chartConfig={{
        title,
        description,
        label1: `${total} total`,
        label2: "Hover to see exact counts",
      }}
    />
  );
}

function buildDistributionData(distribution = {}) {
  return Object.entries(distribution || {})
    .map(([label, value]) => ({
      label: label === "undefined" ? "Not specified" : label,
      value: toNumber(value),
    }))
    .sort((a, b) => b.value - a.value);
}

function toNumber(value, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function formatNumber(value) {
  return typeof value === "number" && !Number.isNaN(value)
    ? numberFormatter.format(value)
    : "-";
}

function formatCurrency(value) {
  return typeof value === "number" && !Number.isNaN(value)
    ? currencyFormatter.format(value)
    : "-";
}

function calculateShare(value, total) {
  if (!total) return "0%";
  const percentage = Math.round((toNumber(value) / total) * 100);
  return `${percentage}%`;
}

function formatPercent(value) {
  const safe = toNumber(value, null);
  if (safe === null) return "-";
  return `${Math.round(safe)}%`;
}