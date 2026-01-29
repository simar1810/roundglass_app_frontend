"use client";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Activity, TrendingUp, AlertTriangle, Users } from "lucide-react";
import useSWR from "swr";
import { getAppClients } from "@/lib/fetchers/app";
import ContentLoader from "@/components/common/ContentLoader";

const COLORS = [
  "var(--accent-1)",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

export default function InjuryAnalyticsDashboard({ clientData, clientId }) {
  const injuryLogs = clientData?.injuryLog || [];

  // Fetch all clients for team comparison
  const { data: allClientsData, isLoading: isLoadingTeam } = useSWR(
    `getAppClients-for-injury-analytics`,
    () => getAppClients({ limit: 10000 })
  );

  const allClients = useMemo(() => {
    if (!allClientsData || allClientsData.status_code !== 200) return [];
    return Array.isArray(allClientsData.data) ? allClientsData.data : [];
  }, [allClientsData]);

  // Calculate Frequency of Injuries
  const injuryFrequency = useMemo(() => {
    const totalInjuries = injuryLogs.length;
    const last30Days = injuryLogs.filter((injury) => {
      if (!injury.incidentDate) return false;
      const date = new Date(injury.incidentDate);
      const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length;
    const last90Days = injuryLogs.filter((injury) => {
      if (!injury.incidentDate) return false;
      const date = new Date(injury.incidentDate);
      const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24);
      return daysDiff <= 90;
    }).length;

    return {
      total: totalInjuries,
      last30Days,
      last90Days,
    };
  }, [injuryLogs]);

  // Type-level Distribution
  const typeDistribution = useMemo(() => {
    const distribution = {};
    injuryLogs.forEach((injury) => {
      const type = injury.injuryType || "Unknown";
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [injuryLogs]);

  // Month-on-Month Trend
  const monthlyTrend = useMemo(() => {
    const monthlyData = {};
    
    injuryLogs.forEach((injury) => {
      if (!injury.incidentDate) return;
      const date = new Date(injury.incidentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          count: 0,
          sortKey: monthKey,
        };
      }
      monthlyData[monthKey].count += 1;
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-12); // Last 12 months
  }, [injuryLogs]);

  // Team Comparison
  const teamComparison = useMemo(() => {
    if (isLoadingTeam || allClients.length === 0) {
      return {
        clientInjuries: injuryLogs.length,
        teamAverage: 0,
        teamData: [],
      };
    }

    // Calculate injuries for all clients
    const teamInjuryCounts = allClients
      .map((client) => ({
        name: client.name,
        injuries: (client.injuryLog || []).length,
      }))
      .filter((item) => item.injuries > 0)
      .sort((a, b) => b.injuries - a.injuries)
      .slice(0, 10); // Top 10 clients with injuries

    const totalTeamInjuries = allClients.reduce(
      (sum, client) => sum + (client.injuryLog || []).length,
      0
    );
    const teamAverage = allClients.length > 0 
      ? (totalTeamInjuries / allClients.length).toFixed(1)
      : 0;

    // Include current client in comparison
    const clientInjuries = injuryLogs.length;
    const comparisonData = [
      {
        name: clientData?.name || "This Client",
        injuries: clientInjuries,
        isCurrentClient: true,
      },
      {
        name: "Team Average",
        injuries: parseFloat(teamAverage),
        isCurrentClient: false,
      },
      ...teamInjuryCounts.slice(0, 5).map((item) => ({
        ...item,
        isCurrentClient: false,
      })),
    ];

    return {
      clientInjuries,
      teamAverage: parseFloat(teamAverage),
      teamData: comparisonData,
    };
  }, [allClients, injuryLogs, clientData, isLoadingTeam]);

  // Show message if no real data
  if (injuryLogs.length === 0) {
    return (
      <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
        <CardContent className="pt-6">
          <p className="text-sm italic text-[#808080] text-center">
            No injury data available for analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Frequency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--dark-2)] mb-1">Total Injuries</p>
                <p className="text-2xl font-bold text-[var(--accent-1)]">
                  {injuryFrequency.total}
                </p>
              </div>
              <Activity className="w-8 h-8 text-[var(--accent-1)] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--dark-2)] mb-1">Last 30 Days</p>
                <p className="text-2xl font-bold text-[var(--accent-1)]">
                  {injuryFrequency.last30Days}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[var(--accent-1)] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--dark-2)] mb-1">Last 90 Days</p>
                <p className="text-2xl font-bold text-[var(--accent-1)]">
                  {injuryFrequency.last90Days}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-[var(--accent-1)] opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Type-level Distribution */}
        <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
          <CardHeader>
            <CardTitle className="text-lg">Injury Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {typeDistribution.length > 0 ? (
              <ChartContainer
                config={{
                  count: {
                    label: "Injuries",
                    color: "var(--accent-1)",
                  },
                }}
                className="aspect-[4/3]"
              >
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-[#808080] text-center py-8">
                No injury type data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Month-on-Month Trend */}
        <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ChartContainer
                config={{
                  count: {
                    label: "Injuries",
                    color: "var(--accent-1)",
                  },
                }}
                className="aspect-[4/3]"
              >
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: "var(--accent-1)", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--accent-1)"
                    strokeWidth={2}
                    dot={{ fill: "var(--accent-1)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-[#808080] text-center py-8">
                No monthly trend data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Comparison */}
      <Card className="border-1 rounded-lg bg-[var(--comp-1)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-1)]" />
            <CardTitle className="text-lg">Team Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTeam ? (
            <ContentLoader />
          ) : teamComparison.teamData.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-[var(--dark-2)]">
                  Your Injuries: <strong className="text-[var(--accent-1)]">{teamComparison.clientInjuries}</strong>
                </span>
                <span className="text-[var(--dark-2)]">
                  Team Average: <strong className="text-[var(--accent-1)]">{teamComparison.teamAverage}</strong>
                </span>
              </div>
              <ChartContainer
                config={{
                  injuries: {
                    label: "Injuries",
                    color: "var(--accent-1)",
                  },
                }}
                className="aspect-[4/3]"
              >
                <BarChart data={teamComparison.teamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar
                    dataKey="injuries"
                    radius={[8, 8, 0, 0]}
                  >
                    {teamComparison.teamData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isCurrentClient
                            ? "var(--accent-1)"
                            : COLORS[(index + 1) % COLORS.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="text-sm text-[#808080] text-center py-8">
              No team comparison data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

